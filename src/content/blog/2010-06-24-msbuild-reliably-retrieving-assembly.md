---
title: 'MSBuild: Reliably Retrieving the Assembly Version (without locking the file!)'
description: ''
pubDate: 2010-06-24
tags: ['devops']
source: hugo
originalUrl: 'https://codifice.dev/posts/2010-06-24-msbuild-reliably-retrieving-assembly/'
heroImage: ../../assets/blog/hero-images/2010-06-24-msbuild-reliably-retrieving-assembly.jpg
---

I’ve recently had to look at dynamically assigning an assembly versions based in part on the date of compilation and the version of a compiled 3rd Party library.

This looked like a simple job for the MSBuild.ExtensionPack.Framework.Assembly task in the [MSBuild Extension Pack](http://bit.ly/cIia8E).  However, this had a serious downside it locked the Assembly for the duration of the build!.

Erkk.

This is the Devil Line that causes the problem:

```
{
```

It looks innocent enough, but it loads the assembly into the current AppDomain (MSBuild’s build process) which then prevents any other process from accessing the file – even the build process itself.

Fail.

#### The Workaround

To get around this, I knocked up a quick custom MSBuild Task:

```
using System.Linq;
```

The main different between my implementation and the MSBuild Extension Pack task is this line:

```
<UsingTask AssemblyFile="..\3rd Party\MartinOnDotNet Build Tasks\MartinOnDotNet.MSBuild.Tasks.dll"
```

The above example makes use the AssemblyInfo task in the MSBuild Extension Pack to explicitly set the version number for my assembly.
