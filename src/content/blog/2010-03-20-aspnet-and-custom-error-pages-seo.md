---
title: 'ASP.Net and Custom Error Pages, an SEO nightmare?'
description: 'How custom error pages in ASP.Net can negatively impact SEO rankings and how to fix it with a smart HttpModule that detects search engine crawlers.'
pubDate: 2010-03-20
updatedDate: 2010-03-25
tags: ['best-practise']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/03/aspnet-and-custom-error-pages-seo.html'
heroImage: ../../assets/blog/hero-images/2010-03-20-aspnet-and-custom-error-pages-seo.jpg
---

It's a (conscientious) developer's worst fear:

> You've slaved long and hard to produce a top-notch, blistering fast website that fully shows off your coding prowess and skills, you unveil the website to critical acclaim and universal client approval (imagine cheering crowds) but then out-of-hours the database server fails! **_Yerrk_**!

> All the developer's are out celebrating a successful so no-one notices the log file growing bigger and bigger, screaming to be heard…..and then the client notices _and it really hits the fan!_

> After a frantic few hours the DB hardware's restored and the website returns to it's former glory….crisis over.

Or is it?

You're a good web developer, of course you are, you've enabled the custom error pages in ASP.Net (you've probably even set the servers [deployment property to retail](https://learn.microsoft.com/en-us/archive/blogs/scottgu/archive/2006/04/11/2_2f00_20760100.shtml) to make doubly sure). Every visitor to the site during your downtime would have seen a nice and friendly message informing them that there's a problem with the site and it will be up again shortly.

Maybe, you've even reduced the potential impact by adding some marketing blurb about how great your products are, nice meaning full copy to make your visitors want to return to the site when it's back when the sites back up. In fact, just the sort of copy that search engines love – **_D'oh_**! If your site has had issues whilst being indexed, that error message could very well come back to haunt you!

Now in fairness, it's unlikely that your error page will be ranked as the #1 authority for a particular subject. Search engines have gotten pretty good at spotting these gaffs, but it won't be helping your page rankings any either.

Here's why, when your ASP.Net application throws an unhandled exception it naturally wants to return a 500 status code (Internal Server Error) and if you don't have custom errors switched on, that's what you get which leads to the Yellow Screen of Death! But with custom error handling switched on there's a neat little HttpModule that detects the 500 status code (Internal Server Error) and turns this in a redirect (302 status code) to your nice custom error page. This then renders successfully (they'll be no errors with your error page after all!) and returns a 200 status (OK).

For a visitor (human or web crawler), this looks _exactly_ the same as a normal redirect.

Clearly then what we need is a smarter custom error HttpModule to selectively redirect the visitor based on whether or not they're a search engine. In fact, one just like this:

```csharp
using System;
using System.Web;
using System.Net;
using System.Collections.Generic;
using System.Configuration;
using System.Web.Configuration;

namespace MartinOnDotNet.Website.Support
{
    /// <summary>
    /// Handles errors in an SEO friendly manner
    /// </summary>
    public class SeoErrorLoggingModule : IHttpModule
    {

        /// <summary>
        /// Called when [error].
        /// </summary>
        /// <param name="sender">The sender.</param>
        /// <param name="e">The <see cref="System.EventArgs"/> instance containing the event data.</param>
        protected virtual void OnError(object sender, EventArgs e)
        {
            HttpApplication application = (HttpApplication)sender;
            HttpContext context = application.Context;
            if (context != null && context.AllErrors != null)
            {
                foreach (Exception ex in context.AllErrors)
                {
                    ex.Data["RawUrl"] = context.Request.RawUrl;
                    HttpException hex = ex as HttpException;
                    if (hex != null && hex.GetHttpCode() == (int)HttpStatusCode.NotFound)
                    {
                        Logging.Logger.LogWarning(string.Format(System.Globalization.CultureInfo.InvariantCulture, "Requested File Not Found {0} ({1})", context.Request.RawUrl, context.Request.Url));
                    }
                    else
                    {
                        Logging.Logger.Log(ex);
                    }
                }
            }
            HttpException httpException = context.Error as HttpException;
            context.Response.Clear();
            if (httpException != null)
                context.Response.StatusCode = httpException.GetHttpCode();
            else
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            if (context.IsCustomErrorEnabled
                && !context.Request.Browser.Crawler
                && !IsAnErrorPage(context.Request.RawUrl))
            {
                context.ClearError();
                string path = GetPathForError(context, (HttpStatusCode)context.Response.StatusCode);
                if (!string.IsNullOrEmpty(path))
                {
                    context.Response.Redirect(path, true);
                }
            }
        }

        /// <summary>
        /// Gets a path for error.
        /// </summary>
        /// <param name="current">The current.</param>
        /// <param name="status">The status.</param>
        /// <returns></returns>
        protected virtual string GetPathForError(HttpContext current, HttpStatusCode status)
        {
            CustomErrorsSection customErrors = WebConfigurationManager.GetSection("system.web/customErrors") as CustomErrorsSection;
            foreach (CustomError ce in customErrors.Errors)
            {
                if (ce.StatusCode == (int)status) return ce.Redirect;
            }
            return customErrors.DefaultRedirect;
        }

        /// <summary>
        /// Determines whether the given path (RawUrl) is an error page itself
        /// </summary>
        /// <param name="path">The path.</param>
        /// <returns>
        ///     <c>true</c> if [is an error page] [the specified path]; otherwise, <c>false</c>.
        /// </returns>
        protected virtual bool IsAnErrorPage(string path)
        {
            if (ErrorPages != null)
            {
                foreach (string s in ErrorPages)
                {
                    if (path.IndexOf(s, StringComparison.OrdinalIgnoreCase) > -1) return true;
                }
            }
            return false;
        }

        /// <summary>
        /// Gets the error pages.
        /// </summary>
        /// <value>The error pages.</value>
        protected virtual IEnumerable<string> ErrorPages
        {
            get
            {
                CustomErrorsSection customErrors = WebConfigurationManager.GetSection("system.web/customErrors") as CustomErrorsSection;
                foreach (CustomError ce in customErrors.Errors)
                {
                    yield return ce.Redirect;
                }
                yield return customErrors.DefaultRedirect;
            }
        }

        /// <summary>
        /// Disposes of the resources (other than memory) used by the module that implements <see cref="T:System.Web.IHttpModule"/>.
        /// </summary>
        public void Dispose()
        {
            //cleanup code here.
        }

        /// <summary>
        /// Initializes a module and prepares it to handle requests.
        /// </summary>
        /// <param name="context">An <see cref="T:System.Web.HttpApplication"/> that provides access to the methods, properties, and events common to all application objects within an ASP.NET application</param>
        public void Init(HttpApplication context)
        {
            // Below is an example of how you can handle LogRequest event and provide
            // custom logging implementation for it
            context.Error += new EventHandler(OnError);
        }


    }
}
```

You'll notice that this module also handles logging the error and differentiates between real exceptions (500) and file not found (404) allowing a custom page to be displayed for either.

To use the code simply register the module in the system.web/httpModules (for IIS 6) or System.WebServer/Modules (for IIS 7) section of your web.config and you're good to go. For best effect, it will probably be worthwhile putting an up-to-date .browsers file in your App_Browsers directory as well.
