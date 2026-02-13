---
title: Ektron and Web Application Projects (Part 3)
description: 'How to use Post-Build Events to deploy your compiled Web Application Project code into the Ektron workarea, including a CodeBehindRemover utility to fix page directive compatibility.'
pubDate: 2010-03-27
updatedDate: 2010-03-29
heroImage: ../../assets/blog/hero-images/2010-03-27-ektron-compiled-workarea-workaround.jpg
tags: ['ektron']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/03/ektron-compiled-workarea-workaround.html'
---

In this series of posts I've described a method of keeping your code and the required Ektron workarea separated. This method essentially turns the 'drop-in compiled workarea' feature request on its head, by dropping your compiled code into the work area. It's the same result, just a slightly different process (that you can do right now!):

- In [Part 1](/blog/2010-03-22-working-with-ektron-using-web), I discussed why you might want to develop your website outside of the default [Ektron](http://www.ektron.com/) workarea and gave a brief overview of your options.
- In Part 2, I described how to organise the VS solution and configure IIS for use with Ektron workarea.

In this final part, I'll describe how to combine your code with the Ektron workarea for final deployment.

#### Leveraging the Post-Build Event

The key to the whole process is the Post-Build Event in the **_clientproject_.Website** Web Application (see Part 2). We can use this to copy your compiled code into the workarea website using a set of **_xcopy_** (or similar) commands. To edit the Post-Build event right click on the clientproject.Website project and click 'View Properties' it will be on the 'Build Events' tab. There's a handy editor that lets you know the values of various 'macros' for your project. These macros are resolved automatically before the commands are executed and mean you don't have to hard code absolute locations into your project.

![Post-Build Event editor in Visual Studio](../../assets/blog/2010-03-27-ektron-compiled-workarea-workaround-post-build.png)

These should include any css or js that your templates need, an example entry into the Post-Build Event could be:

```batch
xcopy "$(ProjectDir)js" "$(SolutionDir)Web\js" /E /I /R /D /C /Y
```

You'll notice that I've not included any of the .Net UI files (aspx, ascx, asmx, ashx, etc) within the xcopy statements. That's because one of the implementation differences between Web Applications and Web Sites is that WAPs refer to their codebehind file using the **_codebehind_** page directive attribute, and websites use **_codefile_**. Usually, when you compile (or precompile) a WS or WAP project those references get ignored as there's no code file necessary. However, when you're trying to get ASP.Net to use a WAP aspx in a website you'll get a compilation error.

Fortunately, you don't need a code file for the site to work – only for the '**_inherits_**' attribute to point towards your WAP page class. So you can use a simple script/command line utility to remove any codebehind or codefile attributes as part of the Post-Build processing. I've attached the source code for a basic command line application that I wrote to do this (imaginatively named _CodeBehindRemover!_), the usage for the app is on line 1 of the code sample above.

With the post-build event in place, when you build your Web Application Project it will automatically be deployed into the vanilla workarea website.

**_Tip: If your IIS is locking your website files and preventing deployment you can add 'iisreset /stop' into the Pre-Build event and 'iisreset /restart' at the end of the Post-Build event_**

[Download the Code Behind Remover source code](/downloads/2010-03-27-ektron-compiled-workarea-workaround/CodeBehindRemover.zip)
