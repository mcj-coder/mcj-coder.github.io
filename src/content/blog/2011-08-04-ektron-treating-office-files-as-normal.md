---
title: 'Ektron: Treating Office Files as Normal DMS Assets'
description: 'How to treat Office files as normal DMS assets in Ektron CMS instead of using the tight office integration, with both manual and unobtrusive HttpModule-based fixes.'
pubDate: 2011-08-04
tags: ['ektron']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2011/08/ektron-treating-office-files-as-normal.html'
heroImage: ../../assets/blog/hero-images/2011-08-04-ektron-treating-office-files-as-normal.jpg
---

One of the features of Ektron is tight office integration allowing the editing of office files directly from the workarea. However, in some circumstances you may want to treat these as normal DMS assets (like PDF files) as their the end results of an offline publishing process.

The Ektron support fix for this is to modify the workarea files (detailed below), which would then need to be re-applied with every upgrade. This is easy enough to do (if you remember to do it with each upgrade), but I would prefer a more unobtrusive fix which is applied via configuration.

#### The Manual Fix (Ektron Supported)

Edit /workarea/edit.aspx and comment out the following lines (~line 2110):

```javascript
var isOffice = document.getElementById('isOfficeDoc');

if (isOffice != null && isOffice.value == 'true' && (ShowMultipleUpload() || !IsBrowserIE())) {
  g_initialPaneToShow = 'dvSummary';
  var contentTabHeader = document.getElementById('dvContent');
  var contentTabContent = document.getElementById('_dvContent');
  if (contentTabHeader != null) contentTabHeader.style.display = 'none';
  if (contentTabContent != null) contentTabContent.style.display = 'none';
}
```

Also, comment out the following lines of /workarea/edit.aspx.vb (~line 1945):

```vb
If (isOfficeDoc.Value = "true") Then
    phContent.Visible = False
    phEditContent.Visible = False
End If
```

The workarea will now treat office files in the same manner as PDF DMS Assets.

#### The Unobtrusive Fix (Unsupported)

Looking at what the official fix achieves does, it all hangs on the value of the "isOffice" hidden field being 'true'. Realising this it's an (almost) trivial task to create an HttpModule to manipulate the control tree of the edit page to get the same effect. The major advantage of this is that it won't require modification of Ektron files and can be disabled by simply unregistering the module within the web.config.

```csharp
using System;
using System.Reflection;
using System.Web;
using System.Web.UI;
using System.Web.UI.HtmlControls;

namespace MartinOnDotNet.Support
{
    /// <summary>
    /// Force OfficeDocuments to be treated as normal DMS Assets
    /// </summary>
    public class OfficeDocumentFixModule : IHttpModule
    {

        /// <summary>
        /// Initializes a module and prepares it to handle requests.
        /// </summary>
        /// <param name="context">An <see cref="T:System.Web.HttpApplication"/> that provides access to the methods, properties, and events common to all application objects within an ASP.NET application</param>
        public void Init(HttpApplication context)
        {
            if (context == null) throw new ArgumentNullException("context");
            context.PreRequestHandlerExecute += new EventHandler(OnPreRequestHandlerExecute);
        }

        private void OnPreRequestHandlerExecute(object sender, EventArgs e)
        {
            HttpContext current = HttpContext.Current;
            if (current == null
                || current.Handler == null
                || current.Request == null
                || !current.Request.Url.AbsolutePath.EndsWith("/workarea/edit.aspx", StringComparison.OrdinalIgnoreCase)) return;

            Page page = current.Handler as Page;
            page.PreInit += new EventHandler(OnPreInit);
        }

        /// <summary>
        /// Always return false regardless of actual value
        /// </summary>
        public class AlwaysFalseHiddenField : System.Web.UI.HtmlControls.HtmlInputHidden
        {
            /// <summary>
            /// Gets or sets value associated with <see cref="T:System.Web.UI.HtmlControls.HtmlInputControl"/> control.
            /// </summary>
            /// <value></value>
            /// <returns>
            /// The value associated with <see cref="T:System.Web.UI.HtmlControls.HtmlInputControl"/>.
            /// </returns>
            public override string Value
            {
                get
                {
                    return "false";
                }
                set
                {
                    base.Value = value;
                }
            }
        }



        /// <summary>
        /// Called when [Page] load event fires
        /// </summary>
        /// <param name="sender">The sender.</param>
        /// <param name="e">The <see cref="System.EventArgs"/> instance containing the event data.</param>
        private void OnPreInit(object sender, EventArgs e)
        {
            Page page = sender as Page;
            if (page == null) return;
            PropertyInfo officeDocProperty = page.GetType().GetProperty("isOfficeDoc", BindingFlags.Instance | BindingFlags.NonPublic);
            if (officeDocProperty == null) return;

            HtmlInputHidden hil = officeDocProperty.GetValue(page, null) as HtmlInputHidden;
            AlwaysFalseHiddenField fhil = new AlwaysFalseHiddenField();
            fhil.ID = hil.ID;
            fhil.Name = hil.Name;
            fhil.Value="false";
            page.PreRenderComplete += (s, ea) =>
                {
                    hil.Value = "false";
                };
            officeDocProperty.SetValue(page, fhil, null);

        }



        /// <summary>
        /// Disposes of the resources (other than memory) used by the module that implements <see cref="T:System.Web.IHttpModule"/>.
        /// </summary>
        public void Dispose()
        {
            //throw new NotImplementedException();
        }



    }
}
```

Simply wire up the module in web.config and job's a good 'un.
