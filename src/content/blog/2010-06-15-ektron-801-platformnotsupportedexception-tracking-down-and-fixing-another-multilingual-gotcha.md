---
title: "Ektron 8.01: PlatformNotSupportedException – Tracking Down and Fixing Another Multilingual Gotcha!"
description: "Technical blog post from 2010-06-15"
pubDate: 2010-06-15
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

I’m still tracing though issues after upgrading to 8.01, this time looking at why requests for static files are return 500 - Internal Server Errors when French is selected, but not English. Hmm.

  Looking at the Event Logs shows lots of errors like this:

```csharp
Exception type: PlatformNotSupportedException 
```

```csharp



```csharp
Exception message: The DefaultHttpHandler.BeginProcessRequest method is not 
```

```csharp
supported by IIS integrated pipeline mode. 
```

This is telling me that I’m trying to serve a file via the IIS 7 Integrated Pipeline using a handler that’s specifically designed for IIS 6 (or IIS Classic Pipeline).  What could be causing that?

Stack trace isn’t much help either:

  
```csharp
System.PlatformNotSupportedException: The DefaultHttpHandler.BeginProcessRequest method is not supported by IIS integrated pipeline mode.
```

```csharp
at System.Web.DefaultHttpHandler.BeginProcessRequest(HttpContext context, AsyncCallback callback, Object state)
```

```csharp
at System.Web.HttpApplication.CallHandlerExecutionStep.System.Web.HttpApplication.IExecutionStep.Execute()
```

```csharp
at System.Web.HttpApplication.ExecuteStep(IExecutionStep step, Boolean& completedSynchronously)
```

The site is using extension-less aliasing so the configured default handler (EkDavHttpHandlerFactory) needs be looked into.  Essentially, this class analyses the request and applies particular rules against it to decide which handler is best suited to serve the content.  In this case, the static file should be served by the default content handler.  This is selected by looking at the server version if the server version is greater than 6 then use (the [Ektron](http://bit.ly/d0YHh7) Implementation of) StaticFileHandler otherwise DefaultHttpHandler.

The server version is parse from a server variable:

  
```csharp
private static int GetServerVersion(HttpContext context)
```

```csharp
{
```

```csharp
string str = string.Empty;
```

```csharp
if (ServerVersion == 0)
```

```csharp
{
```

```csharp
try
```

```csharp
{
```

```csharp
str = context.Request.ServerVariables["SERVER_SOFTWARE"];
```

```csharp
if (!string.IsNullOrEmpty(str))
```

```csharp
{
```

```csharp
int index = str.IndexOf("/");
```

```csharp
if (index > -1)
```

```csharp
{
```

```csharp
str = str.Substring(index + 1);
```

```csharp
}
```

```csharp
if (!string.IsNullOrEmpty(str))
```

```csharp
{
```

```csharp
decimal num2;
```

```csharp
decimal.TryParse(str, out num2);
```

```csharp
ServerVersion = (int) num2;
```

```csharp
}
```

```csharp
}
```

```csharp
}
```

```csharp
catch
```

```csharp
{
```

```csharp
ServerVersion = 6;
```

```csharp
}
```

```csharp
}
```

```csharp
return ServerVersion;
```

```csharp
}
```

```csharp



```csharp
/* Grabbed using Reflector From
```

```csharp



```csharp
private static int GetServerVersion(HttpContext context);
```

```csharp



```csharp
Declaring Type: Ektron.ASM.EkHttpDavHandler.EkDavHttpHandlerFactory 
```

```csharp
Assembly: Ektron.ASM.EkHttpDavHandler, Version=1.0.0.0 
```

```csharp



```csharp
*/
```

```csharp



D’oh!  Decimal.TryParse will (by default) use the current threads locale and French uses a comma as a decimal seperator!  7.0 is not a valid decimal!  This could be fixed by passing in CultureInfo.InvariantCulture into the TryParse method to get a consistent evaluation, but that would take a hot fix to deploy.

To fix this now, we need to implement a subclass of EkDavHttpHandlerFactory to ensure that the correct handler is used to serve static files:

  
```csharp
using System;
```

```csharp
using System.Linq;
```

```csharp
using System.Reflection;
```

```csharp
using System.Web;
```

```csharp
using global::Ektron.ASM.FileHandler;
```

```csharp



```csharp



```csharp
namespace MartinOnDotNet.Ektron.Web
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// Correctly handler asset folders named /assets/ that aren't the ektron assets folder
```

```csharp
/// 
```

```csharp
/// Required assembly references
```

```csharp
/// 
```

```csharp
/// Ektron.ASM.EkHttpDavHandler
```

```csharp
/// Ektron.ASM.FileHandler
```

```csharp
/// Ektron.Cms.URLAliasing
```

```csharp
/// 
```

```csharp
/// 
```

```csharp
[CLSCompliant(false)]
```

```csharp
public class EkDavHttpHandlerFactory
```

```csharp
: global::Ektron.ASM.EkHttpDavHandler.EkDavHttpHandlerFactory
```

```csharp
{
```

