---
title: "N2CMS Meet VWT2OC: Day 2 \u2013 N2CMS Configuration"
description: ""
pubDate: 2010-06-07
updatedDate: 2010-06-08
heroImage: ../../assets/blog/hero-images/post-00-hero.svg



tags: ["n2cms"]
source: hugo
originalUrl: "https://codifice.dev/posts/2010-06-07-n2cms-meet-vwt2oc-day-2-n2cms/"
---

[Yesterday](http://martinondotnet.blogspot.com/2010/06/n2cms-meet-vwt2oc-day-1-project-setup.html) went well and I’ve now got the basic N2CMS install working and the Forum Addon has been installed, so my objectives for today are:

     * Day 2 – N2CMS Configuration             Integrate the Membership Provider from n2cms/forum/legacy vwt2oc 
        * Construct basic site structure (homepage/articles/forum/gallery/events calendar/etc) 
        * Create VWT2OC basic theme 
           #### Integrating the Membership Provider  One of the first tasks I need to undertake is integrating the underlying security model.  Fortunately, n2cms implements the provider model (as does the forum add-on and my legacy VWT2OC site).  However, the implementations behind them are very different and each application has various customizations that need to be incorporated.  My aim for my integrated Membership Provider is:

     * Provide all required features for n2cms and forum add-on 
    * Ensure that all of the user credentials from the existing site can work with the new one – I don’t want all the members to have to reset their passwords! 
   The major difference between the provided N2.Security.ContentMembershipProvider and the VWt2OC legacy implementation is that the n2 version stores passwords in clear text where VWT2OC uses hashes.  As a has is a one-way operation I can’t retrieve the existing passwords (only reset them), so I need to override several methods to implement hashing.

  
```
using System.Web.Security;
```

Pass the Salt!

Of course, being too clever for my own good, I didn’t use an unsalted hash…I generated the salt from the strong name key of the current assembly.  Which was fine for my green field application where all assemblies were strong names…not so good now where the chain of dependencies aren’t strongly named.  If you’re interested the algorithm is pretty simple:

```
{
```

To resolve, this I will need to obtain the salt and replicate it in the new assembly.  This time around I’m going to use a simpler mechanism and store the salt as a Base64 encoded string using the default Settings Class for the project.

Hooking It Up

Finally, I just need to wire up the Provider in the web.config:

```
<providers>
```

Integrating into the Forum

To fully integrate the forum into the site, a quick custom implementation of the AbstractN2ForumUser is in order:

```
using N2;
```

This class will use the standard n2cms profile provider and User objects to fill in the blanks that the GenericForumUser provided with the Forum Addon is missing.

#### Construct Basic Site Structure

So, now comes the interesting bit – configuring the website structure for the first time and checking that the major features work.  But first things first, I need to switch from the default SQLite to SQLExpress as the Forum Addin will only work on MS SQL.

Fortunately, this is as simple as adding a new database to App_Data in visual studio and tweaking one of the provided connection strings (in web.config and again in yafnet.config) and firing up the website:

  * When the website starts now, you’ll get a simple installation screen 
    
[](http://lh3.ggpht.com/_Vz_CYzsjR7M/TA0CLw_WNsI/AAAAAAAAAC0/xMM_jCtMEz8/s1600-h/image%5B2%5D.png) 

  * Click to install a new database and log in using the default ‘admin/changeme’ credentials (unless you’ve changed them in the web.config file!) 

  * You’re now prompted to create the database tables by working through the installation step ‘tabs’ 
    
[](http://lh3.ggpht.com/_Vz_CYzsjR7M/TA0CMss7XjI/AAAAAAAAAC8/qo-jlrcBXNs/s1600-h/image%5B5%5D.png) 

  * Test the connection on step 2 
    
[](http://lh3.ggpht.com/_Vz_CYzsjR7M/TA0CNbmA7zI/AAAAAAAAADE/zhb6Ck0nsgg/s1600-h/image%5B8%5D.png) 

  * Click the ‘Create Tables’ button on step 3 to install the n2cms schema  
[](http://lh5.ggpht.com/_Vz_CYzsjR7M/TA0COASXq2I/AAAAAAAAADM/Q6sQXoRqFK4/s1600-h/image%5B11%5D.png) 

  * Select a theme…As the VWT2OC site is primarily yellow, I’ve gone with ‘Plain Orange Theme’ as it will be a simple modification 
    
[](http://lh6.ggpht.com/_Vz_CYzsjR7M/TA0CPNvEMCI/AAAAAAAAADU/EcAhgTjXKGo/s1600-h/image%5B14%5D.png) 

  * Restart the application on Step 5 and go to the management console (click on the ***managing*** link) 

    
[](http://lh6.ggpht.com/_Vz_CYzsjR7M/TA0CQLcAxWI/AAAAAAAAADc/gytd2Q2lyyQ/s1600-h/image%5B17%5D.png) [](http://lh6.ggpht.com/_Vz_CYzsjR7M/TA0CRWtHuJI/AAAAAAAAADk/nG78DDOBQEI/s1600-h/image%5B20%5D.png) 

  * Now to create an interim Administrator account, click on ‘Users’ in the top left and then ‘New’ 
    
[](http://lh6.ggpht.com/_Vz_CYzsjR7M/TA0CSOZ4acI/AAAAAAAAADs/rwvyoHEnkd0/s1600-h/image%5B23%5D.png) 

  * That done I can now validate the modified Membership Provider by inspecting what’s been saved as the password for my new user.  This is in the n2Detail table (and it will be close to the bottom…) 
    
[](http://lh6.ggpht.com/_Vz_CYzsjR7M/TA0CTO3czMI/AAAAAAAAAD0/C3jVMMiYhts/s1600-h/image%5B26%5D.png) 

    
You’ll have to trust me that that’s a hashed version of the password I entered! 

  * The final test is to log out and back in again! 

  * Now to remove the default administrator credentials from the web.config 
    
```
<forms loginUrl="n2/login.aspx" protection="All" timeout="30000" path="/">
```

    
  

  * Now, to add a Forum underneath homepage so it appears in the top level navigation.  Right click on Home –> New and then select ‘Forum’.  Fill in the ‘Content’ and ‘Forum Settings’ as required 
    
[](http://lh5.ggpht.com/_Vz_CYzsjR7M/TA0CUqcVu7I/AAAAAAAAAD8/vIylxuSM6fk/s1600-h/image%5B32%5D.png) 

    
There are a couple of gotchas here: 

    
      Making sure the Custom Forum User is selected 

      * The Forum Location is the location of the Addon files (should be left as default /Forum/YAF) 

    
  

  * When the forum is published we will be prompted to work through the installation wizard. 
    
      If you hit a database connection problem, manually update the connection string in the yafnet.config file 

      * If you get ‘Cannot use full-text search in user instance’ error don’t worry…it’ll be fine *apparently* 

    
  

  * At the end of the wizard click ‘Finish’.  At this point, my installation erred as Session State had been disabled and the addon requires it. To enable it change the sessionState mode to InProc  in the web.config 
    
```
<!--<sessionState mode="Off" />-->
```

    
  

  * Now the forum should be installed 
    
[](http://lh5.ggpht.com/_Vz_CYzsjR7M/TA0CVmJJjSI/AAAAAAAAAEE/-3d1-6UtAzg/s1600-h/image%5B35%5D.png) 

#### ‘Prettying’ It up

Now for a bit of light relief (ha ha) I’m going to spend some time merging the existing vwt2oc theme in with the plain orange n2cms theme.  This is pretty simple (on paper):

  * Copy the ‘Plain’ theme within App_Themes to VWT2OC 

  * Tweak CSS 

  * Switch the Site Theme to ‘VWT2OC’ by right clicking on ‘Home’ and editing the Layout 
    
[](http://lh6.ggpht.com/_Vz_CYzsjR7M/TA0CWpByiJI/AAAAAAAAAEM/9V1QUD64zLg/s1600-h/image%5B38%5D.png) 

It’s a shame my CSS skills are a bit lacking really….Oh well, it’ll be easy enough to change later.

[](http://lh4.ggpht.com/_Vz_CYzsjR7M/TA1KZeyldjI/AAAAAAAAAEU/kOftAMtucY4/s1600-h/image%5B3%5D.png)