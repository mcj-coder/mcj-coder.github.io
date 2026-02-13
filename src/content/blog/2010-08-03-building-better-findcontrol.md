---
title: Building a Better FindControl
description: 'Generic C# extension methods for recursively finding ASP.NET controls by type, interface, or ID within databound templated controls like the Repeater.'
pubDate: 2010-08-03
tags: ['tips']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/08/building-better-findcontrol.html'
heroImage: ../../assets/blog/hero-images/2010-08-03-building-better-findcontrol.jpg
---

There are times in any semi-advanced ASP.NET developer's life when they're working with databound templated controls (such as the Repeater) and they need to find a control without knowing where it is, or even if it's there.

Normally, you're reduced to using the standard FindControl method available on any control. But this only finds controls with a given id within the same NamingContainer.

I've written some extension methods to try and get around the (many) issues that I've had with FindControl and hopefully people will find them useful.

#### Get All Child Controls of a Given Type

```csharp
public static IEnumerable<T> GetAllChildControlsOfType<T>(this Control parent) where T : Control
{
    if (parent == null) throw new ArgumentNullException("parent");
    foreach (Control c in parent.Controls)
    {
        if (typeof(T).IsInstanceOfType(c)) yield return (T)c;
        foreach (T tc in c.GetAllChildControlsOfType<T>())
            yield return tc;
    }
    yield break;
}
```

#### Get All Child Controls that Implement a Given Interface

For when you don't care what the control is, as long as it can do a particular thing….try it with IButtonControl.

```csharp
public static IEnumerable<T> GetAllChildControlsWithInterface<T>(this Control parent)
{
    if (!typeof(T).IsInterface) throw new NotSupportedException(string.Format(CultureInfo.InvariantCulture,"Type '{0}' is not an interface".ToFormattedString(typeof(T).ToString()));
    if (parent == null) throw new ArgumentNullException("parent");
    foreach (object c in parent.Controls)
    {
        if (typeof(T).IsInstanceOfType(c))
            yield return (T)c;
        Control ctrl = c as Control;
        if (ctrl != null)
            foreach (T tc in ctrl.GetAllChildControlsWithInterface<T>())
                yield return tc;
    }
    yield break;
}
```

#### Find All Controls With a Given ID

Find every Textbox with an Id of 'FirstName' within a repeater….

```csharp
public static IEnumerable<T> FindAllControl<T>(this Control parent, string id) where T : Control
{
    if (string.IsNullOrEmpty(id)) throw new ArgumentNullException("id");
    return parent.GetAllChildControlsOfType<T>()
        .Where(c => string.Equals(c.ID, id, StringComparison.OrdinalIgnoreCase));
}
```

#### Find The First Control with an ID

```csharp
public static T FindControl<T>(this Control parent, string id) where T : Control
{
    return parent.FindAllControl<T>(id).FirstOrDefault();
}
```
