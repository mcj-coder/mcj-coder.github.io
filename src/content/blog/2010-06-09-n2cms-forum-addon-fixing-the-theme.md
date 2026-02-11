---
title: "N2CMS Forum Addon: Fixing the Theme"
description: "Technical blog post from 2010-06-09"
pubDate: 2010-06-09
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

*My work on the VWT2OC site is on hiatus at the moment due to hosting issues so I thought I’d blog a useful fix that I’ve found.*
I’ve noticed a bug with the Forum Addon.  The first page would be correctly themed but any subsequent pages were not when running against a build of the latest N2CMS.
On investigation it seems that the Forum Pages CurrentItem was resolving to null which prevented the ThemeConcern for assigning the correct theme:

   1: namespace N2.Templates.Web
   2: {
   3:     /// 
   4:     /// Sets the theme of the page template.
   5:     /// 
   6:     [Service(typeof(TemplateConcern))]
   7:     public class ThemeConcern : TemplateConcern
   8:     {
   9:         public override void OnPreInit(ITemplatePage template)
  10:         {
  11:             var item = template.CurrentItem;
  12:             if (item == null)
  13:                 return; // 
  14:             
  15:             /* Implementation doesn't matter here as it will never run! */
  16:  
  17:         }
  18:     }
  19: }

Looking into the N2.Templates.dll that comes the the Forum Addon, it looks like things were handled differently back in the day, with the N2.Templates.Web.ThemeModifier just using the theme for that start page:

   1: public void Modify(TemplatePage page) where T: AbstractPage
   2: {
   3:     string theme = GenericFind.StartPage.Theme;
   4:     if ((!this.themeVerified && (theme != null)) && Directory.Exists(page.Server.MapPath("~/App_Themes/" + theme)))
   5:     {
   6:         this.themeVerified = true;
   7:     }
   8:     if (this.themeVerified)
   9:     {
  10:         page.Theme = theme;
  11:     }
  12: }
  13:  
  14: /* Taken from Reflector
  15: public void Modify(TemplatePage page) where T: AbstractPage;
  16:  
  17: Declaring Type: N2.Templates.Web.ThemeModifier 
  18: Assembly: N2.Templates, Version=1.0.403.25743 
  19: */

So, the fix is to make the forum page take the theme from the start page, without affecting other page types…..tricky whilst maintaining separation of concerns…hmm.

## 
The Fix

The fix has to belong with the forum addon so that the change in behaviour doesn’t knacker the standard [n2cms](http://bit.ly/aco4m4) features.  N2CMS populates the CurrentItem property based on the current url and as the Forum Plugin is generating links directly to it’s core template (/Forum/UI/Views/Forum.aspx) this is causing a problem.
Fortunately, the YAF Framework provides an extension point we can use to fix the problem yaf.IUrlBuilder.  This is a simple interface which takes the query string parameters and returns the appropriate link.

   1: using System.Web;
   2:  
   3: namespace N2.Templates.Forum
   4: {
   5:     /// 
   6:     /// Build links from the current page
   7:     /// 
   8:     public class N2UrlLinkBuilder : yaf.IUrlBuilder
   9:     {
  10:         #region IUrlBuilder Members
  11:  
  12:         /// 
  13:         /// Builds the URL.
  14:         /// 
  15:         /// The URL.
  16:         /// 
  17:         public string BuildUrl(string url)
  18:         {
  19:             return string.Format("{0}?{1}", HttpContext.Current.Request.RawUrl.Split('?')[0], url);
  20:         }
  21:  
  22:         #endregion
  23:     }
  24: }

Unfortunately, YAF doesn’t allow you to set the link builder via configuration – it has to be done programmatically.  So you’ll need to amend ‘/Forum/UI/Views/Forum.aspx’ to ensure it’s set:

   1: namespace N2.Templates.Forum.UI.Views
   2: {
   3:     public partial class Forum : N2.Templates.Web.UI.TemplatePage
   4:     {
   5:         protected override void OnPreInit(EventArgs e)
   6:         {
   7:             if (!(yaf.Config.IsRainbow || yaf.Config.IsDotNetNuke || yaf.Config.IsPortal || yaf.Config.EnableURLRewriting == "true")) // based on logic found in yaf.Config
   8:                 HttpContext.Current.Application["yaf_UrlBuilder"] = new N2UrlLinkBuilder();
   9:             base.OnPreInit(e);
  10:         }
  11:     }
  12: }

Another possible workaround is to investigate the UrlRewriting….but this look too involved for the time available.
