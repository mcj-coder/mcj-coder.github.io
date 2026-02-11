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

             1: using System;

       2: using System.Web.Security;

       3:  

       4: namespace VWT2OC.Website.Support.Security

       5: {

       6:     /// 

       7:     /// Overrides the N2 MembershipProvider to support hashed passwords

       8:     /// 

       9:     public class CustomMembershipProvider : N2.Security.ContentMembershipProvider 

      10:     {

      11:  

      12:         /// 

      13:         /// Hashes the password.

      14:         /// 

      15:         /// The password.

      16:         /// 

      17:         internal string HashPassword(string password)

      18:         {

      19:             return HashPassword(password, Utility.GetSaltFromAssembly());

      20:         }

      21:         /// 

      22:         /// Hashes the password.

      23:         /// 

      24:         /// The password.

      25:         /// The salt.

      26:         /// 

      27:         internal string HashPassword(string password, byte[] salt)

      28:         {

      29:             string sResult = password;

      30:             switch (PasswordFormat)

      31:             {

      32:                 case MembershipPasswordFormat.Hashed:

      33:                     sResult = Security.SimpleHash.ComputeHash(password, Security.HashType.SHA256, salt); //custom hashing wrapper

      34:                     break;

      35:                 case MembershipPasswordFormat.Encrypted:

      36:                     throw new NotImplementedException("Encrypted Passwords Not Implemented");

      37:             }

      38:             return sResult;

      39:         }

      40:  

      41:         /// 

      42:         /// Gets the password format.

      43:         /// 

      44:         /// The password format.

      45:         public override MembershipPasswordFormat PasswordFormat

      46:         {

      47:             get

      48:             {

      49:                 return MembershipPasswordFormat.Hashed;

      50:             }

      51:         }

      52:  

      53:         /// 

      54:         /// Changes the password.

      55:         /// 

      56:         /// The username.

      57:         /// The old password.

      58:         /// The new password.

      59:         /// 

      60:         public override bool ChangePassword(string username, string oldPassword, string newPassword)

      61:         {

      62:             N2.Security.Items.User u = Bridge.GetUser(username);

      63:             if (u == null || u.Password != HashPassword(oldPassword))

      64:                 return false;

      65:             u.Password = newPassword;

      66:             Bridge.Save(u);

      67:             return true;

      68:         }

      69:  

      70:         /// 

      71:         /// Changes the password question and answer.

      72:         /// 

      73:         /// The username.

      74:         /// The password.

      75:         /// The new password question.

      76:         /// The new password answer.

      77:         /// 

      78:         public override bool ChangePasswordQuestionAndAnswer(string username, string password, string newPasswordQuestion, string newPasswordAnswer)

      79:         {

      80:             N2.Security.Items.User u = Bridge.GetUser(username);

      81:             if (u == null || u.Password != HashPassword(password))

      82:                 return false;

      83:             u.PasswordQuestion = newPasswordQuestion;

      84:             u.PasswordAnswer = newPasswordAnswer;

      85:             Bridge.Save(u);

      86:             return true;

      87:         }

      88:  

      89:         /// 

      90:         /// Validates the user.

      91:         /// 

      92:         /// The username.

      93:         /// The password.

      94:         /// 

      95:         public override bool ValidateUser(string username, string password)

      96:         {

      97:             N2.Security.Items.User u = Bridge.GetUser(username);

      98:             if (u != null && u.Password == HashPassword(password))

      99:                 return true;

     100:             return false;

     101:         }

     102:  

     103:         /// 

     104:         /// Resets the password.

     105:         /// 

     106:         /// The username.

     107:         /// The answer.

     108:         /// 

     109:         public override string ResetPassword(string username, string answer)

     110:         {

     111:             N2.Security.Items.User u = Bridge.GetUser(username);

     112:             if (u != null)

     113:             {

     114:                 string newPassword = System.IO.Path.GetRandomFileName();

     115:                 if (newPassword.Length > 7) newPassword = newPassword.Substring(0, 7);

     116:                 u.IsLockedOut = false;

     117:                 u.Password = HashPassword(newPassword);

     118:                 Bridge.Save(u);

     119:                 return newPassword;

     120:             }

     121:             return null;

     122:         }

     123:  

     124:         /// 

     125:         /// Gets the password.

     126:         /// 

     127:         /// The username.

     128:         /// The answer.

     129:         /// 

     130:         public override string GetPassword(string username, string answer)

     131:         {

     132:             throw new NotImplementedException();

     133:         }

     134:  

     135:         /// 

     136:         /// Creates the user.

     137:         /// 

     138:         /// The username.

     139:         /// The password.

     140:         /// The email.

     141:         /// The password question.

     142:         /// The password answer.

     143:         /// if set to true [is approved].

     144:         /// The provider user key.

     145:         /// The status.

     146:         /// 

     147:         public override MembershipUser CreateUser(string username, string password, string email, string passwordQuestion, string passwordAnswer, bool isApproved, object providerUserKey, out MembershipCreateStatus status)

     148:         {

     149:             N2.Security.Items.User u = Bridge.GetUser(username);

     150:             if (u != null)

     151:             {

     152:                 status = MembershipCreateStatus.DuplicateUserName;

     153:                 return null;

     154:             }

     155:             if (string.IsNullOrEmpty(username))

     156:             {

     157:                 status = MembershipCreateStatus.InvalidUserName;

     158:                 return null;

     159:             }

     160:             if (string.IsNullOrEmpty(password))

     161:             {

     162:                 status = MembershipCreateStatus.InvalidPassword;

     163:                 return null;

     164:             }

     165:             status = MembershipCreateStatus.Success;

     166:  

     167:             u = Bridge.CreateUser(username, HashPassword(password), email, passwordQuestion, passwordAnswer, isApproved, providerUserKey);

     168:  

     169:             MembershipUser m = u.GetMembershipUser(base.Name);

     170:             return m;

     171:         }

     172:      

     173:     }

     174: }

