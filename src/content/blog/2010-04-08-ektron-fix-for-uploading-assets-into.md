---
title: 'Ektron: A Fix For Uploading Assets into a Folder Called Assets'
description: ''
pubDate: 2010-04-08
tags: ['ektron', 'troubleshooting']
source: hugo
originalUrl: 'https://codifice.dev/posts/2010-04-08-ektron-fix-for-uploading-assets-into/'
heroImage: ../../assets/blog/hero-images/2010-04-08-ektron-fix-for-uploading-assets-into.jpg
---

An interesting bug came in today from a client that had been uploading content and images into their workarea for their upcoming release.  Most of their images weren’t being displayed on the site or in the workarea.

When the image url was navigated to directly, instead of an server error or file not found we saw this:

**Error:**Asset requested doesn't exist in the system

I beg to differ! I can see it right there on the file system!  After a bit of Googling, I found the same issue on the Ektron forums (<http://bit.ly/90erho>)  which shows this has been a problem since (at least) 2008!  It’s also a reasonable Google Hack to find other Ektron Deployments with the same issue (I see you Walmart!).

With a bit of digging I traced the source of the issue to the EkDavHttpHandlerFactory Handler that’s used for the url rewriting.  More specifically, this block of code:

```
 
```

D’oh!  The images in question had been uploaded to a folder called assets within the library (not the ~/assets/ folder but ~/uploadedImages/…./assets/….) and the overzealous detection algorithm above was treating them as DMS items.

To fix this I’ve implemented a subclass of the handler which performs extra checking when the AssetHttpHandler IHttpHandler implementation is returned to ensure that it’s only blocking assets within the ~/assets/ folder.

```
using System.Web;
```

Where possible I’ve reused the functionality from the API (even using a nasty bit of reflection to extract the server version according to the Ektron API).

To use this, copy the class above into a your websites \App_Code\CSCode\ folder and in the web.config replace all references to ‘Ektron.ASM.EkHttpDavHandler.EkDavHttpHandlerFactory’ with ‘MartinOnDotNet.Ektron.Web.EkDavHttpHandlerFactory’.
