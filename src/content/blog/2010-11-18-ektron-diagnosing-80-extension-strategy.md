---
title: "EKTRON: Diagnosing 8.0 Extension Strategy Loading Failures"
description: ""
pubDate: 2010-11-18
heroImage: ../../assets/blog/hero-images/post-00-hero.svg



tags: ["ektron", "troubleshooting"]
source: hugo
originalUrl: "https://codifice.dev/posts/2010-11-18-ektron-diagnosing-80-extension-strategy/"
---

I’ve recently hit a problem with deploying  Ektron Extensions (the 8.0 replacement for Plugins), essentially every time my Extension ‘Strategy’ was called the workarea would display an error similar to:

  >    **Value cannot be null. Parameter name: type **

   Fortunately, in the Application Event log (for the CMS400 Source) there’s a bit more information:

  
```
Message: Could not load the MartinOnDotNet.Helpers.Ektron.Extensions.Monitoring.UserMonitoringStrategy, MartinOnDotNet.Helpers.Ektron.Extensions.Monitoring implementation from the configuration file
```

This shows that the declaration in the web.config is correct:

```
<objectStrategies>
```

Fortunately, the next logged error reveals another vital clue:

```
Message: Exception thrown from: /WorkArea/login.aspx
```

The reference to ‘Activator’ means that the issue is the .Net cannot find the referenced strategy through the type description. 

This is a bit puzzling as the declaration is correct, so I need a bit more information on what’s causing the problem and why I can’t see it in the log, so that means  breaking out Reflector and digging into the API.  Fortunately, the problem method (GetStrategyList<T>) is easy to find and fairly simple to understand.  Here’s the code that’s failing:

```
{
```

Essentially, the first log entry is written in response to the actual problem (but doesn’t record it!) and the second, more detailed error is caused by the failure to assign the **type** variable.

What we really need to get hold of is the original **TypeLoadException** and capture the reason for the failure. There are two ways to do this:

  *  You could use the Visual Studio Exceptions dialog (Debug->Exceptions and check the ‘Thrown’ checkbox for System.TypeLoadException under ‘Common Language Runtime Exceptions) and use the debugger to inspect the error:[](http://lh6.ggpht.com/_Vz_CYzsjR7M/TOWX7PmUuVI/AAAAAAAAAG4/mK2lCOqzziw/s1600-h/image%5B2%5D.png)

  * Create a test bed report to reproduce the strategy loading procedure with an increased amount of logging

My first brush attempt was using Option 1, but I found that it was a bit unreliable and would be limited to debugging my development machine.  The second option is more work, but is reusable and direct.  My weapon of choice for this type of report is a custom HttpHandler which can be added/removed through a simple configuration change:

```
using System.Configuration;
```

This can simply be registered in the system.webServer/handlers section of the web.config (assuming IIS 7 and Integrated Pipeline):

```
verb="GET"
```

This report can now be called using [/secure/validatestrategies.ashx">http://<website>/secure/validatestrategies.ashx](http:///secure/validatestrategies.ashx) and will render a report similar to:

```
 
```

With the full exception logged to Trace.   

What the report immediately showed was that the Extensions that had worked were in assemblies that were listed in the ‘Loaded Assemblies’ report.  The ones that failed weren’t.

This is odd as the library was definitely in the websites /bin folder, and a little more digging and investigation revealed that the one of the class libraries dependencies couldn’t be resolved correctly due to version number mismatch.  When that was fixed, the Strategies were loaded as expected!  *Result*.

```
 
```

Hopefully, this report/test bench handler will help others with similar issues.