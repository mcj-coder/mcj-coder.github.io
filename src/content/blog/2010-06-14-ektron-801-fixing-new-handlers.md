---
title: 'Ektron 8.0.1: Fixing New Handlers Multilingual Bug'
description: 'How to fix a FormatException in Ektron 8.0.1 multilingual sites caused by the new CSS and JS handlers parsing the If-Modified-Since header with the wrong culture.'
pubDate: 2010-06-14
tags: ['ektron', 'troubleshooting']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/06/ektron-801-fixing-new-handlers.html'
heroImage: ../../assets/blog/hero-images/2010-06-14-ektron-801-fixing-new-handlers.jpg
---

I recently had to upgrade a multilingual Ektron project and all went relatively well. However, whilst debugging the site – I noticed that we were getting a lot of Formatting Exceptions when running the site in French (fr-FR) but not English (en-GB). I tracked this down to the new 'workarea/csslib/ektronCss.ashx' and 'workarea/java/ektronJs.ashx' handlers and in particular around the mechanism for parsing the 'If-Modified-Since' header:

```csharp
public class ektronCss : IHttpHandler {

    public void ProcessRequest (HttpContext context)
    {
        // Ommitted for clarity until line 19
        CultureInfo provider = CultureInfo.InvariantCulture;
        DateTime lastUpdate = String.IsNullOrEmpty(context.Request.Headers.Get("If-Modified-Since"))
            ? DateTime.MinValue
            : DateTime.ParseExact(context.Request.Headers.Get("If-Modified-Since"),
              "ddd, dd MMM yyyy HH':'mm':'ss 'GMT'", null);
        // Ommitted for Brevity
    }
}
```

This can easily be fixed by substituting the **null** argument for the DateTime.ParseExact method for the **provider** variable:

```csharp
public class ektronCss : IHttpHandler {

    public void ProcessRequest (HttpContext context)
    {
        // Ommitted for clarity until line 19
        CultureInfo provider = CultureInfo.InvariantCulture;
        DateTime lastUpdate = String.IsNullOrEmpty(context.Request.Headers.Get("If-Modified-Since"))
            ? DateTime.MinValue
            : DateTime.ParseExact(context.Request.Headers.Get("If-Modified-Since"),
              "ddd, dd MMM yyyy HH':'mm':'ss 'GMT'", provider);
        // Ommitted for Brevity
    }
}
```

And is **provider** used anywhere else in either handler? It is not.
