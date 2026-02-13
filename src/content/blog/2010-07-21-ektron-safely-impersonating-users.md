---
title: 'Ektron: Safely Impersonating Users within Ektron'
description: 'An IDisposable ImpersonationScope pattern for safely impersonating Ektron CMS users during content approval workflows, with automatic credential restoration.'
pubDate: 2010-07-21
tags: ['ektron', 'best practise']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/07/ektron-safely-impersonating-users.html'
heroImage: ../../assets/blog/hero-images/2010-07-21-ektron-safely-impersonating-users.jpg
---

I [recently](http://dev.ektron.com/forum.aspx?g=posts&t=32279 'Link may be broken') hit a scenario where I needed to impersonate a lesser privileged workarea user to perform some content creation/approvals whilst working within the Approval Chain.

My initial attempts leveraged my [ElevatedPermissionScope](/blog/2010-04-14-elevating-ektron-user-permissions) class, which failed with an error similar to:

```text
System.Exception: Index was outside the bounds of the
array.[EkSite-->;GetPermissions(Int,Int,Int,String,[&Collection)]]
[EkSite->GetPermissions(Int,Int,String,[&Collection]]
```

Now the error is suitably vague that it made diagnosing the issue next to impossible. After a lot of experimentation with different API calls and approaches (thank you eGandalf), I was ready to throw my toys out of the pram and go home when eventually Ektron support provided the following snippet that seemed to do what I was looking for:

```vb
Dim userAPI As New Ektron.Cms.API.User.User
Dim userObj As Ektron.Cms.UserData
userObj = userAPI.LogInUser("jedit", "jedit", "", "", "")
userAPI.SetAuthenticationCookie(userObj)
Dim cd As New Ektron.Cms.ContentAPI
cd.DeclineContent(104)
Dim cook As HttpCookie = Request.Cookies("ecm")
cook.Expires = Now()
Response.Cookies.Add(cook)
```

A quick bit of experimentation proved that this would solve my problem, with a couple of side effects:

- Automatically logging in as a person has some side effects….if the password changes the account could be locked very quickly!
- At the end of the operation the user would be logged out of the workarea

Well, there's not much I could do about point 1. But I could work a bit of IDisposable Scope magic to manage the changes to the 'ecm' cookie which stores the login details for the current session.

#### Introducing the ImpersonationScope

This scope works in a very similar manner to the ElevatedPermissionScope in that you wrap the block of code you want to execute as the impersonated user in a using statement containing the ImpersonationScope object you want to use.

```csharp
public bool ApproveContent(long contentId, int cultureLcid, string userName,
    string password, string domain)
{
    if (string.IsNullOrEmpty(userName))
        throw new ArgumentNullException("userName");
    if (string.IsNullOrEmpty(password))
        throw new ArgumentNullException("password");
    if (domain == null) domain = string.Empty;
    CultureInfo locale = new CultureInfo(cultureLcid);
    using (new ImpersonationScope(userName, password, domain))
    {
        global::Ektron.Cms.ContentAPI api =
            new global::Ektron.Cms.ContentAPI();
        api.ContentLanguage = locale.LCID;
        return api.ApproveContent(contentId);
    }
}
```

When the executing code leaves scope, the impersonated credentials are automatically replaced with the previous set.

So, without further waffle – here's the implementation:

```csharp
using System;
using System.Web;
using Ektron.Cms;

namespace MartinOnDotNet.Helpers.Ektron.Security
{
    /// <summary>
    /// Utility class to temporarily login as another user
    /// </summary>
    public sealed class ImpersonationScope : IDisposable
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="ImpersonationScope"/> class.
        /// </summary>
        /// <param name="userName">Name of the user.</param>
        /// <param name="password">The password.</param>
        /// <param name="domain">The domain.</param>
        public ImpersonationScope(string userName, string password, string domain)
        {
            if (string.IsNullOrEmpty(userName))
                throw new ArgumentNullException("userName");
            if (string.IsNullOrEmpty(password))
                throw new ArgumentNullException("password");
            if (domain == null) domain = string.Empty;
            SetEcmCookieUserId(userName, password, domain);
        }

        /// <summary>
        /// Gets or sets the user id.
        /// </summary>
        /// <value>The user id.</value>
        public long UserId { get; set; }

        private static HttpCookie _ecm;

        private void SetEcmCookieUserId(string userName, string password, string domain)
        {
            if (HttpContext.Current != null
                && HttpContext.Current.Request != null)
            {
                _ecm = HttpContext.Current.Request.Cookies["ecm"];
                HttpContext.Current.Request.Cookies.Remove("ecm");
                global::Ektron.Cms.API.User.User u =
                    new global::Ektron.Cms.API.User.User();
                UserData ud = u.LogInUser(userName, password, string.Empty, domain);
                u.SetAuthenticationCookie(ud);
                UserId = ud.Id;
            }
            else
            {
                throw new NotSupportedException(
                    "Must be called within a valid Web Context!");
            }
        }

        private static void RevertEcmCookie()
        {
            if (HttpContext.Current != null
                && HttpContext.Current.Request != null)
            {
                HttpContext.Current.Request.Cookies.Remove("ecm");
                HttpContext.Current.Request.Cookies.Add(_ecm);
                HttpContext.Current.Response.Cookies.Remove("ecm");
                HttpContext.Current.Response.Cookies.Add(_ecm);
            }
        }

        /// <summary>
        /// Performs application-defined tasks associated with freeing,
        /// releasing, or resetting unmanaged resources.
        /// </summary>
        public void Dispose()
        {
            RevertEcmCookie();
            GC.SuppressFinalize(this);
        }
    }
}
```

Enjoy.
