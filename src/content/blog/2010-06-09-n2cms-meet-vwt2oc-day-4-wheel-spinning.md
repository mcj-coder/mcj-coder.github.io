---
title: 'N2CMS Meet VWT2OC: Day 4 – Wheel Spinning'
description: 'Day 4 of the VWT2OC rebuild: hosting problems continue, so the day is spent scripting the N2CMS update, build, and deployment process using batch files and SVN.'
pubDate: 2010-06-09
updatedDate: 2010-06-10
tags: ['n2cms']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/06/n2cms-meet-vwt2oc-day-4-wheel-spinning.html'
heroImage: ../../assets/blog/hero-images/2010-06-09-n2cms-meet-vwt2oc-day-4-wheel-spinning.jpg
---

Well, Webhost4Life have yet to restore the current site so I can't work through the develop model/import data/rinse/repeat iterations which I'll need to ensure a clean migration at the end of the project. Still at least they're keeping me updated…and not at all keeping me in the dark with vague promises that someone's working on it. Bastards.

I guess it's my fault for trusting them to do all the database backups (like they're paid to do)…..I should have been doing them myself.

#### Still On The Brightside – [n2cms](https://www.n2cms.com/) 2.0 has been released!

Ok, so it's only 7 revisions from my current version so it's unlikely to have any game changing fixes or features but it does give me an opportunity to test my N2CMS upgrade and deployment mechanism that I devised on [Day 1](/blog/2010-06-06-n2cms-meet-vwt2oc-day-1-project-setup).

In fact, given how mechanical the process is…I'll script it out. First step is to merge in the latest changes and merge them into my customised branch (UpdateN2.bat):

```batch
:UpdateN2.bat
@echo off
setlocal
cmd /c "%programfiles(x86)%\Microsoft Visual Studio 9.0\VC\vcvarsall.bat" &
cls
echo WARNING - this script will automatically commit changes to the repository
echo Are you sure you want to continue?
pause
echo You were warned!
svn cleanup
svn update
svn commit -m "Automatic Checkin Prior to Update"

cd "3rd Party"
svn propget svn:externals > svntemp.tmp

FOR /F "tokens=1,2,3 delims= " %%i IN (svntemp.tmp) DO (
    svn info %%k > svntemp.tmp
    FOR /F "tokens=1,2 delims=: " %%s IN (svntemp.tmp) DO (
        if "%%s"=="Revision" (
            if NOT "-r%%t"=="%%j" (
                 svn propset svn:externals "%%i -r%%t %%k" .
                svn commit -m "Upated %%i revision to %%t"
                echo Updating workarea
                svn update
                svn export n2cms local\n2cms --force

                svn status local\n2cms > svntemp.tmp

                FOR /F "tokens=1,2 delims= " %%i IN (svntemp.tmp) DO (
                    if "%%i"=="?" (
                        svn add %%j
                    )

                )

                svn commit -m "Committed latest changes from %%i -r%%t"
                svn info custom\n2cms > svntemp.tmp
                FOR /F "tokens=1,2 delims=:" %%a IN (svntemp.tmp) DO (
                    if "%%a"=="Last Changed Rev" (
                        svn merge -r%%b:HEAD local\n2cms custom\n2cms > svntemp.tmp
                        SET conflict=0
                        FOR /F "tokens=1,2 delims= " %%i IN (svntemp.tmp) DO (
                            if "%%i"=="C" (
                                echo conflicted file found %%j
                                SET conflict=1
                            )

                        )
                        IF "%conflict%"=="1" EXIT
                        svn commit -m "Merged latest changes into custom"


                    )
                )
                cd ..
                svn cleanup
                svn update
                cd "3rd Party"

            )
            if "-r%%t"=="%%j" (
                echo External Reference %%i Revision is Already -r%%t
            )


        )
    )

)
del svntemp.tmp
cd ..
```

Apologies for the batching…but sometimes it's just easier!

Now we need to build the custom version, rebuild the Forum addon and prepare the compiled version ready for deployment (into the VWT2OC project) (BuildN2.bat):

```batch
@echo off
cmd /c "%programfiles(x86)%\Microsoft Visual Studio 9.0\VC\vcvarsall.bat" &
Echo Updateing Compiled N2CMS
cd "3rd Party\custom\n2cms\build"
cmd /c "build.bat /target:Clean;PrepareDependencies;Build;Templates-Build /property:Configuration=Debug" &
cmd /c "..\..\..\..\Tools\CodeBehindRemover\CodeBehindRemover /i:..\src\\wwwroot  /o:..\..\N2.Templates.Compiled /e:ascx,aspx,master,asmx,ashx" &
cmd /c "robocopy ..\src\wwwroot ..\..\N2.Templates.Compiled /XD .svn obj /XF *.cs *.ascx *.aspx *.master *.asmx *.ashx *.csproj *.sln *.suo *.user *.cache /S" &

ECHO Deploying Forum to Compiled Template
cmd /c "robocopy ..\src\wwwroot\bin  ..\..\Forum\lib N2.dll N2.pdb N2.xml N2.Templates.*" &
cd ..\..\Forum\src
cmd /c "msbuild Forum.sln /target:clean;rebuild /property:Configuration=Debug" &
cmd /c "..\..\..\..\Tools\CodeBehindRemover\CodeBehindRemover /i:Forum /o:..\..\N2.Templates.Compiled /e:ascx,aspx,master,asmx,ashx" &
cmd /c "robocopy Forum ..\..\N2.Templates.Compiled /XD .svn obj /XF *.cs *.ascx *.aspx *.master *.asmx *.ashx *.csproj *.sln *.suo *.user *.cache /S" &

cmd /c "robocopy ..\..\N2.Templates.Compiled\bin ..\..\N2.Templates.Compiled.bin /XD .svn /MOVE" &

cd ..\..\..\..\
```

And finally deploy the compiled version into the VWT2OC project (DeployN2.bat):

```batch
:DeployN2.bat
@echo off
setlocal
cmd /c "%programfiles(x86)%\Microsoft Visual Studio 9.0\VC\vcvarsall.bat" &
IF "%1"=="" (
    cls
    echo WARNING - this script will automatically commit changes to the repository
    echo Are you sure you want to continue?
    pause
    echo You were warned!
    svn cleanup
    svn update
    svn commit -m "Automatic Checkin Prior to Update"
)

cd "3rd Party"

                svn info custom\n2cms > svntemp.tmp
                FOR /F "tokens=1,2 delims=:" %%a IN (svntemp.tmp) DO (
                    if "%%a"=="Last Changed Rev" (
                        svn merge -r%%b:HEAD custom\n2cms ..\Website > svntemp.tmp
                        SET conflict=0
                        FOR /F "tokens=1,2 delims= " %%i IN (svntemp.tmp) DO (
                            if "%%i"=="C" (
                                echo conflicted file found %%j
                                SET conflict=1
                            )

                        )
                        IF "%conflict%"=="1" EXIT
                        svn commit -m "Merged latest changes into custom"


                    )
                )



)
del svntemp.tmp
cd ..
```

And finally one to make it one swift command (UpdateAndDeployN2.bat):

```batch
:UpdateAndDeployN2.bat
@echo off
setlocal
cmd /c "UpdateN2.bat" &
cmd /c "BuildN2.bat" &
cmd /c "DeployN2.bat NoWarning" &
echo Update and Deployment Complete
```
