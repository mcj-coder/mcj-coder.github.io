---
title: 'Ektron: A Fix For Uploading Assets into a Folder Called Assets'
description: 'Fixing an Ektron bug where images uploaded to folders named "assets" within the library are incorrectly treated as DMS items, by subclassing EkDavHttpHandlerFactory.'
pubDate: 2010-04-08
tags: ['ektron', 'troubleshooting']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/04/ektron-fix-for-uploading-assets-into.html'
heroImage: ../../assets/blog/hero-images/2010-04-08-ektron-fix-for-uploading-assets-into.jpg
---

An interesting bug came in today from a client that had been uploading content and images into their workarea for their upcoming release. Most of their images weren't being displayed on the site or in the workarea.

When the image url was navigated to directly, instead of a server error or file not found we saw this:

> **Error:** Asset requested doesn't exist in the system

I beg to differ! I can see it right there on the file system! After a bit of Googling, I found the same issue on the [Ektron forums](http://dev.ektron.com/forum.aspx?g=posts&t=18704&page=-1) which shows this has been a problem since (at least) 2008! It's also a reasonable Google Hack to find other Ektron Deployments with the same issue (I see you Walmart!).

With a bit of digging I traced the source of the issue to the EkDavHttpHandlerFactory Handler that's used for the url rewriting. More specifically, this block of code:

```csharp
if (((context.Request.PhysicalPath.ToLower().IndexOf(@"\\assets\\") >= 0)
    && (context.Request.PhysicalPath.ToLower().IndexOf(@"\\thumb\_") < 0))
    && ((context.Request.PhysicalPath.ToLower().IndexOf(@"\\orig\_") < 0)
    && (context.Request.PhysicalPath.ToLower().IndexOf(@"\_indexed\\") < 0)))
{
    return new AssetHttpHandler();
}
```

D'oh! The images in question had been uploaded to a folder called assets within the library (not the ~/assets/ folder but ~/uploadedImages/…./assets/….) and the overzealous detection algorithm above was treating them as DMS items.

To fix this I've implemented a subclass of the handler which performs extra checking when the AssetHttpHandler IHttpHandler implementation is returned to ensure that it's only blocking assets within the ~/assets/ folder.

```csharp
using System;
using System.Web;
using System.Reflection;
using global::Ektron.ASM.FileHandler;
using global::Ektron.Cms.UrlAliasing;

namespace MartinOnDotNet.Ektron.Web
{
    /// <summary>
    /// Correctly handler asset folders named /assets/ that aren't the ektron assets folder
    /// </summary>
    [CLSCompliant(false)]
    public class EkDavHttpHandlerFactory
        : global::Ektron.ASM.EkHttpDavHandler.EkDavHttpHandlerFactory
    {
        /// <summary>
        /// Gets the handler.
        /// </summary>
        public override System.Web.IHttpHandler GetHandler(HttpContext context, string requestType, string url, string pathTranslated)
        {
            IHttpHandler handler = base.GetHandler(context, requestType, url, pathTranslated);
            if (typeof(AssetHttpHandler).IsInstanceOfType(handler))
            {
                if (!context.Request.PhysicalPath.StartsWith(
                    context.Server.MapPath("~/assets/"), StringComparison.OrdinalIgnoreCase))
                {
                    handler = GetFallbackHandlerForServer(context);
                }
            }
            return handler;
        }

        /// <summary>
        /// Gets the fallback handler for server.
        /// </summary>
        private static IHttpHandler GetFallbackHandlerForServer(HttpContext context)
        {
            if (ServerVersion(context) > 6)
            {
                return new StaticFileHandler();
            }
            return new DefaultHttpHandler();
        }

        private static int? _serverVersion;

        /// <summary>
        /// Servers the version.
        /// </summary>
        public static int ServerVersion(HttpContext current)
        {
            if (!_serverVersion.HasValue)
            {
                Type t = typeof(global::Ektron.ASM.EkHttpDavHandler.EkDavHttpHandlerFactory);
                _serverVersion = t.InvokeMember(
                    "GetServerVersion"
                    , BindingFlags.InvokeMethod | BindingFlags.NonPublic | BindingFlags.Static
                    , null
                    , t
                    , new object[] { current }
                    , System.Globalization.CultureInfo.InvariantCulture) as int?;
            }
            return _serverVersion.GetValueOrDefault(6);
        }
    }
}
```

Where possible I've reused the functionality from the API (even using a nasty bit of reflection to extract the server version according to the Ektron API).

To use this, copy the class above into your website's \App_Code\CSCode\ folder and in the web.config replace all references to `Ektron.ASM.EkHttpDavHandler.EkDavHttpHandlerFactory` with `MartinOnDotNet.Ektron.Web.EkDavHttpHandlerFactory`.
