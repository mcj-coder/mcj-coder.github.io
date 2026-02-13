---
title: 'N2CMS Meet VWT2OC: Day 2 – N2CMS Configuration'
description: 'Day 2 of the VWT2OC rebuild: integrating a custom hashed MembershipProvider with N2CMS and the forum add-on, configuring the site structure, and creating a basic theme.'
pubDate: 2010-06-07
updatedDate: 2010-06-08
heroImage: ../../assets/blog/hero-images/2010-06-07-n2cms-meet-vwt2oc-day-2-n2cms.jpg
tags: ['n2cms']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/06/n2cms-meet-vwt2oc-day-2-n2cms.html'
---

[Yesterday](/blog/2010-06-06-n2cms-meet-vwt2oc-day-1-project-setup) went well and I've now got the basic N2CMS install working and the Forum Addon has been installed, so my objectives for today are:

- **Day 2 – N2CMS Configuration**
  - Integrate the Membership Provider from n2cms/forum/legacy vwt2oc
  - Construct basic site structure (homepage/articles/forum/gallery/events calendar/etc)
  - Create VWT2OC basic theme

#### Integrating the Membership Provider

One of the first tasks I need to undertake is integrating the underlying security model. Fortunately, n2cms implements the provider model (as does the forum add-on and my legacy VWT2OC site). However, the implementations behind them are very different and each application has various customizations that need to be incorporated. My aim for my integrated Membership Provider is:

- Provide all required features for n2cms and forum add-on
- Ensure that all of the user credentials from the existing site can work with the new one – I don't want all the members to have to reset their passwords!

The major difference between the provided N2.Security.ContentMembershipProvider and the VWT2OC legacy implementation is that the n2 version stores passwords in clear text where VWT2OC uses hashes. As a hash is a one-way operation I can't retrieve the existing passwords (only reset them), so I need to override several methods to implement hashing.

```csharp
using System;
using System.Web.Security;

namespace VWT2OC.Website.Support.Security
{
    /// <summary>
    /// Overrides the N2 MembershipProvider to support hashed passwords
    /// </summary>
    public class CustomMembershipProvider : N2.Security.ContentMembershipProvider
    {

        /// <summary>
        /// Hashes the password.
        /// </summary>
        /// <param name="password">The password.</param>
        /// <returns></returns>
        internal string HashPassword(string password)
        {
            return HashPassword(password, Utility.GetSaltFromAssembly());
        }
        /// <summary>
        /// Hashes the password.
        /// </summary>
        /// <param name="password">The password.</param>
        /// <param name="salt">The salt.</param>
        /// <returns></returns>
        internal string HashPassword(string password, byte[] salt)
        {
            string sResult = password;
            switch (PasswordFormat)
            {
                case MembershipPasswordFormat.Hashed:
                    sResult = Security.SimpleHash.ComputeHash(password, Security.HashType.SHA256, salt);
                    break;
                case MembershipPasswordFormat.Encrypted:
                    throw new NotImplementedException("Encrypted Passwords Not Implemented");
            }
            return sResult;
        }

        /// <summary>
        /// Gets the password format.
        /// </summary>
        /// <value>The password format.</value>
        public override MembershipPasswordFormat PasswordFormat
        {
            get
            {
                return MembershipPasswordFormat.Hashed;
            }
        }

        /// <summary>
        /// Changes the password.
        /// </summary>
        public override bool ChangePassword(string username, string oldPassword, string newPassword)
        {
            N2.Security.Items.User u = Bridge.GetUser(username);
            if (u == null || u.Password != HashPassword(oldPassword))
                return false;
            u.Password = newPassword;
            Bridge.Save(u);
            return true;
        }

        /// <summary>
        /// Changes the password question and answer.
        /// </summary>
        public override bool ChangePasswordQuestionAndAnswer(string username, string password, string newPasswordQuestion, string newPasswordAnswer)
        {
            N2.Security.Items.User u = Bridge.GetUser(username);
            if (u == null || u.Password != HashPassword(password))
                return false;
            u.PasswordQuestion = newPasswordQuestion;
            u.PasswordAnswer = newPasswordAnswer;
            Bridge.Save(u);
            return true;
        }

        /// <summary>
        /// Validates the user.
        /// </summary>
        public override bool ValidateUser(string username, string password)
        {
            N2.Security.Items.User u = Bridge.GetUser(username);
            if (u != null && u.Password == HashPassword(password))
                return true;
            return false;
        }

        /// <summary>
        /// Resets the password.
        /// </summary>
        public override string ResetPassword(string username, string answer)
        {
            N2.Security.Items.User u = Bridge.GetUser(username);
            if (u != null)
            {
                string newPassword = System.IO.Path.GetRandomFileName();
                if (newPassword.Length > 7) newPassword = newPassword.Substring(0, 7);
                u.IsLockedOut = false;
                u.Password = HashPassword(newPassword);
                Bridge.Save(u);
                return newPassword;
            }
            return null;
        }

        /// <summary>
        /// Gets the password.
        /// </summary>
        public override string GetPassword(string username, string answer)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Creates the user.
        /// </summary>
        public override MembershipUser CreateUser(string username, string password, string email, string passwordQuestion, string passwordAnswer, bool isApproved, object providerUserKey, out MembershipCreateStatus status)
        {
            N2.Security.Items.User u = Bridge.GetUser(username);
            if (u != null)
            {
                status = MembershipCreateStatus.DuplicateUserName;
                return null;
            }
            if (string.IsNullOrEmpty(username))
            {
                status = MembershipCreateStatus.InvalidUserName;
                return null;
            }
            if (string.IsNullOrEmpty(password))
            {
                status = MembershipCreateStatus.InvalidPassword;
                return null;
            }
            status = MembershipCreateStatus.Success;

            u = Bridge.CreateUser(username, HashPassword(password), email, passwordQuestion, passwordAnswer, isApproved, providerUserKey);

            MembershipUser m = u.GetMembershipUser(base.Name);
            return m;
        }

    }
}
```

