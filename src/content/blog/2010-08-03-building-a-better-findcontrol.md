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
             1: public static IEnumerable GetAllChildControlsOfType(this Control parent) where T : Control

       2: {

       3:    if (parent == null) throw new ArgumentNullException("parent");

       4:    foreach (Control c in parent.Controls)

       5:    {

       6:        if (typeof(T).IsInstanceOfType(c)) yield return (T)c;

       7:        foreach (T tc in c.GetAllChildControlsOfType())

       8:            yield return tc;

       9:    }

      10:    yield break;

      11: }

## Get All Child Controls that Implement a Given Interface

For when you don’t care what the control is, as long as it can do a particular thing….try it with IButtonControl.

  
       1: public static IEnumerable GetAllChildControlsWithInterface(this Control parent)

       2: {

       3:    if (!typeof(T).IsInterface) throw new NotSupportedException(string.Format(CultureInfo.InvariantCulture,"Type '{0}' is not an interface".ToFormattedString(typeof(T).ToString()));

       4:    if (parent == null) throw new ArgumentNullException("parent");

       5:    foreach (object c in parent.Controls)

       6:    {

       7:        if (typeof(T).IsInstanceOfType(c))

       8:            yield return (T)c;

       9:        Control ctrl = c as Control;

      10:        if (ctrl != null)

      11:            foreach (T tc in ctrl.GetAllChildControlsWithInterface())

      12:                yield return tc;

      13:    }

      14:    yield break;

      15: }

## Find All Controls With a Given ID

Find every Textbox with an Id of ‘FirstName’ within a repeater….

  
       1: public static IEnumerable FindAllControl(this Control parent, string id) where T : Control

       2: {

       3:    if (string.IsNullOrEmpty(id)) throw new ArgumentNullException("id");

       4:    return parent.GetAllChildControlsOfType()

       5:        .Where(c => string.Equals(c.ID, id, StringComparison.OrdinalIgnoreCase));

       6: }

## Find The First Control with an ID

  
       1: public static T FindControl(this Control parent, string id) where T : Control

       2: {

       3:    return parent.FindAllControl(id).FirstOrDefault();

       4: }
