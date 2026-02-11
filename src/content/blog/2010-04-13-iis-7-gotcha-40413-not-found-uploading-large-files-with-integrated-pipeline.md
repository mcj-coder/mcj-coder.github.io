---
title: "IIS 7 Gotcha! 404.13 Not Found – Uploading Large Files with Integrated Pipeline!"
description: "Technical blog post from 2010-04-13"
pubDate: 2010-04-13
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

Whilst uploading a large (70MB) file to an IIS 7 website I got a 404 error….which was odd, uploading a file in a postback shouldn’t give me that.  I know that file exists!

  On further investigation it turns out it was actually a 404.13 error from the Request Filtering feature of the Integrated Pipeline (more info: [http://bit.ly/dkZiYr](http://bit.ly/dkZiYr)).  

  To fix this I needed to add some additional configuration to the  element on top of the  modifications – not the subtle change of units!

             1: xml version="1.0" encoding="utf-8"?>

       2: configuration>

       3:     system.web>

       4:         

       5:         httpRuntime maxRequestLength="204800"

       6:                      requestLengthDiskThreshold="204800" />

       7:     system.web>

       8:     system.webServer>

       9:         security>

      10:             

      11:             requestFiltering>

      12:                 requestLimits maxAllowedContentLength="204800000" />

      13:             requestFiltering>

      14:         security>

      15:     system.webServer>

      16: configuration>
