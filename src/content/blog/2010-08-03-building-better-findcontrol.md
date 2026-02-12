---
title: Building a Better FindControl
description: ''
pubDate: 2010-08-03
tags: ['tips']
source: hugo
originalUrl: 'https://codifice.dev/posts/2010-08-03-building-better-findcontrol/'
heroImage: ../../assets/blog/hero-images/2010-08-03-building-better-findcontrol.jpg
---

There are times in any semi-advanced ASP.NET developers life when they’re working with databound templated controls (such as the Repeater) and they need to find a control without knowing where it is, or even if its there.

Normally, you’re reduced to using the standard FindControl method available on any control.  But this only finds controls with a given id within the same NamingContainer.

I’ve written some extension methods to try and get around the (many) issues that I’ve had with FindControl and hopefully people will find them useful.

#### Get All Child Controls of a Given Type

```
{
```

#### Get All Child Controls that Implement a Given Interface

For when you don’t care what the control is, as long as it can do a particular thing….try it with IButtonControl.

```
{
```

#### Find All Controls With a Given ID

Find every Textbox with an Id of ‘FirstName’ within a repeater….

```
public static IEnumerable<T> FindAllControl<T>(this Control parent, string id) where T : Control
```

#### Find The First Control with an ID

```
public static T FindControl<T>(this Control parent, string id) where T : Control
```
