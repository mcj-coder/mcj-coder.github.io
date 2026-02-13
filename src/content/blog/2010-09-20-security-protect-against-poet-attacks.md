---
title: 'Security: Protect against POET Attacks with Custom Errors!'
description: 'A modified SeoErrorLoggingModule that mitigates ASP.NET POET (Padding Oracle) attacks by normalising error responses for WebResource.axd and ScriptResource.axd handlers.'
pubDate: 2010-09-20
tags: ['tips']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/09/security-protect-against-poet-attacks.html'
heroImage: ../../assets/blog/hero-images/2010-09-20-security-protect-against-poet-attacks.jpg
---

There's been a [big](http://weblogs.asp.net/scottgu/archive/2010/09/18/important-asp-net-security-vulnerability.aspx) [deal](http://pentonizer.com/general-programming/aspnet-poet-vulnerability-what-else-can-i-do/ 'Link may be broken') made of a [serious security flaw](http://www.troyhunt.com/2010/09/fear-uncertainty-and-and-padding-oracle.html) in ASP.Net which potentially affects a lot of .Net sites, that allows a 3rd Party to trick ASP.Net into serving sensitive files within a web application folder. Microsoft have released official advice on how to [temporarily patch](http://weblogs.asp.net/scottgu/archive/2010/09/18/important-asp-net-security-vulnerability.aspx) the problem which revolves around forcing Error and Page Not Found pages to return the same status page. This would need to stay in place until a permanent fix is released.

This workaround clearly introduces a usability issue, which clients may not accept.

Fortunately a quick amend to my [Custom Error Module](/blog/2010-03-20-aspnet-and-custom-error-pages-seo) can secure your site against the attack with minimal impact to usability.

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

        private static System.Random random = new Random((int)DateTime.Now.Ticks);

        private const int MaxDelay = 500;

        private static CustomErrorsSection customErrors = WebConfigurationManager.GetSection("system.web/customErrors") as CustomErrorsSection;

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
            if (httpException != null && !IsResourceRequest(context.CurrentHandler))
                context.Response.StatusCode = httpException.GetHttpCode();
            else
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            if (((context.IsCustomErrorEnabled && !context.Request.Browser.Crawler) || IsResourceRequest(context.CurrentHandler))
                && !IsAnErrorPage(context.Request.RawUrl))
            {
                System.Threading.Thread.Sleep(TimeSpan.FromMilliseconds(random.Next(MaxDelay)));
                context.ClearError();
                string path = GetPathForError(context, (HttpStatusCode)context.Response.StatusCode);
                if (!string.IsNullOrEmpty(path))
                {
                    if (CustomErrors.RedirectMode == CustomErrorsRedirectMode.ResponseRedirect && !IsResourceRequest(context.CurrentHandler))
                    {
                        context.Response.Redirect(path, true);
                    }
                    else
                    {
                        context.RewritePath(path);
                    }
                }
            }
        }

        /// <summary>
        /// Determines whether current request is to a resource handler
        /// </summary>
        /// <param name="handler">The handler.</param>
        /// <returns>
        ///     <c>true</c> if [is resource request] [the specified handler]; otherwise, <c>false</c>.
        /// </returns>
        protected virtual bool IsResourceRequest(IHttpHandler handler)
        {
            return handler != null
                &&
                (typeof(System.Web.Handlers.AssemblyResourceLoader).IsInstanceOfType(handler)
                || typeof(System.Web.Handlers.ScriptResourceHandler).IsInstanceOfType(handler));
        }

        /// <summary>
        /// Gets the path for error.
        /// </summary>
        /// <param name="current">The current.</param>
        /// <param name="status">The status.</param>
        /// <returns></returns>
        protected virtual string GetPathForError(HttpContext current, HttpStatusCode status)
        {
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
            //clean-up code here.
        }

        /// <summary>
        /// Initializes a module and prepares it to handle requests.
        /// </summary>
        /// <param name="context">An <see cref="T:System.Web.HttpApplication"/> that provides access to the methods, properties, and events common to all application objects within an ASP.NET application</param>
        public void Init(HttpApplication context)
        {
            context.Error += new EventHandler(OnError);
        }
    }
}
```

The amendments hinge on the fact that the exploit only really affects the WebResource.axd and ScriptResource.axd so any error relating from these handlers is automatically given a 500 status (Internal Server Error) and treated as a normal error. This is an acceptable compromise for me as all references to these handlers should be programmatically generated by your site and therefore 'correct'.

As per Scott Gu's recommendation I've added a random <500ms delay to the processing of all errors to help muddy the waters and added support for the ResponseRewrite property on the CustomErrors element.
