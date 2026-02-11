---
title: "Ektron: Treating Office Files as Normal DMS Assets"
description: "Technical blog post from 2011-08-04"
pubDate: 2011-08-04
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

One of the features of [Ektron](http://bit.ly/d0YHh7) is tight office integration allowing the editing of office files directly from the workarea.  However, in some circumstances you may want to treat these as normal DMS assets (like PDF files) as their the end results of an offline publishing process.

  The Ektron support fix for this is to modify the workarea files (detailed below), which would then need to be re-applyed with every upgrade.  This is easy enough to do (if you remember to do it with each upgrade), but I would prefer a more unobtrusive fix which is applied via configuration.

  
## The Manual Fix (Ektron Supported)
  Edit /workarea/edit.aspx and comment out the following lines (~line 2110):

             1: var isOffice = document.getElementById("isOfficeDoc");

       2:  

       3: if ((isOffice != null) && (isOffice.value == "true") && (ShowMultipleUpload() || !IsBrowserIE()))

       4: {

       5:     g_initialPaneToShow = 'dvSummary';

       6:     var contentTabHeader = document.getElementById("dvContent");

       7:     var contentTabContent = document.getElementById("_dvContent");

       8:     if (contentTabHeader != null)

       9:        contentTabHeader.style.display="none";

      10:     if (contentTabContent != null)

      11:        contentTabContent.style.display="none";

      12: }

Also, comment out the following lines of /workarea/edit.aspx.vb  (~line 1945)

  
       1: If (isOfficeDoc.Value = "true") Then

       2:     phContent.Visible = False

       3:     phEditContent.Visible = False

       4: End If

The workarea will now treat office files in the same manner as PDF DMS Assets.

## The Unobtrusive Fix (Unsupported)

Looking at what the official fix achieves does, it all hangs on the value of the “isOffice” hidden field being ‘true’.  Realising this it’s an (almost) trivial task to create an HttpModule to manipulate the control tree of the edit page to get the same effect.  The major advantage of this is that it won’t require modification of Ektron files and can be disabled by simply unregistering the module within the web.config.

  
       1: using System;

       2: using System.Reflection;

       3: using System.Web;

       4: using System.Web.UI;

       5: using System.Web.UI.HtmlControls;

       6:  

       7: namespace MartinOnDotNet.Support

       8: {

       9:     /// 

      10:     /// Force OfficeDocuments to be treated as normal DMS Assets

      11:     /// 

      12:     public class OfficeDocumentFixModule : IHttpModule

      13:     {

      14:  

      15:         /// 

      16:         /// Initializes a module and prepares it to handle requests.

      17:         /// 

      18:         /// An  that provides access to the methods, properties, and events common to all application objects within an ASP.NET application

      19:         public void Init(HttpApplication context)

      20:         {

      21:             if (context == null) throw new ArgumentNullException("context");

      22:             context.PreRequestHandlerExecute += new EventHandler(OnPreRequestHandlerExecute);

      23:         }

      24:  

      25:         private void OnPreRequestHandlerExecute(object sender, EventArgs e)

      26:         {

      27:             HttpContext current = HttpContext.Current;

      28:             if (current == null

      29:                 || current.Handler == null

      30:                 || current.Request == null

      31:                 || !current.Request.Url.AbsolutePath.EndsWith("/workarea/edit.aspx", StringComparison.OrdinalIgnoreCase)) return;

      32:  

      33:             Page page = current.Handler as Page;

      34:             page.PreInit += new EventHandler(OnPreInit);

      35:  

      36:         }

      37:  

      38:         /// 

      39:         /// Always return false regardless of actual value

      40:         /// 

      41:         public class AlwaysFalseHiddenField : System.Web.UI.HtmlControls.HtmlInputHidden

      42:         {

      43:             /// 

      44:             /// Gets or sets the value associated with the  control.

      45:             /// 

      46:             /// 

      47:             /// 

      48:             /// The value associated with the .

      49:             /// 

      50:             public override string Value

      51:             {

      52:                 get

      53:                 {

      54:                     return "false";

      55:                 }

      56:                 set

      57:                 {

      58:                     base.Value = value;

      59:                 }

      60:             }

      61:         }

      62:  

      63:  

      64:  

      65:         /// 

      66:         /// Called when the Page load event fires

      67:         /// 

      68:         /// The sender.

      69:         /// The  instance containing the event data.

      70:         private void OnPreInit(object sender, EventArgs e)

      71:         {

      72:             Page page = sender as Page;

      73:             if (page == null) return;

      74:             PropertyInfo officeDocProperty = page.GetType().GetProperty("isOfficeDoc", BindingFlags.Instance | BindingFlags.NonPublic);

      75:             if (officeDocProperty == null) return;

      76:  

      77:             HtmlInputHidden hil = officeDocProperty.GetValue(page, null) as HtmlInputHidden;

      78:             AlwaysFalseHiddenField fhil = new AlwaysFalseHiddenField();

      79:             fhil.ID = hil.ID;

      80:             fhil.Name = hil.Name;

      81:             fhil.Value="false";

      82:             page.PreRenderComplete += (s, ea) =>

      83:                 {

      84:                     hil.Value = "false";

      85:                 };

      86:             officeDocProperty.SetValue(page, fhil, null);

      87:  

      88:         }

      89:  

      90:  

      91:         /// 

      92:         /// Disposes of the resources (other than memory) used by the module that implements .

      93:         /// 

      94:         public void Dispose()

      95:         {

      96:             //throw new NotImplementedException();

      97:         }

      98:  

      99:  

     100:     }

     101: }

Simply wire up the module in web.config and job’s a good ‘un.
