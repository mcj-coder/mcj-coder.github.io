---
title: 'TIP: How to Debug Windows Services and Plugins'
description: 'A quick C# snippet using conditional compilation to automatically launch the debugger when debugging Windows services and plugins.'
pubDate: 2010-06-23
tags: ['troubleshooting']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/06/tip-how-to-debug-windows-services-and.html'
heroImage: ../../assets/blog/hero-images/2010-06-23-tip-how-to-debug-windows-services-and.jpg
---

If you've ever had to create a component hosted inside a 3rd Party application (such as a plugin or windows service), you'll know that it can be pretty tricky to get the debugger attached to the process quickly and reliably. Here's a snippet that I've taken from project to project:

```csharp
#if DEBUG
    if (Properties.Settings.Default.LaunchDebugger
        && !System.Diagnostics.Debugger.IsAttached)
        System.Diagnostics.Debugger.Launch();
#endif
```

This statement checks to see if launching the debugger is allowed (using the standard settings classes) and launches the debugger if one isn't already attached.

For release builds, the entire line is removed from code to avoid 'accidental' debugging.
