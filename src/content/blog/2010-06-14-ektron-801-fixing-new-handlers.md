---
title: "Ektron 8.0.1: Fixing New Handlers Multilingual Bug"
description: ""
pubDate: 2010-06-14
tags: ["ektron", "troubleshooting"]
source: hugo
originalUrl: "https://codifice.dev/posts/2010-06-14-ektron-801-fixing-new-handlers/"
heroImage: ../../assets/blog/hero-images/2010-06-14-ektron-801-fixing-new-handlers.jpg
---

I recently had to upgrade an multilingual Ektron project and all went relatively well.  However, whilst debugging the site – I noticed that we were getting a lot of Formatting Exceptions when running the site in French (fr-FR) but not English (en-GB).  I tracked this down to the new ‘workarea/csslib/ektronCss.ashx’ and ‘workarea/java/ektronJs.ashx’ handlers and in particular around the mechanism for parsing the ‘If-Modified-Since’ header:

  
```

```

This can easily be fixed by substituting the **null** argument for the DateTime.ParseExact method for the **provider** variable:

```

```

And is **provider** used anywhere else in either handler?  It is not.