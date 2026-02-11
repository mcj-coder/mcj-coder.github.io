---
title: "Mmmmm… clean, sweet WCF proxy usage with TidyProxy!"
description: "Technical blog post from 2010-03-20"
pubDate: 2010-03-20
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

Everyone knows (hopefully) how WCF has made multi-tiered application development easier and cleaner.  You get nicely generated client proxies that reuse common libraries straight out of Visual Studio – no more having to convert between *your* DTOs and the Web Service DTOs.  They even implement IDisposable - you can just wrap them in using statements and you’re good to go!  How neat is that!     1: using (var proxy = new TidyProxy())       2: {      3:    proxy.Client.DoSomeMagicallyComplexOperation();      4: }
But only if nothing goes wrong.

If the service you’re calling throws an exception (or Faults) then the Clients dispose method will throw another exception – masking the actual problem…  There’s an entire [MSDN article](http://bit.ly/cQ460Y) on the issue.  The suggested fix?  Replace the using block above with something like this:

   1: var client = new SomeWCFServiceClient();   2: try   3: {   4:     client.DoSomeMagicallyComplexOperation();   5:     client.Close();   6: }   7: catch (CommunicationException e)   8: {   9:     client.Abort();  10: }  11: catch (TimeoutException e)  12: {  13:     client.Abort();  14: }  15: catch (Exception e)  16: {  17:     client.Abort();  18:     throw;  19: }[](http://11011.net/software/vspaste)
WCF not looking so sweet now, is it?

Now, I’ve got an issue with this type of boilerplate code, it’s verbose and awkward and *reeks* of having to [clean up someone else's mess](http://bit.ly/cRxbIP).  So, what can we do about?  Well, there’s a couple of good ideas out there from replacing the default [ClientBase](http://bit.ly/dgljYO) to adding an additional [partial class](http://bit.ly/9L9PLM) to the generated code.  These are good solutions, but will require modification of the generated code and I’m too lazy to do that for each service I’m consuming.  

So, I want a way to leverage the existing, *generated* client and keep the implementation as close to the neat using statement as possible.  Thankfully, through the wonders of Generics and the Adapter pattern WCF can be redeemed – here’s TidyProxy:

   1: using System;   2: using System.ServiceModel;   3: namespace MartinOnDotNet.Helpers.WCF   4: {   5:     ///    6:     /// A disposable wrapper that can be used to remove a lot of the WCF boiler plate code   7:     ///    8:     /// The type of the proxy.   9:     public class TidyProxy : IDisposable where TProxy : ICommunicationObject, new()  10:     {  11:         private TProxy _client;  12:         ///   13:         /// Gets or sets the generated client.  14:         ///   15:         /// The client.  16:         public TProxy Client  17:         {  18:             get  19:             {  20:                 if (_client == null) _client = new TProxy();  21:                 return _client;  22:             }  23:             set  24:             {  25:                 _client = value;  26:             }  27:         }  28:           29:         #region IDisposable Members  30:         ///   31:         /// Performs application-defined tasks associated with freeing, releasing, or resetting unmanaged resources.  32:         ///   33:         public void Dispose()  34:         {  35:             if (_client == null) return;  36:             try  37:             {  38:                 if (_client.State == CommunicationState.Opened)  39:                 {  40:                     _client.Close();  41:                 }  42:                 else  43:                 {  44:                     _client.Abort();  45:                 }  46:             }  47:             catch (Exception ex)  48:             {  49:                 try  50:                 {  51:                     _client.Abort();  52:                 }  53:                 catch   54:                 {  55:                     // Nasty, but this error isn't the problem -   56:                     // the one that caused it is!  57:                 }  58:                 throw;  59:             }  60:             GC.SuppressFinalize(this);  61:         }  62:         #endregion  63:     }  64: }So, what does this get me?  Well, to call my magically complex service I now just need to write:

   1: using (var proxy = new TidyProxy())          2: {         3:   proxy.Client.DoSomeMagicallyComplexOperation();        4: }Awesome.
