---
title: "Changing A Master Page Body Tag’s CSS Class For Different Content Pages"
description: "Technical blog post from 2010-07-20"
pubDate: 2010-07-20
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

It seems a bit of a failing of Master Pages that there’s no clear way to assign different CSS classes to the ‘body’ tag based on the Content Page.  To get around this, I’ve taken to inheriting all of my content pages from a known base class (which in turn inherits from System.Web.Page) and then giving it a publically accessible property of ‘BodyCssClass’!

```csharp
namespace MartinOnDotNet.MasterPageBodyClass
```

```csharp
{
```

```csharp
public class BasePage : System.Web.UI.Page
```

```csharp
{
```

```csharp
public string BodyCssClass { get; set; }
```

```csharp



```csharp
}
```

```csharp
}
```

This can then be picked up from the MasterPage and used to modify the body tag:

  
```csharp
using System;
```

```csharp



```csharp
namespace MartinOnDotNet.MasterPageBodyClass
```

```csharp
{
```

```csharp
public partial class Global : System.Web.UI.MasterPage
```

```csharp
{
```

```csharp
protected override void OnPreRender(EventArgs e)
```

```csharp
{
```

```csharp
base.OnPreRender(e);
```

```csharp
BasePage current = Page as BasePage;
```

```csharp
if (current != null && !string.IsNullOrEmpty(current.BodyCssClass))
```

```csharp
{
```

```csharp
Body.Attributes["class"] = current.BodyCssClass;
```

```csharp
}
```

```csharp
}
```

```csharp
}
```

```csharp
}
```
  
```csharp



```csharp
DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
```

```csharp
html xmlns="http://www.w3.org/1999/xhtml" >
```

```csharp
head runat="server">
```

```csharp
asp:ContentPlaceHolder ID="head" runat="server">
```

```csharp
asp:ContentPlaceHolder>
```

```csharp
head>
```

```csharp
body runat="server" id="Body">
```

```csharp
form id="form1" runat="server">
```

```csharp
div>
```

```csharp
asp:ScriptManager ID="ScriptManager1" runat="server" />
```

```csharp
asp:ContentPlaceHolder ID="ContentPlaceHolder1" runat="server">
```

```csharp



```csharp
asp:ContentPlaceHolder>
```

```csharp
div>
```

```csharp
form>
```

```csharp
body>
```

```csharp
html>
```

The class itself can be assigned in the  declaration of the Content Pages that implement the MasterPage:

  
```csharp



```csharp
MasterPageFile="~/Global.Master" 
```

```csharp
AutoEventWireup="true" 
```

```csharp
Title="Content Page" 
```

```csharp
Inherits="MartinOnDotNet.MasterPageBodyClass.BasePage"
```

```csharp
BodyCssClass="content" %>
```

```csharp



```csharp
asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
```

```csharp
asp:Content>
```

```csharp
asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="server">
```

```csharp
asp:Content>
```

**Attachment: **[**MasterPageBodyClass.zip**](http://bit.ly/dpVZaW)
