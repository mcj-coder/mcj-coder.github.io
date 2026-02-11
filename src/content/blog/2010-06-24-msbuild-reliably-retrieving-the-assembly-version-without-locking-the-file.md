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

             1: protected override void InternalExecute()

       2: {

       3:     // Implementation ommitted

       4:     this.assembly = Assembly.LoadFrom(this.NetAssembly.GetMetadata("FullPath"));

       5:     // Implementation ommitted

       6: }

       7: /* Taken From MSBuild.ExtensionPack.Framework.Assembly using Reflector

       8: protected override void InternalExecute();

       9:  

      10: Declaring Type: MSBuild.ExtensionPack.Framework.Assembly 

      11: Assembly: MSBuild.ExtensionPack, Version=3.5.0.0 

      12: */

It looks innocent enough, but it loads the assembly into the current AppDomain (MSBuild’s build process) which then prevents any other process from accessing the file – even the build process itself.  

Fail.

## The Workaround

To get around this, I knocked up a quick custom MSBuild Task:

  
       1: using System;

       2: using System.Linq;

       3: using System.Reflection;

       4: using Microsoft.Build.Framework;

       5: using Microsoft.Build.Utilities;

       6:  

       7: namespace MartinOnDotNet.MSBuild.Tasks

       8: {

       9:     /// 

      10:     /// This task takes a four section version number 8.0.0.128 and returns an abbreviated version number

      11:     /// based on the  first three parts (800).  This can then be used to distinguish depended versions.

      12:     /// 

      13:     public class AbbreviateVersionTask : Task

      14:     {

      15:  

      16:         /// 

      17:         /// Executes this instance.

      18:         /// 

      19:         /// 

      20:         public override bool Execute()

      21:         {

      22: #if DEBUG

      23:             if (Properties.Settings.Default.LaunchDebugger

      24:                 && !System.Diagnostics.Debugger.IsAttached) System.Diagnostics.Debugger.Launch();

      25: #endif

      26:             if (AbbreviatedVersionParts  4) AbbreviatedVersionParts = 3;

      27:             AssemblyName assname = AssemblyName.GetAssemblyName(NetAssembly.GetMetadata("FullPath"));

      28:             Version v = assname.Version;

      29:             AssemblyVersion = v.ToString();

      30:             string[] parts = v.ToString(AbbreviatedVersionParts).Split(new char[] { '.' }, StringSplitOptions.RemoveEmptyEntries);

      31:             AbbreviatedVersion = string.Concat(parts.ToArray());

      32:             Major = v.Major;

      33:             Minor = v.Minor;

      34:             Build = v.Build;

      35:             Revision = v.Revision;

      36:             return true;

      37:         }

      38:  

      39:         /// 

      40:         /// Gets or sets the assembly version.

      41:         /// 

      42:         /// The assembly version.

      43:         [Output]

      44:         public string AssemblyVersion { get; set; }

      45:  

      46:         /// 

      47:         /// Gets or sets the abbreviated version pats.

      48:         /// 

      49:         /// The abbreviated version pats.

      50:         public int AbbreviatedVersionParts { get; set; }

      51:  

      52:         /// 

      53:         /// Gets or sets the assembly.

      54:         /// 

      55:         /// The assembly.

      56:         [Required]

      57:         public ITaskItem NetAssembly { get; set; }

      58:  

      59:         /// 

      60:         /// Gets or sets the abbreviated version.

      61:         /// 

      62:         /// The abbreviated version.

      63:         [Output]

      64:         public string AbbreviatedVersion { get; set; }

      65:  

      66:         /// 

      67:         /// Gets or sets the major.

      68:         /// 

      69:         /// The major.

      70:         [Output]

      71:         public int Major { get; set; }

      72:         /// 

      73:         /// Gets or sets the minor.

      74:         /// 

      75:         /// The minor.

      76:         [Output]

      77:         public int Minor { get; set; }

      78:         /// 

      79:         /// Gets or sets the build.

      80:         /// 

      81:         /// The build.

      82:         [Output]

      83:         public int Build { get; set; }

      84:         /// 

      85:         /// Gets or sets the revision.

      86:         /// 

      87:         /// The revision.

      88:         [Output]

      89:         public int Revision { get; set; }

      90:  

      91:  

      92:     }

      93: }

The main different between my implementation and the MSBuild Extension Pack task is this line:

  
       1: AssemblyName assname = AssemblyName.GetAssemblyName(NetAssembly.GetMetadata("FullPath"));

This line retrieves the assemblies name object (version, public key, etc, etc) without actually loading the assembly into the AppDomain, hence – no locking!  Sweet.

This can now be referenced in your build scripts, like so:

  
       1: 

       2: UsingTask AssemblyFile="..\3rd Party\MartinOnDotNet Build Tasks\MartinOnDotNet.MSBuild.Tasks.dll"

       3:                      TaskName="MartinOnDotNet.MSBuild.Tasks.AbbreviateVersionTask" />

       4:  

       5: 

       6: Target Name="MergeVersions">

       7:     

       8:     

       9:     MartinOnDotNet.MSBuild.Tasks.AbbreviateVersionTask NetAssembly="$(HelpersLibrary)">

      10:         Output TaskParameter="AssemblyVersion"

      11:                         PropertyName="HelpersAssemblyVersion" />

      12:         Output TaskParameter="Major"

      13:                         PropertyName="HelpersMajor" />

      14:         Output TaskParameter="Major"

      15:                         PropertyName="HelpersMajor" />

      16:         Output TaskParameter="Minor"

      17:                         PropertyName="HelpersMinor" />

      18:         Output TaskParameter="Build"

      19:                         PropertyName="HelpersBuild" />

      20:         Output TaskParameter="Revision"

      21:                         PropertyName="HelpersRevision" />

      22:     MartinOnDotNet.MSBuild.Tasks.AbbreviateVersionTask>

      23:     Message Text="Helpers Version: $(HelpersAssemblyVersion)"

      24:                      Importance="high" />

      25:     ItemGroup>

      26:         AssemblyInfoFiles Include="..\Freestyle.Helpers.Ektron\Properties\AssemblyInfo.cs"/>

      27:     ItemGroup>

      28:     

      29:     Message Text="Assembly Info File: %(AssemblyInfoFiles.FullPath)"

      30:                      Importance="high" />

      31:     MSBuild.ExtensionPack.Framework.AssemblyInfo AssemblyInfoFiles="@(AssemblyInfoFiles)"

      32:                                                                                                 AssemblyFileMajorVersion="$(HelpersMajor)"

      33:                                                                                                 AssemblyFileMinorVersion="$(AbbreviatedVersion)"

      34:                                                                                                 AssemblyFileBuildNumberType="NoIncrement"

      35:                                                                                                 AssemblyFileBuildNumber="$(HelpersBuild)"

      36:                                                                                                 AssemblyFileRevisionType="NoIncrement"

      37:                                                                                                 AssemblyFileRevision="$(HelpersRevision)"

      38:                                                                                                 AssemblyMajorVersion="$(HelpersMajor)"

      39:                                                                                                 AssemblyMinorVersion="$(AbbreviatedVersion)"

      40:                                                                                                 AssemblyBuildNumberType="NoIncrement"

      41:                                                                                                 AssemblyBuildNumber="$(HelpersBuild)"

      42:                                                                                                 AssemblyRevisionType="NoIncrement"

      43:                                                                                                 AssemblyRevision="$(HelpersRevision)"

      44:                                                                                                 SkipVersioning="false"/>

      45:     

      46: target>

The above example makes use the AssemblyInfo task in the MSBuild Extension Pack to explicitly set the version number for my assembly.
