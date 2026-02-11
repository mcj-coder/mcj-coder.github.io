---
title: "Security: Protect against POET Attacks with Custom Errors!"
description: "Technical blog post from 2010-09-20"
pubDate: 2010-09-20
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

There’s been a [big](http://bit.ly/adYPvZ) [deal](http://bit.ly/9ANVPs) made of a [serious security flaw](http://bit.ly/9KxgtL) in ASP.Net which potentially affects a lot of .Net sites, that allows a 3rd Party to trick ASP.Net into serving sensitive files within a web application folder.  Microsoft have released official advise on how to [temporarily patch](http://bit.ly/adYPvZ) the problem which revolves around forcing Error  and Page Not found pages to return the same status page.  This would need to stay in place until a permanent fix is released.

  This workaround clearly introduces an usability issue, which client may not accept. 

  Fortunately a quick amend to my [Custom Error Module](http://bit.ly/d3b0Xt) can secure your site against the attack with minimal impact to usability.  

  

             1: using System;

       2: using System.Web;

       3: using System.Net;

       4: using System.Collections.Generic;

       5: using System.Configuration;

       6: using System.Web.Configuration;

       7:  

       8:  

       9: namespace MartinOnDotNet.Website.Support

      10: {

      11:     /// 

      12:     /// Handles errors in an SEO friendly manner

      13:     /// 

      14:     public class SeoErrorLoggingModule : IHttpModule

      15:     {

      16:  

      17:         private static System.Random random = new Random((int)DateTime.Now.Ticks);

      18:  

      19:         private const int MaxDelay = 500;

      20:  

      21:         private static CustomErrorsSection customErrors = WebConfigurationManager.GetSection("system.web/customErrors") as CustomErrorsSection;

      22:  

      23:         /// 

      24:         /// Called when [error].

      25:         /// 

      26:         /// The sender.

      27:         /// The  instance containing the event data.

      28:         protected virtual void OnError(object sender, EventArgs e)

      29:         {

      30:             HttpApplication application = (HttpApplication)sender;

      31:             HttpContext context = application.Context;

      32:             if (context != null && context.AllErrors != null)

      33:             {

      34:                 foreach (Exception ex in context.AllErrors)

      35:                 {

      36:                     ex.Data["RawUrl"] = context.Request.RawUrl;

      37:                     HttpException hex = ex as HttpException;

      38:                     if (hex != null && hex.GetHttpCode() == (int)HttpStatusCode.NotFound)

      39:                     {

      40:                         Logging.Logger.LogWarning(string.Format(System.Globalization.CultureInfo.InvariantCulture, "Requested File Not Found {0} ({1})", context.Request.RawUrl, context.Request.Url));

      41:                     }

      42:                     else

      43:                     {

      44:                         Logging.Logger.Log(ex);

      45:                     }

      46:                    

      47:                 }

      48:             }

      49:             HttpException httpException = context.Error as HttpException;

      50:             context.Response.Clear();

      51:             if (httpException != null && !IsResourceRequest(context.CurrentHandler))

      52:                 context.Response.StatusCode = httpException.GetHttpCode();

      53:             else

      54:                 context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

      55:             if (((context.IsCustomErrorEnabled && !context.Request.Browser.Crawler) || IsResourceRequest(context.CurrentHandler) )

      56:                 && !IsAnErrorPage(context.Request.RawUrl))

      57:             {

      58:                 System.Threading.Thread.Sleep(TimeSpan.FromMilliseconds(_random.Next(MaxDelay)));

      59:                 context.ClearError();

      60:                 string path = GetPathForError(context, (HttpStatusCode)context.Response.StatusCode);

      61:                 if (!string.IsNullOrEmpty(path))

      62:                 {

      63:                    if (CustomErrors.RedirectMode == CustomErrorsRedirectMode.ResponseRedirect && !IsResourceRequest(context.CurrentHandler) )

      64:                    {

      65:                        context.Response.Redirect(path, true);

      66:                    }

      67:                    else

      68:                    {

      69:                        context.RewritePath(path);

      70:                    }

      71:                 }

      72:             }

      73:         }

      74:  

      75:         /// 

      76:         /// Determines whether current request is to a resource handler

      77:         /// 

      78:         /// The handler.

      79:         /// 

      80:         ///     true if [is resource request] [the specified handler]; otherwise, false.

      81:         /// 

      82:         protected virtual bool IsResourceRequest(IHttpHandler handler)

      83:         {

      84:             return handler != null

      85:                 &&

      86:                 (typeof(System.Web.Handlers.AssemblyResourceLoader).IsInstanceOfType(handler)

      87:                 || typeof(System.Web.Handlers.ScriptResourceHandler).IsInstanceOfType(handler));

      88:  

      89:         }

      90:  

      91:         /// 

      92:         /// Gets the path for error.

      93:         /// 

      94:         /// The current.

      95:         /// The status.

      96:         /// 

      97:         protected virtual string GetPathForError(HttpContext current, HttpStatusCode status)

      98:         {

      99:             foreach (CustomError ce in customErrors.Errors)

     100:             {

     101:                 if (ce.StatusCode == (int)status) return ce.Redirect;

     102:             }

     103:             return customErrors.DefaultRedirect;

     104:         }

     105:  

     106:         /// 

     107:         /// Determines whether the given path (RawUrl) is an error page itself

     108:         /// 

     109:         /// The path.

     110:         /// 

     111:         ///     true if [is an error page] [the specified path]; otherwise, false.

     112:         /// 

     113:         protected virtual bool IsAnErrorPage(string path)

     114:         {

     115:             if (ErrorPages != null)

     116:             {

     117:                 foreach (string s in ErrorPages)

     118:                 {

     119:                     if (path.IndexOf(s, StringComparison.OrdinalIgnoreCase) > -1) return true;

     120:                 }

     121:             }

     122:             return false;

     123:         }

     124:  

     125:         /// 

     126:         /// Gets the error pages.

     127:         /// 

     128:         /// The error pages.

     129:         protected virtual IEnumerablestring> ErrorPages

     130:         {

     131:             get

     132:             {

     133:                 

     134:                 foreach (CustomError ce in customErrors.Errors)

     135:                 {

     136:                     yield return ce.Redirect;

     137:                 }

     138:                 yield return customErrors.DefaultRedirect;

     139:             }

     140:         }

     141:  

     142:        /// 

     143:        /// Disposes of the resources (other than memory) used by the module that implements .

     144:        /// 

     145:        public void Dispose()

     146:        {

     147:            //clean-up code here.

     148:        }

     149:  

     150:        /// 

     151:        /// Initializes a module and prepares it to handle requests.

     152:        /// 

     153:        /// An  that provides access to the methods, properties, and events common to all application objects within an ASP.NET application

     154:        public void Init(HttpApplication context)

     155:        {

     156:            // Below is an example of how you can handle LogRequest event and provide 

     157:            // custom logging implementation for it

     158:            context.Error += new EventHandler(OnError);

     159:        }

     160:  

     161:  

     162:     }

     163: }

The amendments hinge on the fact that the exploit only really affects the WebResource.axd and ScriptResource.axd so any error relating from these handlers is automatically given an 500 status (Internal Server Error) and treated as a normal error.  This is an acceptable compromise for me as all references to these handlers should be programmatically generated and by your site and therefore ‘correct’.

As per, Scott Gu’s recommendation I’ve added a random <500ms delay to the processing of all errors to help muddy the waters and added support for the ResponseRewrite property on the CustomErrors element.
