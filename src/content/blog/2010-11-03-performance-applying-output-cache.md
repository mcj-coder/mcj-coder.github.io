---
title: 'Performance: Applying Output Cache Policies to User Controls'
description: 'An extension method to dynamically apply web.config OutputCacheProfile settings to ASP.NET User Controls, enabling environment-specific caching without recompilation.'
pubDate: 2010-11-03
tags: ['performance']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/11/performance-applying-output-cache.html'
heroImage: ../../assets/blog/hero-images/2010-11-03-performance-applying-output-cache.jpg
---

One of the great features in ASP.NET is the rich caching framework. I particularly like being able to:

- Define caching policies in the configuration file and then assigning those policies to groups of pages (via the @OutputCache directive).
- Cache User Control output for reuse on multiple pages (Partial Page Caching)

What I **don't** like is the fact that you can't combine the two! You have to hard code your user control cache directives either in the mark-up (as @OutputCache directive) or by applying an attribute (System.Web.UI.PartialCaching) to the code behind, both of which require at least the duration to be hardcoded.

This is a massive oversight, as best-practise ASP.Net dictates precompiling websites prior to production which means caching rules can't be tweaked without frequent rebuild/deployment cycles.

Fortunately, we can work around the issue!

As with most of my workarounds, the trick is a new Extension Method to dynamically alter the UserControl's Cache Policy:

```csharp
using System;
using System.Linq;
using System.Web.Configuration;
using System.Web.UI;

namespace MartinOnDotNet.Helpers.UI
{
    /// <summary>
    /// Useful extension methods for Controls
    /// </summary>
    public static class ControlExtensions
    {
        private static OutputCacheSettingsSection _outputCacheSettings =
            ((OutputCacheSettingsSection)WebConfigurationManager.GetSection(
                @"system.web/caching/outputCacheSettings"));

        /// <summary>
        /// Applies the cache policy.
        /// </summary>
        /// <param name="control">The control.</param>
        /// <param name="cachePolicyName">Name of the cache policy.</param>
        public static void ApplyCachePolicy(this UserControl control,
            string cachePolicyName)
        {
            if (control == null) throw new ArgumentNullException("control");
            if (string.IsNullOrEmpty(cachePolicyName))
                throw new ArgumentNullException("cachePolicyName");
            if (_outputCacheSettings == null) return;

            OutputCacheProfile profile = _outputCacheSettings
                .OutputCacheProfiles.OfType<OutputCacheProfile>()
                .Where(p => string.Equals(p.Name, cachePolicyName,
                    StringComparison.OrdinalIgnoreCase))
                .FirstOrDefault();

            if (profile == null || !profile.Enabled) return;

            control.CachePolicy.SetExpires(
                DateTime.Now.AddSeconds(profile.Duration));

            if (!string.Equals(profile.VaryByParam, "none",
                StringComparison.OrdinalIgnoreCase) &&
                !string.IsNullOrEmpty(profile.VaryByParam))
                foreach (string key in profile.VaryByParam.Split(
                    new char[]{';'}, StringSplitOptions.RemoveEmptyEntries))
                    control.CachePolicy.VaryByParams[key] = true;
            else
                control.CachePolicy.VaryByParams.IgnoreParams = true;

            if (!string.IsNullOrEmpty(profile.VaryByCustom))
                control.CachePolicy.SetVaryByCustom(profile.VaryByCustom);
            if (!string.IsNullOrEmpty(profile.VaryByControl))
                control.CachePolicy.SetVaryByCustom(profile.VaryByControl);
        }
    }
}
```

To use it each user control will need to have a line added to the OnInit override in the code-behind (\*.ascx.cs):

```csharp
using System;
using MartinOnDotNet.Helpers.UI;

namespace MartinOnDotNet.Helpers.BrandingDemo
{
    /// <summary>
    /// Example of a cached usercontrol
    /// </summary>
    public partial class CacheExample : System.Web.UI.UserControl
    {
        /// <summary>
        /// Raises the <see cref="E:System.Web.UI.Control.Init"/> event.
        /// </summary>
        /// <param name="e">An <see cref="T:System.EventArgs"/> object that
        /// contains the event data.</param>
        protected override void OnInit(EventArgs e)
        {
            base.OnInit(e);
            if (this.CachePolicy.SupportsCaching)
                this.ApplyCachePolicy("Test");
        }
    }
}
```

The ascx file will need a placeholder @OutputCache directive:

```aspx-cs
<%@ Control Language="C#" AutoEventWireup="true"
    CodeBehind="CacheExample.ascx.cs"
    Inherits="MartinOnDotNet.Helpers.BrandingDemo.CacheExample" %>

<%@ OutputCache Duration="1" VaryByParam="none" Shared="true" %>

<% = DateTime.Now.ToString("G") %>
```

The values in the directive act as defaults and will be overridden by parameters in the matching Cache Policy (Test, in the code above), apart from Shared which isn't included in the config.

Finally, define your cache policy in the web.config file:

```xml
<system.web>
    <caching>
        <outputCacheSettings>
            <outputCacheProfiles>
                <add name="Test"
                     duration="3600"
                     varyByParam="none"
                     varyByCustom="DATE:yyyyMMddHHmm"/>
            </outputCacheProfiles>
        </outputCacheSettings>
    </caching>
</system.web>
```

The varyByCustom attribute in the rule above refers to some custom code in the Global.asax using the GetVaryByCustomString method. In this case the code will vary by the current date in the given format making the cached version of the control roll over every minute. This is a bit wasteful, as the cache will hang on to each version of the control for 3600 seconds (an hour) but proves the principle works.

Happily, the outputCacheSettings element of the web.config file supports configSource so you can actually apply different profiles for different environments by using an external config file.

Happy Caching!
