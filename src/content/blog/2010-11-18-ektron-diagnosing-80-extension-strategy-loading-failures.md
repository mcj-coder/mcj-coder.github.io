---
title: "EKTRON: Diagnosing 8.0 Extension Strategy Loading Failures"
description: "Technical blog post from 2010-11-18"
pubDate: 2010-11-18
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

I’ve recently hit a problem with deploying  [Ektron](http://bit.ly/d0YHh7) Extensions (the 8.0 replacement for Plugins), essentially every time my Extension ‘Strategy’ was called the workarea would display an error similar to:

     **Value cannot be null. Parameter name: type **

   Fortunately, in the Application Event log (for the CMS400 Source) there’s a bit more information:

```csharp
Timestamp: 18/11/2010 18:43:01
```

```csharp
Message: Could not load the MartinOnDotNet.Helpers.Ektron.Extensions.Monitoring.UserMonitoringStrategy, MartinOnDotNet.Helpers.Ektron.Extensions.Monitoring implementation from the configuration file
```

```csharp
Category: Error
```

```csharp
Priority: -1
```

```csharp
EventId: 0
```

```csharp
Severity: Error
```

This shows that the declaration in the web.config is correct:

  
```csharp
objectFactory>
```

```csharp
objectStrategies>
```

```csharp
add name="User">
```

```csharp
strategies>
```

```csharp
add name="UserMonitoringStrategy"
```

```csharp
type="MartinOnDotNet.Helpers.Ektron.Extensions.Monitoring.UserMonitoringStrategy, MartinOnDotNet.Helpers.Ektron.Extensions.Monitoring"/>
```

```csharp
strategies>
```

```csharp
add>
```

```csharp
objectStrategies>
```

```csharp
objectImplementations>
```

```csharp
objectImplementations>
```

```csharp
objectFactory>
```

Fortunately, the next logged error reveals another vital clue:

  
```csharp
Timestamp: 18/11/2010 18:43:22
```

```csharp
Message: Exception thrown from: /WorkArea/login.aspx
```

```csharp
Value cannot be null.
```

```csharp
Parameter name: type   at System.Activator.CreateInstance(Type type, Boolean nonPublic)
```

```csharp
at Ektron.Cms.ObjectFactory.GetStrategyList[T](String objectName)
```

```csharp
at Ektron.Cms.User.EkUser.get_StrategyList()
```

```csharp
at Ektron.Cms.User.EkUser.OnBeforeLogin(UserData userData)
```

```csharp
at Ektron.Cms.User.EkUser.logIn(String username, String Password, String ServerName, String Domain, String Protocol, Boolean autologin, AutoAddUserTypes AutoAddType, Boolean ForceLogin)    at System.Activator.CreateInstance(Type type, Boolean nonPublic)
```

```csharp
at Ektron.Cms.ObjectFactory.GetStrategyList[T](String objectName)
```

```csharp
at Ektron.Cms.User.EkUser.get_StrategyList()
```

```csharp
at Ektron.Cms.User.EkUser.OnBeforeLogin(UserData userData)
```

```csharp
at Ektron.Cms.User.EkUser.logIn(String username, String Password, String ServerName, String Domain, String Protocol, Boolean autologin, AutoAddUserTypes AutoAddType, Boolean ForceLogin)
```

```csharp
Last 1 events
```

```csharp
[EventName]: [Timestamp] - ([UserID],[VisitorID])
```

```csharp
OnBeforeUserLogin: 18/11/2010 18:43:01 - (0, b7461b16-72f8-4631-b180-29e128d87184)
```

```csharp



```csharp
Category: Error
```

```csharp
Priority: -1
```

```csharp
EventId: 0
```

```csharp
Severity: Error
```

The reference to ‘Activator’ means that the issue is the .Net cannot find the referenced strategy through the type description. 

This is a bit puzzling as the declaration is correct, so I need a bit more information on what’s causing the problem and why I can’t see it in the log, so that means  breaking out [Reflector](http://bit.ly/cUbyio) and digging into the API.  Fortunately, the problem method (GetStrategyList) is easy to find and fairly simple to understand.  Here’s the code that’s failing:

  
```csharp
try
```

```csharp
{
```

```csharp
type = Type.GetType(element2.Type, true);
```

```csharp
}
```

```csharp
catch (TypeLoadException)
```

```csharp
{
```

```csharp
EkException.WriteToEventLog(string.Format("Could not load the {0} implementation from the configuration file", element2.Type), EventLogEntryType.Error);
```

```csharp
}
```

```csharp
strategy = (T) Activator.CreateInstance(type);    
```

Essentially, the first log entry is written in response to the actual problem (but doesn’t record it!) and the second, more detailed error is caused by the failure to assign the **type** variable.

What we really need to get hold of is the original **TypeLoadException** and capture the reason for the failure. There are two ways to do this:

  *  You could use the Visual Studio Exceptions dialog (Debug->Exceptions and check the ‘Thrown’ checkbox for System.TypeLoadException under ‘Common Language Runtime Exceptions) and use the debugger to inspect the error:[](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhODwwPlg3P-gzXGsOqatBAQLVY9CTmNdUWOVWBw3m2-KfHwQnogPIAhHFovZAdsERbclDQiXj1yDrmMDcDo8CQB2L-_sZNx71OtOtA_ac9ZUorSSCWLuF1xOl1ASJATmaHs1YWK6nL/s1600-h/image%5B2%5D.png)

  * Create a test bed report to reproduce the strategy loading procedure with an increased amount of logging

My first brush attempt was using Option 1, but I found that it was a bit unreliable and would be limited to debugging my development machine.  The second option is more work, but is reusable and direct.  My weapon of choice for this type of report is a custom HttpHandler which can be added/removed through a simple configuration change:

  
```csharp
using System;
```

```csharp
using System.Configuration;
```

```csharp
using System.Web;
```

```csharp
using global::Ektron.Cms;
```

```csharp



```csharp
namespace MartinOnDotNet.Helpers.Ektron.Extensibilty
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// Diagnostic handler to test loading Extensions
```

```csharp
/// 
```

```csharp
public class ValidateStrategiesHandler : IHttpHandler
```

```csharp
{
```

```csharp



```csharp
/// 
```

```csharp
/// Enables processing of HTTP Web requests by a custom HttpHandler that implements the  interface.
```

```csharp
/// 
```

```csharp
/// An  object that provides references to the intrinsic server objects (for example, Request, Response, Session, and Server) used to service HTTP requests.
```

```csharp
public void ProcessRequest(HttpContext context)
```

```csharp
{
```

```csharp
context.Response.ContentType = "text/plain";
```

```csharp
System.IO.TextWriter output = context.Response.Output;
```

```csharp
output.WriteLine("Configured Extension Strategy Test\n");
```

```csharp
ObjectFactorySection factorySection = (ObjectFactorySection)ConfigurationManager.GetSection("objectFactory");
```

```csharp
foreach (ObjectStrategyConfigElement strategies in factorySection.ObjectStrategies)
```

```csharp
{
```

```csharp
output.WriteLine("{0} (found {1})", strategies.Name, strategies.Strategies.Count);
```

```csharp
foreach (StrategyConfigElement strategy in strategies.Strategies)
```

```csharp
{
```

```csharp
RenderStrategyLoadingOutcome(output, strategy);
```

```csharp
}
```

```csharp
}
```

```csharp
output.WriteLine("\nLoaded Assemblies");
```

```csharp
foreach (System.Reflection.Assembly ass in System.AppDomain.CurrentDomain.GetAssemblies())
```

```csharp
{
```

```csharp
output.WriteLine(ass.FullName);
```

```csharp
}
```

```csharp



```csharp
}
```

```csharp



```csharp
[System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Performance", "CA1804:RemoveUnusedLocals", MessageId = "type")]
```

```csharp
private void RenderStrategyLoadingOutcome(System.IO.TextWriter output, StrategyConfigElement strategy)
```

```csharp
{
```

```csharp
output.Write("\t{0,-20}\t{1,-40}\t", strategy.Name, strategy.Type);
```

```csharp
try
```

```csharp
{
```

```csharp
Type type = Type.GetType(strategy.Type, true);
```

```csharp
Type baseType = type.BaseType;
```

```csharp
output.WriteLine("{0}\tOK!", baseType.Name);
```

```csharp
}
```

```csharp
catch (Exception tle)
```

```csharp
{
```

```csharp
output.WriteLine("Failed! ({0}:{1})", tle.GetType().Name, tle.Message);
```

```csharp
System.Diagnostics.Trace.TraceError("Failed to Load Strategy '{0}'\n{1}", strategy.Type, tle.ToString());
```

```csharp
}
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Gets a value indicating whether another request can use the  instance.
```

```csharp
/// 
```

```csharp
/// 
```

```csharp
/// true if the  instance is reusable; otherwise, false.
```

```csharp
/// 
```

```csharp
public bool IsReusable
```

```csharp
{
```

```csharp
// Return false in case your Managed Handler cannot be reused for another request.
```

```csharp
// Usually this would be false in case you have some state information preserved per request.
```

```csharp
get { return true; }
```

```csharp
}
```

```csharp
}
```

```csharp
}
```

This can simply be registered in the system.webServer/handlers section of the web.config (assuming IIS 7 and Integrated Pipeline):

  
```csharp
add name="Verify Strategy Handler"
```

```csharp
verb="GET"
```

```csharp
path="secure/validatestrategies.ashx"
```

```csharp
type="MartinOnDotNet.Helpers.Ektron.Extensibilty.ValidateStrategiesHandler"
```

```csharp
preCondition="integratedMode,runtimeVersionv2.0" />
```

This report can now be called using [/secure/validatestrategies.ashx">http:///secure/validatestrategies.ashx](http:///secure/validatestrategies.ashx) and will render a report similar to:

  
```csharp
Configured Extension Strategy Test
```

```csharp



```csharp
Content (found 1)
```

```csharp
LoggingStrategy          MartinOnDotNet.Helpers.Ektron.Extensibilty.LoggingContentStrategy, MartinOnDotNet.Helpers.Ektron    ContentStrategy    OK!
```

```csharp



```csharp
User (found 1)
```

```csharp
UserMonitoringStrategy    MartinOnDotNet.Helpers.Ektron.Extensions.Monitoring.UserMonitoringStrategy, MartinOnDotNet.Helpers.Ektron.Extensions.Monitoring    Failed! (TypeLoadException:Could not load type MartinOnDotNet.Helpers.Ektron.Extensions.Monitoring.UserMonitoringStrategy' from assembly MartinOnDotNet.Helpers.Ektron.Extensions.Monitoring'.)
```

```csharp



```csharp
Loaded Assemblies
```

```csharp
** Ommitted as there's hundreds **
```

With the full exception logged to Trace.   

What the report immediately showed was that the Extensions that had worked were in assemblies that were listed in the ‘Loaded Assemblies’ report.  The ones that failed weren’t.

This is odd as the library was definitely in the websites /bin folder, and a little more digging and investigation revealed that the one of the class libraries dependencies couldn’t be resolved correctly due to version number mismatch.  When that was fixed, the Strategies were loaded as expected!  *Result*.

  
```csharp
Configured Extension Strategy Test
```

```csharp



```csharp
Content (found 1)
```

```csharp
LoggingStrategy          MartinOnDotNet.Helpers.Ektron.Extensibilty.LoggingContentStrategy, MartinOnDotNet.Helpers.Ektron    ContentStrategy    OK!
```

```csharp
User (found 1)
```

```csharp
UserMonitoringStrategy    MartinOnDotNet.Helpers.Ektron.Extensions.Monitoring.UserMonitoringStrategy, MartinOnDotNet.Helpers.Ektron.Extensions.Monitoring    UserStrategy    OK!
```

```csharp



```csharp
Loaded Assemblies
```

```csharp
** Ommitted as there's hundreds **
```

Hopefully, this report/test bench handler will help others with similar issues.
