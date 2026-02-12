---
title: IIS 7 Gotcha! 404.13 Not Found – Uploading Large Files with Integrated Pipeline!
description: ""
pubDate: 2010-04-13
tags: ["troubleshooting"]
source: hugo
originalUrl: "https://codifice.dev/posts/2010-04-13-iis-7-gotcha-40413-not-found-uploading/"
heroImage: ../../assets/blog/hero-images/2010-04-13-iis-7-gotcha-40413-not-found-uploading.jpg
---

Whilst uploading a large (70MB) file to an IIS 7 website I got a 404 error….which was odd, uploading a file in a postback shouldn’t give me that.  I know that file exists!

  On further investigation it turns out it was actually a 404.13 error from the Request Filtering feature of the Integrated Pipeline (more info: http://bit.ly/dkZiYr).  

  To fix this I needed to add some additional configuration to the <system.webServer> element on top of the <httpRuntime> modifications – not the subtle change of units!

  
```
<?xml version="1.0" encoding="utf-8"?>
```