---
title: "Yummy! Cleaner, sweeter WCF proxy usage with DynamicTidyProxy!"
description: "Technical blog post from 2010-09-05"
pubDate: 2010-09-05
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

*This is a follow up to my previous (in fact my first) post “*[*Mmmmm… clean, sweet WCF proxy usage with TidyProxy!*](http://bit.ly/90sy6r)*”, which showed how to safely use an arbitrary WCF proxy class safely.  *

  A substantial part of my day-to-day development is working with WCF services, mainly web and MSMQ and after a few teething troubles everything’s been ticking along nicely.  Generally these are internal windows->web comm’s where I can control both client and server implementations, so lots of shared types.

  However, one of my fastest ever growing webservice API’s recently hit a metadata limit (*apparently there’s are reason for the up to 30 methods guideline!)* which meant that neither VS2008 or svcutil could reliable generate usable proxies without altering the standard configuration of every machine which may need to generate proxies.  

  So after a monster refactoring session to break down my one service into ***fourteen (14! – how did it get that big!) ***smaller, more cohesive services – I’m faced with an even more mammoth task of retrofitting the smaller services in place of the larger one.  Clearly, this was not going to be pretty as we’ll need to replace the one service reference with fourteen***!  ***As this service is used across several projects, this could result in me being nailed to a wall.

  After a bit a Googling, Reflectoring and inspecting the Generated Code it quickly became apparent that for my case, ***I didn’t need to be generating proxies at all!***  As, all the types were shared between client and server using common libraries and the WCF configuration in config files, I could just wrap the ChannelFactory<>.  This clever class does all the heavy lifting in WCF and only needs the service contract interface and an endpoint name!

  As if by magic, the Proxy appeared…               1: using System;

```csharp
using System.ServiceModel;
```

```csharp



```csharp
namespace MartinOnDotNet.Helpers.WCF
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// Dynamically create a WCF proxy class using the given interface
```

```csharp
/// 
```

```csharp
/// The type of the service contract.
```

```csharp
public class DynamicTidyProxy : IDisposable
```

```csharp
{
```

```csharp



```csharp
/// 
```

```csharp
/// Initializes a new instance of the  class.
```

```csharp
/// 
```

```csharp
public DynamicTidyProxy()
```

```csharp
{
```

```csharp
EndpointName = typeof(TServiceContract).Name;
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Initializes a new instance of the  class.
```

```csharp
/// 
```

```csharp
/// Name of the endpoint configuration.
```

```csharp
public DynamicTidyProxy(string endpointConfigurationName)
```

```csharp
{
```

```csharp
EndpointName = endpointConfigurationName;
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Gets or sets the name of the endpoint.
```

```csharp
/// 
```

```csharp
/// The name of the endpoint.
```

```csharp
public string EndpointName { get; set; }
```

```csharp



```csharp
private ChannelFactory _channel;
```

```csharp
private TServiceContract _client;
```

```csharp



```csharp
/// 
```

```csharp
/// Gets the client.
```

```csharp
/// 
```

```csharp
/// The client.
```

```csharp
public TServiceContract Client
```

```csharp
{
```

```csharp
get
```

```csharp
{
```

```csharp
if (_client == null)
```

```csharp
{
```

```csharp
if (!typeof(TServiceContract).IsInterface) throw new NotSupportedException("TServiceContract must be an interface!");
```

```csharp
if (string.IsNullOrEmpty(EndpointName)) throw new NotSupportedException("EndpointName must be set prior to use!");
```

```csharp
_channel = new ChannelFactory(EndpointName);
```

```csharp
_client = _channel.CreateChannel();
```

```csharp
}
```

```csharp
return _client;
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



```csharp



```csharp
#region IDisposable Members
```

```csharp



```csharp
/// 
```

```csharp
/// Performs application-defined tasks associated with freeing, releasing, or resetting unmanaged resources.
```

```csharp
/// 
```

```csharp
public void Dispose()
```

```csharp
{
```

```csharp
if (_channel != null)
```

```csharp
{
```

```csharp
_channel.CloseConnection();
```

```csharp
}
```

```csharp
GC.SuppressFinalize(this);
```

```csharp
}
```

```csharp



```csharp
#endregion
```

```csharp
}
```

```csharp
}
```

I’ve coded the default constructor to use the service contract interface type name… so make sure your config file matches!

You can then dynamically create WCF proxies in code using:

  
```csharp
using (var proxy = new DynamicTidyProxy())       
```

```csharp
{      
```

```csharp
proxy.Client.DoSomeMagicallyComplexOperation();     
```

```csharp
}
```

No svcutil, or VS2008 Service Reference Required!

It also means, I didn’t have to spend all that time refactoring! (*today at least…it was going to happen - promise*)

Tidying Up

You’ve probably noticed the subtle “_channel.CloseConnection()” in the DynamicTidyProxy Dispose Method…this is simply an extension method that wraps all of the required WCF boiler plate code…

  
```csharp
// 
```

```csharp
/// Safely closes a service client connection.
```

```csharp
/// 
```

```csharp
/// The service client.
```

```csharp
public static void CloseConnection(this ICommunicationObject serviceClient)
```

```csharp
{
```

```csharp
if (serviceClient == null) return;
```

```csharp
try
```

```csharp
{
```

```csharp
if (serviceClient.State == CommunicationState.Opened)
```

```csharp
{
```

```csharp
serviceClient.Close();
```

```csharp
}
```

```csharp
else
```

```csharp
{
```

```csharp
serviceClient.Abort();
```

```csharp
}
```

```csharp
}
```

```csharp
catch (CommunicationException ex)
```

```csharp
{
```

```csharp
Logging.Logger.Log(ex);
```

```csharp
try
```

```csharp
{
```

```csharp
serviceClient.Abort();
```

```csharp
}
```

```csharp
catch { } //nasty but nothing useful can be found by logging this exception as secondary issue
```

```csharp
}
```

```csharp
catch (TimeoutException ex)
```

```csharp
{
```

```csharp
Logging.Logger.Log(ex);
```

```csharp
try
```

```csharp
{
```

```csharp
serviceClient.Abort();
```

```csharp
}
```

```csharp
catch { }//nasty but nothing useful can be found by logging this exception as secondary issue
```

```csharp
}
```

```csharp
catch (Exception ex)
```

```csharp
{
```

```csharp
Logging.Logger.Log(ex);
```

```csharp
try
```

```csharp
{
```

```csharp
serviceClient.Abort();
```

```csharp
}
```

```csharp
catch { }//nasty but nothing useful can be found by logging this exception as secondary issue
```

```csharp
throw;
```

```csharp



```csharp
}
```

```csharp
}
```