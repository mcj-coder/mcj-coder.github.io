---
title: "Building a Better FindControl"
description: "Technical blog post from 2010-08-03"
pubDate: 2010-08-03
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

There are times in any semi-advanced ASP.NET developers life when they’re working with databound templated controls (such as the Repeater) and they need to find a control without knowing where it is, or even if its there.

  Normally, you’re reduced to using the standard FindControl method available on any control.  But this only finds controls with a given id within the same NamingContainer.  

  I’ve written some extension methods to try and get around the (many) issues that I’ve had with FindControl and hopefully people will find them useful.

  
## Get All Child Controls of a Given Type
```csharp
public static IEnumerable GetAllChildControlsOfType(this Control parent) where T : Control
```

```csharp
{
```

```csharp
if (parent == null) throw new ArgumentNullException("parent");
```

```csharp
foreach (Control c in parent.Controls)
```

```csharp
{
```

```csharp
if (typeof(T).IsInstanceOfType(c)) yield return (T)c;
```

```csharp
foreach (T tc in c.GetAllChildControlsOfType())
```

```csharp
yield return tc;
```

```csharp
}
```

```csharp
yield break;
```

```csharp
}
```

## Get All Child Controls that Implement a Given Interface

For when you don’t care what the control is, as long as it can do a particular thing….try it with IButtonControl.

  
```csharp
public static IEnumerable GetAllChildControlsWithInterface(this Control parent)
```

```csharp
{
```

```csharp
if (!typeof(T).IsInterface) throw new NotSupportedException(string.Format(CultureInfo.InvariantCulture,"Type '{0}' is not an interface".ToFormattedString(typeof(T).ToString()));
```

```csharp
if (parent == null) throw new ArgumentNullException("parent");
```

```csharp
foreach (object c in parent.Controls)
```

```csharp
{
```

```csharp
if (typeof(T).IsInstanceOfType(c))
```

```csharp
yield return (T)c;
```

```csharp
Control ctrl = c as Control;
```

```csharp
if (ctrl != null)
```

```csharp
foreach (T tc in ctrl.GetAllChildControlsWithInterface())
```

```csharp
yield return tc;
```

```csharp
}
```

```csharp
yield break;
```

```csharp
}
```

## Find All Controls With a Given ID

Find every Textbox with an Id of ‘FirstName’ within a repeater….

  
```csharp
public static IEnumerable FindAllControl(this Control parent, string id) where T : Control
```

```csharp
{
```

```csharp
if (string.IsNullOrEmpty(id)) throw new ArgumentNullException("id");
```

```csharp
return parent.GetAllChildControlsOfType()
```

```csharp
.Where(c => string.Equals(c.ID, id, StringComparison.OrdinalIgnoreCase));
```

```csharp
}
```

## Find The First Control with an ID

  
```csharp
public static T FindControl(this Control parent, string id) where T : Control
```

```csharp
{
```

```csharp
return parent.FindAllControl(id).FirstOrDefault();
```

```csharp
}
```