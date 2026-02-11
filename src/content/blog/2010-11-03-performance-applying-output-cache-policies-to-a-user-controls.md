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

             1: using System;

       2: using System.Linq;

       3: using System.Web.Configuration;

       4: using System.Web.UI;

       5:  

       6:  

       7: namespace MartinOnDotNet.Helpers.UI

       8: {

       9:     /// 

      10:     /// Useful extension methods for Controls

      11:     /// 

      12:     public static class ControlExtensions

      13:     {

      14:  

      15:  

      16:         private static OutputCacheSettingsSection _outputCacheSettings = ((OutputCacheSettingsSection)WebConfigurationManager.GetSection(@"system.web/caching/outputCacheSettings"));

      17:  

      18:         /// 

      19:         /// Applies the cache policy.

      20:         /// 

      21:         /// The control.

      22:         /// Name of the cache policy.

      23:         public static void ApplyCachePolicy(this UserControl control, string cachePolicyName)

      24:         {

      25:             if (control == null) throw new ArgumentNullException("control");

      26:             if (string.IsNullOrEmpty(cachePolicyName)) throw new ArgumentNullException("cachePolicyName");

      27:             if (_outputCacheSettings == null) return;

      28:             OutputCacheProfile profile = _outputCacheSettings.OutputCacheProfiles.OfType()

      29:                 .Where(p => string.Equals(p.Name, cachePolicyName, StringComparison.OrdinalIgnoreCase))

      30:                 .FirstOrDefault();

      31:             if (profile == null || !profile.Enabled) return;

      32:             control.CachePolicy.SetExpires(DateTime.Now.AddSeconds(profile.Duration));

      33:             if (!string.Equals(profile.VaryByParam, "none", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(profile.VaryByParam))

      34:                 foreach (string key in profile.VaryByParam.Split(new char[]{';'},  StringSplitOptions.RemoveEmptyEntries))

      35:                     control.CachePolicy.VaryByParams[key] = true;

      36:             else

      37:                 control.CachePolicy.VaryByParams.IgnoreParams = true;

      38:             if (!string.IsNullOrEmpty(profile.VaryByCustom)) control.CachePolicy.SetVaryByCustom(profile.VaryByCustom);

      39:             if (!string.IsNullOrEmpty(profile.VaryByControl)) control.CachePolicy.SetVaryByCustom(profile.VaryByControl);

      40:  

      41:  

      42:         }

      43:  

      44:     }

      45: }

To use it each user control will need to have a line added to the OnInit override in the codebehind (*.ascx.cs):

  
       1: using System;

       2: using MartinOnDotNet.Helpers.UI;

       3:  

       4: namespace MartinOnDotNet.Helpers.BrandingDemo

       5: {

       6:     /// 

       7:     /// Example of a cached usercontrol

       8:     /// 

       9:     public partial class CacheExample : System.Web.UI.UserControl

      10:     {

      11:         /// 

      12:         /// Raises the  event.

      13:         /// 

      14:         /// An  object that contains the event data.

      15:         protected override void OnInit(EventArgs e)

      16:         {

      17:             base.OnInit(e);

      18:             if (this.CachePolicy.SupportsCaching)

      19:                 this.ApplyCachePolicy("Test");

      20:         }

      21:    

      22:     }

      23: }

The ascx file will need a place holder @outputcache directive:

  
       1: 

       2:     Inherits="MartinOnDotNet.Helpers.BrandingDemo.CacheExample" %>

       3:  

       4: 

       5:  

       6: "G") %>

The values in the directive act as defaults and will be overridden by parameters in the matching Cache Policy (Test, in the code above), apart from Shared which isn’t included in the config.

Finally, define you cache policy in the web.config file:

  
       1: system.web>

       2:     caching>

       3:         outputCacheSettings>

       4:             outputCacheProfiles>

       5:                 add name="Test"

       6:                          duration="3600"

       7:                          varyByParam="none" varyByCustom="DATE:yyyyMMddHHmm"/>

       8:             outputCacheProfiles>

       9:         outputCacheSettings>

      10:     caching>

      11: system.web>

The varyByCustom attribute in the rule above refers to some custom code in the Global.asax using the GetVaryByCustomString method.  In this case the code will vary by the current date in the given format making the cached version of the control rollover every minute.  This is a bit wasteful, as the cache will hang on to each version of the control for 3600 seconds (an hour) but proves the principle works.

Happily, the outputCacheSettings element of the web.config file supports configSource so you can actually apply different profiles for different environments by using an external config file.

Happy Caching!
