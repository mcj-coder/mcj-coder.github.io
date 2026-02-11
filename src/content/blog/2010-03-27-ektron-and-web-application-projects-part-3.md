---
title: "Ektron and Web Application Projects (Part 3)"
description: "Technical blog post from 2010-03-27"
pubDate: 2010-03-27
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

In this series of posts I’ve described a method of keeping your code and the required Ektron workarea separated.  This method essentially turns the ‘drop-in compiled workarea’ feature request on it’s head, by dropping your compiled code into the work area.  It’s the same result, just a slightly difference process (that you can do right now!):

     * In [Part 1](http://bit.ly/a2O6y2), I discussed why you might want to develop your website outside of the default [Ektron](http://bit.ly/d0YHh7) workarea and gave a brief overview of your options.     * In [Part 2](http://bit.ly/cntsnJ), I described how to organise the VS solution and configure IIS for use with Ektron workarea.    In this final part, I’ll describe how to combine your code with the Ektron workarea for final deployment.

  
## Leveraging the Post-Build Event
  The key to the whole process is the Post-Build Event in the ***clientproject*.Website** Web Application (see [Part 2](http://bit.ly/cntsnJ)).  We can use this to copy your compiled code into the workarea website using a set of ***xcopy*** (or similar)commands.  To edit the Post-Build event right click on the clientproject.Website project and click ‘View Properties’ it will be on the ‘Build Events’ tab.  There’s a handy editor that let’s you know the values of various ‘macros’ for your project.  These macros are resolved automatically before the commands are executed and mean you don’t have to hard code absolute locations into your project.

  [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjbgkXqTKnzoBEEwocNB7RPWteB3J0fR2p20tj1hCc34azCxTNKAmlzequKBJYp5g5eWMaahFrJTFvdzrgrY8z6nVImc2tDWtAVeTjcoNqK9P-m0LBcCh6BAlKOYFWxvdqciu5aX3z8/s1600-h/image%5B3%5D.png) 

  These should include any css or js that your templates need, an example entry into the Post-Build Event could be:

             1: "$(SolutionDir)3rd Party\Tools\CodebehindRemover\CodebehindRemover" /i="$(ProjectDir)." /o="$(SolutionDir)web\." /e="ascx,aspx,master,asmx,ascx,svc,htm,html" 

       2: xcopy "$(ProjectDir)js" "$(SolutionDir)Web\js" /E /I /R /D /C /Y

       3: xcopy "$(ProjectDir)ui" "$(SolutionDir)Web\ui" /E /I /R /D /C /Y

       4: xcopy "$(ProjectDir)video" "$(SolutionDir)Web\video" /E /I /R /D /C /Y

       5: xcopy "$(ProjectDir)Xml" "$(SolutionDir)Web\Xml" /E /I /R /D /C /Y

       6: xcopy "$(ProjectDir)Xslt" "$(SolutionDir)Web\Xslt" /E /I /R /D /C /Y 

       7:  

       8: xcopy "$(ProjectDir)App_Browsers\*.*" "$(SolutionDir)Web\App_Browsers" /I /R /D /Y

       9: xcopy "$(ProjectDir)Configs\*.config" "$(SolutionDir)Web\Configs" /I /R /D /Y

      10: xcopy "$(ProjectDir)Configs\*.config.*" "$(SolutionDir)Web\Configs" /I /R /D /Y

      11: xcopy "$(ProjectDir)bin\*.dll" "$(SolutionDir)Web\bin" /E /I /R /D /C /Y

      12: xcopy "$(ProjectDir)bin\*.pdb" "$(SolutionDir)Web\bin" /E /I /R /D /C /Y

      13: xcopy "$(ProjectDir)bin\*.xml" "$(SolutionDir)Web\bin" /E /I /R /D /C /Y

      14: xcopy "$(ProjectDir)App_GlobalResources\*.resx" "$(SolutionDir)Web\App_GlobalResources" /I /R /D /Y 

You’ll notice that I’ve not included any of the .Net UI files (aspx, ascx, asmx, ashx, etc)  within the xcopy statements.  That’s because one of the implementation differences between Web Applications and Web Sites is that WAPS refer to their codebehind file using the ***codebehind*** page directive attribute, and websites use ***codefile***.  Usually, when you compile (or precompile) a WS or WAP project those references get ignored as there’s no code file necessary.  However, when you’re trying to get ASP.Net to use a WAP aspx in a website you’ll get a compilation error.  

Fortunately, you don’t need a code file for the site to work – only for the ‘***inherits***’ attribute to be point towards your WAP page class.  So you can use a simple script/command line utility to remove any codebehind or codefile attributes as part of the Post-Build processing.  I’ve attached the source code for a basic command line application that I wrote to do this (imaginatively named *CodeBehindRemover!*) , the usage for the app is on line 1 of the code sample above.

With the post-build event in place, when you build your Web Application Project it will automatically be deployed into the vanilla workarea website.

***Tip: If your IIS is locking your website files and preventing deployment you can add ‘iisreset /stop’ into the Pre-Build event and ‘iisreset /restart’ at the end of the Post-Build event***

**Attachment: **[**Code Behind Remover**](http://bit.ly/d4rD4D)
