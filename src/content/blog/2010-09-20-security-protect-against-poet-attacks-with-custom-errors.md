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
private static System.Random random = new Random((int)DateTime.Now.Ticks);
```

```csharp



```csharp
private const int MaxDelay = 500;
```

```csharp



```csharp
private static CustomErrorsSection customErrors = WebConfigurationManager.GetSection("system.web/customErrors") as CustomErrorsSection;
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
if (httpException != null && !IsResourceRequest(context.CurrentHandler))
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
if (((context.IsCustomErrorEnabled && !context.Request.Browser.Crawler) || IsResourceRequest(context.CurrentHandler) )
```

```csharp
&& !IsAnErrorPage(context.Request.RawUrl))
```

```csharp
{
```

```csharp
System.Threading.Thread.Sleep(TimeSpan.FromMilliseconds(_random.Next(MaxDelay)));
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
if (CustomErrors.RedirectMode == CustomErrorsRedirectMode.ResponseRedirect && !IsResourceRequest(context.CurrentHandler) )
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
else
```

```csharp
{
```

```csharp
context.RewritePath(path);
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

```csharp



```csharp
/// 
```

```csharp
/// Determines whether current request is to a resource handler
```

```csharp
/// 
```

```csharp
/// The handler.
```

```csharp
/// 
```

```csharp
///     true if [is resource request] [the specified handler]; otherwise, false.
```

```csharp
/// 
```

```csharp
protected virtual bool IsResourceRequest(IHttpHandler handler)
```

```csharp
{
```

```csharp
return handler != null
```

```csharp
&&
```

```csharp
(typeof(System.Web.Handlers.AssemblyResourceLoader).IsInstanceOfType(handler)
```

```csharp
|| typeof(System.Web.Handlers.ScriptResourceHandler).IsInstanceOfType(handler));
```

```csharp



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

The amendments hinge on the fact that the exploit only really affects the WebResource.axd and ScriptResource.axd so any error relating from these handlers is automatically given an 500 status (Internal Server Error) and treated as a normal error.  This is an acceptable compromise for me as all references to these handlers should be programmatically generated and by your site and therefore ‘correct’.

As per, Scott Gu’s recommendation I’ve added a random <500ms delay to the processing of all errors to help muddy the waters and added support for the ResponseRewrite property on the CustomErrors element.
