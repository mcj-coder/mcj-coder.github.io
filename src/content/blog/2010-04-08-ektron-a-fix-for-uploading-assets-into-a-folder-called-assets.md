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

             1: // Taken from Ektron.ASM.EkHttpDavHandler.EkDavHttpHandlerFactory.GetHandler using Reflector

       2:  

       3: if (((context.Request.PhysicalPath.ToLower().IndexOf(@"\assets\") >= 0) 

       4:     && (context.Request.PhysicalPath.ToLower().IndexOf(@"\thumb_") 

       5:     && ((context.Request.PhysicalPath.ToLower().IndexOf(@"\orig_") 

       6:     && (context.Request.PhysicalPath.ToLower().IndexOf(@"_indexed\") 

       7:   {

       8:       return new AssetHttpHandler();

       9:   }

 D’oh!  The images in question had been uploaded to a folder called assets within the library (not the ~/assets/ folder but ~/uploadedImages/…./assets/….) and the overzealous detection algorithm above was treating them as DMS items.

To fix this I’ve implemented a subclass of the handler which performs extra checking when the AssetHttpHandler IHttpHandler implementation is returned to ensure that it’s only blocking assets within the ~/assets/ folder.

  
       1: using System;

       2: using System.Web;

       3: using System.Reflection;

       4: using global::Ektron.ASM.FileHandler;

       5: using global::Ektron.Cms.UrlAliasing;

       6:  

       7:  

       8: namespace MartinOnDotNet.Ektron.Web

       9: {

      10:     /// 

      11:     /// Correctly handler asset folders named /assets/ that aren't the ektron assets folder

      12:     /// 

      13:     /// Required assembly references

      14:     /// 

      15:     /// Ektron.ASM.EkHttpDavHandler

      16:     /// Ektron.ASM.FileHandler

      17:     /// Ektron.Cms.URLAliasing

      18:     /// 

      19:     /// 

      20:     [CLSCompliant(false)]

      21:     public class EkDavHttpHandlerFactory

      22:         : global::Ektron.ASM.EkHttpDavHandler.EkDavHttpHandlerFactory

      23:     {

      24:  

      25:         /// 

      26:         /// Gets the handler.

      27:         /// 

      28:         /// The context.

      29:         /// Type of the request.

      30:         /// The URL.

      31:         /// The path translated.

      32:         /// The correct request handler

      33:         public override System.Web.IHttpHandler GetHandler(HttpContext context, string requestType, string url, string pathTranslated)

      34:         {

      35:             IHttpHandler handler = base.GetHandler(context, requestType, url, pathTranslated); // inherit other mapping logic

      36:             if (typeof(AssetHttpHandler).IsInstanceOfType(handler)) // override assets folder handling

      37:             {

      38:                 if (!context.Request.PhysicalPath.StartsWith(context.Server.MapPath("~/assets/"), StringComparison.OrdinalIgnoreCase))

      39:                 {

      40:                     handler = GetFallbackHandlerForServer(context);

      41:  

      42:                 }

      43:             }

      44:             return handler;

      45:         }

      46:  

      47:         /// 

      48:         /// Gets the fallback handler for server.

      49:         /// 

      50:         /// The context.

      51:         /// This algorithm was taken from the Ektron implementation using 

      52:         /// Reflector.  As it's reflection based, there's a chance that future releases

      53:         /// will break it.

      54:         private static IHttpHandler GetFallbackHandlerForServer(HttpContext context)

      55:         {

      56:             if (ServerVersion(context) > 6)

      57:             {

      58:                 return new StaticFileHandler();

      59:             }

      60:             return new DefaultHttpHandler();

      61:         }

      62:  

      63:         private static int? _serverVersion;

      64:  

      65:         /// 

      66:         /// Servers the version.

      67:         /// 

      68:         /// The current.

      69:         /// The server version using the ektron implemented algorithm

      70:         public static int ServerVersion(HttpContext current)

      71:         {

      72:             if (!_serverVersion.HasValue)

      73:             {

      74:                 Type t = typeof(global::Ektron.ASM.EkHttpDavHandler.EkDavHttpHandlerFactory);

      75:                 _serverVersion = t.InvokeMember(

      76:                     "GetServerVersion"

      77:                     , BindingFlags.InvokeMethod | BindingFlags.NonPublic | BindingFlags.Static

      78:                     , null

      79:                     , t

      80:                     , new object[] { current }

      81:                     , System.Globalization.CultureInfo.InvariantCulture) as int?;

      82:             }

      83:             return _serverVersion.GetValueOrDefault(6);

      84:  

      85:         }

      86:     }

      87: }

Where possible I’ve reused the functionality from the API (even using a nasty bit of reflection to extract the server version according to the Ektron API).  

To use this, copy the class above into a your websites \App_Code\CSCode\ folder and in the web.config replace all references to ‘Ektron.ASM.EkHttpDavHandler.EkDavHttpHandlerFactory’ with ‘MartinOnDotNet.Ektron.Web.EkDavHttpHandlerFactory’.
