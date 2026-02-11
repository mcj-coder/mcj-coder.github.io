---
title: "Tip: Constructing Private Types"
description: "Technical blog post from 2010-06-16"
pubDate: 2010-06-16
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

I recently needed to create an instance of the System.Web.StaticFileHandler.  This is a bit difficult as the class is internal so reflection must be used:

             1: private static IHttpHandler _staticFileHandler;

       2:  

       3: private static IHttpHandler StaticFileHandler

       4: {

       5:     get

       6:     {

       7:         if (_staticFileHandler == null)

       8:         {

       9:             Assembly systemWeb = typeof(IHttpHandler).Assembly;

      10:             /* If you don't have a public type to reference a lookup like this could be done

      11:                 Assembly systemWeb = AppDomain.CurrentDomain.GetAssemblies()

      12:                     .Where(ass => ass.GetName().Name == "System.Web")

      13:                     .First();

      14:             */

      15:          

      16:             Type staticFileHandler = systemWeb.GetType("System.Web.StaticFileHandler");

      17:                         ConstructorInfo ci = staticFileHandler.GetConstructor(

      18:                             BindingFlags.NonPublic | BindingFlags.Instance

      19:                             , null

      20:                             , Type.EmptyTypes

      21:                             , null);

      22:             _staticFileHandler = ci.Invoke(null) as IHttpHandler;

      23:             if (_staticFileHandler == null) throw new NotSupportedException("System.Web must contain System.Web.StaticFileHandler");

      24:         }

      25:         return _staticFileHandler;

      26:     }

      27: }

      28:  

      29: /*

      30: using System;

      31: using System.Linq;

      32: using System.Reflection;

      33: using System.Web;

      34: */

Hope it helps.
