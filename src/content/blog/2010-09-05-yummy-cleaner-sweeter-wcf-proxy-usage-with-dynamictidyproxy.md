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

       2: using System.ServiceModel;

       3:  

       4: namespace MartinOnDotNet.Helpers.WCF

       5: {

       6:     /// 

       7:     /// Dynamically create a WCF proxy class using the given interface

       8:     /// 

       9:     /// The type of the service contract.

      10:     public class DynamicTidyProxy : IDisposable

      11:     {

      12:  

      13:         /// 

      14:         /// Initializes a new instance of the  class.

      15:         /// 

      16:         public DynamicTidyProxy()

      17:         {

      18:             EndpointName = typeof(TServiceContract).Name;

      19:         }

      20:  

      21:         /// 

      22:         /// Initializes a new instance of the  class.

      23:         /// 

      24:         /// Name of the endpoint configuration.

      25:         public DynamicTidyProxy(string endpointConfigurationName)

      26:         {

      27:             EndpointName = endpointConfigurationName;

      28:         }

      29:  

      30:         /// 

      31:         /// Gets or sets the name of the endpoint.

      32:         /// 

      33:         /// The name of the endpoint.

      34:         public string EndpointName { get; set; }

      35:  

      36:         private ChannelFactory _channel;

      37:         private TServiceContract _client;

      38:  

      39:         /// 

      40:         /// Gets the client.

      41:         /// 

      42:         /// The client.

      43:         public TServiceContract Client

      44:         {

      45:             get

      46:             {

      47:                 if (_client == null)

      48:                 {

      49:                     if (!typeof(TServiceContract).IsInterface) throw new NotSupportedException("TServiceContract must be an interface!");

      50:                     if (string.IsNullOrEmpty(EndpointName)) throw new NotSupportedException("EndpointName must be set prior to use!");

      51:                     _channel = new ChannelFactory(EndpointName);

      52:                     _client = _channel.CreateChannel();

      53:                 }

      54:                 return _client;

      55:             }

      56:  

      57:         }

      58:  

      59:  

      60:  

      61:         #region IDisposable Members

      62:  

      63:         /// 

      64:         /// Performs application-defined tasks associated with freeing, releasing, or resetting unmanaged resources.

      65:         /// 

      66:         public void Dispose()

      67:         {

      68:             if (_channel != null)

      69:             {

      70:                 _channel.CloseConnection();

      71:             }

      72:             GC.SuppressFinalize(this);

      73:         }

      74:  

      75:         #endregion

      76:     }

      77: }

I’ve coded the default constructor to use the service contract interface type name… so make sure your config file matches!

You can then dynamically create WCF proxies in code using:

  
       1: using (var proxy = new DynamicTidyProxy())       

       2: {      

       3:   proxy.Client.DoSomeMagicallyComplexOperation();     

       4: }

No svcutil, or VS2008 Service Reference Required!

It also means, I didn’t have to spend all that time refactoring! (*today at least…it was going to happen - promise*)

Tidying Up

You’ve probably noticed the subtle “_channel.CloseConnection()” in the DynamicTidyProxy Dispose Method…this is simply an extension method that wraps all of the required WCF boiler plate code…

  
       1: // 

       2: /// Safely closes a service client connection.

       3: /// 

       4: /// The service client.

       5: public static void CloseConnection(this ICommunicationObject serviceClient)

       6: {

       7:     if (serviceClient == null) return;

       8:     try

       9:     {

      10:         if (serviceClient.State == CommunicationState.Opened)

      11:         {

      12:             serviceClient.Close();

      13:         }

      14:         else

      15:         {

      16:             serviceClient.Abort();

      17:         }

      18:     }

      19:     catch (CommunicationException ex)

      20:     {

      21:         Logging.Logger.Log(ex);

      22:         try

      23:         {

      24:             serviceClient.Abort();

      25:         }

      26:         catch { } //nasty but nothing useful can be found by logging this exception as secondary issue

      27:     }

      28:     catch (TimeoutException ex)

      29:     {

      30:         Logging.Logger.Log(ex);

      31:         try

      32:         {

      33:             serviceClient.Abort();

      34:         }

      35:         catch { }//nasty but nothing useful can be found by logging this exception as secondary issue

      36:     }

      37:     catch (Exception ex)

      38:     {

      39:         Logging.Logger.Log(ex);

      40:         try

      41:         {

      42:             serviceClient.Abort();

      43:         }

      44:         catch { }//nasty but nothing useful can be found by logging this exception as secondary issue

      45:         throw;

      46:  

      47:     }

      48: }
