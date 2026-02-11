---
title: "MSBuild: Reliably Retrieving the Assembly Version (without locking the file!)"
description: "Technical blog post from 2010-06-24"
pubDate: 2010-06-24
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

I’ve recently had to look at dynamically assigning an assembly versions based in part on the date of compilation and the version of a compiled 3rd Party library.

  This looked like a simple job for the [MSBuild.ExtensionPack.Framework.Assembly](http://bit.ly/9dcRAq) task in the [MSBuild Extension Pack](http://bit.ly/cIia8E).  However, this had a serious downside it locked the Assembly for the duration of the build!.  

  Erkk.

  This is the Devil Line that causes the problem:

```csharp
protected override void InternalExecute()
```

```csharp
{
```

```csharp
// Implementation ommitted
```

```csharp
this.assembly = Assembly.LoadFrom(this.NetAssembly.GetMetadata("FullPath"));
```

```csharp
// Implementation ommitted
```

```csharp
}
```

```csharp
/* Taken From MSBuild.ExtensionPack.Framework.Assembly using Reflector
```

```csharp
protected override void InternalExecute();
```

```csharp



```csharp
Declaring Type: MSBuild.ExtensionPack.Framework.Assembly 
```

```csharp
Assembly: MSBuild.ExtensionPack, Version=3.5.0.0 
```

```csharp
*/
```

It looks innocent enough, but it loads the assembly into the current AppDomain (MSBuild’s build process) which then prevents any other process from accessing the file – even the build process itself.  

Fail.

## The Workaround

To get around this, I knocked up a quick custom MSBuild Task:

  
```csharp
using System;
```

```csharp
using System.Linq;
```

```csharp
using System.Reflection;
```

```csharp
using Microsoft.Build.Framework;
```

```csharp
using Microsoft.Build.Utilities;
```

```csharp



```csharp
namespace MartinOnDotNet.MSBuild.Tasks
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// This task takes a four section version number 8.0.0.128 and returns an abbreviated version number
```

```csharp
/// based on the  first three parts (800).  This can then be used to distinguish depended versions.
```

```csharp
/// 
```

```csharp
public class AbbreviateVersionTask : Task
```

```csharp
{
```

```csharp



```csharp
/// 
```

```csharp
/// Executes this instance.
```

```csharp
/// 
```

```csharp
/// 
```

```csharp
public override bool Execute()
```

```csharp
{
```

```csharp
#if DEBUG
```

```csharp
if (Properties.Settings.Default.LaunchDebugger
```

```csharp
&& !System.Diagnostics.Debugger.IsAttached) System.Diagnostics.Debugger.Launch();
```

```csharp
#endif
```

```csharp
if (AbbreviatedVersionParts  4) AbbreviatedVersionParts = 3;
```

```csharp
AssemblyName assname = AssemblyName.GetAssemblyName(NetAssembly.GetMetadata("FullPath"));
```

```csharp
Version v = assname.Version;
```

```csharp
AssemblyVersion = v.ToString();
```

```csharp
string[] parts = v.ToString(AbbreviatedVersionParts).Split(new char[] { '.' }, StringSplitOptions.RemoveEmptyEntries);
```

```csharp
AbbreviatedVersion = string.Concat(parts.ToArray());
```

```csharp
Major = v.Major;
```

```csharp
Minor = v.Minor;
```

```csharp
Build = v.Build;
```

```csharp
Revision = v.Revision;
```

```csharp
return true;
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Gets or sets the assembly version.
```

```csharp
/// 
```

```csharp
/// The assembly version.
```

```csharp
[Output]
```

```csharp
public string AssemblyVersion { get; set; }
```

```csharp



```csharp
/// 
```

```csharp
/// Gets or sets the abbreviated version pats.
```

```csharp
/// 
```

```csharp
/// The abbreviated version pats.
```

```csharp
public int AbbreviatedVersionParts { get; set; }
```

```csharp



```csharp
/// 
```

```csharp
/// Gets or sets the assembly.
```

```csharp
/// 
```

```csharp
/// The assembly.
```

```csharp
[Required]
```

```csharp
public ITaskItem NetAssembly { get; set; }
```

```csharp



```csharp
/// 
```

```csharp
/// Gets or sets the abbreviated version.
```

```csharp
/// 
```

```csharp
/// The abbreviated version.
```

```csharp
[Output]
```

```csharp
public string AbbreviatedVersion { get; set; }
```

```csharp



```csharp
/// 
```

```csharp
/// Gets or sets the major.
```

```csharp
/// 
```

```csharp
/// The major.
```

```csharp
[Output]
```

```csharp
public int Major { get; set; }
```

```csharp
/// 
```

```csharp
/// Gets or sets the minor.
```

```csharp
/// 
```

```csharp
/// The minor.
```

```csharp
[Output]
```

```csharp
public int Minor { get; set; }
```

```csharp
/// 
```

```csharp
/// Gets or sets the build.
```

```csharp
/// 
```

```csharp
/// The build.
```

```csharp
[Output]
```

```csharp
public int Build { get; set; }
```

```csharp
/// 
```

```csharp
/// Gets or sets the revision.
```

```csharp
/// 
```

```csharp
/// The revision.
```

```csharp
[Output]
```

```csharp
public int Revision { get; set; }
```

```csharp



```csharp



```csharp
}
```

```csharp
}
```

The main different between my implementation and the MSBuild Extension Pack task is this line:

  
```csharp
AssemblyName assname = AssemblyName.GetAssemblyName(NetAssembly.GetMetadata("FullPath"));
```

This line retrieves the assemblies name object (version, public key, etc, etc) without actually loading the assembly into the AppDomain, hence – no locking!  Sweet.

This can now be referenced in your build scripts, like so:

  
```csharp



