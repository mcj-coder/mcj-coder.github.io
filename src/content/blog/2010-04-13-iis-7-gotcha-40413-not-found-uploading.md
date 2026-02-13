---
title: IIS 7 Gotcha! 404.13 Not Found – Uploading Large Files with Integrated Pipeline!
description: 'How to fix the IIS 7 404.13 error when uploading large files by configuring both httpRuntime (kilobytes) and requestFiltering (bytes) in web.config.'
pubDate: 2010-04-13
tags: ['troubleshooting']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/04/iis-7-gotcha-40413-not-found-uploading.html'
heroImage: ../../assets/blog/hero-images/2010-04-13-iis-7-gotcha-40413-not-found-uploading.jpg
---

Whilst uploading a large (70MB) file to an IIS 7 website I got a 404 error….which was odd, uploading a file in a postback shouldn't give me that. I know that file exists!

On further investigation it turns out it was actually a 404.13 error from the Request Filtering feature of the Integrated Pipeline (more info: <https://learn.microsoft.com/en-us/iis/configuration/system.webServer/security/requestFiltering/requestLimits/>).

To fix this I needed to add some additional configuration to the \<system.webServer\> element on top of the \<httpRuntime\> modifications – note the subtle change of units!

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
    <system.web>
        <!-- maxRequestLength and requestLengthDiskThreshold is in Kilobytes-->
        <httpRuntime maxRequestLength="204800"
                     requestLengthDiskThreshold="204800" />
    </system.web>
    <system.webServer>
        <security>
            <!-- maxAllowedContentLength is in Bytes not Kilobytes -->
            <requestFiltering>
                <requestLimits maxAllowedContentLength="204800000" />
            </requestFiltering>
        </security>
    </system.webServer>
</configuration>
```
