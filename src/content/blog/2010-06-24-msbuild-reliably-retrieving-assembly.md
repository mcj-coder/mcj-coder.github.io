---
title: 'MSBuild: Reliably Retrieving the Assembly Version (without locking the file!)'
description: 'A custom MSBuild task that retrieves assembly version information using AssemblyName.GetAssemblyName instead of Assembly.LoadFrom to avoid file locking during builds.'
pubDate: 2010-06-24
tags: ['devops']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/06/msbuild-reliably-retrieving-assembly.html'
heroImage: ../../assets/blog/hero-images/2010-06-24-msbuild-reliably-retrieving-assembly.jpg
---

I've recently had to look at dynamically assigning an assembly version based in part on the date of compilation and the version of a compiled 3rd Party library.

This looked like a simple job for the MSBuild.ExtensionPack.Framework.Assembly task in the [MSBuild Extension Pack](http://www.msbuildextensionpack.com/). However, this had a serious downside – it locked the Assembly for the duration of the build!

Erkk.

This is the Devil Line that causes the problem:

```csharp
this.assembly = Assembly.LoadFrom(this.NetAssembly.GetMetadata("FullPath"));
```

It looks innocent enough, but it loads the assembly into the current AppDomain (MSBuild's build process) which then prevents any other process from accessing the file – even the build process itself.

Fail.

#### The Workaround

To get around this, I knocked up a quick custom MSBuild Task:

```csharp
using System;
using System.Linq;
using System.Reflection;
using Microsoft.Build.Framework;
using Microsoft.Build.Utilities;

namespace MartinOnDotNet.MSBuild.Tasks
{
    /// <summary>
    /// This task takes a four section version number 8.0.0.128 and returns an abbreviated version number
    /// based on the  first three parts (800).  This can then be used to distinguish depended versions.
    /// </summary>
    public class AbbreviateVersionTask : Task
    {

        /// <summary>
        /// Executes this instance.
        /// </summary>
        /// <returns></returns>
        public override bool Execute()
        {
#if DEBUG
            if (Properties.Settings.Default.LaunchDebugger
                && !System.Diagnostics.Debugger.IsAttached) System.Diagnostics.Debugger.Launch();
#endif
            if (AbbreviatedVersionParts <= 0 || AbbreviatedVersionParts > 4) AbbreviatedVersionParts = 3;
            AssemblyName assname = AssemblyName.GetAssemblyName(NetAssembly.GetMetadata("FullPath"));
            Version v = assname.Version;
            AssemblyVersion = v.ToString();
            string[] parts = v.ToString(AbbreviatedVersionParts).Split(new char[] { '.' }, StringSplitOptions.RemoveEmptyEntries);
            AbbreviatedVersion = string.Concat(parts.ToArray());
            Major = v.Major;
            Minor = v.Minor;
            Build = v.Build;
            Revision = v.Revision;
            return true;
        }

        /// <summary>
        /// Gets or sets the assembly version.
        /// </summary>
        /// <value>The assembly version.</value>
        [Output]
        public string AssemblyVersion { get; set; }

        /// <summary>
        /// Gets or sets the abbreviated version parts.
        /// </summary>
        /// <value>The abbreviated version parts.</value>
        public int AbbreviatedVersionParts { get; set; }

        /// <summary>
        /// Gets or sets the assembly.
        /// </summary>
        /// <value>The assembly.</value>
        [Required]
        public ITaskItem NetAssembly { get; set; }

        /// <summary>
        /// Gets or sets the abbreviated version.
        /// </summary>
        /// <value>The abbreviated version.</value>
        [Output]
        public string AbbreviatedVersion { get; set; }

        /// <summary>
        /// Gets or sets the major.
        /// </summary>
        /// <value>The major.</value>
        [Output]
        public int Major { get; set; }
        /// <summary>
        /// Gets or sets the minor.
        /// </summary>
        /// <value>The minor.</value>
        [Output]
        public int Minor { get; set; }
        /// <summary>
        /// Gets or sets the build.
        /// </summary>
        /// <value>The build.</value>
        [Output]
        public int Build { get; set; }
        /// <summary>
        /// Gets or sets the revision.
        /// </summary>
        /// <value>The revision.</value>
        [Output]
        public int Revision { get; set; }

    }
}
```

The main difference between my implementation and the MSBuild Extension Pack task is this line:

```csharp
AssemblyName assname = AssemblyName.GetAssemblyName(NetAssembly.GetMetadata("FullPath"));
```

This loads only the assembly _name_ (using static method AssemblyName.GetAssemblyName) rather than the assembly itself into memory. The MSBuild Extension Pack equivalent loads the entire assembly which in turn locks the file.

The above example makes use of the AssemblyInfo task in the MSBuild Extension Pack to explicitly set the version number for my assembly:

```xml
<!-- Register Task -->
<UsingTask AssemblyFile="..\3rd Party\MartinOnDotNet Build Tasks\MartinOnDotNet.MSBuild.Tasks.dll"
           TaskName="MartinOnDotNet.MSBuild.Tasks.AbbreviateVersionTask" />

<!-- And Now Use in Build Target -->
<Target Name="MergeVersions">
    <!-- Implementation Ommitted -->

    <MartinOnDotNet.MSBuild.Tasks.AbbreviateVersionTask NetAssembly="$(HelpersLibrary)">
        <Output TaskParameter="AssemblyVersion"
                PropertyName="HelpersAssemblyVersion" />
        <Output TaskParameter="Major"
                PropertyName="HelpersMajor" />
        <Output TaskParameter="Minor"
                PropertyName="HelpersMinor" />
        <Output TaskParameter="Build"
                PropertyName="HelpersBuild" />
        <Output TaskParameter="Revision"
                PropertyName="HelpersRevision" />
    </MartinOnDotNet.MSBuild.Tasks.AbbreviateVersionTask>
    <Message Text="Helpers Version: $(HelpersAssemblyVersion)"
             Importance="high" />
    <ItemGroup>
        <AssemblyInfoFiles Include="..\Freestyle.Helpers.Ektron\Properties\AssemblyInfo.cs"/>
    </ItemGroup>

    <Message Text="Assembly Info File: %(AssemblyInfoFiles.FullPath)"
             Importance="high" />
    <MSBuild.ExtensionPack.Framework.AssemblyInfo
        AssemblyInfoFiles="@(AssemblyInfoFiles)"
        AssemblyFileMajorVersion="$(HelpersMajor)"
        AssemblyFileMinorVersion="$(AbbreviatedVersion)"
        AssemblyFileBuildNumberType="NoIncrement"
        AssemblyFileBuildNumber="$(HelpersBuild)"
        AssemblyFileRevisionType="NoIncrement"
        AssemblyFileRevision="$(HelpersRevision)"
        AssemblyMajorVersion="$(HelpersMajor)"
        AssemblyMinorVersion="$(AbbreviatedVersion)"
        AssemblyBuildNumberType="NoIncrement"
        AssemblyBuildNumber="$(HelpersBuild)"
        AssemblyRevisionType="NoIncrement"
        AssemblyRevision="$(HelpersRevision)"
        SkipVersioning="false"/>

</Target>
```
