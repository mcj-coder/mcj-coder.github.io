---
title: Notes on Configuring a New EPiServer 6 R2 Website for Continuous Integration
description: 'Step-by-step guide for setting up a new EPiServer 6 R2 website for continuous integration, including project creation, dependency management, and NuGet configuration.'
pubDate: 2012-11-22
tags: ['episerver']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2012/11/notes-on-configuring-new-episerver-6-r2.html'
heroImage: ../../assets/blog/hero-images/2012-11-22-notes-on-configuring-new-episerver-6-r2.jpg
---

I'm assuming that you've read the installation instructions:

<http://world.episerver.com/Documentation/Items/Installation-Instructions/EPiServer-CMS/Version-6/EPiServer-CMS-6-R2/Installation-Instructions---EPiServer-CMS-6-R2/>

## Creating a New Blank EPiServer Site Project and Solution

1. **Prepare Repository**

2. **Check out** trunk/main branch to working copy

3. **Create an Empty VS Solution** root of the working copy

4. **Download the** 6R2 installer from EPiServer World (you'll need to register):

   <http://world.episerver.com/Download/Categories/Products/EPiServer-CMS/>

5. **Run installer** and deploy a Core deployment to the Working Copy, creating a project folder

6. **Open VS solution**

7. **Add New Empty Website Project** (use a temporary name)

8. **Configure project properties** as required:
   - Assembly Name (`<client>.Website`)
   - Assembly Info (Version, Name, Copyright, etc)
   - Namespace (`<client>.Website`)
   - Target Framework (.Net 3.5)
   - Treat Warnings as Errors (All Configurations)
   - Strong Naming Key
   - Code Analysis Rules

9. **Save and Remove** the Temporary Website Project from the Solution

10. **Move project file** into EPiServer Website folder and rename to match
    - Edit the file in notepad to replace all instances of the Temporary Project Name with the real one
    - Also copy:
      - `web.*.config` (not web.config)
      - the Properties folder
      - Any supporting files you added (Strong naming key, Code Analysis rules, etc)

11. **Add the moved Project** file to the solution as an Existing Project

12. **Enable 'Show All Files'** and include all

13. **Edit `episerver.config`** to configure:
    - **Start Page Id** – set `startPageId` attribute to '1' (from '0') (`/sites/site/siteSettings[startPageId]`)
    - **Site Description** attribute
    - **Site Url** - the `siteUrl` attribute (`/sites/site/siteSettings[siteUrl]`)

14. **Edit `EPiServerFramework.config`** to ensure that the correct `siteHosts` are set

15. **Test the project** builds as expected and website is working (place holder page is displayed)
    - place holder page is displayed

16. **Commit the solution** to version control, ensuring that only code and configuration files are committed not build outputs or per user settings (`/bin`, `/obj`, `*.user` files etc.)

## Managing Dependencies for CI

The project builds successfully as all of the required dependencies exist within the bin folder of the website. This means the build server will not be able to successfully build the project. We can manage this in two ways:

1. **(Recommended)** Move all of the DLL's from the bin folder into a '3rd Party' or 'libs' folder and create references to all of the top level assemblies from there, ensuring the 'Copy Local' is enabled.
   - For each additional EPiServer installed to the website this procedure will need to be repeated

2. Manage the dependencies via the EPiServer NuGet service (required NuGet VS extension) (_not recommended as the feed is outdated compared to the download from EPiServer World_)

**From here it should be build scripts as usual!**

---

### \*Here Be Dragons – Configuring EPiServer Dependencies using NuGet

---

_I couldn't get this to work as intended – in the hope that I've done something stupid and easily correctable…_

Managing dependencies via NuGet is the new standard for managing dependencies and has many advantages over manually maintaining references. For CI builds, not storing binary files within version control is a big win.

Unfortunately, the EPiServer NuGet feed doesn't take advantage of all NuGet offers and is already a little out of date. However, if you want to attempt to get a core EPiServer site running using NuGet dependencies:

1. **Enable NuGet Package Restore** on the Solution (from Project Menu, or Right Click on Solution)

2. **Add the EPiServer NuGet feed** (<http://nuget.episerver.com/feed/packages.svc/>) to the Package Manager Sources

3. **Install the required packages** as references to the EPiServer Website project via the Package Manager Console (Ensuring the EPiServer package source is selected):
   - `Install-Package EPiServer.CMS.Core -Version 6.1.379.0`
   - `Install-Package EPiServer.Framework -Version 6.2.267.1`

4. The balance of the dependencies will need to be references from the 3rd Party folder.

_At this point the project wouldn't display as a website will a null reference exception (no stack trace)_
