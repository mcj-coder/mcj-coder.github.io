---
title: Using MbUnit StaticTestFactory to Validate Sitemap.xml Links
description: ''
pubDate: 2010-05-05
tags: ['ektron']
source: hugo
originalUrl: 'https://codifice.dev/posts/2010-05-05-using-mbunit-statictestfactory-to/'
heroImage: ../../assets/blog/hero-images/2010-05-05-using-mbunit-statictestfactory-to.jpg
---

I’ve been investigating a replacement for our current link checker (SEO Optimization Toolkit) to be run automatically as part of our build so that we can get a quick heads up if one of our dynamic pages breaks.  The problem is that as most of our sites are built with Ektron there’s a lot of potential for a combination of content and code to break individual pages that share a template with working pages.

As these pages are data driven hard coding tests is very timely and very fragile.  Fortunately, most of our Ektron sites have automatically generated sitemap.xml which gives us a neat list of urls to test which is where MbUnit’s StaticTestFactory comes in useful as it allows us to dynamically create distinct tests for each url.

Enjoy.

```
using System.Collections.Generic;
```

**Attachment: Visual Studio Project**
