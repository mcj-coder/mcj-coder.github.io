---
title: "Tip: Constructing Private Types"
description: "Technical blog post from 2010-06-16"
pubDate: 2010-06-16
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

I recently needed to create an instance of the System.Web.StaticFileHandler.  This is a bit difficult as the class is internal so reflection must be used:

```csharp
private static IHttpHandler _staticFileHandler;
```

```csharp



```csharp
private static IHttpHandler StaticFileHandler
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
if (_staticFileHandler == null)
```

```csharp
{
```

```csharp
Assembly systemWeb = typeof(IHttpHandler).Assembly;
```

```csharp
/* If you don't have a public type to reference a lookup like this could be done
```

```csharp
Assembly systemWeb = AppDomain.CurrentDomain.GetAssemblies()
```

```csharp
.Where(ass => ass.GetName().Name == "System.Web")
```

```csharp
.First();
```

```csharp
*/
```

```csharp



```csharp
Type staticFileHandler = systemWeb.GetType("System.Web.StaticFileHandler");
```

```csharp
ConstructorInfo ci = staticFileHandler.GetConstructor(
```

```csharp
BindingFlags.NonPublic | BindingFlags.Instance
```

```csharp
, null
```

```csharp
, Type.EmptyTypes
```

```csharp
, null);
```

```csharp
_staticFileHandler = ci.Invoke(null) as IHttpHandler;
```

```csharp
if (_staticFileHandler == null) throw new NotSupportedException("System.Web must contain System.Web.StaticFileHandler");
```

```csharp
}
```

```csharp
return _staticFileHandler;
```

```csharp
}
```

```csharp
}
```

```csharp



```csharp
/*
```

```csharp
using System;
```

```csharp
using System.Linq;
```

```csharp
using System.Reflection;
```

```csharp
using System.Web;
```

```csharp
*/
```

Hope it helps.
