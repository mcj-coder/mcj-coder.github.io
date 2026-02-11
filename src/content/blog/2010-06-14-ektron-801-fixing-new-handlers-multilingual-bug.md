---
title: "Ektron 8.0.1: Fixing New Handlers Multilingual Bug"
description: "Technical blog post from 2010-06-14"
pubDate: 2010-06-14
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

I recently had to upgrade an multilingual [Ektron](http://bit.ly/d0YHh7) project and all went [relatively](http://bit.ly/a8LEPz) well.  However, whilst debugging the site – I noticed that we were getting a lot of Formatting Exceptions when running the site in French (fr-FR) but not English (en-GB).  I tracked this down to the new ‘workarea/csslib/ektronCss.ashx’ and ‘workarea/java/ektronJs.ashx’ handlers and in particular around the mechanism for parsing the ‘If-Modified-Since’ header:

```csharp
public class ektronCss : IHttpHandler {
```

```csharp



```csharp
public void ProcessRequest (HttpContext context) 
```

```csharp
{
```

```csharp
// Ommitted for clarity until line 19    
```

```csharp
CultureInfo provider = CultureInfo.InvariantCulture;
```

```csharp
DateTime lastUpdate = String.IsNullOrEmpty(context.Request.Headers.Get("If-Modified-Since")) 
```

```csharp
? DateTime.MinValue 
```

```csharp
: DateTime.ParseExact(context.Request.Headers.Get("If-Modified-Since"), "ddd, dd MMM yyyy HH':'mm':'ss 'GMT'", null);
```

```csharp
// Ommitted for Brevity        
```

```csharp
}
```

```csharp
}
```

This can easily be fixed by substituting the **null** argument for the DateTime.ParseExact method for the **provider** variable:

  
```csharp
public class ektronCss : IHttpHandler {
```

```csharp



```csharp
public void ProcessRequest (HttpContext context) 
```

```csharp
{
```

```csharp
// Ommitted for clarity until line 19    
```

```csharp
CultureInfo provider = CultureInfo.InvariantCulture;
```

```csharp
DateTime lastUpdate = String.IsNullOrEmpty(context.Request.Headers.Get("If-Modified-Since")) 
```

```csharp
? DateTime.MinValue 
```

```csharp
: DateTime.ParseExact(context.Request.Headers.Get("If-Modified-Since"), "ddd, dd MMM yyyy HH':'mm':'ss 'GMT'", ***provider*);**
```

    **  10:         // Ommitted for Brevity        **

    **  11:     }**

    **  12: }**

And is **provider** used anywhere else in either handler?  It is not.
