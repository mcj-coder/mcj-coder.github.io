---
title: "Changing A Master Page Body Tag’s CSS Class For Different Content Pages"
description: "Technical blog post from 2010-07-20"
pubDate: 2010-07-20
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

It seems a bit of a failing of Master Pages that there’s no clear way to assign different CSS classes to the ‘body’ tag based on the Content Page.  To get around this, I’ve taken to inheriting all of my content pages from a known base class (which in turn inherits from System.Web.Page) and then giving it a publically accessible property of ‘BodyCssClass’!

             1: namespace MartinOnDotNet.MasterPageBodyClass

       2: {

       3:     public class BasePage : System.Web.UI.Page

       4:     {

       5:         public string BodyCssClass { get; set; }

       6:  

       7:     }

       8: }

This can then be picked up from the MasterPage and used to modify the body tag:

  
       1: using System;

       2:  

       3: namespace MartinOnDotNet.MasterPageBodyClass

       4: {

       5:     public partial class Global : System.Web.UI.MasterPage

       6:     {

       7:         protected override void OnPreRender(EventArgs e)

       8:         {

       9:             base.OnPreRender(e);

      10:             BasePage current = Page as BasePage;

      11:             if (current != null && !string.IsNullOrEmpty(current.BodyCssClass))

      12:             {

      13:                 Body.Attributes["class"] = current.BodyCssClass;

      14:             }

      15:         }

      16:     }

      17: }

  
       1: 

       2: DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

       3: html xmlns="http://www.w3.org/1999/xhtml" >

       4: head runat="server">

       5:     asp:ContentPlaceHolder ID="head" runat="server">

       6:     asp:ContentPlaceHolder>

       7: head>

       8: body runat="server" id="Body">

       9:     form id="form1" runat="server">

      10:     div>

      11:         asp:ScriptManager ID="ScriptManager1" runat="server" />

      12:         asp:ContentPlaceHolder ID="ContentPlaceHolder1" runat="server">

      13:         

      14:         asp:ContentPlaceHolder>

      15:     div>

      16:     form>

      17: body>

      18: html>

The class itself can be assigned in the  declaration of the Content Pages that implement the MasterPage:

  
       1: 

       2:     MasterPageFile="~/Global.Master" 

       3:     AutoEventWireup="true" 

       4:     Title="Content Page" 

       5:     Inherits="MartinOnDotNet.MasterPageBodyClass.BasePage"

       6:     BodyCssClass="content" %>

       7:  

       8: asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">

       9: asp:Content>

      10: asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="server">

      11: asp:Content>

**Attachment: **[**MasterPageBodyClass.zip**](http://bit.ly/dpVZaW)
