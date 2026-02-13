---
title: 'TIP: How to Handle Form Postbacks when Url Rewriting'
description: 'A reusable ASP.NET Control Adapter that fixes form postback actions to preserve rewritten URLs instead of reverting to the physical page path.'
pubDate: 2010-07-15
tags: ['tips']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/07/tip-how-to-handle-form-postbacks-when.html'
heroImage: ../../assets/blog/hero-images/2010-07-15-tip-how-to-handle-form-postbacks-when.jpg
---

URL Rewriting is great and I love it a lot, you get to create nice readable (and memorable) URLs without having to create hundreds of files. However, there can be issues.

For example, when you post back to a page where the URL has been rewritten, it won't be to the nice alias, it will be to the direct **_page.aspx?id=blah_** location. Which is a bit nasty.

To stop this, I make use of a Control Adapter which alters the rendering logic of the HtmlForm control on every ASP.Net page, to amend the action to be the nice alias.

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web.UI.HtmlControls;
using System.Web;

namespace MartinOnDotNet.Web.ControlAdapters
{
    /// <summary>
    /// Control adapter to ensure the form action persists the rewritten url
    /// </summary>
    public class FormActionRewriterControlAdapter : System.Web.UI.Adapters.ControlAdapter
    {
        /// <summary>
        /// Overrides the OnPreRender method for the associated control.
        /// </summary>
        /// <param name="e">An EventArgs that contains the event data.</param>
        protected override void OnPreRender(EventArgs e)
        {
            HtmlForm form = Control as HtmlForm;
            if (form != null && HttpContext.Current != null)
            {
                form.Action = HttpContext.Current.Request.RawUrl;
            }
            base.OnPreRender(e);
        }

        /// <summary>
        /// Generates the target-specific markup for the control.
        /// </summary>
        /// <param name="writer">The HtmlTextWriter to use to render output.</param>
        protected override void Render(System.Web.UI.HtmlTextWriter writer)
        {
            base.Render(new RewriteFormActionHtmlTextWriter(writer));
        }
    }
}
```

You'll notice that the control adapter needs a special HtmlTextWriter implementation to do the actual heavy lifting:

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.UI;
using System.IO;

namespace MartinOnDotNet.Web.ControlExtensions
{
    /// <summary>
    /// Specialised HtmlTextWriter that handles form action for url rewriting
    /// </summary>
    public class RewriteFormActionHtmlTextWriter : HtmlTextWriter
    {
        private bool _haveAlreadyWritten;

        /// <summary>
        /// Initializes a new instance of the RewriteFormActionHtmlTextWriter.
        /// </summary>
        /// <param name="writer">The writer.</param>
        public RewriteFormActionHtmlTextWriter(TextWriter writer) : base(writer) { InnerWriter = writer; }

        /// <summary>
        /// Initializes a new instance of the RewriteFormActionHtmlTextWriter.
        /// </summary>
        /// <param name="writer">The writer.</param>
        public RewriteFormActionHtmlTextWriter(HtmlTextWriter writer) : base(writer) { InnerWriter = writer.InnerWriter; }

        /// <summary>
        /// Writes the specified markup attribute and value to the output stream.
        /// </summary>
        /// <param name="name">The markup attribute to write to the output stream.</param>
        /// <param name="value">The value assigned to the attribute.</param>
        /// <param name="fEncode">true to encode the attribute and its assigned value; otherwise, false.</param>
        public override void WriteAttribute(string name, string value, bool fEncode)
        {
            if (string.Equals(name, "action", StringComparison.OrdinalIgnoreCase) && !_haveAlreadyWritten)
            {
                value = HttpContext.Current.Request.RawUrl;
                _haveAlreadyWritten = true;
            }
            base.WriteAttribute(name, value, fEncode);
        }
    }
}
```

This is then all registered in your web application with a simple FormAdapter.browser file in the App_Browsers folder of your Web App.

```xml
<browsers>
  <browser refID="Default">
    <controlAdapters>
      <adapter controlType="System.Web.UI.HtmlControls.HtmlForm"
               adapterType="MartinOnDotNet.Web.ControlAdapters.FormActionRewriterControlAdapter" />
    </controlAdapters>
  </browser>
</browsers>
```

These classes/config can now be reused across multiple projects quickly and easily.

Enjoy.