```csharp
UsingTask AssemblyFile="..\3rd Party\MartinOnDotNet Build Tasks\MartinOnDotNet.MSBuild.Tasks.dll"
```

```csharp
TaskName="MartinOnDotNet.MSBuild.Tasks.AbbreviateVersionTask" />
```

```csharp



```csharp



```csharp
Target Name="MergeVersions">
```

```csharp



```csharp



```csharp
MartinOnDotNet.MSBuild.Tasks.AbbreviateVersionTask NetAssembly="$(HelpersLibrary)">
```

```csharp
Output TaskParameter="AssemblyVersion"
```

```csharp
PropertyName="HelpersAssemblyVersion" />
```

```csharp
Output TaskParameter="Major"
```

```csharp
PropertyName="HelpersMajor" />
```

```csharp
Output TaskParameter="Major"
```

```csharp
PropertyName="HelpersMajor" />
```

```csharp
Output TaskParameter="Minor"
```

```csharp
PropertyName="HelpersMinor" />
```

```csharp
Output TaskParameter="Build"
```

```csharp
PropertyName="HelpersBuild" />
```

```csharp
Output TaskParameter="Revision"
```

```csharp
PropertyName="HelpersRevision" />
```

```csharp
MartinOnDotNet.MSBuild.Tasks.AbbreviateVersionTask>
```

```csharp
Message Text="Helpers Version: $(HelpersAssemblyVersion)"
```

```csharp
Importance="high" />
```

```csharp
ItemGroup>
```

```csharp
AssemblyInfoFiles Include="..\Freestyle.Helpers.Ektron\Properties\AssemblyInfo.cs"/>
```

```csharp
ItemGroup>
```

```csharp



```csharp
Message Text="Assembly Info File: %(AssemblyInfoFiles.FullPath)"
```

```csharp
Importance="high" />
```

```csharp
MSBuild.ExtensionPack.Framework.AssemblyInfo AssemblyInfoFiles="@(AssemblyInfoFiles)"
```

```csharp
AssemblyFileMajorVersion="$(HelpersMajor)"
```

```csharp
AssemblyFileMinorVersion="$(AbbreviatedVersion)"
```

```csharp
AssemblyFileBuildNumberType="NoIncrement"
```

```csharp
AssemblyFileBuildNumber="$(HelpersBuild)"
```

```csharp
AssemblyFileRevisionType="NoIncrement"
```

```csharp
AssemblyFileRevision="$(HelpersRevision)"
```

```csharp
AssemblyMajorVersion="$(HelpersMajor)"
```

```csharp
AssemblyMinorVersion="$(AbbreviatedVersion)"
```

```csharp
AssemblyBuildNumberType="NoIncrement"
```

```csharp
AssemblyBuildNumber="$(HelpersBuild)"
```

```csharp
AssemblyRevisionType="NoIncrement"
```

```csharp
AssemblyRevision="$(HelpersRevision)"
```

```csharp
SkipVersioning="false"/>
```

```csharp



```csharp
target>
```

The above example makes use the AssemblyInfo task in the MSBuild Extension Pack to explicitly set the version number for my assembly.
