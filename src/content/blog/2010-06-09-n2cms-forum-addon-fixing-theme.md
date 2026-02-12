---
title: 'N2CMS Forum Addon: Fixing the Theme'
description: ''
pubDate: 2010-06-09
tags: ['n2cms']
source: hugo
originalUrl: 'https://codifice.dev/posts/2010-06-09-n2cms-forum-addon-fixing-theme/'
heroImage: ../../assets/blog/hero-images/2010-06-09-n2cms-forum-addon-fixing-theme.jpg
---

---

title: "N2CMS Forum Addon: Fixing the Theme"
date: 2010-06-09
lastmod: 2010-06-09
draft: false
comments: true
thumbnail: "/coding-gallery"
series: ["n2cms"]
authors: ["martincjarvis"]
---_My work on the VWT2OC site is on hiatus at the moment due to hosting issues so I thought I’d blog a useful fix that I’ve found._

I’ve noticed a bug with the Forum Addon.  The first page would be correctly themed but any subsequent pages were not when running against a build of the latest N2CMS.

On investigation it seems that the Forum Pages CurrentItem was resolving to null which prevented the ThemeConcern for assigning the correct theme:

```
1: namespace N2.Templates.Web
```

Looking into the N2.Templates.dll that comes the the Forum Addon, it looks like things were handled differently back in the day, with the N2.Templates.Web.ThemeModifier just using the theme for that start page:

```
1: public void Modify<T>(TemplatePage<T> page) where T: AbstractPage
```

So, the fix is to make the forum page take the theme from the start page, without affecting other page types…..tricky whilst maintaining separation of concerns…hmm.

####

The Fix
The fix has to belong with the forum addon so that the change in behaviour doesn’t knacker the standard [n2cms](http://bit.ly/aco4m4) features.  N2CMS populates the CurrentItem property based on the current url and as the Forum Plugin is generating links directly to it’s core template (/Forum/UI/Views/Forum.aspx) this is causing a problem.

Fortunately, the YAF Framework provides an extension point we can use to fix the problem yaf.IUrlBuilder.  This is a simple interface which takes the query string parameters and returns the appropriate link.

```
1: using System.Web;
```

Unfortunately, YAF doesn’t allow you to set the link builder via configuration – it has to be done programmatically.  So you’ll need to amend ‘/Forum/UI/Views/Forum.aspx’ to ensure it’s set:

```
1: namespace N2.Templates.Forum.UI.Views
```

Another possible workaround is to investigate the UrlRewriting….but this look too involved for the time available.
