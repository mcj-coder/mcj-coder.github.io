---
title: "N2CMS Meet VWT2OC: Day 2 – N2CMS Configuration"
description: "Technical blog post from 2010-06-07"
pubDate: 2010-06-07
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

[Yesterday](http://martinondotnet.blogspot.com/2010/06/n2cms-meet-vwt2oc-day-1-project-setup.html) went well and I’ve now got the basic [N2CMS](http://bit.ly/aco4m4) install working and the Forum Addon has been installed, so my objectives for today are:

     * Day 2 – N2CMS Configuration             Integrate the Membership Provider from n2cms/forum/legacy vwt2oc         * Construct basic site structure (homepage/articles/forum/gallery/events calendar/etc)         * Create VWT2OC basic theme            
## Integrating the Membership Provider
  One of the first tasks I need to undertake is integrating the underlying security model.  Fortunately, n2cms implements the provider model (as does the forum add-on and my legacy VWT2OC site).  However, the implementations behind them are very different and each application has various customizations that need to be incorporated.  My aim for my integrated Membership Provider is:

     * Provide all required features for n2cms and forum add-on     * Ensure that all of the user credentials from the existing site can work with the new one – I don’t want all the members to have to reset their passwords!    The major difference between the provided N2.Security.ContentMembershipProvider and the VWt2OC legacy implementation is that the n2 version stores passwords in clear text where VWT2OC uses hashes.  As a has is a one-way operation I can’t retrieve the existing passwords (only reset them), so I need to override several methods to implement hashing.

```csharp
using System;
```

```csharp
using System.Web.Security;
```

```csharp



```csharp
namespace VWT2OC.Website.Support.Security
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// Overrides the N2 MembershipProvider to support hashed passwords
```

```csharp
/// 
```

```csharp
public class CustomMembershipProvider : N2.Security.ContentMembershipProvider 
```

```csharp
{
```

```csharp



```csharp
/// 
```

```csharp
/// Hashes the password.
```

```csharp
/// 
```

```csharp
/// The password.
```

```csharp
/// 
```

```csharp
internal string HashPassword(string password)
```

```csharp
{
```

```csharp
return HashPassword(password, Utility.GetSaltFromAssembly());
```

```csharp
}
```

```csharp
/// 
```

```csharp
/// Hashes the password.
```

```csharp
/// 
```

```csharp
/// The password.
```

```csharp
/// The salt.
```

```csharp
/// 
```

```csharp
internal string HashPassword(string password, byte[] salt)
```

```csharp
{
```

```csharp
string sResult = password;
```

```csharp
switch (PasswordFormat)
```

```csharp
{
```

```csharp
case MembershipPasswordFormat.Hashed:
```

```csharp
sResult = Security.SimpleHash.ComputeHash(password, Security.HashType.SHA256, salt); //custom hashing wrapper
```

```csharp
break;
```

```csharp
case MembershipPasswordFormat.Encrypted:
```

```csharp
throw new NotImplementedException("Encrypted Passwords Not Implemented");
```

```csharp
}
```

```csharp
return sResult;
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Gets the password format.
```

```csharp
/// 
```

```csharp
/// The password format.
```

```csharp
public override MembershipPasswordFormat PasswordFormat
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
return MembershipPasswordFormat.Hashed;
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
/// Changes the password.
```

```csharp
/// 
```

```csharp
/// The username.
```

```csharp
/// The old password.
```

```csharp
/// The new password.
```

```csharp
/// 
```

```csharp
public override bool ChangePassword(string username, string oldPassword, string newPassword)
```

```csharp
{
```

```csharp
N2.Security.Items.User u = Bridge.GetUser(username);
```

```csharp
if (u == null || u.Password != HashPassword(oldPassword))
```

```csharp
return false;
```

```csharp
u.Password = newPassword;
```

```csharp
Bridge.Save(u);
```

```csharp
return true;
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Changes the password question and answer.
```

```csharp
/// 
```

```csharp
/// The username.
```

```csharp
/// The password.
```

```csharp
/// The new password question.
```

```csharp
/// The new password answer.
```

```csharp
/// 
```

```csharp
public override bool ChangePasswordQuestionAndAnswer(string username, string password, string newPasswordQuestion, string newPasswordAnswer)
```

```csharp
{
```

```csharp
N2.Security.Items.User u = Bridge.GetUser(username);
```

```csharp
if (u == null || u.Password != HashPassword(password))
```

```csharp
return false;
```

```csharp
u.PasswordQuestion = newPasswordQuestion;
```

```csharp
u.PasswordAnswer = newPasswordAnswer;
```

```csharp
Bridge.Save(u);
```

```csharp
return true;
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Validates the user.
```

```csharp
/// 
```

```csharp
/// The username.
```

```csharp
/// The password.
```

```csharp
/// 
```

```csharp
public override bool ValidateUser(string username, string password)
```

```csharp
{
```

```csharp
N2.Security.Items.User u = Bridge.GetUser(username);
```

```csharp
if (u != null && u.Password == HashPassword(password))
```

```csharp
return true;
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
/// Resets the password.
```

```csharp
/// 
```

```csharp
/// The username.
```

```csharp
/// The answer.
```

```csharp
/// 
```

```csharp
public override string ResetPassword(string username, string answer)
```

```csharp
{
```

```csharp
N2.Security.Items.User u = Bridge.GetUser(username);
```

```csharp
if (u != null)
```

```csharp
{
```

```csharp
string newPassword = System.IO.Path.GetRandomFileName();
```

```csharp
if (newPassword.Length > 7) newPassword = newPassword.Substring(0, 7);
```

```csharp
u.IsLockedOut = false;
```

```csharp
u.Password = HashPassword(newPassword);
```

```csharp
Bridge.Save(u);
```

```csharp
return newPassword;
```

```csharp
}
```

```csharp
return null;
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Gets the password.
```

```csharp
/// 
```

```csharp
/// The username.
```

```csharp
/// The answer.
```

```csharp
/// 
```

```csharp
public override string GetPassword(string username, string answer)
```

```csharp
{
```

```csharp
throw new NotImplementedException();
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Creates the user.
```

```csharp
/// 
```

```csharp
/// The username.
```

```csharp
/// The password.
```

```csharp
/// The email.
```

```csharp
/// The password question.
```

```csharp
/// The password answer.
```

```csharp
/// if set to true [is approved].
```

```csharp
/// The provider user key.
```

```csharp
/// The status.
```

```csharp
/// 
```

```csharp
public override MembershipUser CreateUser(string username, string password, string email, string passwordQuestion, string passwordAnswer, bool isApproved, object providerUserKey, out MembershipCreateStatus status)
```

```csharp
{
```

```csharp
N2.Security.Items.User u = Bridge.GetUser(username);
```

```csharp
if (u != null)
```

```csharp
{
```

```csharp
status = MembershipCreateStatus.DuplicateUserName;
```

```csharp
return null;
```

```csharp
}
```

```csharp
if (string.IsNullOrEmpty(username))
```

```csharp
{
```

```csharp
status = MembershipCreateStatus.InvalidUserName;
```

```csharp
return null;
```

```csharp
}
```

```csharp
if (string.IsNullOrEmpty(password))
```

```csharp
{
```

```csharp
status = MembershipCreateStatus.InvalidPassword;
```

```csharp
return null;
```

```csharp
}
```

```csharp
status = MembershipCreateStatus.Success;
```

```csharp



```csharp
u = Bridge.CreateUser(username, HashPassword(password), email, passwordQuestion, passwordAnswer, isApproved, providerUserKey);
```

```csharp



```csharp
MembershipUser m = u.GetMembershipUser(base.Name);
```

```csharp
return m;
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

Pass the Salt!

Of course, being too clever for my own good, I didn’t use an unsalted hash…I generated the salt from the strong name key of the current assembly.  Which was fine for my green field application where all assemblies were strong names…not so good now where the chain of dependencies aren’t strongly named.  If you’re interested the algorithm is pretty simple:

  
```csharp
public static byte[] GetSaltFromAssembly()
```

```csharp
{
```

```csharp
System.Reflection.Assembly ass = System.Reflection.Assembly.GetExecutingAssembly();
```

```csharp
byte[] fullKey = ass.GetName().GetPublicKey();
```

```csharp
byte[] salt = new byte[8];
```

```csharp
for (int i = 0; i 
```

```csharp
{
```

```csharp
salt[i] = fullKey[i];
```

```csharp
}
```

```csharp
return salt;
```

```csharp
}
```

To resolve, this I will need to obtain the salt and replicate it in the new assembly.  This time around I’m going to use a simpler mechanism and store the salt as a Base64 encoded string using the default Settings Class for the project.

Hooking It Up

Finally, I just need to wire up the Provider in the web.config:

  
```csharp
"CustomMembershipProvider">
```

```csharp



```csharp



```csharp
"CustomMembershipProvider" type="VWT2OC.Website.Support.Security.CustomMembershipProvider, VWT2OC.Website.Support" />
```

```csharp



```csharp



Integrating into the Forum

To fully integrate the forum into the site, a quick custom implementation of the AbstractN2ForumUser is in order:

  
```csharp
using System.Web;
```

```csharp
using N2;
```

```csharp
using N2.Security;
```

```csharp



```csharp
namespace VWT2OC.Website.Support.Security
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// Integrated the VWT2OC/N2CMS User into the Forum Addon
```

```csharp
/// 
```

```csharp
public class ForumUser : N2.Templates.Forum.Services.AbstractN2ForumUser
```

```csharp
{
```

```csharp
ItemBridge bridge;
```

```csharp



```csharp
/// 
```

```csharp
/// Gets the bridge.
```

```csharp
/// 
```

```csharp
/// The bridge.
```

```csharp
protected virtual ItemBridge Bridge
```

```csharp
{
```

```csharp
get { return bridge ?? (bridge = Context.Current.Resolve()); }
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Initializes this instance.
```

```csharp
/// 
```

```csharp
protected override void Initialize()
```

```csharp
{
```

```csharp
_isAuthenticated = false;
```

```csharp
_userName = "";
```

```csharp
HttpContext current = HttpContext.Current;
```

```csharp
// Check wether the user is authenticated
```

```csharp
if (current.User.Identity.IsAuthenticated)
```

```csharp
{
```

```csharp
string username = current.User.Identity.Name;
```

```csharp
N2.Security.Items.User user = Bridge.GetUser(username);
```

```csharp



```csharp
// Get the data
```

```csharp
_userID = user.ID;
```

```csharp
_userName = username;
```

```csharp
_email = user.Email;
```

```csharp



```csharp
_location = (current.Profile.Context[UserDetailKey.Location] as string) ?? string.Empty;
```

```csharp
_homePage = (current.Profile.Context[UserDetailKey.Website] as string) ?? string.Empty;
```

```csharp
_isAuthenticated = true;
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
}
```

This class will use the standard n2cms profile provider and User objects to fill in the blanks that the GenericForumUser provided with the Forum Addon is missing.

## Construct Basic Site Structure

So, now comes the interesting bit – configuring the website structure for the first time and checking that the major features work.  But first things first, I need to switch from the default SQLite to SQLExpress as the Forum Addin will only work on MS SQL.

Fortunately, this is as simple as adding a new database to App_Data in visual studio and tweaking one of the provided connection strings (in web.config and again in yafnet.config) and firing up the website:

  * When the website starts now, you’ll get a simple installation screen 
    [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEipUvpwkUW8kbBlApOUL94nY-UTB7i3frk3Y2qfelQtzI_JmwQEANso0NAKBs1PkdeFZUVm-qUB9vcBxQV13Pud2CavJf0Bcim4mA1LaLVIntzGW4QNV4yab9yPHIxwBQ9FinLdhDWR/s1600-h/image%5B2%5D.png) 

  * Click to install a new database and log in using the default ‘admin/changeme’ credentials (unless you’ve changed them in the web.config file!) 

  * You’re now prompted to create the database tables by working through the installation step ‘tabs’ 
    [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEilCWqpcaRvC4Gx1TxM3onP12az6rRAhZpxQreKqi7YtzOvQDWEEj3Hh6FHlGt1L1RQJacbwsvZ6oYC4VXlKCG2WWbvCTRHUVNleKSl5sR1Da2dIoAKyo_AZZyvgreFa976JuiNbNKO/s1600-h/image%5B5%5D.png) 

  * Test the connection on step 2 
    [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhx2GNIGrlLRveU5eI5GeGcnbTYtr3GzbKUHufkdh6G_ObQ0h-lwXmLdIZP5qkEcdVbYQLtIrIx9X65RbHxPXJsaiaXTMJspMT-y5f_hu3XaEQB-ZeazDha5-jq8znHRukY7agoUEz4/s1600-h/image%5B8%5D.png) 

  * Click the ‘Create Tables’ button on step 3 to install the n2cms schema  [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjryRAQRHInFfHbiU9IYDqXm48nKa99ms5ddnJtjuKSxheWJT3nL-kVjqqn-L09THHGXrjLL4sRatBrgoNuEdCCZw-qcjH1E5A2_N4YfyEc1pfAKnP48Z79MVZYO1uxniY8SoWIM4qo/s1600-h/image%5B11%5D.png) 

  * Select a theme…As the VWT2OC site is primarily yellow, I’ve gone with ‘Plain Orange Theme’ as it will be a simple modification 
    [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEigQb4qjS3VZNaZ_8TP9A1LykQG9lU0EVsUBzeEiYNRzTV9lYnQJFu0Vj-w7oNjvckWxb7Wh8JN8shMxSgUaLeGQT2buSDgqa7f7oVtzhD73kbKgm9_MTNMp0kuG2CQpKsZGf69IMHp/s1600-h/image%5B14%5D.png) 

  * Restart the application on Step 5 and go to the management console (click on the ***managing*** link) 

    [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiNYuxBm3NBcin9nvjJO-x1bpUoFWMDb1iGRDqtcTDP3ujBJIOK61zRzf17q_YBgVt1DbJ80rolB_4DBCwecz9NkNCPc7OgT-eNh8cykuKhZQXG-WQ2hDUXBLiC1MvRRQEJmBn5vWJC/s1600-h/image%5B17%5D.png) [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEisvPdRR_6V9Ye_YfRRWAKS1fBclvID5vQ_DirlCX_PLhpz8e2ATU1O0W-9N2hyphenhyphenPiAN_fET9RkoteK3SyN7mnSgkcDufM1Jnhr7fwthll9LM8oZ5WS0p5eZoEvcSci0wO3-0w7qocMW/s1600-h/image%5B20%5D.png) 

  * Now to create an interim Administrator account, click on ‘Users’ in the top left and then ‘New’ 
    [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhLZOCJt38Qny68D_TnJkkq8s0-Cu0HcON5394MOEgw9jx1cmaDso1TL3tAStvMDDPEj84LqyPd5eQGXPHJzfN2eYLFFqT6H8XhK26V8hGf5YBQcec90RYdUb6nOkuZeI6XlKDEpNrR/s1600-h/image%5B23%5D.png) 

  * That done I can now validate the modified Membership Provider by inspecting what’s been saved as the password for my new user.  This is in the n2Detail table (and it will be close to the bottom…) 
    [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEijrZIbnwtQSTGVh4Uegyb1aji6rsxJ69TI-Lg5iI38OINLkzeV1d1hyphenhyphenPPBfJXQejVAuMQBjp-Ym52izGVgEFiIqKIrTnRuuuHTnBCbJnBMKdti_Yfu3Ik5QDMsMjLz2BmpI61mefRr/s1600-h/image%5B26%5D.png) 

    You’ll have to trust me that that’s a hashed version of the password I entered! 

  * The final test is to log out and back in again! 

  * Now to remove the default administrator credentials from the web.config 
    
      
```csharp
authentication mode="Forms">
```

```csharp
forms loginUrl="n2/login.aspx" protection="All" timeout="30000" path="/">
```

```csharp
credentials passwordFormat="Clear">
```

```csharp



```csharp



```csharp



```csharp
-->
```

```csharp
credentials>
```

```csharp
forms>
```

```csharp
authentication>
```
    
  

  * Now, to add a Forum underneath homepage so it appears in the top level navigation.  Right click on Home –> New and then select ‘Forum’.  Fill in the ‘Content’ and ‘Forum Settings’ as required 
    [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj04meummHn3eu9uP2F8Q3gFhwO5AYqytYQyz9XV1Ld-0WfbKmjjewY6eMa7OCMREqTNvIzXvkOQcqLwQI9p2EV3VsKjmjnRVjR-0mYlG4F2mQsW8ws_drgUpgigbnUSDG7ljjCVPAY/s1600-h/image%5B32%5D.png) 

    There are a couple of gotchas here: 

    
      Making sure the Custom Forum User is selected 

      * The Forum Location is the location of the Addon files (should be left as default /Forum/YAF) 
    
  

  * When the forum is published we will be prompted to work through the installation wizard. 
    
      If you hit a database connection problem, manually update the connection string in the yafnet.config file 

      * If you get ‘Cannot use full-text search in user instance’ error don’t worry…it’ll be fine *apparently* 
    
  

  * At the end of the wizard click ‘Finish’.  At this point, my installation erred as Session State had been disabled and the addon requires it. To enable it change the sessionState mode to InProc  in the web.config 
    
      
```csharp
-->
```

```csharp
sessionState mode="InProc" />
```
    
  

  * Now the forum should be installed 
    [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhv71CJOY_BZ_Oo7xKuCJfbeh-CW9qBB1SLNVg6n_Qwkwt1j2lFNmhpJsnWXsixUDfQHhwjL7H0nv-tqZEiHFLXW2pzUsfl11CWAxEUkOxxk4V0SOPQpIilF06xljBMqeWD-zskC1kY/s1600-h/image%5B35%5D.png) 

## ‘Prettying’ It up

Now for a bit of light relief (ha ha) I’m going to spend some time merging the existing vwt2oc theme in with the plain orange n2cms theme.  This is pretty simple (on paper):

  * Copy the ‘Plain’ theme within App_Themes to VWT2OC 

  * Tweak CSS 

  * Switch the Site Theme to ‘VWT2OC’ by right clicking on ‘Home’ and editing the Layout 
    [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiH0mCuQUty0Pcq6QJgocQNydD_WrIn159iPukXIuaIaLT-uU27_1QfiO0JSQUbas9UTzeLASNYhQpWUnpJqEuUjrH8tEzvHRgSecDHLLvOj28roTEVhchucjExJ0rVnSwj2it-Mq2a/s1600-h/image%5B38%5D.png) 

It’s a shame my CSS skills are a bit lacking really….Oh well, it’ll be easy enough to change later.

[](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhp6XNROjI61pJyT68QVfGYSoxR5D82maMSrgCx9HCdgz9Mz_TIBLkf_ossscmunUt0fiEPLWAf3wNVRNyAzNdygiBDUui-iGwE8pc_sEOOXmoWPz3iyz30ozA8YuQamS7f2rL7eTuV/s1600-h/image%5B3%5D.png)
