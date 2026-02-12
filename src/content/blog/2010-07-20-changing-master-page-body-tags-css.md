---
title: Changing A Master Page Body Tag’s CSS Class For Different Content Pages
description: ''
pubDate: 2010-07-20
tags: ['tips']
source: hugo
originalUrl: 'https://codifice.dev/posts/2010-07-20-changing-master-page-body-tags-css/'
heroImage: ../../assets/blog/hero-images/2010-07-20-changing-master-page-body-tags-css.jpg
---

It seems a bit of a failing of Master Pages that there’s no clear way to assign different CSS classes to the ‘body’ tag based on the Content Page.  To get around this, I’ve taken to inheriting all of my content pages from a known base class (which in turn inherits from System.Web.Page) and then giving it a publically accessible property of ‘BodyCssClass’!

```
{
```

This can then be picked up from the MasterPage and used to modify the body tag:

```
 
```

```
<%@@ Master Language="C#" AutoEventWireup="true" CodeBehind="Global.master.cs" Inherits="MartinOnDotNet.MasterPageBodyClass.Global" %>
```

The class itself can be assigned in the <%@@ Page %> declaration of the Content Pages that implement the MasterPage:

```
MasterPageFile="~/Global.Master"
```

**Attachment: \*\***MasterPageBodyClass.zip\*\*
