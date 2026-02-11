---
title: "N2CMS Meet VWT2OC: Day 4 – Wheel Spinning"
description: "Technical blog post from 2010-06-09"
pubDate: 2010-06-09
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

Well, Webhost4Life have yet to restore the current site so I can’t work through the develop model/import data/rinse/repeat iterations which I’ll need to ensure a clean migration at the end of the project.  Still at least they’re keeping me updated…and not at all keeping me in the dark with vague promised that someone's working on it.  Bastards.
I guess it’s my fault for trusting them to do all the database backups (like they’re paid to do)…..I should have been doing them myself.

## 
Still On The Brightside – [n2cms](http://bit.ly/aco4m4) 2.0 has been released!

Ok, so it’s only 7 revisions from my current version so it’s unlikely to have any game changing fixes of features but it does give me an opportunity to test my N2CMS upgrade and deployment mechanism that I devised on [Day 1](http://martinondotnet.blogspot.com/2010/06/n2cms-meet-vwt2oc-day-1-project-setup.html).
In fact, given how mechanical the process is…I’ll script it out.  First step is to merge in the latest changes and merge them into my customised branch (UpdateN2.bat):

   1: :UpdateN2.bat
   2: @echo off
   3: setlocal
   4: cmd /c "%programfiles(x86)%\Microsoft Visual Studio 9.0\VC\vcvarsall.bat" &
   5: cls
   6: echo WARNING - this script will automatically commit changes to the repository
   7: echo Are you sure you want to continue?
   8: pause
   9: echo You were warned!
  10: svn cleanup
  11: svn update
  12: svn commit -m "Automatic Checkin Prior to Update"
  13:  
  14: cd "3rd Party"
  15: svn propget svn:externals > svntemp.tmp
  16:  
  17: FOR /F "tokens=1,2,3 delims= " %%i IN (svntemp.tmp) DO (
  18:     svn info %%k > svntemp.tmp
  19:     FOR /F "tokens=1,2 delims=: " %%s IN (svntemp.tmp) DO (
  20:         if "%%s"=="Revision" (
  21:             if NOT "-r%%t"=="%%j" (
  22:                  svn propset svn:externals "%%i -r%%t %%k" .
  23:                 svn commit -m "Upated %%i revision to %%t"
  24:                 echo Updating workarea
  25:                 svn update
  26:                 svn export n2cms local\n2cms --force
  27:  
  28:                 svn status local\n2cms > svntemp.tmp
  29:  
  30:                 FOR /F "tokens=1,2 delims= " %%i IN (svntemp.tmp) DO (
  31:                     if "%%i"=="?" (
  32:                         svn add %%j
  33:                     )
  34:  
  35:                 )
  36:  
  37:                 svn commit -m "Committed latest changes from %%i -r%%t"
  38:                 svn info custom\n2cms > svntemp.tmp
  39:                 FOR /F "tokens=1,2 delims=:" %%a IN (svntemp.tmp) DO (
  40:                     if "%%a"=="Last Changed Rev" (
  41:                         svn merge -r%%b:HEAD local\n2cms custom\n2cms > svntemp.tmp    
  42:                         SET conflict=0
  43:                         FOR /F "tokens=1,2 delims= " %%i IN (svntemp.tmp) DO (
  44:                             if "%%i"=="C" (
  45:                                 echo conflicted file found %%j
  46:                                 SET conflict=1
  47:                             )
  48:  
  49:                         )
  50:                         IF "%conflict%"=="1" EXIT
  51:                         svn commit -m "Merged latest changes into custom"
  52:                     
  53:                     )
  54:                 )
  55:                 cd ..
  56:                 svn cleanup
  57:                 svn update
  58:                 cd "3rd Party"
  59:  
  60:             )
  61:             if "-r%%t"=="%%j" (
  62:                 echo External Reference %%i Revision is Already -r%%t
  63:             )
  64:  
  65:  
  66:         )
  67:     )
  68:     
  69: )
  70: del svntemp.tmp
  71: cd ..
  72:  
  73:  

Apologies for the batching…but sometimes it’s just easier!
Now we need to build the custom version, rebuild the Forum addon and prepare the compiled version ready for deployment (into the VWT2OC project) (BuildN2.bat):

   1: @echo off
   2: cmd /c "%programfiles(x86)%\Microsoft Visual Studio 9.0\VC\vcvarsall.bat" &
   3: Echo Updateing Compiled N2CMS
   4: cd "3rd Party\custom\n2cms\build"
   5: cmd /c "build.bat /target:Clean;PrepareDependencies;Build;Templates-Build /property:Configuration=Debug" & 
   6: cmd /c "..\..\..\..\Tools\CodeBehindRemover\CodeBehindRemover /i:..\src\\wwwroot  /o:..\..\N2.Templates.Compiled /e:ascx,aspx,master,asmx,ashx" &
   7: cmd /c "robocopy ..\src\wwwroot ..\..\N2.Templates.Compiled /XD .svn obj /XF *.cs *.ascx *.aspx *.master *.asmx *.ashx *.csproj *.sln *.suo *.user *.cache /S" &
   8:  
   9: ECHO Deploying Forum to Compiled Template
  10: cmd /c "robocopy ..\src\wwwroot\bin  ..\..\Forum\lib N2.dll N2.pdb N2.xml N2.Templates.*" &
  11: cd ..\..\Forum\src
  12: cmd /c "msbuild Forum.sln /target:clean;rebuild /property:Configuration=Debug" &
  13: cmd /c "..\..\..\..\Tools\CodeBehindRemover\CodeBehindRemover /i:Forum /o:..\..\N2.Templates.Compiled /e:ascx,aspx,master,asmx,ashx" &
  14: cmd /c "robocopy Forum ..\..\N2.Templates.Compiled /XD .svn obj /XF *.cs *.ascx *.aspx *.master *.asmx *.ashx *.csproj *.sln *.suo *.user *.cache /S" &
  15:  
  16: cmd /c "robocopy ..\..\N2.Templates.Compiled\bin ..\..\N2.Templates.Compiled.bin /XD .svn /MOVE" &
  17:  
  18: cd ..\..\..\..\

And finally deploy the compiled version into the VWT2OC project (DeployN2.bat):

   1: :DeployN2.bat
   2: @echo off
   3: setlocal
   4: cmd /c "%programfiles(x86)%\Microsoft Visual Studio 9.0\VC\vcvarsall.bat" &
   5: IF "%1"=="" (
   6:     cls
   7:     echo WARNING - this script will automatically commit changes to the repository
   8:     echo Are you sure you want ot continue?
   9:     pause
  10:     echo You were warned!
  11:     svn cleanup
  12:     svn update
  13:     svn commit -m "Automatic Checkin Prior to Update"
  14: )
  15:  
  16: cd "3rd Party"
  17:  
  18:                 svn info custom\n2cms > svntemp.tmp
  19:                 FOR /F "tokens=1,2 delims=:" %%a IN (svntemp.tmp) DO (
  20:                     if "%%a"=="Last Changed Rev" (
  21:                         svn merge -r%%b:HEAD custom\n2cms ..\Website > svntemp.tmp    
  22:                         SET conflict=0
  23:                         FOR /F "tokens=1,2 delims= " %%i IN (svntemp.tmp) DO (
  24:                             if "%%i"=="C" (
  25:                                 echo conflicted file found %%j
  26:                                 SET conflict=1
  27:                             )
  28:  
  29:                         )
  30:                         IF "%conflict%"=="1" EXIT
  31:                         svn commit -m "Merged latest changes into custom"
  32:                     
  33:                     )
  34:                 )
  35:                 
  36:     
  37: )
  38: del svntemp.tmp
  39: cd ..
  40:  
  41:  

And finally one to make it one swift command (Update AndDeployN2.bat):

   1: :UpdateAndDeployN2.bat
   2: @echo off
   3: setlocal
   4: cmd /c "UpdateN2.bat" &
   5: cmd /c "BuildN2.bat" &
   6: cmd /c "DeployN2.bat NoWarning" &
   7: echo Update and Deployment Complete
