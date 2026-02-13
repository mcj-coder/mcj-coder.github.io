---
title: 'N2CMS Forum Addon: Fixing the Theme'
description: 'How to fix the N2CMS forum add-on losing its theme on subsequent pages by implementing a custom yaf.IUrlBuilder to preserve the CurrentItem context.'
pubDate: 2010-06-09
tags: ['n2cms']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/06/n2cms-forum-addon-fixing-theme.html'
heroImage: ../../assets/blog/hero-images/2010-06-09-n2cms-forum-addon-fixing-theme.jpg
---

_My work on the VWT2OC site is on hiatus at the moment due to hosting issues so I thought I'd blog a useful fix that I've found._

I've noticed a bug with the Forum Addon. The first page would be correctly themed but any subsequent pages were not when running against a build of the latest N2CMS.

On investigation it seems that the Forum Pages CurrentItem was resolving to null which prevented the ThemeConcern from assigning the correct theme:

```csharp
namespace N2.Templates.Web
{
    /// <summary>
    /// Sets the theme of the page template.
    /// </summary>
    [Service(typeof(TemplateConcern))]
    public class ThemeConcern : TemplateConcern
    {
        public override void OnPreInit(ITemplatePage template)
        {
            var item = template.CurrentItem;
            if (item == null)
                return; // <=== D'oh!  This is why the forum has no theme!

            /* Implementation doesn't matter here as it will never run! */

        }
    }
}
```

Looking into the N2.Templates.dll that comes with the Forum Addon, it looks like things were handled differently back in the day, with the N2.Templates.Web.ThemeModifier just using the theme for the start page:

```csharp
public void Modify<T>(TemplatePage<T> page) where T: AbstractPage
{
    string theme = GenericFind<ContentItem, StartPage>.StartPage.Theme;
    if ((!this.themeVerified && (theme != null)) && Directory.Exists(page.Server.MapPath("~/App_Themes/" + theme)))
    {
        this.themeVerified = true;
    }
    if (this.themeVerified)
    {
        page.Theme = theme;
    }
}
```

So, the fix is to make the forum page take the theme from the start page, without affecting other page types…..tricky whilst maintaining separation of concerns…hmm.

#### The Fix

The fix has to belong with the forum addon so that the change in behaviour doesn't knacker the standard [n2cms](https://www.n2cms.com/) features. N2CMS populates the CurrentItem property based on the current url and as the Forum Plugin is generating links directly to its core template (/Forum/UI/Views/Forum.aspx) this is causing a problem.

Fortunately, the YAF Framework provides an extension point we can use to fix the problem: yaf.IUrlBuilder. This is a simple interface which takes the query string parameters and returns the appropriate link.

```csharp
using System.Web;

namespace N2.Templates.Forum
{
    /// <summary>
    /// Build links from the current page
    /// </summary>
    public class N2UrlLinkBuilder : yaf.IUrlBuilder
    {
        #region IUrlBuilder Members

        /// <summary>
        /// Builds the URL.
        /// </summary>
        /// <param name="url">The URL.</param>
        /// <returns></returns>
        public string BuildUrl(string url)
        {
            return string.Format("{0}?{1}", HttpContext.Current.Request.RawUrl.Split('?')[0], url);
        }

        #endregion
    }
}
```

Unfortunately, YAF doesn't allow you to set the link builder via configuration – it has to be done programmatically. So you'll need to amend '/Forum/UI/Views/Forum.aspx' to ensure it's set:

```csharp
namespace N2.Templates.Forum.UI.Views
{
    public partial class Forum : N2.Templates.Web.UI.TemplatePage<Items.Forum>
    {
        protected override void OnPreInit(EventArgs e)
        {
            if (!(yaf.Config.IsRainbow || yaf.Config.IsDotNetNuke || yaf.Config.IsPortal || yaf.Config.EnableURLRewriting == "true")) // based on logic found in yaf.Config
                HttpContext.Current.Application["yaf_UrlBuilder"] = new N2UrlLinkBuilder();
            base.OnPreInit(e);
        }
    }
}
```

Another possible workaround is to investigate the UrlRewriting….but this looked too involved for the time available.
