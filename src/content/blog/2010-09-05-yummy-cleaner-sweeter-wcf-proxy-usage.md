---
title: 'Yummy! Cleaner, sweeter WCF proxy usage with DynamicTidyProxy!'
description: 'A generic DynamicTidyProxy class that wraps ChannelFactory to dynamically create WCF proxies without svcutil or VS Service References, using shared types and config endpoints.'
pubDate: 2010-09-05
updatedDate: 2010-09-06
tags: ['best-practise']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/09/yummy-cleaner-sweeter-wcf-proxy-usage.html'
heroImage: ../../assets/blog/hero-images/2010-09-05-yummy-cleaner-sweeter-wcf-proxy-usage.jpg
---

_This is a follow up to my previous (in fact my first) post "[Mmmmm… clean, sweet WCF proxy usage with TidyProxy!](/blog/2010-03-20-mmmmm-clean-sweet-wcf-proxy-usage)", which showed how to safely use an arbitrary WCF proxy class safely._

A substantial part of my day-to-day development is working with WCF services, mainly web and MSMQ and after a few teething troubles everything's been ticking along nicely. Generally these are internal windows->web comms where I can control both client and server implementations, so lots of shared types.

However, one of my fastest ever growing webservice APIs recently hit a metadata limit (_apparently there's a reason for the up to 30 methods guideline!_) which meant that neither VS2008 or svcutil could reliably generate usable proxies without altering the standard configuration of every machine which may need to generate proxies.

So after a monster refactoring session to break down my one service into **fourteen** (14! – how did it get that big!) smaller, more cohesive services – I'm faced with an even more mammoth task of retrofitting the smaller services in place of the larger one. Clearly, this was not going to be pretty as we'll need to replace the one service reference with fourteen! As this service is used across several projects, this could result in me being nailed to a wall.

After a bit of Googling, Reflectoring and inspecting the Generated Code it quickly became apparent that for my case, _**I didn't need to be generating proxies at all!**_ As all the types were shared between client and server using common libraries and the WCF configuration in config files, I could just wrap the ChannelFactory<>. This clever class does all the heavy lifting in WCF and only needs the service contract interface and an endpoint name!

As if by magic, the Proxy appeared…

```csharp
using System;
using System.ServiceModel;

namespace MartinOnDotNet.Helpers.WCF
{
    /// <summary>
    /// Dynamically create a WCF proxy class using the given interface
    /// </summary>
    /// <typeparam name="TServiceContract">The type of the service contract.</typeparam>
    public class DynamicTidyProxy<TServiceContract> : IDisposable
    {

        /// <summary>
        /// Initializes a new instance of the <see cref="DynamicTidyProxy&lt;TServiceContract&gt;"/> class.
        /// </summary>
        public DynamicTidyProxy()
        {
            EndpointName = typeof(TServiceContract).Name;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="DynamicTidyProxy&lt;TServiceContract&gt;"/> class.
        /// </summary>
        /// <param name="endpointConfigurationName">Name of the endpoint configuration.</param>
        public DynamicTidyProxy(string endpointConfigurationName)
        {
            EndpointName = endpointConfigurationName;
        }

        /// <summary>
        /// Gets or sets the name of the endpoint.
        /// </summary>
        /// <value>The name of the endpoint.</value>
        public string EndpointName { get; set; }

        private ChannelFactory<TServiceContract> _channel;
        private TServiceContract _client;

        /// <summary>
        /// Gets the client.
        /// </summary>
        /// <value>The client.</value>
        public TServiceContract Client
        {
            get
            {
                if (_client == null)
                {
                    if (!typeof(TServiceContract).IsInterface) throw new NotSupportedException("TServiceContract must be an interface!");
                    if (string.IsNullOrEmpty(EndpointName)) throw new NotSupportedException("EndpointName must be set prior to use!");
                    _channel = new ChannelFactory<TServiceContract>(EndpointName);
                    _client = _channel.CreateChannel();
                }
                return _client;
            }

        }

        #region IDisposable Members

        /// <summary>
        /// Performs application-defined tasks associated with freeing, releasing, or resetting unmanaged resources.
        /// </summary>
        public void Dispose()
        {
            if (_channel != null)
            {
                _channel.CloseConnection();
            }
            GC.SuppressFinalize(this);
        }

        #endregion
    }
}
```

I've coded the default constructor to use the service contract interface type name… so make sure your config file matches!

You can then dynamically create WCF proxies in code using:

```csharp
using (var proxy = new DynamicTidyProxy<IMagicComplexServiceContract>())
{
    proxy.Client.DoSomeMagicallyComplexOperation();
}
```

No svcutil, or VS2008 Service Reference Required!

It also means, I didn't have to spend all that time refactoring! (_today at least…it was going to happen – promise_)

#### Tidying Up

You've probably noticed the subtle "\_channel.CloseConnection()" in the DynamicTidyProxy Dispose Method…this is simply an extension method that wraps all of the required WCF boiler plate code…

```csharp
/// <summary>
/// Safely closes a service client connection.
/// </summary>
/// <param name="serviceClient">The service client.</param>
public static void CloseConnection(this ICommunicationObject serviceClient)
{
    if (serviceClient == null) return;
    try
    {
        if (serviceClient.State == CommunicationState.Opened)
        {
            serviceClient.Close();
        }
        else
        {
            serviceClient.Abort();
        }
    }
    catch (CommunicationException ex)
    {
        Logging.Logger.Log(ex);
        try
        {
            serviceClient.Abort();
        }
        catch { } //nasty but nothing useful can be found by logging this exception as secondary issue
    }
    catch (TimeoutException ex)
    {
        Logging.Logger.Log(ex);
        try
        {
            serviceClient.Abort();
        }
        catch { } //nasty but nothing useful can be found by logging this exception as secondary issue
    }
    catch (Exception ex)
    {
        Logging.Logger.Log(ex);
        try
        {
            serviceClient.Abort();
        }
        catch { } //nasty but nothing useful can be found by logging this exception as secondary issue
        throw;
    }
}
```
