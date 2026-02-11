---
title: "TIP: How to Debug Windows Services and Plugins"
description: "Technical blog post from 2010-06-23"
pubDate: 2010-06-23
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

If you’ve ever had to create an component hosted inside a 3rd Party application (such as a plugin or windows service), you’ll know that it can be pretty tricky to get the debugger attached to the process quickly and reliably.  Here’s a snippet that’s I’ve taken from project to project:

             1: #if DEBUG

       2:             if (Properties.Settings.Default.LaunchDebugger

       3:                 && !System.Diagnostics.Debugger.IsAttached) System.Diagnostics.Debugger.Launch();

       4: #endif

This is statement checks to see if launching the debugger is allowed (using the standard settings classes) and launches the debugger if one isn’t already attached.

For release builds, the entire line is removed from code to avoid ‘accidental’ debugging.
