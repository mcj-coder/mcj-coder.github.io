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

             1: Timestamp: 18/11/2010 18:43:01

       2: Message: Could not load the MartinOnDotNet.Helpers.Ektron.Extensions.Monitoring.UserMonitoringStrategy, MartinOnDotNet.Helpers.Ektron.Extensions.Monitoring implementation from the configuration file

       3: Category: Error

       4: Priority: -1

       5: EventId: 0

       6: Severity: Error

This shows that the declaration in the web.config is correct:

  
       1: objectFactory>

       2:     objectStrategies>

       3:         add name="User">

       4:             strategies>

       5:                 add name="UserMonitoringStrategy"

       6:                          type="MartinOnDotNet.Helpers.Ektron.Extensions.Monitoring.UserMonitoringStrategy, MartinOnDotNet.Helpers.Ektron.Extensions.Monitoring"/>

       7:             strategies>

       8:         add>

       9:     objectStrategies>

      10:     objectImplementations>

      11:     objectImplementations>

      12: objectFactory>

Fortunately, the next logged error reveals another vital clue:

  
       1: Timestamp: 18/11/2010 18:43:22

       2: Message: Exception thrown from: /WorkArea/login.aspx

       3: Value cannot be null.

       4: Parameter name: type   at System.Activator.CreateInstance(Type type, Boolean nonPublic)

       5:    at Ektron.Cms.ObjectFactory.GetStrategyList[T](String objectName)

       6:    at Ektron.Cms.User.EkUser.get_StrategyList()

       7:    at Ektron.Cms.User.EkUser.OnBeforeLogin(UserData userData)

       8:    at Ektron.Cms.User.EkUser.logIn(String username, String Password, String ServerName, String Domain, String Protocol, Boolean autologin, AutoAddUserTypes AutoAddType, Boolean ForceLogin)    at System.Activator.CreateInstance(Type type, Boolean nonPublic)

       9:    at Ektron.Cms.ObjectFactory.GetStrategyList[T](String objectName)

      10:    at Ektron.Cms.User.EkUser.get_StrategyList()

      11:    at Ektron.Cms.User.EkUser.OnBeforeLogin(UserData userData)

      12:    at Ektron.Cms.User.EkUser.logIn(String username, String Password, String ServerName, String Domain, String Protocol, Boolean autologin, AutoAddUserTypes AutoAddType, Boolean ForceLogin)

      13: Last 1 events

      14: [EventName]: [Timestamp] - ([UserID],[VisitorID])

      15: OnBeforeUserLogin: 18/11/2010 18:43:01 - (0, b7461b16-72f8-4631-b180-29e128d87184)

      16:  

      17: Category: Error

      18: Priority: -1

      19: EventId: 0

      20: Severity: Error

The reference to ‘Activator’ means that the issue is the .Net cannot find the referenced strategy through the type description. 

