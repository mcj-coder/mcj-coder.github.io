---
title: "Performance: Applying Output Cache Policies to a User Controls"
description: ""
pubDate: 2010-11-03
tags: ["performance"]
source: hugo
originalUrl: "https://codifice.dev/posts/2010-11-03-performance-applying-output-cache/"
heroImage: ../../assets/blog/hero-images/2010-11-03-performance-applying-output-cache.jpg
---

One of the great features in ASP.NET is the rich caching framework.  I particularly like being able to:

     * Define caching policies in the configuration file and then assigning those policies to groups of pages (via the @@OutputCache directive). 
    * Cache User Control output for reuse on multiple pages (Partial Page Caching) 
   What I** don’t** like is the fact that you can’t combine the two!  You have to hard code your user control cache directives either in the mark-up (as @@OutputCache directive) or by applying an attribute (System.Web.UI.PartialCaching) to the code behind, both of which require at least the duration to be hardcoded.

  This is a massive oversight, as best-practise ASP.Net dictates precompiling websites prior to production which means caching rules can’t be tweaked without frequent rebuild/deployment cycles.

  Fortunately, we can work around the issue!

  As with most of my workarounds, the trick is a new Extension Method to dynamically alter the UserControls Cache Policy:

  
```
using System.Linq;
```

To use it each user control will need to have a line added to the OnInit override in the codebehind (*.ascx.cs):

```
using MartinOnDotNet.Helpers.UI;
```

The ascx file will need a place holder @@outputcache directive:

```
Inherits="MartinOnDotNet.Helpers.BrandingDemo.CacheExample" %>
```

The values in the directive act as defaults and will be overridden by parameters in the matching Cache Policy (Test, in the code above), apart from Shared which isn’t included in the config.

Finally, define you cache policy in the web.config file:

```
<caching>
```

The varyByCustom attribute in the rule above refers to some custom code in the Global.asax using the GetVaryByCustomString method.  In this case the code will vary by the current date in the given format making the cached version of the control rollover every minute.  This is a bit wasteful, as the cache will hang on to each version of the control for 3600 seconds (an hour) but proves the principle works.

Happily, the outputCacheSettings element of the web.config file supports configSource so you can actually apply different profiles for different environments by using an external config file.

Happy Caching!