**Pass the Salt!**

Of course, being too clever for my own good, I didn't use an unsalted hash…I generated the salt from the strong name key of the current assembly. Which was fine for my green field application where all assemblies were strong names…not so good now where the chain of dependencies aren't strongly named. If you're interested the algorithm is pretty simple:

```csharp
public static byte[] GetSaltFromAssembly()
{
    System.Reflection.Assembly ass = System.Reflection.Assembly.GetExecutingAssembly();
    byte[] fullKey = ass.GetName().GetPublicKey();
    byte[] salt = new byte[8];
    for (int i = 0; i < salt.Length; i++)
    {
        salt[i] = fullKey[i];
    }
    return salt;
}
```

To resolve this I will need to obtain the salt and replicate it in the new assembly. This time around I'm going to use a simpler mechanism and store the salt as a Base64 encoded string using the default Settings Class for the project.

**Hooking It Up**

Finally, I just need to wire up the Provider in the web.config:

```xml
<membership defaultProvider="CustomMembershipProvider">
    <providers>
        <clear />
        <add name="CustomMembershipProvider" type="VWT2OC.Website.Support.Security.CustomMembershipProvider, VWT2OC.Website.Support" />
    </providers>
</membership>
```

**Integrating into the Forum**

To fully integrate the forum into the site, a quick custom implementation of the AbstractN2ForumUser is in order:

```csharp
using System.Web;
using N2;
using N2.Security;

namespace VWT2OC.Website.Support.Security
{
    /// <summary>
    /// Integrated the VWT2OC/N2CMS User into the Forum Addon
    /// </summary>
    public class ForumUser : N2.Templates.Forum.Services.AbstractN2ForumUser
    {
        ItemBridge bridge;

        /// <summary>
        /// Gets the bridge.
        /// </summary>
        /// <value>The bridge.</value>
        protected virtual ItemBridge Bridge
        {
            get { return bridge ?? (bridge = Context.Current.Resolve<ItemBridge>()); }
        }

        /// <summary>
        /// Initializes this instance.
        /// </summary>
        protected override void Initialize()
        {
            _isAuthenticated = false;
            _userName = "";
            HttpContext current = HttpContext.Current;
            // Check whether the user is authenticated
            if (current.User.Identity.IsAuthenticated)
            {
                string username = current.User.Identity.Name;
                N2.Security.Items.User user = Bridge.GetUser(username);

                // Get the data

                _userID = user.ID;
                _userName = username;
                _email = user.Email;

                _location = (current.Profile.Context[UserDetailKey.Location] as string) ?? string.Empty;
                _homePage = (current.Profile.Context[UserDetailKey.Website] as string) ?? string.Empty;
                _isAuthenticated = true;
            }

        }
    }
}
```