Pass the Salt!

Of course, being too clever for my own good, I didn’t use an unsalted hash…I generated the salt from the strong name key of the current assembly.  Which was fine for my green field application where all assemblies were strong names…not so good now where the chain of dependencies aren’t strongly named.  If you’re interested the algorithm is pretty simple:

  
       1: public static byte[] GetSaltFromAssembly()

       2: {

       3:     System.Reflection.Assembly ass = System.Reflection.Assembly.GetExecutingAssembly();

       4:     byte[] fullKey = ass.GetName().GetPublicKey();

       5:     byte[] salt = new byte[8];

       6:     for (int i = 0; i 

       7:     {

       8:         salt[i] = fullKey[i];

       9:     }

      10:     return salt;

      11: }

To resolve, this I will need to obtain the salt and replicate it in the new assembly.  This time around I’m going to use a simpler mechanism and store the salt as a Base64 encoded string using the default Settings Class for the project.

Hooking It Up

Finally, I just need to wire up the Provider in the web.config:

  
       1: "CustomMembershipProvider">

       2:     

       3:         

       4:         "CustomMembershipProvider" type="VWT2OC.Website.Support.Security.CustomMembershipProvider, VWT2OC.Website.Support" />

       5:     

       6: 

Integrating into the Forum

To fully integrate the forum into the site, a quick custom implementation of the AbstractN2ForumUser is in order:

  
       1: using System.Web;

       2: using N2;

       3: using N2.Security;

       4:  

       5: namespace VWT2OC.Website.Support.Security

       6: {

       7:     /// 

       8:     /// Integrated the VWT2OC/N2CMS User into the Forum Addon

       9:     /// 

      10:     public class ForumUser : N2.Templates.Forum.Services.AbstractN2ForumUser

      11:     {

      12:         ItemBridge bridge;

      13:  

      14:         /// 

      15:         /// Gets the bridge.

      16:         /// 

      17:         /// The bridge.

      18:         protected virtual ItemBridge Bridge

      19:         {

      20:             get { return bridge ?? (bridge = Context.Current.Resolve()); }

      21:         }

      22:  

      23:         /// 

      24:         /// Initializes this instance.

      25:         /// 

      26:         protected override void Initialize()

      27:         {

      28:             _isAuthenticated = false;

      29:             _userName = "";

      30:             HttpContext current = HttpContext.Current;

      31:             // Check wether the user is authenticated

      32:             if (current.User.Identity.IsAuthenticated)

      33:             {

      34:                 string username = current.User.Identity.Name;

      35:                 N2.Security.Items.User user = Bridge.GetUser(username);

      36:  

      37:                 // Get the data

      38:                 _userID = user.ID;

      39:                 _userName = username;

      40:                 _email = user.Email;

      41:                 

      42:                 _location = (current.Profile.Context[UserDetailKey.Location] as string) ?? string.Empty;

      43:                 _homePage = (current.Profile.Context[UserDetailKey.Website] as string) ?? string.Empty;

      44:                 _isAuthenticated = true;

      45:             }

      46:  

      47:         }

      48:     }

      49: }

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
    
      
           1: authentication mode="Forms">

           2:     forms loginUrl="n2/login.aspx" protection="All" timeout="30000" path="/">

           3:         credentials passwordFormat="Clear">

           4:             

           5: 

           6:             

           7: -->

           8:         credentials>

           9:     forms>

          10: authentication>

    
  

  * Now, to add a Forum underneath homepage so it appears in the top level navigation.  Right click on Home –> New and then select ‘Forum’.  Fill in the ‘Content’ and ‘Forum Settings’ as required 
    [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj04meummHn3eu9uP2F8Q3gFhwO5AYqytYQyz9XV1Ld-0WfbKmjjewY6eMa7OCMREqTNvIzXvkOQcqLwQI9p2EV3VsKjmjnRVjR-0mYlG4F2mQsW8ws_drgUpgigbnUSDG7ljjCVPAY/s1600-h/image%5B32%5D.png) 

    There are a couple of gotchas here: 

    
      Making sure the Custom Forum User is selected 

      * The Forum Location is the location of the Addon files (should be left as default /Forum/YAF) 
    
  

  * When the forum is published we will be prompted to work through the installation wizard. 
    
      If you hit a database connection problem, manually update the connection string in the yafnet.config file 

      * If you get ‘Cannot use full-text search in user instance’ error don’t worry…it’ll be fine *apparently* 
    
  

  * At the end of the wizard click ‘Finish’.  At this point, my installation erred as Session State had been disabled and the addon requires it. To enable it change the sessionState mode to InProc  in the web.config 
    
      
           1: -->

           2: sessionState mode="InProc" />

    
  

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
