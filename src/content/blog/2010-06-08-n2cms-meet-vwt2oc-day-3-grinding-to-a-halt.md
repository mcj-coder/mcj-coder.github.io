---
title: "N2CMS Meet VWT2OC: Day 3 – Grinding to a Halt!"
description: "Technical blog post from 2010-06-08"
pubDate: 2010-06-08
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

Well, it was going way too well to last.  It’s become apparent that the existing site is in some sort of half migrated mangled state after the hosting provider changed systems.  This has been like a half-brick to the head as when they’ve tried to fix the issue, more and more keep getting uncovered.  The sites been down for most of the day as a result (and is still down 24 hours later …. curse you WebHost4Life!)

  
## A Change of Plans
  Until the hosting issue resolved, I can’t really work on the Membership System, so I’m going to look at implementing [n2cms](http://bit.ly/aco4m4) editor addon’s and deploying what I’ve got for client approval.  

  My new overall plan of action is:

     * Day 3 – Editor Addons and Deployment                   Define Skeleton Feature Projects         * Implement Skeleton Editor Addons         * Deploy to temporary hosted location for client approval of WIP             * Day 4 – Membership Model (WebHost4Life willing)                   Basic Admin Screens for Members         * Restore Live Site after WebHost4Life have recovered it             * Day 5 - Import Data                   Implement Club Member/Membership Data Model in n2cms         * Initial member import routine from current site             * Day 6 - Memerships and Member Areas                   Membership Reports/Maintenance from with N2CMS         * Initial ‘My Account’ page for front end             * Day 7 – eCommerce                   Import Membership Purchasing Mechanism for legacy app         * Integrate NoChex/Paypal payment gateways             * Day 8 – Review of Progress and Bug Fixing                   Review functionality and prioritise urgent issues with work so far            Define Skeleton Feature Projects  The legacy VWT2OC website maintained quite a good seperation between the eCommerce part of paid memberships and the club members it self.  I’d like to try and keep that separation in the new build by creating two new ‘features’ for n2cms: Store and Club.

 [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhmXn_A9xZudTagEy9W6RyH8dCua3tGUGfikenRTclUBPas2clm0bREBcRDVt-4GA3SkWiu8AXHpnHnE79uKufuD9hy0feEA6kkrVvA4lHfkXOQRNmkMDq86IN3OrjU3xFe-zcHspr7/s1600-h/image%5B11%5D.png)   Each of these will need Editor components as there will be lots of data which isn’t really page related – as well AddOn still UI plugins.  This means that each 'feature’ will need three projects:

     * A Core Class Library defining the content items and details     * A Editor Addon Web Application Project that can be deployed along side N2.Management (which doesn’t need to be deployed as the same application as the front end)     * An Addon Project which will add new front end components    These will be deployed into the project using the standard n2cms xcopy-a-like mechanism, so that’s what the build procedure will support.  I’ll develop these features within the VWT2OC Solution with a view of possibly submitting them to the n2cms project later.

  The Web Application projects will have the following Post-Build Event defined:

             1: $(SolutionDir)Tools\CodeBehindRemover\CodeBehindRemover /i:$(ProjectDir) /o:$(SolutionDir)Website\ /e:ascx,aspx,master,asmx,ashx

       2:  

       3: robocopy $(ProjectDir) $(SolutionDir)Website\ /XD .svn obj /XF *.cs *.ascx *.aspx *.master *.asmx *.ashx *.csproj *.sln *.suo *.user *.cache /S

       4: if errorlevel 1 set errorlevel=0

This will mean that there is no ‘hard’ reference between the two new features and the VWT2OC website project.  They will be dropped in to the project and loaded dynamically like every other n2cms addon and extension.

Skeleton Editor Addons

Integration new administration screens to the n2cms editor site is quite simple as all you need to do it decorate a standard page class with the ToolbarPluginAttribute decorator:

  
       1: namespace N2.Edit.Club

       2: {

       3:     /// 

       4:     /// Lists the Available Club Management features

       5:     /// 

       6:     [ToolbarPluginAttribute("CLUB" // the text to appear next to the icon

       7:         , "club" // the name of the feature (used as a div id wrapping the button)

       8:         , "Club/ClubManagement.aspx" // the page to open

       9:         , ToolbarArea.Navigation //appear in the top leve group of buttons

      10:         , Targets.Navigation // this page is a new menu, so display in the navigation frame

      11:         , "~/N2/Resources/icons/group.png" //the icon to use

      12:         , 110 // sort order - where to appear in the toolbar

      13:         , ToolTip = "Administer Club"

      14:         , AuthorizedRoles = new string[] { "Administrators", "Admin" }

      15:         , GlobalResourceClassName = "Toolbar")

      16:     ]

      17:     public partial class ClubManagement : System.Web.UI.Page

      18:     {

      19:  

      20:     }

      21: }

This results in a ‘Club’ button in the toolbar which, when clicked, opens the target page in the navigation frame:

[](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgQ1dPZ_NzJeBwhf4eptR0hQn-8Wcrw_gJSKw6_KNLnHUoYGS7x2v146YHPjhgudfQkEKDztIxbqj9vPgizU-1nukrJZwqt6cg6KyWG1191O_s7APUHR_2Ae3YfBmRdbNeMf-YFXp3Q/s1600-h/image%5B2%5D.png) 

Buy giving the links within this page a target of ‘preview’ we can open actual administration screens within the preview frame:

  
       1: li>a href="Titles/Titles.aspx" target="preview">Titlesa>li>

## Deployment

Before deploying to a preview location there are a few more tweaks that need to be done for the build process:

  * Remove any extraneous files/folders from project that may break pre-compilation from the project

  
    * \Addons\Demo 

    * \Addons\MyAddon 

    * \Addons\UITests 

    * \Templates\UI\Parts\Statistics.ascx
  

  * Add a Web Deployment Project for the VWT2OC project

  * Configure Web Deployment:

  
    * Precompile the UI components

    * Ensure that SourceWebVirtualPath is ‘/’

    * Update the connection strings to the preview database

    * Exclude installation folders and files

    * Deletion of Temporary files
  

For your entertainment - this is my modified Web Deployment project file:

  
       1: 

       2:   Microsoft Visual Studio 2008 Web Deployment Project 

       3:   http://go.microsoft.com/fwlink/?LinkID=104956

       4: 

       5: -->

       6: Project ToolsVersion="3.5" DefaultTargets="Build" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">

       7:   PropertyGroup>

       8:     Configuration Condition=" '$(Configuration)' == '' ">DebugConfiguration>

       9:     Platform Condition=" '$(Platform)' == '' ">AnyCPUPlatform>

      10:     ProductVersion>9.0.21022ProductVersion>

      11:     SchemaVersion>2.0SchemaVersion>

      12:     ProjectGuid>{990B76AF-AC0D-47D8-9D9A-485F4FDED792}ProjectGuid>

      13:     SourceWebPhysicalPath>..\WebsiteSourceWebPhysicalPath>

      14:     SourceWebProject>{0943038B-9FE4-40C2-93DE-0F9908348EFF}|Website\Website.csprojSourceWebProject>

      15:     SourceWebVirtualPath>/SourceWebVirtualPath>

      16:     TargetFrameworkVersion>v3.5TargetFrameworkVersion>

      17:     DebugSymbols>trueDebugSymbols>

      18:     EnableUpdateable>falseEnableUpdateable>

      19:     UseMerge>trueUseMerge>

      20:     SingleAssemblyName>VWT2OC.WebsiteSingleAssemblyName>

      21:     DeleteAppCodeCompiledFiles>falseDeleteAppCodeCompiledFiles>

      22:     DeleteAppDataFolder>falseDeleteAppDataFolder>

      23:     UseWebConfigReplacement>trueUseWebConfigReplacement>

      24:   PropertyGroup>

      25:   PropertyGroup Condition=" '$(Configuration)|$(Platform)' == 'Debug|AnyCPU' ">

      26:    

      27:     OutputPath>.\DebugOutputPath>

      28:   

      29:   PropertyGroup>

      30:   PropertyGroup Condition=" '$(Configuration)|$(Platform)' == 'Release|AnyCPU' ">

      31:   

      32:     OutputPath>.\ReleaseOutputPath>

      33:   PropertyGroup>

      34:   ItemGroup>

      35:   ItemGroup>

      36:   ItemGroup>

      37:     WebConfigReplacementFiles Include="App_Data\connectionStrings.config.live">

      38:       Section>connectionStringsSection>

      39:     WebConfigReplacementFiles>

      40:     WebConfigReplacementFiles Include="App_Data\yafnet.config.live">

      41:       Section>yafnetSection>

      42:     WebConfigReplacementFiles>

      43:   ItemGroup>

      44:   ItemGroup>

      45:     ExcludeFromBuild Include="$(SourceWebPhysicalPath)\**\.svn\**\*.*" />

      46:     ExcludeFromBuild Include="$(SourceWebPhysicalPath)\**\*.csproj*" />

      47:     ExcludeFromBuild Include="$(SourceWebPhysicalPath)\N2\Installation\**\*.*" />

      48:     ExcludeFromBuild Include="$(SourceWebPhysicalPath)\App_Data\**\*.*" Exclude="$(SourceWebPhysicalPath)\App_Data\*.config*" />

      49:   ItemGroup>

      50:   ItemGroup>

      51:     DeleteAfterBuild Include="$(OutputPath)\App_Data\yafnet.config.live" />

      52:     DeleteAfterBuild Include="$(OutputPath)\yafnet.config" />

      53:     DeleteAfterBuild Include="$(OutputPath)\App_Data\connectionStrings.config.live" />

      54:     DeleteAfterBuild Include="$(OutputPath)\obj\**\*.*" />

      55:     DeleteAfterBuild Include="$(OutputPath)\bin\*.tmp" />

      56:   ItemGroup>

      57:   Import Project="$(MSBuildExtensionsPath)\Microsoft\WebDeployment\v9.0\Microsoft.WebDeployment.targets" />

      58:   Target Name="AfterBuild">

      59:     Delete Files="@(DeleteAfterBuild)" />

      60:   Target>

      61: Project>

I then modified the build configuration so the deployment project was only built for ‘release’ builds.