This class will use the standard n2cms profile provider and User objects to fill in the blanks that the GenericForumUser provided with the Forum Addon is missing.

#### Construct Basic Site Structure

So, now comes the interesting bit – configuring the website structure for the first time and checking that the major features work. But first things first, I need to switch from the default SQLite to SQLExpress as the Forum Addon will only work on MS SQL.

Fortunately, this is as simple as adding a new database to App_Data in visual studio and tweaking one of the provided connection strings (in web.config and again in yafnet.config) and firing up the website:

- When the website starts now, you'll get a simple installation screen

_\[Original installation screenshot no longer available\]_

- Click to install a new database and log in using the default 'admin/changeme' credentials (unless you've changed them in the web.config file!)

- You're now prompted to create the database tables by working through the installation step 'tabs'

_\[Original installation steps screenshot no longer available\]_

- Test the connection on step 2

_\[Original connection test screenshot no longer available\]_

- Click the 'Create Tables' button on step 3 to install the n2cms schema

_\[Original schema creation screenshot no longer available\]_

- Select a theme…As the VWT2OC site is primarily yellow, I've gone with 'Plain Orange Theme' as it will be a simple modification

_\[Original theme selection screenshot no longer available\]_

- Restart the application on Step 5 and go to the management console (click on the **_managing_** link)

_\[Original management console screenshots no longer available\]_

- Now to create an interim Administrator account, click on 'Users' in the top left and then 'New'

_\[Original user creation screenshot no longer available\]_

- That done I can now validate the modified Membership Provider by inspecting what's been saved as the password for my new user. This is in the n2Detail table (and it will be close to the bottom…)

_\[Original database screenshot no longer available\]_

You'll have to trust me that that's a hashed version of the password I entered!

- The final test is to log out and back in again!

- Now to remove the default administrator credentials from the web.config

```xml
<authentication mode="Forms">
    <forms loginUrl="n2/login.aspx" protection="All" timeout="30000" path="/">
        <credentials passwordFormat="Clear">
            <!-- WARNING: Change this default password. Please do it now. -->
<!--
            <user name="admin" password="changeme" />
-->
        </credentials>
    </forms>
</authentication>
```

- Now, to add a Forum underneath homepage so it appears in the top level navigation. Right click on Home -> New and then select 'Forum'. Fill in the 'Content' and 'Forum Settings' as required

_\[Original forum settings screenshot no longer available\]_

There are a couple of gotchas here:

- Making sure the Custom Forum User is selected
- The Forum Location is the location of the Addon files (should be left as default /Forum/YAF)

- When the forum is published we will be prompted to work through the installation wizard.
  - If you hit a database connection problem, manually update the connection string in the yafnet.config file
  - If you get 'Cannot use full-text search in user instance' error don't worry…it'll be fine _apparently_

- At the end of the wizard click 'Finish'. At this point, my installation erred as Session State had been disabled and the addon requires it. To enable it change the sessionState mode to InProc in the web.config

```xml
<!--<sessionState mode="Off" />-->
<sessionState mode="InProc" />
```

- Now the forum should be installed

_\[Original forum screenshot no longer available\]_

#### 'Prettying' It Up

Now for a bit of light relief (ha ha) I'm going to spend some time merging the existing vwt2oc theme in with the plain orange n2cms theme. This is pretty simple (on paper):

- Copy the 'Plain' theme within App_Themes to VWT2OC
- Tweak CSS
- Switch the Site Theme to 'VWT2OC' by right clicking on 'Home' and editing the Layout

_\[Original theme configuration screenshot no longer available\]_

It's a shame my CSS skills are a bit lacking really….Oh well, it'll be easy enough to change later.

_\[Original VWT2OC themed site screenshot no longer available\]_
