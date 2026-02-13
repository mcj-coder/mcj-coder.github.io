---
title: 'Ektron 8.01: PlatformNotSupportedException – Tracking Down and Fixing Another Multilingual Gotcha!'
description: 'How to fix a PlatformNotSupportedException in Ektron 8.01 multilingual sites caused by locale-sensitive decimal parsing of the IIS server version variable.'
pubDate: 2010-06-15
tags: ['ektron', 'troubleshooting']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/06/ektron-801-platformnotsupportedexceptio.html'
heroImage: ../../assets/blog/hero-images/2010-06-15-ektron-801-platformnotsupportedexceptio.jpg
---

I'm still tracing through issues after upgrading to 8.01, this time looking at why requests for static files are returning 500 - Internal Server Errors when French is selected, but not English. Hmm.

Looking at the Event Logs shows lots of errors like this:

```text
Exception type: PlatformNotSupportedException

Exception message: The DefaultHttpHandler.BeginProcessRequest method is not
supported by IIS integrated pipeline mode.
```

This is telling me that I'm trying to serve a file via the IIS 7 Integrated Pipeline using a handler that's specifically designed for IIS 6 (or IIS Classic Pipeline). What could be causing that?

Stack trace isn't much help either:

```text
System.PlatformNotSupportedException: The DefaultHttpHandler.BeginProcessRequest method is not supported by IIS integrated pipeline mode.
   at System.Web.DefaultHttpHandler.BeginProcessRequest(HttpContext context, AsyncCallback callback, Object state)
   at System.Web.HttpApplication.CallHandlerExecutionStep.System.Web.HttpApplication.IExecutionStep.Execute()
   at System.Web.HttpApplication.ExecuteStep(IExecutionStep step, Boolean& completedSynchronously)
```

The site is using extension-less aliasing so the configured default handler (EkDavHttpHandlerFactory) needs be looked into. Essentially, this class analyses the request and applies particular rules against it to decide which handler is best suited to serve the content. In this case, the static file should be served by the default content handler. This is selected by looking at the server version: if the server version is greater than 6 then use (the Ektron Implementation of) StaticFileHandler otherwise DefaultHttpHandler.

The server version is parsed from a server variable:

```csharp
private static int GetServerVersion(HttpContext context)
{
    string str = string.Empty;
    if (ServerVersion == 0)
    {
        try
        {
            str = context.Request.ServerVariables["SERVER_SOFTWARE"];
            if (!string.IsNullOrEmpty(str))
            {
                int index = str.IndexOf("/");
                if (index > -1)
                {
                    str = str.Substring(index + 1);
                }
                if (!string.IsNullOrEmpty(str))
                {
                    decimal num2;
                    decimal.TryParse(str, out num2);
                    ServerVersion = (int) num2;
                }
            }
        }
        catch
        {
            ServerVersion = 6;
        }
    }
    return ServerVersion;
}
```

D'oh! Decimal.TryParse will (by default) use the current threads locale and French uses a comma as a decimal separator! 7.0 is not a valid decimal! This could be fixed by passing in CultureInfo.InvariantCulture into the TryParse method to get a consistent evaluation, but that would take a hot fix to deploy.

To fix this now, we need to implement a subclass of EkDavHttpHandlerFactory to ensure that the correct handler is used to serve static files:

```csharp
using System;
using System.Linq;
using System.Reflection;
using System.Web;
using global::Ektron.ASM.FileHandler;

namespace MartinOnDotNet.Ektron.Web
{
    [CLSCompliant(false)]
    public class EkDavHttpHandlerFactory
        : global::Ektron.ASM.EkHttpDavHandler.EkDavHttpHandlerFactory
    {
        public override System.Web.IHttpHandler GetHandler(HttpContext context, string requestType, string url, string pathTranslated)
        {
            IHttpHandler handler = base.GetHandler(context, requestType, url, pathTranslated);
            if (typeof(DefaultHttpHandler).IsInstanceOfType(handler) && HttpRuntime.UsingIntegratedPipeline)
            {
                handler = GetFallbackHandlerForServer();
            }
            return handler;
        }

        private static IHttpHandler GetFallbackHandlerForServer()
        {
            if (!HttpRuntime.UsingIntegratedPipeline) return new DefaultHttpHandler();
            return new StaticFileHandler();
        }
    }
}
```

If you've implemented my [Asset Folder fix](/blog/2010-04-08-ektron-fix-for-uploading-assets-into) then the combined EkDavHttpHandlerFactory is this:

```csharp
using System;
using System.Linq;
using System.Reflection;
using System.Web;
using global::Ektron.ASM.FileHandler;

namespace MartinOnDotNet.Ektron.Web
{
    [CLSCompliant(false)]
    public class EkDavHttpHandlerFactory
        : global::Ektron.ASM.EkHttpDavHandler.EkDavHttpHandlerFactory
    {

        public override System.Web.IHttpHandler GetHandler(HttpContext context, string requestType, string url, string pathTranslated)
        {
            IHttpHandler handler = base.GetHandler(context, requestType, url, pathTranslated);
            if (typeof(AssetHttpHandler).IsInstanceOfType(handler))
            {
                if (!context.Request.PhysicalPath.StartsWith(context.Server.MapPath("~/assets/"), StringComparison.OrdinalIgnoreCase))
                {
                    handler = GetFallbackHandlerForServer();
                }
            }
            else if (typeof(DefaultHttpHandler).IsInstanceOfType(handler) && HttpRuntime.UsingIntegratedPipeline)
            {
                handler = GetFallbackHandlerForServer();
            }
            return handler;
        }

        private static IHttpHandler GetFallbackHandlerForServer()
        {
            if (!HttpRuntime.UsingIntegratedPipeline) return new DefaultHttpHandler();
            return StaticFileHandler;
        }

        [ThreadStatic()]
        private static IHttpHandler _staticFileHandler = null;

        private static IHttpHandler StaticFileHandler
        {
            get
            {
                if (_staticFileHandler == null)
                {
                    Assembly systemWeb = AppDomain.CurrentDomain.GetAssemblies()
                    .Where(ass => ass.GetName().Name == "System.Web")
                    .First();
                    if (systemWeb == null)
                    {
                        Type staticFileHandler = systemWeb.GetType("System.Web.StaticFileHandler");
                        ConstructorInfo ci = staticFileHandler.GetConstructor(
                            BindingFlags.NonPublic | BindingFlags.Instance
                            , null
                            , Type.EmptyTypes
                            , null);
                        _staticFileHandler = ci.Invoke(null) as IHttpHandler;
                        if (_staticFileHandler == null) throw new NotSupportedException("System.Web must contain System.Web.StaticFileHandler");
                    }
                    else
                    {
                        throw new NotSupportedException("AppDomain must contain System.Web!");
                    }
                }
                return _staticFileHandler;
            }
        }
    }
}
```
