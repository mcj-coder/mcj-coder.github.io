---
title: "Performance: Applying Output Cache Policies to a User Controls"
description: "Technical blog post from 2010-11-03"
pubDate: 2010-11-03
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

One of the great features in ASP.NET is the rich caching framework.  I particularly like being able to:

     * Define caching policies in the configuration file and then assigning those policies to groups of pages (via the @[OutputCache](http://bit.ly/9q3hVI) directive).     * Cache User Control output for reuse on multiple pages ([Partial Page Caching](http://bit.ly/93fUZ3))    What I** don’t** like is the fact that you can’t combine the two!  You have to hard code your user control cache directives either in the mark-up (as @OutputCache directive) or by applying an attribute (System.Web.UI.PartialCaching) to the code behind, both of which require at least the duration to be hardcoded.

  This is a massive oversight, as best-practise ASP.Net dictates precompiling websites prior to production which means caching rules can’t be tweaked without frequent rebuild/deployment cycles.

  Fortunately, we can work around the issue!

  As with most of my workarounds, the trick is a new Extension Method to dynamically alter the UserControls Cache Policy:

```csharp
using System;
```

```csharp
using System.Linq;
```

```csharp
using System.Web.Configuration;
```

```csharp
using System.Web.UI;
```

```csharp



```csharp



```csharp
namespace MartinOnDotNet.Helpers.UI
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// Useful extension methods for Controls
```

```csharp
/// 
```

```csharp
public static class ControlExtensions
```

```csharp
{
```

```csharp



```csharp



```csharp
private static OutputCacheSettingsSection _outputCacheSettings = ((OutputCacheSettingsSection)WebConfigurationManager.GetSection(@"system.web/caching/outputCacheSettings"));
```

```csharp



```csharp
/// 
```

```csharp
/// Applies the cache policy.
```

```csharp
/// 
```

```csharp
/// The control.
```

```csharp
/// Name of the cache policy.
```

```csharp
public static void ApplyCachePolicy(this UserControl control, string cachePolicyName)
```

```csharp
{
```

```csharp
if (control == null) throw new ArgumentNullException("control");
```

```csharp
if (string.IsNullOrEmpty(cachePolicyName)) throw new ArgumentNullException("cachePolicyName");
```

```csharp
if (_outputCacheSettings == null) return;
```

```csharp
OutputCacheProfile profile = _outputCacheSettings.OutputCacheProfiles.OfType()
```

```csharp
.Where(p => string.Equals(p.Name, cachePolicyName, StringComparison.OrdinalIgnoreCase))
```

```csharp
.FirstOrDefault();
```

```csharp
if (profile == null || !profile.Enabled) return;
```

```csharp
control.CachePolicy.SetExpires(DateTime.Now.AddSeconds(profile.Duration));
```

```csharp
if (!string.Equals(profile.VaryByParam, "none", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(profile.VaryByParam))
```

```csharp
foreach (string key in profile.VaryByParam.Split(new char[]{';'},  StringSplitOptions.RemoveEmptyEntries))
```

```csharp
control.CachePolicy.VaryByParams[key] = true;
```

```csharp
else
```

```csharp
control.CachePolicy.VaryByParams.IgnoreParams = true;
```

```csharp
if (!string.IsNullOrEmpty(profile.VaryByCustom)) control.CachePolicy.SetVaryByCustom(profile.VaryByCustom);
```

```csharp
if (!string.IsNullOrEmpty(profile.VaryByControl)) control.CachePolicy.SetVaryByCustom(profile.VaryByControl);
```

```csharp



```csharp



```csharp
}
```

```csharp



```csharp
}
```

```csharp
}
```

To use it each user control will need to have a line added to the OnInit override in the codebehind (*.ascx.cs):

  
```csharp
using System;
```

```csharp
using MartinOnDotNet.Helpers.UI;
```

```csharp



```csharp
namespace MartinOnDotNet.Helpers.BrandingDemo
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// Example of a cached usercontrol
```

```csharp
/// 
```

```csharp
public partial class CacheExample : System.Web.UI.UserControl
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// Raises the  event.
```

```csharp
/// 
```

```csharp
/// An  object that contains the event data.
```

```csharp
protected override void OnInit(EventArgs e)
```

```csharp
{
```

```csharp
base.OnInit(e);
```

```csharp
if (this.CachePolicy.SupportsCaching)
```

```csharp
this.ApplyCachePolicy("Test");
```

```csharp
}
```

```csharp



```csharp
}
```

```csharp
}
```

The ascx file will need a place holder @outputcache directive:

  
```csharp



```csharp
Inherits="MartinOnDotNet.Helpers.BrandingDemo.CacheExample" %>
```

```csharp



```csharp



```csharp



```csharp
"G") %>
```

The values in the directive act as defaults and will be overridden by parameters in the matching Cache Policy (Test, in the code above), apart from Shared which isn’t included in the config.

Finally, define you cache policy in the web.config file:

  
```csharp
system.web>
```

```csharp
caching>
```

```csharp
outputCacheSettings>
```

```csharp
outputCacheProfiles>
```

```csharp
add name="Test"
```

```csharp
duration="3600"
```

```csharp
varyByParam="none" varyByCustom="DATE:yyyyMMddHHmm"/>
```

```csharp
outputCacheProfiles>
```

```csharp
outputCacheSettings>
```

```csharp
caching>
```

```csharp
system.web>
```

The varyByCustom attribute in the rule above refers to some custom code in the Global.asax using the GetVaryByCustomString method.  In this case the code will vary by the current date in the given format making the cached version of the control rollover every minute.  This is a bit wasteful, as the cache will hang on to each version of the control for 3600 seconds (an hour) but proves the principle works.

Happily, the outputCacheSettings element of the web.config file supports configSource so you can actually apply different profiles for different environments by using an external config file.

Happy Caching!
