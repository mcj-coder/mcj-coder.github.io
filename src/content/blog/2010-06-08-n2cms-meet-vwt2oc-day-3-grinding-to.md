---
title: "N2CMS Meet VWT2OC: Day 3 \u2013 Grinding to a Halt!"
description: ""
pubDate: 2010-06-08
updatedDate: 2010-06-09
heroImage: "../../assets/blog/n2cms-meet-vwt2oc-day-3-grinding-to-image_thumb[7].png"
tags: ["n2cms"]
source: hugo
originalUrl: "https://codifice.dev/posts/2010-06-08-n2cms-meet-vwt2oc-day-3-grinding-to/"
---

Well, it was going way too well to last.  It’s become apparent that the existing site is in some sort of half migrated mangled state after the hosting provider changed systems.  This has been like a half-brick to the head as when they’ve tried to fix the issue, more and more keep getting uncovered.  The sites been down for most of the day as a result (and is still down 24 hours later …. curse you WebHost4Life!)

  #### A Change of Plans  Until the hosting issue resolved, I can’t really work on the Membership System, so I’m going to look at implementing n2cms editor addon’s and deploying what I’ve got for client approval.  

  My new overall plan of action is:

     * Day 3 – Editor Addons and Deployment      
             Define Skeleton Feature Projects 
        * Implement Skeleton Editor Addons 
        * Deploy to temporary hosted location for client approval of WIP 
            * Day 4 – Membership Model (WebHost4Life willing)      
             Basic Admin Screens for Members 
        * Restore Live Site after WebHost4Life have recovered it 
            * Day 5 - Import Data      
             Implement Club Member/Membership Data Model in n2cms 
        * Initial member import routine from current site 
            * Day 6 - Memerships and Member Areas      
             Membership Reports/Maintenance from with N2CMS 
        * Initial ‘My Account’ page for front end 
            * Day 7 – eCommerce      
             Import Membership Purchasing Mechanism for legacy app 
        * Integrate NoChex/Paypal payment gateways 
            * Day 8 – Review of Progress and Bug Fixing      
             Review functionality and prioritise urgent issues with work so far 
           Define Skeleton Feature Projects  The legacy VWT2OC website maintained quite a good seperation between the eCommerce part of paid memberships and the club members it self.  I’d like to try and keep that separation in the new build by creating two new ‘features’ for n2cms: Store and Club.

 [](http://lh5.ggpht.com/_Vz_CYzsjR7M/TA-BQ_764iI/AAAAAAAAAEc/PbU_RezIZ9g/s1600-h/image%5B11%5D.png)   Each of these will need Editor components as there will be lots of data which isn’t really page related – as well AddOn still UI plugins.  This means that each 'feature’ will need three projects:

     * A Core Class Library defining the content items and details 
    * A Editor Addon Web Application Project that can be deployed along side N2.Management (which doesn’t need to be deployed as the same application as the front end) 
    * An Addon Project which will add new front end components 
   These will be deployed into the project using the standard n2cms xcopy-a-like mechanism, so that’s what the build procedure will support.  I’ll develop these features within the VWT2OC Solution with a view of possibly submitting them to the n2cms project later.

  The Web Application projects will have the following Post-Build Event defined:

  
```
 
```

This will mean that there is no ‘hard’ reference between the two new features and the VWT2OC website project.  They will be dropped in to the project and loaded dynamically like every other n2cms addon and extension.

Skeleton Editor Addons

Integration new administration screens to the n2cms editor site is quite simple as all you need to do it decorate a standard page class with the ToolbarPluginAttribute decorator:

```
{
```

This results in a ‘Club’ button in the toolbar which, when clicked, opens the target page in the navigation frame:

[](http://lh6.ggpht.com/_Vz_CYzsjR7M/TA-BSBieo0I/AAAAAAAAAEk/hgTQDUcKZfs/s1600-h/image%5B2%5D.png) 

Buy giving the links within this page a target of ‘preview’ we can open actual administration screens within the preview frame:

```
Microsoft Visual Studio 2008 Web Deployment Project
```

I then modified the build configuration so the deployment project was only built for ‘release’ builds.