This is a bit puzzling as the declaration is correct, so I need a bit more information on what’s causing the problem and why I can’t see it in the log, so that means  breaking out [Reflector](http://bit.ly/cUbyio) and digging into the API.  Fortunately, the problem method (GetStrategyList) is easy to find and fairly simple to understand.  Here’s the code that’s failing:

  
       1: try

       2: {

       3:     type = Type.GetType(element2.Type, true);

       4: }

       5: catch (TypeLoadException)

       6: {

       7:     EkException.WriteToEventLog(string.Format("Could not load the {0} implementation from the configuration file", element2.Type), EventLogEntryType.Error);

       8: }

       9: strategy = (T) Activator.CreateInstance(type);    

Essentially, the first log entry is written in response to the actual problem (but doesn’t record it!) and the second, more detailed error is caused by the failure to assign the **type** variable.

What we really need to get hold of is the original **TypeLoadException** and capture the reason for the failure. There are two ways to do this:

  *  You could use the Visual Studio Exceptions dialog (Debug->Exceptions and check the ‘Thrown’ checkbox for System.TypeLoadException under ‘Common Language Runtime Exceptions) and use the debugger to inspect the error:[](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhODwwPlg3P-gzXGsOqatBAQLVY9CTmNdUWOVWBw3m2-KfHwQnogPIAhHFovZAdsERbclDQiXj1yDrmMDcDo8CQB2L-_sZNx71OtOtA_ac9ZUorSSCWLuF1xOl1ASJATmaHs1YWK6nL/s1600-h/image%5B2%5D.png)

  * Create a test bed report to reproduce the strategy loading procedure with an increased amount of logging

My first brush attempt was using Option 1, but I found that it was a bit unreliable and would be limited to debugging my development machine.  The second option is more work, but is reusable and direct.  My weapon of choice for this type of report is a custom HttpHandler which can be added/removed through a simple configuration change:

  
       1: using System;

       2: using System.Configuration;

       3: using System.Web;

       4: using global::Ektron.Cms;

       5:  

       6: namespace MartinOnDotNet.Helpers.Ektron.Extensibilty

       7: {

       8:     /// 

       9:     /// Diagnostic handler to test loading Extensions

      10:     /// 

      11:     public class ValidateStrategiesHandler : IHttpHandler

      12:     {

      13:  

      14:         /// 

      15:         /// Enables processing of HTTP Web requests by a custom HttpHandler that implements the  interface.

      16:         /// 

      17:         /// An  object that provides references to the intrinsic server objects (for example, Request, Response, Session, and Server) used to service HTTP requests.

      18:         public void ProcessRequest(HttpContext context)

      19:         {

      20:             context.Response.ContentType = "text/plain";

      21:             System.IO.TextWriter output = context.Response.Output;

      22:             output.WriteLine("Configured Extension Strategy Test\n");

      23:             ObjectFactorySection factorySection = (ObjectFactorySection)ConfigurationManager.GetSection("objectFactory");

      24:             foreach (ObjectStrategyConfigElement strategies in factorySection.ObjectStrategies)

      25:             {

      26:                 output.WriteLine("{0} (found {1})", strategies.Name, strategies.Strategies.Count);

      27:                 foreach (StrategyConfigElement strategy in strategies.Strategies)

      28:                 {

      29:                     RenderStrategyLoadingOutcome(output, strategy);

      30:                 }

      31:             }

      32:             output.WriteLine("\nLoaded Assemblies");

      33:             foreach (System.Reflection.Assembly ass in System.AppDomain.CurrentDomain.GetAssemblies())

      34:             {

      35:                 output.WriteLine(ass.FullName);

      36:             }

      37:  

      38:         }

      39:  

      40:         [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Performance", "CA1804:RemoveUnusedLocals", MessageId = "type")]

      41:         private void RenderStrategyLoadingOutcome(System.IO.TextWriter output, StrategyConfigElement strategy)

      42:         {

      43:             output.Write("\t{0,-20}\t{1,-40}\t", strategy.Name, strategy.Type);

      44:             try

      45:             {

      46:                 Type type = Type.GetType(strategy.Type, true);

      47:                 Type baseType = type.BaseType;

      48:                 output.WriteLine("{0}\tOK!", baseType.Name);

      49:             }

      50:             catch (Exception tle)

      51:             {

      52:                 output.WriteLine("Failed! ({0}:{1})", tle.GetType().Name, tle.Message);

      53:                 System.Diagnostics.Trace.TraceError("Failed to Load Strategy '{0}'\n{1}", strategy.Type, tle.ToString());

      54:             }

      55:         }

      56:  

      57:        /// 

      58:        /// Gets a value indicating whether another request can use the  instance.

      59:        /// 

      60:        /// 

      61:        /// true if the  instance is reusable; otherwise, false.

      62:        /// 

      63:        public bool IsReusable

      64:        {

      65:            // Return false in case your Managed Handler cannot be reused for another request.

      66:            // Usually this would be false in case you have some state information preserved per request.

      67:            get { return true; }

      68:        }

      69:     }

      70: }

This can simply be registered in the system.webServer/handlers section of the web.config (assuming IIS 7 and Integrated Pipeline):

  
       1: add name="Verify Strategy Handler"

       2:      verb="GET"

       3:      path="secure/validatestrategies.ashx"

       4:      type="MartinOnDotNet.Helpers.Ektron.Extensibilty.ValidateStrategiesHandler"

       5:      preCondition="integratedMode,runtimeVersionv2.0" />

This report can now be called using [/secure/validatestrategies.ashx">http:///secure/validatestrategies.ashx](http:///secure/validatestrategies.ashx) and will render a report similar to:

  
       1: Configured Extension Strategy Test

       2:  

       3: Content (found 1)

       4:     LoggingStrategy          MartinOnDotNet.Helpers.Ektron.Extensibilty.LoggingContentStrategy, MartinOnDotNet.Helpers.Ektron    ContentStrategy    OK!

       5:  

       6: User (found 1)

       7:     UserMonitoringStrategy    MartinOnDotNet.Helpers.Ektron.Extensions.Monitoring.UserMonitoringStrategy, MartinOnDotNet.Helpers.Ektron.Extensions.Monitoring    Failed! (TypeLoadException:Could not load type MartinOnDotNet.Helpers.Ektron.Extensions.Monitoring.UserMonitoringStrategy' from assembly MartinOnDotNet.Helpers.Ektron.Extensions.Monitoring'.)

       8:  

       9: Loaded Assemblies

      10: ** Ommitted as there's hundreds **

With the full exception logged to Trace.   

What the report immediately showed was that the Extensions that had worked were in assemblies that were listed in the ‘Loaded Assemblies’ report.  The ones that failed weren’t.

This is odd as the library was definitely in the websites /bin folder, and a little more digging and investigation revealed that the one of the class libraries dependencies couldn’t be resolved correctly due to version number mismatch.  When that was fixed, the Strategies were loaded as expected!  *Result*.

  
       1: Configured Extension Strategy Test

       2:  

       3: Content (found 1)

       4:     LoggingStrategy          MartinOnDotNet.Helpers.Ektron.Extensibilty.LoggingContentStrategy, MartinOnDotNet.Helpers.Ektron    ContentStrategy    OK!

       5: User (found 1)

       6:     UserMonitoringStrategy    MartinOnDotNet.Helpers.Ektron.Extensions.Monitoring.UserMonitoringStrategy, MartinOnDotNet.Helpers.Ektron.Extensions.Monitoring    UserStrategy    OK!

       7:  

       8: Loaded Assemblies

       9: ** Ommitted as there's hundreds **

Hopefully, this report/test bench handler will help others with similar issues.