```csharp



```csharp
/// 
```

```csharp
/// Gets the handler.
```

```csharp
/// 
```

```csharp
/// The context.
```

```csharp
/// Type of the request.
```

```csharp
/// The URL.
```

```csharp
/// The path translated.
```

```csharp
/// The correct request handler
```

```csharp
public override System.Web.IHttpHandler GetHandler(HttpContext context, string requestType, string url, string pathTranslated)
```

```csharp
{
```

```csharp
IHttpHandler handler = base.GetHandler(context, requestType, url, pathTranslated); // inherit other mapping logic
```

```csharp
if (typeof(DefaultHttpHandler).IsInstanceOfType(handler) && HttpRuntime.UsingIntegratedPipeline)
```

```csharp
{
```

```csharp
handler = GetFallbackHandlerForServer();
```

```csharp
}
```

```csharp
return handler;
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Gets the fallback handler for server.
```

```csharp
/// 
```

```csharp
/// 
```

```csharp
/// This algorithm was taken from the Ektron implementation using
```

```csharp
/// Reflector.  As it's reflection based, there's a chance that future releases
```

```csharp
/// will break it.
```

```csharp
private static IHttpHandler GetFallbackHandlerForServer()
```

```csharp
{
```

```csharp
if (!HttpRuntime.UsingIntegratedPipeline) return new DefaultHttpHandler();
```

```csharp
return new StaticFileHandler(); // return Ektron Static File Implementation
```

```csharp
}
```

```csharp



```csharp
}
```

```csharp
}
```

If you’ve implemented my [Asset Folder fix](http://martinondotnet.blogspot.com/2010/04/ektron-fix-for-uploading-assets-into.html) then the combined EkDavHttpHandlerFactory is this:

  
```csharp
using System;
```

```csharp
using System.Linq;
```

```csharp
using System.Reflection;
```

```csharp
using System.Web;
```

```csharp
using global::Ektron.ASM.FileHandler;
```

```csharp



```csharp



```csharp
namespace MartinOnDotNet.Ektron.Web
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// Correctly handler asset folders named /assets/ that aren't the ektron assets folder
```

```csharp
/// 
```

```csharp
/// Required assembly references
```

```csharp
/// 
```

```csharp
/// Ektron.ASM.EkHttpDavHandler
```

```csharp
/// Ektron.ASM.FileHandler
```

```csharp
/// Ektron.Cms.URLAliasing
```

```csharp
/// 
```

```csharp
/// 
```

```csharp
[CLSCompliant(false)]
```

```csharp
public class EkDavHttpHandlerFactory
```

```csharp
: global::Ektron.ASM.EkHttpDavHandler.EkDavHttpHandlerFactory
```

```csharp
{
```

```csharp



```csharp
/// 
```

```csharp
/// Gets the handler.
```

```csharp
/// 
```

```csharp
/// The context.
```

```csharp
/// Type of the request.
```

```csharp
/// The URL.
```

```csharp
/// The path translated.
```

```csharp
/// The correct request handler
```

```csharp
public override System.Web.IHttpHandler GetHandler(HttpContext context, string requestType, string url, string pathTranslated)
```

```csharp
{
```

```csharp
IHttpHandler handler = base.GetHandler(context, requestType, url, pathTranslated); // inherit other mapping logic
```

```csharp
if (typeof(AssetHttpHandler).IsInstanceOfType(handler)) // override assets folder handling
```

```csharp
{
```

```csharp
if (!context.Request.PhysicalPath.StartsWith(context.Server.MapPath("~/assets/"), StringComparison.OrdinalIgnoreCase))
```

```csharp
{
```

```csharp
handler = GetFallbackHandlerForServer();
```

```csharp



```csharp
}
```

```csharp
}
```

```csharp
else if (typeof(DefaultHttpHandler).IsInstanceOfType(handler) && HttpRuntime.UsingIntegratedPipeline)
```

```csharp
{
```

```csharp
handler = GetFallbackHandlerForServer();
```

```csharp
}
```

```csharp
return handler;
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Gets the fallback handler for server.
```

```csharp
/// 
```

```csharp
/// 
```

```csharp
/// This algorithm was taken from the Ektron implementation using
```

```csharp
/// Reflector.  As it's reflection based, there's a chance that future releases
```

```csharp
/// will break it.
```

```csharp
private static IHttpHandler GetFallbackHandlerForServer()
```

```csharp
{
```

```csharp
if (!HttpRuntime.UsingIntegratedPipeline) return new DefaultHttpHandler();
```

```csharp
return StaticFileHandler;
```

```csharp
}
```

```csharp



```csharp
[ThreadStatic()]
```

```csharp
private static IHttpHandler _staticFileHandler = null;
```

```csharp



```csharp
/// 
```

```csharp
/// Gets the static file handler.
```

```csharp
/// 
```

```csharp
/// The static file handler.
```

```csharp
private static IHttpHandler StaticFileHandler
```

```csharp
{
```

```csharp
get
```

```csharp
{
```

```csharp
if (_staticFileHandler == null)
```

```csharp
{
```

```csharp
Assembly systemWeb = AppDomain.CurrentDomain.GetAssemblies()
```

```csharp
.Where(ass => ass.GetName().Name == "System.Web")
```

```csharp
.First();
```

```csharp
if (systemWeb == null)
```

```csharp
{
```

```csharp
Type staticFileHandler = systemWeb.GetType("System.Web.StaticFileHandler");
```

```csharp
ConstructorInfo ci = staticFileHandler.GetConstructor(
```

```csharp
BindingFlags.NonPublic | BindingFlags.Instance
```

```csharp
, null
```

```csharp
, Type.EmptyTypes
```

```csharp
, null);
```

```csharp
_staticFileHandler = ci.Invoke(null) as IHttpHandler;
```

```csharp
if (_staticFileHandler == null) throw new NotSupportedException("System.Web must contain System.Web.StaticFileHandler");
```

```csharp
}
```

```csharp
else
```

```csharp
{
```

```csharp
throw new NotSupportedException("AppDomain must contain System.Web!");
```

```csharp
}
```

```csharp
}
```

```csharp
return _staticFileHandler;
```

```csharp
}
```

```csharp
}
```

```csharp
}
```

```csharp
}
```