---
title: "Ektron 8.01: PlatformNotSupportedException \u2013 Tracking Down and Fixing Another Multilingual Gotcha!"
description: ""
pubDate: 2010-06-15
tags: ["ektron", "troubleshooting"]
source: hugo
originalUrl: "https://codifice.dev/posts/2010-06-15-ektron-801-platformnotsupportedexceptio/"
---

I’m still tracing though issues after upgrading to 8.01, this time looking at why requests for static files are return 500 - Internal Server Errors when French is selected, but not English. Hmm.

  Looking at the Event Logs shows lots of errors like this:

  
```
 
```

This is telling me that I’m trying to serve a file via the IIS 7 Integrated Pipeline using a handler that’s specifically designed for IIS 6 (or IIS Classic Pipeline).  What could be causing that?

Stack trace isn’t much help either:

```
at System.Web.DefaultHttpHandler.BeginProcessRequest(HttpContext context, AsyncCallback callback, Object state)
```

The site is using extension-less aliasing so the configured default handler (EkDavHttpHandlerFactory) needs be looked into.  Essentially, this class analyses the request and applies particular rules against it to decide which handler is best suited to serve the content.  In this case, the static file should be served by the default content handler.  This is selected by looking at the server version if the server version is greater than 6 then use (the Ektron Implementation of) StaticFileHandler otherwise DefaultHttpHandler.

The server version is parse from a server variable:

```
{
```

D’oh!  Decimal.TryParse will (by default) use the current threads locale and French uses a comma as a decimal seperator!  7.0 is not a valid decimal!  This could be fixed by passing in CultureInfo.InvariantCulture into the TryParse method to get a consistent evaluation, but that would take a hot fix to deploy.

To fix this now, we need to implement a subclass of EkDavHttpHandlerFactory to ensure that the correct handler is used to serve static files:

```
using System.Linq;
```

If you’ve implemented my [Asset Folder fix](http://martinondotnet.blogspot.com/2010/04/ektron-fix-for-uploading-assets-into.html) then the combined EkDavHttpHandlerFactory is this:

```
using System;
```