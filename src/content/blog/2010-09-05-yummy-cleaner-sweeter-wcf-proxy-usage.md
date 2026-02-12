---
title: 'Yummy! Cleaner, sweeter WCF proxy usage with DynamicTidyProxy!'
description: ''
pubDate: 2010-09-05
updatedDate: 2010-09-06
tags: ['best-practise']
source: hugo
originalUrl: 'https://codifice.dev/posts/2010-09-05-yummy-cleaner-sweeter-wcf-proxy-usage/'
heroImage: ../../assets/blog/hero-images/2010-09-05-yummy-cleaner-sweeter-wcf-proxy-usage.jpg
---

_This is a follow up to my previous (in fact my first) post “**Mmmmm… clean, sweet WCF proxy usage with TidyProxy!**”, which showed how to safely use an arbitrary WCF proxy class safely._

A substantial part of my day-to-day development is working with WCF services, mainly web and MSMQ and after a few teething troubles everything’s been ticking along nicely.  Generally these are internal windows->web comm’s where I can control both client and server implementations, so lots of shared types.

However, one of my fastest ever growing webservice API’s recently hit a metadata limit (_apparently there’s are reason for the up to 30 methods guideline!)_ which meant that neither VS2008 or svcutil could reliable generate usable proxies without altering the standard configuration of every machine which may need to generate proxies.

So after a monster refactoring session to break down my one service into **\*fourteen (14! – how did it get that big!) \_**smaller, more cohesive services – I’m faced with an even more mammoth task of retrofitting the smaller services in place of the larger one.  Clearly, this was not going to be pretty as we’ll need to replace the one service reference with fourteen**\_!\***As this service is used across several projects, this could result in me being nailed to a wall.

After a bit a Googling, Reflectoring and inspecting the Generated Code it quickly became apparent that for my case, ***I didn’t need to be generating proxies at all!***  As, all the types were shared between client and server using common libraries and the WCF configuration in config files, I could just wrap the ChannelFactory<>.  This clever class does all the heavy lifting in WCF and only needs the service contract interface and an endpoint name!

As if by magic, the Proxy appeared…

```
using System.ServiceModel;
```

I’ve coded the default constructor to use the service contract interface type name… so make sure your config file matches!

You can then dynamically create WCF proxies in code using:

```
{
```

No svcutil, or VS2008 Service Reference Required!

It also means, I didn’t have to spend all that time refactoring! (_today at least…it was going to happen - promise_)

Tidying Up

You’ve probably noticed the subtle “\_channel.CloseConnection()” in the DynamicTidyProxy Dispose Method…this is simply an extension method that wraps all of the required WCF boiler plate code…

```
// <summary>
```
