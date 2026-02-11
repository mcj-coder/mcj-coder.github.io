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

             1: System.Exception: Index was outside the bounds of the 

       2: array.[EkSite-->;GetPermissions(Int,Int,Int,String,[&Collection)]][EkSite->GetPermissions(Int,Int,String,[&Collection]]

       3:  at 

       4: Ektron.Cms.EkException.ThrowException(Exception ex, EventLogEntryType EventType)

       5:  at 

       6: Ektron.Cms.EkException.ThrowException(Exception ex)

       7:  at 

       8: Ektron.Cms.ContentAPI.CheckOutContentById(Int64 ContentId)

       9:  at 

      10: Freestyle.Helpers.Ektron.ContentTesting.EktronApiQuery.CheckOutContent(Int64 

      11: contentId, Int32 cultureLcid, Int64 userId)

Now the error is suitable vague that it made diagnosing the issue next to impossible.  After a lot of experimentation with different API calls and approaches (thank you eGandalf), I was ready to throw my toys out of the pram and go home when eventually [Ektron](http://bit.ly/d0YHh7) support provided the following snippet that seemed to do what I was looking for:

  
       1: Dim userAPI As New Ektron.Cms.API.User.User

       2: Dim userObj As Ektron.Cms.UserData

       3: userObj = userAPI.LogInUser("jedit", "jedit", "", "", "")

       4: userAPI.SetAuthenticationCookie(userObj)

       5: Dim cd As New Ektron.Cms.ContentAPI

       6: cd.DeclineContent(104)

       7: Dim cook As HttpCookie = Request.Cookies("ecm")

       8: cook.Expires = Now()

       9: Response.Cookies.Add(cook)

A quick bit of experimentation proved that this would solve my problem, with a couple of side affects:

  * Automatically logging in as a person has some side affects….if the password changes the account could be locked very quickly!

  * At the end of the operation the user would be logged out of the workarea

Well, there’s not much I could do about point 1.  But I could work a bit of IDisposable Scope magic to manage the changes to the ‘ecm’ cookie which stores the login details for the current session. 

## Introducing the ImpersonationScope

This scope works in a very similar manner to the ElevatedPermissionScope in that you wrap the block of code you want to execute as the impersonated user in a using statement containing the ImpersonationScope object you want to use.

  
       1: public bool ApproveContent(long contentId, int cultureLcid, string userName, string password, string domain)

       2: {

       3:    if (string.IsNullOrEmpty(userName)) throw new ArgumentNullException("userName");

       4:    if (string.IsNullOrEmpty(password)) throw new ArgumentNullException("password");

       5:    if (domain == null) domain = string.Empty;

       6:    CultureInfo locale = new CultureInfo(cultureLcid);

       7:    using (new ImpersonationScope(userName, password, domain))

       8:    {

       9:        global::Ektron.Cms.ContentAPI api = new global::Ektron.Cms.ContentAPI()

      10:        api.ContentLanguage = locale.LCID;

      11:        return api.ApproveContent(contentId);

      12:    }

      13: }

When the executing code leaves scope, the impersonated credentials are automatically replaced with the previous set.

So, without further waffle - here’s the implementation:

  
       1: using System;

       2: using System.Web;

       3: using Ektron.Cms;

       4:  

       5: namespace MartinOnDotNet.Helpers.Ektron.Security

       6: {

       7:     /// 

       8:     /// Utility class to temporarily login as another user

       9:     /// 

      10:     public sealed class ImpersonationScope : IDisposable

      11:     {

      12:  

      13:         /// 

      14:         /// Initializes a new instance of the  class.

      15:         /// 

      16:         /// Name of the user.

      17:         /// The password.

      18:         /// The domain.

      19:         public ImpersonationScope(string userName, string password, string domain)

      20:         {

      21:             if (string.IsNullOrEmpty(userName)) throw new ArgumentNullException("userName");

      22:             if (string.IsNullOrEmpty(password)) throw new ArgumentNullException("password");

      23:             if (domain == null) domain = string.Empty;

      24:             SetEcmCookieUserId(userName, password, domain);

      25:         }

      26:  

      27:         /// 

      28:         /// Gets or sets the user id.

      29:         /// 

      30:         /// The user id.

      31:         public long UserId { get; set; }

      32:  

      33:  

      34:         private static HttpCookie _ecm;

      35:  

      36:         private void SetEcmCookieUserId(string userName, string password, string domain)

      37:         {

      38:             if (HttpContext.Current != null

      39:                 && HttpContext.Current.Request != null)

      40:             {

      41:                 _ecm = HttpContext.Current.Request.Cookies["ecm"];

      42:                 HttpContext.Current.Request.Cookies.Remove("ecm");

      43:                 global::Ektron.Cms.API.User.User u = new global::Ektron.Cms.API.User.User();

      44:                 UserData ud = u.LogInUser(userName, password, string.Empty, domain);

      45:                 u.SetAuthenticationCookie(ud);

      46:                 UserId = ud.Id;

      47:             }

      48:             else

      49:             {

      50:                 throw new NotSupportedException("Must be called within a valid Web Context!");

      51:             }

      52:         }

      53:  

      54:         private static void RevertEcmCookie()

      55:         {

      56:             if (HttpContext.Current != null

      57:                 && HttpContext.Current.Request != null)

      58:             {

      59:                 HttpContext.Current.Request.Cookies.Remove("ecm");

      60:                 HttpContext.Current.Request.Cookies.Add(_ecm);

      61:                 HttpContext.Current.Response.Cookies.Remove("ecm");

      62:                 HttpContext.Current.Response.Cookies.Add(_ecm);

      63:             }

      64:         }

      65:  

      66:         /// 

      67:         /// Performs application-defined tasks associated with freeing, releasing, or resetting unmanaged resources.

      68:         /// 

      69:         public void Dispose()

      70:         {

      71:  

      72:             RevertEcmCookie();

      73:             GC.SuppressFinalize(this);

      74:         }

      75:  

      76:     }

      77: }

Enjoy.
