---
title: "Changing A Master Page Body Tag's CSS Class For Different Content Pages"
description: 'How to dynamically assign different CSS classes to the body tag in ASP.NET Master Pages based on the current Content Page using a BasePage class and OnPreRender override.'
pubDate: 2010-07-20
tags: ['tips']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/07/changing-master-page-body-tags-css.html'
heroImage: ../../assets/blog/hero-images/2010-07-20-changing-master-page-body-tags-css.jpg
---

It seems a bit of a failing of Master Pages that there's no clear way to assign different CSS classes to the 'body' tag based on the Content Page. To get around this, I've taken to inheriting all of my content pages from a known base class (which in turn inherits from System.Web.Page) and then giving it a publicly accessible property of 'BodyCssClass':

```csharp
namespace MartinOnDotNet.MasterPageBodyClass
{
    public class BasePage : System.Web.UI.Page
    {
        public string BodyCssClass { get; set; }
    }
}
```

This can then be picked up from the MasterPage and used to modify the body tag:

```csharp
using System;

namespace MartinOnDotNet.MasterPageBodyClass
{
    public partial class Global : System.Web.UI.MasterPage
    {
        protected override void OnPreRender(EventArgs e)
        {
            base.OnPreRender(e);
            BasePage current = Page as BasePage;
            if (current != null && !string.IsNullOrEmpty(current.BodyCssClass))
            {
                Body.Attributes["class"] = current.BodyCssClass;
            }
        }
    }
}
```

```aspx-cs
<%@ Master Language="C#" AutoEventWireup="true"
    CodeBehind="Global.master.cs"
    Inherits="MartinOnDotNet.MasterPageBodyClass.Global" %>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <asp:ContentPlaceHolder ID="head" runat="server">
    </asp:ContentPlaceHolder>
</head>
<body runat="server" id="Body">
    <form id="form1" runat="server">
    <div>
        <asp:ScriptManager ID="ScriptManager1" runat="server" />
        <asp:ContentPlaceHolder ID="ContentPlaceHolder1" runat="server">
        </asp:ContentPlaceHolder>
    </div>
    </form>
</body>
</html>
```

The class itself can be assigned in the `<%@ Page %>` declaration of the Content Pages that implement the MasterPage:

```aspx-cs
<%@ Page Language="C#"
    MasterPageFile="~/Global.Master"
    AutoEventWireup="true"
    Title="Content Page"
    Inherits="MartinOnDotNet.MasterPageBodyClass.BasePage"
    BodyCssClass="content" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1"
    runat="server">
</asp:Content>
```

[Download the source code](/downloads/2010-07-20-changing-master-page-body-tags-css/MasterPageBodyClass.zip)
