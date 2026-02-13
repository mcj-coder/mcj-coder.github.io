---
title: 'Mmmmm… clean, sweet WCF proxy usage with TidyProxy!'
description: 'How WCF client proxies have a dispose pattern issue that masks exceptions, and a TidyProxy<T> wrapper class that solves it while keeping clean using statements.'
pubDate: 2010-03-20
updatedDate: 2010-03-23
tags: ['best-practice']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/03/mmmmm-clean-sweet-wcf-proxy-usage.html'
heroImage: ../../assets/blog/hero-images/2010-03-20-mmmmm-clean-sweet-wcf-proxy-usage.jpg
---

Everyone knows (hopefully) how WCF has made multi-tiered application development easier and cleaner. You get nicely generated client proxies that reuse common libraries straight out of Visual Studio – no more having to convert between _your_ DTOs and the Web Service DTOs. They even implement IDisposable - you can just wrap them in using statements and you're good to go! How neat is that!

```csharp
using (var proxy = new TidyProxy<SomeWCFServiceClient>())
{
    proxy.Client.DoSomeMagicallyComplexOperation();
}
```

But only if nothing goes wrong.

If the service you're calling throws an exception (or Faults) then the Client's dispose method will throw another exception – masking the actual problem… There's an entire [MSDN article](https://learn.microsoft.com/en-us/archive/blogs/scottgu/archive/2006/04/11/2_2f00_20760100.shtml) on the issue. The suggested fix? Replace the using block above with something like this:

```csharp
var client = new SomeWCFServiceClient();
try
{
    client.DoSomeMagicallyComplexOperation();
    client.Close();
}
catch (CommunicationException e)
{
    client.Abort();
}
catch (TimeoutException e)
{
    client.Abort();
}
catch (Exception e)
{
    client.Abort();
    throw;
}
```

WCF not looking so sweet now, is it?

Now, I've got an issue with this type of boilerplate code, it's verbose and awkward and _reeks_ of having to clean up someone else's mess. So, what can we do about? Well, there's a couple of good ideas out there from replacing the default ClientBase to adding an additional partial class to the generated code. These are good solutions, but will require modification of the generated code and I'm too lazy to do that for each service I'm consuming.

So, I want a way to leverage the existing, _generated_ client and keep the implementation as close to the neat using statement as possible. Thankfully, through the wonders of Generics and the Adapter pattern WCF can be redeemed – here's TidyProxy:

```csharp
using System;
using System.ServiceModel;

namespace MartinOnDotNet.Helpers.WCF
{
    /// <summary>
    /// A disposable wrapper that can be used to remove a lot of the WCF boiler plate code
    /// </summary>
    /// <typeparam name="TProxy">The type of the proxy.</typeparam>
    public class TidyProxy<TProxy> : IDisposable where TProxy : ICommunicationObject, new()
    {
        private TProxy _client;

        /// <summary>
        /// Gets or sets the generated client.
        /// </summary>
        /// <value>The client.</value>
        public TProxy Client
        {
            get
            {
                if (_client == null) _client = new TProxy();
                return _client;
            }
            set
            {
                _client = value;
            }
        }

        #region IDisposable Members
        /// <summary>
        /// Performs application-defined tasks associated with freeing, releasing, or resetting unmanaged resources.
        /// </summary>
        public void Dispose()
        {
            if (_client == null) return;

            try
            {
                if (_client.State == CommunicationState.Opened)
                {
                    _client.Close();
                }
                else
                {
                    _client.Abort();
                }
            }
            catch (Exception ex)
            {
                try
                {
                    _client.Abort();
                }
                catch
                {
                    // Nasty, but this error isn't the problem -
                    // the one that caused it is!
                }
                throw;
            }
            GC.SuppressFinalize(this);
        }
        #endregion
    }
}
```

So, what does this get me? Well, to call my magically complex service I now just need to write:

```csharp
using (var proxy = new TidyProxy<SomeWCFServiceClient>())
{
    proxy.Client.DoSomeMagicallyComplexOperation();
}
```

Awesome.
