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

             1: Exception type: PlatformNotSupportedException 

       2:  

       3: Exception message: The DefaultHttpHandler.BeginProcessRequest method is not 

       4: supported by IIS integrated pipeline mode. 

This is telling me that I’m trying to serve a file via the IIS 7 Integrated Pipeline using a handler that’s specifically designed for IIS 6 (or IIS Classic Pipeline).  What could be causing that?

Stack trace isn’t much help either:

  
       1: System.PlatformNotSupportedException: The DefaultHttpHandler.BeginProcessRequest method is not supported by IIS integrated pipeline mode.

       2:    at System.Web.DefaultHttpHandler.BeginProcessRequest(HttpContext context, AsyncCallback callback, Object state)

       3:    at System.Web.HttpApplication.CallHandlerExecutionStep.System.Web.HttpApplication.IExecutionStep.Execute()

       4:    at System.Web.HttpApplication.ExecuteStep(IExecutionStep step, Boolean& completedSynchronously)

The site is using extension-less aliasing so the configured default handler (EkDavHttpHandlerFactory) needs be looked into.  Essentially, this class analyses the request and applies particular rules against it to decide which handler is best suited to serve the content.  In this case, the static file should be served by the default content handler.  This is selected by looking at the server version if the server version is greater than 6 then use (the [Ektron](http://bit.ly/d0YHh7) Implementation of) StaticFileHandler otherwise DefaultHttpHandler.

The server version is parse from a server variable:

  
       1: private static int GetServerVersion(HttpContext context)

       2: {

       3:     string str = string.Empty;

       4:     if (ServerVersion == 0)

       5:     {

       6:         try

       7:         {

       8:             str = context.Request.ServerVariables["SERVER_SOFTWARE"];

       9:             if (!string.IsNullOrEmpty(str))

      10:             {

      11:                 int index = str.IndexOf("/");

      12:                 if (index > -1)

      13:                 {

      14:                     str = str.Substring(index + 1);

      15:                 }

      16:                 if (!string.IsNullOrEmpty(str))

      17:                 {

      18:                     decimal num2;

      19:                     decimal.TryParse(str, out num2);

      20:                     ServerVersion = (int) num2;

      21:                 }

      22:             }

      23:         }

      24:         catch

      25:         {

      26:             ServerVersion = 6;

      27:         }

      28:     }

      29:     return ServerVersion;

      30: }

      31:  

      32: /* Grabbed using Reflector From

      33: 

      34: private static int GetServerVersion(HttpContext context);

      35:  

      36: Declaring Type: Ektron.ASM.EkHttpDavHandler.EkDavHttpHandlerFactory 

      37: Assembly: Ektron.ASM.EkHttpDavHandler, Version=1.0.0.0 

      38: 

      39: */

      40:  

D’oh!  Decimal.TryParse will (by default) use the current threads locale and French uses a comma as a decimal seperator!  7.0 is not a valid decimal!  This could be fixed by passing in CultureInfo.InvariantCulture into the TryParse method to get a consistent evaluation, but that would take a hot fix to deploy.

To fix this now, we need to implement a subclass of EkDavHttpHandlerFactory to ensure that the correct handler is used to serve static files:

  
       1: using System;

       2: using System.Linq;

       3: using System.Reflection;

       4: using System.Web;

       5: using global::Ektron.ASM.FileHandler;

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

      36:              if (typeof(DefaultHttpHandler).IsInstanceOfType(handler) && HttpRuntime.UsingIntegratedPipeline)

      37:             {

      38:                 handler = GetFallbackHandlerForServer();

      39:             }

      40:             return handler;

      41:         }

      42:  

      43:         /// 

      44:         /// Gets the fallback handler for server.

      45:         /// 

      46:         /// 

      47:         /// This algorithm was taken from the Ektron implementation using

      48:         /// Reflector.  As it's reflection based, there's a chance that future releases

      49:         /// will break it.

      50:         private static IHttpHandler GetFallbackHandlerForServer()

      51:         {

      52:             if (!HttpRuntime.UsingIntegratedPipeline) return new DefaultHttpHandler();

      53:             return new StaticFileHandler(); // return Ektron Static File Implementation

      54:         }

      55:  

      56:     }

      57: }

If you’ve implemented my [Asset Folder fix](http://martinondotnet.blogspot.com/2010/04/ektron-fix-for-uploading-assets-into.html) then the combined EkDavHttpHandlerFactory is this:

  
       1: using System;

       2: using System.Linq;

       3: using System.Reflection;

       4: using System.Web;

       5: using global::Ektron.ASM.FileHandler;

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

      40:                     handler = GetFallbackHandlerForServer();

      41:  

      42:                 }

      43:             }

      44:             else if (typeof(DefaultHttpHandler).IsInstanceOfType(handler) && HttpRuntime.UsingIntegratedPipeline)

      45:             {

      46:                 handler = GetFallbackHandlerForServer();

      47:             }

      48:             return handler;

      49:         }

      50:  

      51:         /// 

      52:         /// Gets the fallback handler for server.

      53:         /// 

      54:         /// 

      55:         /// This algorithm was taken from the Ektron implementation using

      56:         /// Reflector.  As it's reflection based, there's a chance that future releases

      57:         /// will break it.

      58:         private static IHttpHandler GetFallbackHandlerForServer()

      59:         {

      60:             if (!HttpRuntime.UsingIntegratedPipeline) return new DefaultHttpHandler();

      61:             return StaticFileHandler;

      62:         }

      63:  

      64:         [ThreadStatic()]

      65:         private static IHttpHandler _staticFileHandler = null;

      66:  

      67:         /// 

      68:         /// Gets the static file handler.

      69:         /// 

      70:         /// The static file handler.

      71:         private static IHttpHandler StaticFileHandler

      72:         {

      73:             get

      74:             {

      75:                 if (_staticFileHandler == null)

      76:                 {

      77:                     Assembly systemWeb = AppDomain.CurrentDomain.GetAssemblies()

      78:                     .Where(ass => ass.GetName().Name == "System.Web")

      79:                     .First();

      80:                     if (systemWeb == null)

      81:                     {

      82:                         Type staticFileHandler = systemWeb.GetType("System.Web.StaticFileHandler");

      83:                         ConstructorInfo ci = staticFileHandler.GetConstructor(

      84:                             BindingFlags.NonPublic | BindingFlags.Instance

      85:                             , null

      86:                             , Type.EmptyTypes

      87:                             , null);

      88:                         _staticFileHandler = ci.Invoke(null) as IHttpHandler;

      89:                         if (_staticFileHandler == null) throw new NotSupportedException("System.Web must contain System.Web.StaticFileHandler");

      90:                     }

      91:                     else

      92:                     {

      93:                         throw new NotSupportedException("AppDomain must contain System.Web!");

      94:                     }

      95:                 }

      96:                 return _staticFileHandler;

      97:             }

      98:         }

      99:     }

     100: }
