---
title: 'EKTRON: Diagnosing 8.0 Extension Strategy Loading Failures'
description: 'A diagnostic HttpHandler to troubleshoot Ektron 8.0 Extension Strategy loading failures caused by suppressed TypeLoadExceptions and assembly version mismatches.'
pubDate: 2010-11-18
heroImage: ../../assets/blog/hero-images/2010-11-18-ektron-diagnosing-80-extension-strategy.jpg
tags: ['ektron', 'troubleshooting']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/11/ektron-diagnosing-80-extension-strategy.html'
---

I've recently hit a problem with deploying Ektron Extensions (the 8.0 replacement for Plugins), essentially every time my Extension 'Strategy' was called the workarea would display an error similar to:

> **Value cannot be null. Parameter name: type**

Fortunately, in the Application Event log (for the CMS400 Source) there's a bit more information:

```text
Message: Could not load the MartinOnDotNet.Helpers.Ektron.Extensions.Monitoring.UserMonitoringStrategy, MartinOnDotNet.Helpers.Ektron.Extensions.Monitoring implementation from the configuration file
```

This shows that the declaration in the web.config is correct:

```xml
<objectFactory>
    <objectStrategies>
        <add name="User">
            <strategies>
                <add name="UserMonitoringStrategy"
                     type="MartinOnDotNet.Helpers.Ektron.Extensions.Monitoring.UserMonitoringStrategy, MartinOnDotNet.Helpers.Ektron.Extensions.Monitoring"/>
            </strategies>
        </add>
    </objectStrategies>
</objectFactory>
```

Fortunately, the next logged error reveals another vital clue:

```text
Message: Exception thrown from: /WorkArea/login.aspx
Value cannot be null.
Parameter name: type at System.Activator.CreateInstance(Type type, Boolean nonPublic)
```

The reference to 'Activator' means that the issue is .Net cannot find the referenced strategy through the type description.

This is a bit puzzling as the declaration is correct, so I need a bit more information on what's causing the problem and why I can't see it in the log, so that means breaking out Reflector and digging into the API. Fortunately, the problem method (GetStrategyList\<T>) is easy to find and fairly simple to understand. Here's the code that's failing:

```csharp
try
{
    type = Type.GetType(element2.Type, true);
}
catch (TypeLoadException)
{
    EkException.WriteToEventLog(string.Format("Could not load the {0} implementation from the configuration file", element2.Type), EventLogEntryType.Error);
}
strategy = (T) Activator.CreateInstance(type);
```

Essentially, the first log entry is written in response to the actual problem (but doesn't record it!) and the second, more detailed error is caused by the failure to assign the **type** variable.

What we really need to get hold of is the original **TypeLoadException** and capture the reason for the failure. There are two ways to do this:

- You could use the Visual Studio Exceptions dialog (Debug->Exceptions and check the 'Thrown' checkbox for System.TypeLoadException under 'Common Language Runtime Exceptions') and use the debugger to inspect the error.
- Create a test bed report to reproduce the strategy loading procedure with an increased amount of logging.

My first brush attempt was using Option 1, but I found that it was a bit unreliable and would be limited to debugging my development machine. The second option is more work, but is reusable and direct. My weapon of choice for this type of report is a custom HttpHandler which can be added/removed through a simple configuration change:

```csharp
using System;
using System.Configuration;
using System.Web;
using global::Ektron.Cms;

namespace MartinOnDotNet.Helpers.Ektron.Extensibilty
{
    /// <summary>
    /// Diagnostic handler to test loading Extensions
    /// </summary>
    public class ValidateStrategiesHandler : IHttpHandler
    {
        /// <summary>
        /// Enables processing of HTTP Web requests by a custom HttpHandler
        /// </summary>
        public void ProcessRequest(HttpContext context)
        {
            context.Response.ContentType = "text/plain";
            System.IO.TextWriter output = context.Response.Output;
            output.WriteLine("Configured Extension Strategy Test\n");
            ObjectFactorySection factorySection = (ObjectFactorySection)ConfigurationManager.GetSection("objectFactory");
            foreach (ObjectStrategyConfigElement strategies in factorySection.ObjectStrategies)
            {
                output.WriteLine("{0} (found {1})", strategies.Name, strategies.Strategies.Count);
                foreach (StrategyConfigElement strategy in strategies.Strategies)
                {
                    RenderStrategyLoadingOutcome(output, strategy);
                }
            }
            output.WriteLine("\nLoaded Assemblies");
            foreach (System.Reflection.Assembly ass in System.AppDomain.CurrentDomain.GetAssemblies())
            {
                output.WriteLine(ass.FullName);
            }
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Performance", "CA1804:RemoveUnusedLocals", MessageId = "type")]
        private void RenderStrategyLoadingOutcome(System.IO.TextWriter output, StrategyConfigElement strategy)
        {
            output.Write("\t{0,-20}\t{1,-40}\t", strategy.Name, strategy.Type);
            try
            {
                Type type = Type.GetType(strategy.Type, true);
                Type baseType = type.BaseType;
                output.WriteLine("{0}\tOK!", baseType.Name);
            }
            catch (Exception tle)
            {
                output.WriteLine("Failed! ({0}:{1})", tle.GetType().Name, tle.Message);
                System.Diagnostics.Trace.TraceError("Failed to Load Strategy '{0}'\n{1}", strategy.Type, tle.ToString());
            }
        }

        public bool IsReusable
        {
            get { return true; }
        }
    }
}
```

This can simply be registered in the system.webServer/handlers section of the web.config (assuming IIS 7 and Integrated Pipeline):

```xml
<add name="Verify Strategy Handler"
     verb="GET"
     path="secure/validatestrategies.ashx"
     type="MartinOnDotNet.Helpers.Ektron.Extensibilty.ValidateStrategiesHandler"
     preCondition="integratedMode,runtimeVersionv2.0" />
```

This report can now be called using `http://<website>/secure/validatestrategies.ashx` and will render a report similar to:

```text
Configured Extension Strategy Test

User (found 1)
    UserMonitoringStrategy    MartinOnDotNet.Helpers.Ektron.Extensions.Monitoring...    Failed! (TypeLoadException:Could not load type...)
```

With the full exception logged to Trace.

What the report immediately showed was that the Extensions that had worked were in assemblies that were listed in the 'Loaded Assemblies' report. The ones that failed weren't.

This is odd as the library was definitely in the website's /bin folder, and a little more digging and investigation revealed that one of the class library's dependencies couldn't be resolved correctly due to version number mismatch. When that was fixed, the Strategies were loaded as expected! _Result_.

```text
Configured Extension Strategy Test

User (found 1)
    UserMonitoringStrategy    MartinOnDotNet.Helpers.Ektron.Extensions.Monitoring...    UserStrategy    OK!
```

Hopefully, this report/test bench handler will help others with similar issues.
