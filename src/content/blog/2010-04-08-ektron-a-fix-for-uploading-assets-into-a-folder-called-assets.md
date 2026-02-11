---
title: "Ektron: A Fix For Uploading Assets into a Folder Called Assets"
description: "Technical blog post from 2010-04-08"
pubDate: 2010-04-08
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

An interesting bug came in today from a client that had been uploading content and images into their workarea for their upcoming release.  Most of their images weren’t being displayed on the site or in the workarea.

  When the image url was navigated to directly, instead of an server error or file not found we saw this:

     **Error: **Asset requested doesn't exist in the system

   I beg to differ! I can see it right there on the file system!  After a bit of Googling, I found the same issue on the [Ektron](http://bit.ly/d0YHh7) forums ([http://bit.ly/90erho](http://bit.ly/90erho))  which shows this has been a problem since (at least) 2008!  It’s also a reasonable [Google Hack](http://bit.ly/9dHz4u) to find other Ektron Deployments with the same issue (I see you Walmart!).

  With a bit of digging I traced the source of the issue to the EkDavHttpHandlerFactory Handler that’s used for the url rewriting.  More specifically, this block of code:

```csharp
// Taken from Ektron.ASM.EkHttpDavHandler.EkDavHttpHandlerFactory.GetHandler using Reflector
```

```csharp



```csharp
if (((context.Request.PhysicalPath.ToLower().IndexOf(@"\assets\") >= 0) 
```

```csharp
&& (context.Request.PhysicalPath.ToLower().IndexOf(@"\thumb_") 
```

```csharp
&& ((context.Request.PhysicalPath.ToLower().IndexOf(@"\orig_") 
```

```csharp
&& (context.Request.PhysicalPath.ToLower().IndexOf(@"_indexed\") 
```

```csharp
{
```

```csharp
return new AssetHttpHandler();
```

```csharp
}
```

 D’oh!  The images in question had been uploaded to a folder called assets within the library (not the ~/assets/ folder but ~/uploadedImages/…./assets/….) and the overzealous detection algorithm above was treating them as DMS items.

To fix this I’ve implemented a subclass of the handler which performs extra checking when the AssetHttpHandler IHttpHandler implementation is returned to ensure that it’s only blocking assets within the ~/assets/ folder.

  
```csharp
using System;
```

```csharp
using System.Web;
```

```csharp
using System.Reflection;
```

```csharp
using global::Ektron.ASM.FileHandler;
```

```csharp
using global::Ektron.Cms.UrlAliasing;
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
handler = GetFallbackHandlerForServer(context);
```

```csharp



```csharp
}
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
/// The context.
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
private static IHttpHandler GetFallbackHandlerForServer(HttpContext context)
```

```csharp
{
```

```csharp
if (ServerVersion(context) > 6)
```

```csharp
{
```

```csharp
return new StaticFileHandler();
```

```csharp
}
```

```csharp
return new DefaultHttpHandler();
```

```csharp
}
```

```csharp



```csharp
private static int? _serverVersion;
```

```csharp



```csharp
/// 
```

```csharp
/// Servers the version.
```

```csharp
/// 
```

```csharp
/// The current.
```

```csharp
/// The server version using the ektron implemented algorithm
```

```csharp
public static int ServerVersion(HttpContext current)
```

```csharp
{
```

```csharp
if (!_serverVersion.HasValue)
```

```csharp
{
```

```csharp
Type t = typeof(global::Ektron.ASM.EkHttpDavHandler.EkDavHttpHandlerFactory);
```

```csharp
_serverVersion = t.InvokeMember(
```

```csharp
"GetServerVersion"
```

```csharp
, BindingFlags.InvokeMethod | BindingFlags.NonPublic | BindingFlags.Static
```

```csharp
, null
```

```csharp
, t
```

```csharp
, new object[] { current }
```

```csharp
, System.Globalization.CultureInfo.InvariantCulture) as int?;
```

```csharp
}
```

```csharp
return _serverVersion.GetValueOrDefault(6);
```

```csharp



```csharp
}
```

```csharp
}
```

```csharp
}
```

Where possible I’ve reused the functionality from the API (even using a nasty bit of reflection to extract the server version according to the Ektron API).  

To use this, copy the class above into a your websites \App_Code\CSCode\ folder and in the web.config replace all references to ‘Ektron.ASM.EkHttpDavHandler.EkDavHttpHandlerFactory’ with ‘MartinOnDotNet.Ektron.Web.EkDavHttpHandlerFactory’.
