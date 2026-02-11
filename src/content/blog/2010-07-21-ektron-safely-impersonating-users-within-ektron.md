---
title: "Ektron: Safely Impersonating Users within Ektron"
description: "Technical blog post from 2010-07-21"
pubDate: 2010-07-21
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

I [recently](http://bit.ly/dgQrns) hit an scenario where I needed to impersonate a lesser privileged workarea user to perform some content creation/approvals whilst working within the Approval Chain. 

  My initial attempts leveraged my [ElevatedPermissionScope](http://bit.ly/b4KGXR) class, which failed with an error similar to:

```csharp
System.Exception: Index was outside the bounds of the 
```

```csharp
array.[EkSite-->;GetPermissions(Int,Int,Int,String,[&Collection)]][EkSite->GetPermissions(Int,Int,String,[&Collection]]
```

```csharp
at 
```

```csharp
Ektron.Cms.EkException.ThrowException(Exception ex, EventLogEntryType EventType)
```

```csharp
at 
```

```csharp
Ektron.Cms.EkException.ThrowException(Exception ex)
```

```csharp
at 
```

```csharp
Ektron.Cms.ContentAPI.CheckOutContentById(Int64 ContentId)
```

```csharp
at 
```

```csharp
Freestyle.Helpers.Ektron.ContentTesting.EktronApiQuery.CheckOutContent(Int64 
```

```csharp
contentId, Int32 cultureLcid, Int64 userId)
```

Now the error is suitable vague that it made diagnosing the issue next to impossible.  After a lot of experimentation with different API calls and approaches (thank you eGandalf), I was ready to throw my toys out of the pram and go home when eventually [Ektron](http://bit.ly/d0YHh7) support provided the following snippet that seemed to do what I was looking for:

  
```csharp
Dim userAPI As New Ektron.Cms.API.User.User
```

```csharp
Dim userObj As Ektron.Cms.UserData
```

```csharp
userObj = userAPI.LogInUser("jedit", "jedit", "", "", "")
```

```csharp
userAPI.SetAuthenticationCookie(userObj)
```

```csharp
Dim cd As New Ektron.Cms.ContentAPI
```

```csharp
cd.DeclineContent(104)
```

```csharp
Dim cook As HttpCookie = Request.Cookies("ecm")
```

```csharp
cook.Expires = Now()
```

```csharp
Response.Cookies.Add(cook)
```

A quick bit of experimentation proved that this would solve my problem, with a couple of side affects:

  * Automatically logging in as a person has some side affects….if the password changes the account could be locked very quickly!

  * At the end of the operation the user would be logged out of the workarea

Well, there’s not much I could do about point 1.  But I could work a bit of IDisposable Scope magic to manage the changes to the ‘ecm’ cookie which stores the login details for the current session. 

## Introducing the ImpersonationScope

This scope works in a very similar manner to the ElevatedPermissionScope in that you wrap the block of code you want to execute as the impersonated user in a using statement containing the ImpersonationScope object you want to use.

  
```csharp
public bool ApproveContent(long contentId, int cultureLcid, string userName, string password, string domain)
```

```csharp
{
```

```csharp
if (string.IsNullOrEmpty(userName)) throw new ArgumentNullException("userName");
```

```csharp
if (string.IsNullOrEmpty(password)) throw new ArgumentNullException("password");
```

```csharp
if (domain == null) domain = string.Empty;
```

```csharp
CultureInfo locale = new CultureInfo(cultureLcid);
```

```csharp
using (new ImpersonationScope(userName, password, domain))
```

```csharp
{
```

```csharp
global::Ektron.Cms.ContentAPI api = new global::Ektron.Cms.ContentAPI()
```

```csharp
api.ContentLanguage = locale.LCID;
```

```csharp
return api.ApproveContent(contentId);
```

```csharp
}
```

```csharp
}
```

When the executing code leaves scope, the impersonated credentials are automatically replaced with the previous set.

So, without further waffle - here’s the implementation:

  
```csharp
using System;
```

```csharp
using System.Web;
```

```csharp
using Ektron.Cms;
```

```csharp



```csharp
namespace MartinOnDotNet.Helpers.Ektron.Security
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// Utility class to temporarily login as another user
```

```csharp
/// 
```

```csharp
public sealed class ImpersonationScope : IDisposable
```

```csharp
{
```

```csharp



```csharp
/// 
```

```csharp
/// Initializes a new instance of the  class.
```

```csharp
/// 
```

```csharp
/// Name of the user.
```

```csharp
/// The password.
```

```csharp
/// The domain.
```

```csharp
public ImpersonationScope(string userName, string password, string domain)
```

```csharp
{
```

```csharp
if (string.IsNullOrEmpty(userName)) throw new ArgumentNullException("userName");
```

```csharp
if (string.IsNullOrEmpty(password)) throw new ArgumentNullException("password");
```

```csharp
if (domain == null) domain = string.Empty;
```

```csharp
SetEcmCookieUserId(userName, password, domain);
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Gets or sets the user id.
```

```csharp
/// 
```

```csharp
/// The user id.
```

```csharp
public long UserId { get; set; }
```

```csharp



```csharp



```csharp
private static HttpCookie _ecm;
```

```csharp



```csharp
private void SetEcmCookieUserId(string userName, string password, string domain)
```

```csharp
{
```

```csharp
if (HttpContext.Current != null
```

```csharp
&& HttpContext.Current.Request != null)
```

```csharp
{
```

```csharp
_ecm = HttpContext.Current.Request.Cookies["ecm"];
```

```csharp
HttpContext.Current.Request.Cookies.Remove("ecm");
```

```csharp
global::Ektron.Cms.API.User.User u = new global::Ektron.Cms.API.User.User();
```

```csharp
UserData ud = u.LogInUser(userName, password, string.Empty, domain);
```

```csharp
u.SetAuthenticationCookie(ud);
```

```csharp
UserId = ud.Id;
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
throw new NotSupportedException("Must be called within a valid Web Context!");
```

```csharp
}
```

```csharp
}
```

```csharp



```csharp
private static void RevertEcmCookie()
```

```csharp
{
```

```csharp
if (HttpContext.Current != null
```

```csharp
&& HttpContext.Current.Request != null)
```

```csharp
{
```

```csharp
HttpContext.Current.Request.Cookies.Remove("ecm");
```

```csharp
HttpContext.Current.Request.Cookies.Add(_ecm);
```

```csharp
HttpContext.Current.Response.Cookies.Remove("ecm");
```

```csharp
HttpContext.Current.Response.Cookies.Add(_ecm);
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
/// Performs application-defined tasks associated with freeing, releasing, or resetting unmanaged resources.
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



```csharp
RevertEcmCookie();
```

```csharp
GC.SuppressFinalize(this);
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

Enjoy.
