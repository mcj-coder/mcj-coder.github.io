---
title: 'TIP: How to Debug Windows Services and Plugins'
description: ''
pubDate: 2010-06-23
tags: ['troubleshooting']
source: hugo
originalUrl: 'https://codifice.dev/posts/2010-06-23-tip-how-to-debug-windows-services-and/'
heroImage: ../../assets/blog/hero-images/2010-06-23-tip-how-to-debug-windows-services-and.jpg
---

If you’ve ever had to create an component hosted inside a 3rd Party application (such as a plugin or windows service), you’ll know that it can be pretty tricky to get the debugger attached to the process quickly and reliably.  Here’s a snippet that’s I’ve taken from project to project:

```
if (Properties.Settings.Default.LaunchDebugger
```

This is statement checks to see if launching the debugger is allowed (using the standard settings classes) and launches the debugger if one isn’t already attached.

For release builds, the entire line is removed from code to avoid ‘accidental’ debugging.
