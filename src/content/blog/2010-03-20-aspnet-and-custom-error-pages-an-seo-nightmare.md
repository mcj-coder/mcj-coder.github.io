---
title: "ASP.Net and Custom Error Pages, an SEO nightmare?"
description: "Technical blog post from 2010-03-20"
pubDate: 2010-03-20
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

It’s a (conscientious) developer’s worst fear:

     You’ve slaved long and hard to produce a top-notch, blistering fast website that fully shows off your coding prowess and skills, you unveil the website to critical acclaim and universal client approval (imagine the cheering crowds) but then out-of-hours the database server fails!  ***Yerrk***!

    All the developer’s are out celebrating a successful so no-one notices the log file growing bigger and bigger, screaming to be heard…..and then the client notices *and it really hits the fan!*

    After a frantic few hours the DB hardware’s restored and the website returns to it’s former glory….crisis over.

   Or is it?

  You’re a good web developer, of course you are, you’ve enabled the custom error pages in ASP.Net (you’ve probably event set the servers [deployment property to retail](http://bit.ly/9xIZCr)** to make doubly sure).  Every visitor to the site during your downtime would have seen a nice and friendly message informing them that there’s a problem with the site and it will be up again shortly.

  Maybe, you’ve even reduced the potential impact by adding some marketing blurb about how great your products are, nice meaning full copy to make your visitors want to return to the site when it’s back when the sites back up.  In fact, just the sort of copy that search engines love – ***D’oh***!  If your site has had issues whilst being indexed, that error message could very well come back to haunt you!

  Now in fairness, it’s unlikely that your error page will be ranked as the #1 authority for a particular subject. Search engines have gotten pretty good at spotting these gaffs, but it won’t be helping your page rankings any either.

  Here’s why, when your ASP.Net application throws an unhandled exception it naturally wants to return a 500 status code (Internal Server Error) and if you don’t have custom errors switched on, that’s what you get which leads to the [Yellow Screen of Death](http://bit.ly/c9QlW5)!  But with custom error handling switched on there’s a neat little HttpModule that detects the 500 [status code](http://bit.ly/bhlbHh) (Internal Server Error) and turns this in a redirect (302 status code) to your nice custom error page.  This then renders successfully (they’ll be no errors with your error page after all!) and returns a 200 status (OK). 

  For a visitor (human or web crawler), this looks *exactly* the same as a normal redirect.

  Clearly then what we need is a smarter custom error HttpModule to selectively redirect the visitor based on whether or not they’re a search engine.  In fact, one just like this:

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

      17:         /// 

      18:         /// Called when [error].

      19:         /// 

      20:         /// The sender.

      21:         /// The  instance containing the event data.

      22:         protected virtual void OnError(object sender, EventArgs e)

      23:         {

      24:             HttpApplication application = (HttpApplication)sender;

      25:             HttpContext context = application.Context;

      26:             if (context != null && context.AllErrors != null)

      27:             {

      28:                 foreach (Exception ex in context.AllErrors)

      29:                 {

      30:                     ex.Data["RawUrl"] = context.Request.RawUrl;

      31:                     HttpException hex = ex as HttpException;

      32:                     if (hex != null && hex.GetHttpCode() == (int)HttpStatusCode.NotFound)

      33:                     {

      34:                         Logging.Logger.LogWarning(string.Format(System.Globalization.CultureInfo.InvariantCulture, "Requested File Not Found {0} ({1})", context.Request.RawUrl, context.Request.Url));

      35:                     }

      36:                     else

      37:                     {

      38:                         Logging.Logger.Log(ex);

      39:                     }

      40:                    

      41:                 }

      42:             }

      43:             HttpException httpException = context.Error as HttpException;

      44:             context.Response.Clear();

      45:             if (httpException != null)

      46:                 context.Response.StatusCode = httpException.GetHttpCode();

      47:             else

      48:                 context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

      49:             if (context.IsCustomErrorEnabled

      50:                 && !context.Request.Browser.Crawler

      51:                 && !IsAnErrorPage(context.Request.RawUrl))

      52:             {

      53:                 context.ClearError();

      54:                 string path = GetPathForError(context, (HttpStatusCode)context.Response.StatusCode);

      55:                 if (!string.IsNullOrEmpty(path))

      56:                 {

      57:                     context.Response.Redirect(path, true);

      58:                 }

      59:             }

      60:         }

      61:  

      62:         /// 

      63:         /// Gets the path for error.

      64:         /// 

      65:         /// The current.

      66:         /// The status.

      67:         /// 

      68:         protected virtual string GetPathForError(HttpContext current, HttpStatusCode status)

      69:         {

      70:             CustomErrorsSection customErrors = WebConfigurationManager.GetSection("system.web/customErrors") as CustomErrorsSection;

      71:             foreach (CustomError ce in customErrors.Errors)

      72:             {

      73:                 if (ce.StatusCode == (int)status) return ce.Redirect;

      74:             }

      75:             return customErrors.DefaultRedirect;

      76:         }

      77:  

      78:         /// 

      79:         /// Determines whether the given path (RawUrl) is an error page itself

      80:         /// 

      81:         /// The path.

      82:         /// 

      83:         ///     true if [is an error page] [the specified path]; otherwise, false.

      84:         /// 

      85:         protected virtual bool IsAnErrorPage(string path)

      86:         {

      87:             if (ErrorPages != null)

      88:             {

      89:                 foreach (string s in ErrorPages)

      90:                 {

      91:                     if (path.IndexOf(s, StringComparison.OrdinalIgnoreCase) > -1) return true;

      92:                 }

      93:             }

      94:             return false;

      95:         }

      96:  

      97:         /// 

      98:         /// Gets the error pages.

      99:         /// 

     100:         /// The error pages.

     101:         protected virtual IEnumerablestring> ErrorPages

     102:         {

     103:             get

     104:             {

     105:                 CustomErrorsSection customErrors = WebConfigurationManager.GetSection("system.web/customErrors") as CustomErrorsSection;

     106:                 foreach (CustomError ce in customErrors.Errors)

     107:                 {

     108:                     yield return ce.Redirect;

     109:                 }

     110:                 yield return customErrors.DefaultRedirect;

     111:             }

     112:         }

     113:  

     114:        /// 

     115:        /// Disposes of the resources (other than memory) used by the module that implements .

     116:        /// 

     117:        public void Dispose()

     118:        {

     119:            //clean-up code here.

     120:        }

     121:  

     122:        /// 

     123:        /// Initializes a module and prepares it to handle requests.

     124:        /// 

     125:        /// An  that provides access to the methods, properties, and events common to all application objects within an ASP.NET application

     126:        public void Init(HttpApplication context)

     127:        {

     128:            // Below is an example of how you can handle LogRequest event and provide 

     129:            // custom logging implementation for it

     130:            context.Error += new EventHandler(OnError);

     131:        }

     132:  

     133:  

     134:     }

     135: }

You’ll notice that this module also handles logging the error and differentiates between real exceptions (500) and file not found (404)  allowing a custom page to be displayed for either.  

To use the code simply register the module in the system.web/httpModules (for IIS 6) of System.Webserver/Modules (for IIS 7) section of your web.config and you’re good to go.  For best affect, it will probably be worthwhile putting an up-to-day [.browsers](http://bit.ly/d4qMxG) file in your App_Browsers directory as well.
