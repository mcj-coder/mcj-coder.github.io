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

```csharp
using System;
```

```csharp
using System.Web;
```

```csharp
using System.Net;
```

```csharp
using System.Collections.Generic;
```

```csharp
using System.Configuration;
```

```csharp
using System.Web.Configuration;
```

```csharp



```csharp



```csharp
namespace MartinOnDotNet.Website.Support
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// Handles errors in an SEO friendly manner
```

```csharp
/// 
```

```csharp
public class SeoErrorLoggingModule : IHttpModule
```

```csharp
{
```

```csharp



```csharp
/// 
```

```csharp
/// Called when [error].
```

```csharp
/// 
```

```csharp
/// The sender.
```

```csharp
/// The  instance containing the event data.
```

```csharp
protected virtual void OnError(object sender, EventArgs e)
```

```csharp
{
```

```csharp
HttpApplication application = (HttpApplication)sender;
```

```csharp
HttpContext context = application.Context;
```

```csharp
if (context != null && context.AllErrors != null)
```

```csharp
{
```

```csharp
foreach (Exception ex in context.AllErrors)
```

```csharp
{
```

```csharp
ex.Data["RawUrl"] = context.Request.RawUrl;
```

```csharp
HttpException hex = ex as HttpException;
```

```csharp
if (hex != null && hex.GetHttpCode() == (int)HttpStatusCode.NotFound)
```

```csharp
{
```

```csharp
Logging.Logger.LogWarning(string.Format(System.Globalization.CultureInfo.InvariantCulture, "Requested File Not Found {0} ({1})", context.Request.RawUrl, context.Request.Url));
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
Logging.Logger.Log(ex);
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

```csharp
HttpException httpException = context.Error as HttpException;
```

```csharp
context.Response.Clear();
```

```csharp
if (httpException != null)
```

```csharp
context.Response.StatusCode = httpException.GetHttpCode();
```

```csharp
else
```

```csharp
context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
```

```csharp
if (context.IsCustomErrorEnabled
```

```csharp
&& !context.Request.Browser.Crawler
```

```csharp
&& !IsAnErrorPage(context.Request.RawUrl))
```

```csharp
{
```

```csharp
context.ClearError();
```

```csharp
string path = GetPathForError(context, (HttpStatusCode)context.Response.StatusCode);
```

```csharp
if (!string.IsNullOrEmpty(path))
```

```csharp
{
```

```csharp
context.Response.Redirect(path, true);
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



```csharp
/// 
```

```csharp
/// Gets the path for error.
```

```csharp
/// 
```

```csharp
/// The current.
```

```csharp
/// The status.
```

```csharp
/// 
```

```csharp
protected virtual string GetPathForError(HttpContext current, HttpStatusCode status)
```

```csharp
{
```

```csharp
CustomErrorsSection customErrors = WebConfigurationManager.GetSection("system.web/customErrors") as CustomErrorsSection;
```

```csharp
foreach (CustomError ce in customErrors.Errors)
```

```csharp
{
```

```csharp
if (ce.StatusCode == (int)status) return ce.Redirect;
```

```csharp
}
```

```csharp
return customErrors.DefaultRedirect;
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Determines whether the given path (RawUrl) is an error page itself
```

```csharp
/// 
```

```csharp
/// The path.
```

```csharp
/// 
```

```csharp
///     true if [is an error page] [the specified path]; otherwise, false.
```

```csharp
/// 
```

```csharp
protected virtual bool IsAnErrorPage(string path)
```

```csharp
{
```

```csharp
if (ErrorPages != null)
```

```csharp
{
```

```csharp
foreach (string s in ErrorPages)
```

```csharp
{
```

```csharp
if (path.IndexOf(s, StringComparison.OrdinalIgnoreCase) > -1) return true;
```

```csharp
}
```

```csharp
}
```

```csharp
return false;
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Gets the error pages.
```

```csharp
/// 
```

```csharp
/// The error pages.
```

```csharp
protected virtual IEnumerablestring> ErrorPages
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
CustomErrorsSection customErrors = WebConfigurationManager.GetSection("system.web/customErrors") as CustomErrorsSection;
```

```csharp
foreach (CustomError ce in customErrors.Errors)
```

```csharp
{
```

```csharp
yield return ce.Redirect;
```

```csharp
}
```

```csharp
yield return customErrors.DefaultRedirect;
```

```csharp
}
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Disposes of the resources (other than memory) used by the module that implements .
```

```csharp
/// 
```

```csharp
public void Dispose()
```

```csharp
{
```

```csharp
//clean-up code here.
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Initializes a module and prepares it to handle requests.
```

```csharp
/// 
```

```csharp
/// An  that provides access to the methods, properties, and events common to all application objects within an ASP.NET application
```

```csharp
public void Init(HttpApplication context)
```

```csharp
{
```

```csharp
// Below is an example of how you can handle LogRequest event and provide 
```

```csharp
// custom logging implementation for it
```

```csharp
context.Error += new EventHandler(OnError);
```

```csharp
}
```

```csharp



```csharp



```csharp
}
```

```csharp
}
```

You’ll notice that this module also handles logging the error and differentiates between real exceptions (500) and file not found (404)  allowing a custom page to be displayed for either.  

To use the code simply register the module in the system.web/httpModules (for IIS 6) of System.Webserver/Modules (for IIS 7) section of your web.config and you’re good to go.  For best affect, it will probably be worthwhile putting an up-to-day [.browsers](http://bit.ly/d4qMxG) file in your App_Browsers directory as well.
