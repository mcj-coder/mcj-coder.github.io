---
title: "Tip: Constructing Private Types"
description: ""
pubDate: 2010-06-16
tags: ["tips"]
source: hugo
originalUrl: "https://codifice.dev/posts/2010-06-16-tip-constructing-private-types/"
---

I recently needed to create an instance of the System.Web.StaticFileHandler.  This is a bit difficult as the class is internal so reflection must be used:

  
```
 
```

Hope it helps.