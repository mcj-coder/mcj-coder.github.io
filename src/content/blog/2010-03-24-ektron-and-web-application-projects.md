---
title: Ektron and Web Application Projects (Part 2)
description: ""
pubDate: 2010-03-24
updatedDate: 2010-03-29
heroImage: ../../assets/blog/hero-images/post-00-hero.svg



tags: ["ektron"]
source: hugo
originalUrl: "https://codifice.dev/posts/2010-03-24-ektron-and-web-application-projects/"
---

In Part 1, I discussed why you might want to develop your website outside of the default Ektron workarea and gave a brief overview of your options.

  This time around, I’m going to show how to configure your Visual Studio Solution and projects and IIS to get you started.

  You will need:

     * A standard Ektron cms400min workarea website (I usually just call mine /Web *– and copy directly from a fresh cms400min install!*) 
    * A Web Application Project (*clientproject*.Website) 
    * A ‘3rd Party’ folder which will contain subfolders for the project dependencies binaries (this includes Ektron) and any helper utilities 
    * A ‘Virtual Directories’ folder (that isn’t included in the VS solution).  Move the uploadedFiles, uploadedImages, assets and privateAssets folders from the /web folder into here.  This will stop VS from rescanning the folder each time there’s a change.  If you don’t want to do this then you can set the *hidden* flag on just those folders (not their children) by right clicking and selecting properties.  I prefer the clean separation approach as the uploaded files and images are data and the asset files are generated artefacts. 
    * ***Optional: ***Class libraries containing business and helper classes (*clientproject*.Website.Support) 
    * All of the projects live in solution folder (imaginatively named *clientproject*) which also contains the solution file (also called *clientproject*) and a strong naming key. 
   The folder structure should look like this:

 [*](http://lh4.ggpht.com/_Vz_CYzsjR7M/S6liyfQdo3I/AAAAAAAAABg/HIy2upGVZIY/s1600-h/image%5B8%5D.png)   This may look complicated but it allows us to easily use source control (such as TFS or Subversion) to allow multiple developers to work on a solution and is Best Practise. 

  In keeping with the best practise handling of 3rd Party libraries: 

     * Move all of the files from ‘/Web/bin’ into ‘/3rd Party/Ektron’ 
    * In Visual Studio, right click on the /Web website and select ‘Add References’ 
    * In the dialog box, click' ‘Add’ and browse the /3rd Party/Ektron and select all of the dll’s 
    * Click Ok. 
   This will create ‘.refresh’ files in the ‘/Web/bin’ folder which can safely be checked in to any version control system.

  #### Configuring IIS for the Workarea Website  The IIS configuration can be done now so we can begin to configure Ektron via the workarea.  This is a relatively simple procedure:

     * Create a new Website (I prefer a format like local.cms.*clientproject*.dev.*companydomain *– *local *as it’s a local developer version, *cms* as the workarea is present and the .dev.*companydomain* gives the opportunity to expose the environment externally via DNS).              Associate the new website with the /web project. 
        * Set up the website Application Pool (I use IIS 7)                     Use the Integrated Pipeline 
            * Check that it’s running as the **Network Service** user 
            * Disable ‘pings’ (this will make debugging much easier!) 
                        * Ensure that the web.config contains all of the handler mappings from the IIS 7 example configuration file (Usually found in *C:\Program Files\Ektron\CMS400vXX\CommonFiles\IIS7Web.config)* 
            * Create a ‘Virtual Directory’ (not an application) for each of the folders within /Virtual Directories names exactly as they would usually appear as folders in the workarea ie:             assets 
        * PrivateAssets 
        * uploadedImages 
        * uploadedFiles 
           #### Validate the Workarea Website Modifications  The workarea website should pretty much be complete now from a infrastructure configuration point of view. but you will need to amend the following web.config settings:

     * The ***Ektron.DbConnection*** database connection string 
    * The ***sessionState ***connection string – if your storing session in SQL Server 
    * The WSPath in appSettings should read ‘http://local.cms.*clientproject*.dev.*companydomain*/workarea/ServerControlWS.asmx’ (and you should be able to view that page as well) 
    * Any other settings (email servers, etc) 
   You should also be able to run SearchConfigUI (remember to right click ‘Run As Administrator’ in Windows Server 2008 or Windows 7).  Define meaning full catalogue names and check that the Assets and Private Assets directories have been correctly located (within the Virtual Directories folder).

  You should now be able to log into the website by visiting ‘http://local.cms.*clientproject*.dev.*companydomain*/cmslogin.aspx’ and using the builtin account the was configured when Ektron was installed.

  #### Setting the Solution the Build Order  It’s probably a good idea at this stage to configure any Code Analysis rules on the clientproject*.Website and *clientproject*.Website.Support projects and to configure the dependencies and set the assemblies to be strongly named.  You should ensure that build order of the solution goes something like: 

     * *clientproject*.Website.Support 
    * *clientproject*.Website 
    * /Web 
   You can control this by setting project dependencies either implicitly by adding a reference to the *clientproject*.Website.Support project into the clientproject.Website project or by using the ‘Project Dependencies’ dialog (checking the build order in the ‘Build Order’ tab on the same screen).

  Depending on the level on integration with the workarea you need, you can configure an IIS website to point at your Web Application project for lightweight testing of the your code.  Simply follow the instructions for configuring IIS but point the website at the /clientproject.Website folder.  This means you can quickly test your code, without IIS having to load all of the Ektron libraries.

  At this point you can start to build your Ektron front end within the *clientproject*.Website and by copying some basic configuration from the /Web project (such as connectionStrings and appSettings). However, to deploy our web application into the Ektron workarea website we’re going to need some custom build steps, which I’ll cover in Part 3.