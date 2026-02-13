---
title: 'Tip: Constructing Private Types'
description: 'How to create an instance of an internal class like System.Web.StaticFileHandler using reflection to access non-public constructors.'
pubDate: 2010-06-16
tags: ['tips']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/06/tip-constructing-private-types.html'
heroImage: ../../assets/blog/hero-images/2010-06-16-tip-constructing-private-types.jpg
---

I recently needed to create an instance of the System.Web.StaticFileHandler. This is a bit difficult as the class is internal so reflection must be used:

```csharp
private static IHttpHandler _staticFileHandler;

private static IHttpHandler StaticFileHandler
{
    get
    {
        if (_staticFileHandler == null)
        {
            Assembly systemWeb = typeof(IHttpHandler).Assembly;
            /* If you don't have a public type to reference a lookup like this could be done
               Assembly systemWeb = AppDomain.CurrentDomain.GetAssemblies()
                   .Where(ass => ass.GetName().Name == "System.Web")
                   .First();
            */

            Type staticFileHandler = systemWeb.GetType("System.Web.StaticFileHandler");
            ConstructorInfo ci = staticFileHandler.GetConstructor(
                BindingFlags.NonPublic | BindingFlags.Instance
                , null
                , Type.EmptyTypes
                , null);
            _staticFileHandler = ci.Invoke(null) as IHttpHandler;
            if (_staticFileHandler == null) throw new NotSupportedException("System.Web must contain System.Web.StaticFileHandler");
        }
        return _staticFileHandler;
    }
}

/*
using System;
using System.Linq;
using System.Reflection;
using System.Web;
*/
```

Hope it helps.
