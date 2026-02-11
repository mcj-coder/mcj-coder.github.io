---
title: "TIP: How to Handle Form Postbacks when Url Rewriting"
description: "Technical blog post from 2010-07-15"
pubDate: 2010-07-15
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

Url Rewriting is great and I love it a lot, you get to create nice readable (and memorable) urls without having to create hundred of files.  However, there can be issues.  

  For example, when you post back to a page where the url has been rewritten, it won’t be to the nice alias, it will be to the direct ***page.aspx?id=blah ***location.  Which is a bit nasty.

  To stop this, I make use of a Control Adapters which alters the rendering logic of the HtmlForm control on every ASP.Net page, to amend the action to be the nice alias.

             1: using System;

       2: using System.Collections.Generic;

       3: using System.Linq;

       4: using System.Text;

       5: using System.Web.UI.HtmlControls;

       6: using System.Web;

       7:  

       8: namespace MartinOnDotNet.Web.ControlAdapters

       9: {

      10:     /// 

      11:     /// Control adapter to ensure the form action persists the rewritten url

      12:     /// 

      13:     public class FormActionRewriterControlAdapter : System.Web.UI.Adapters.ControlAdapter

      14:     {

      15:         /// 

      16:         /// Overrides the  method for the associated control.

      17:         /// 

      18:         /// An  that contains the event data.

      19:         protected override void OnPreRender(EventArgs e)

      20:         {

      21:             HtmlForm form = Control as HtmlForm;

      22:             if (form != null && HttpContext.Current != null)

      23:             {

      24:                 form.Action = HttpContext.Current.Request.RawUrl;

      25:             }

      26:             base.OnPreRender(e);

      27:         }

      28:  

      29:         /// 

      30:         /// Generates the target-specific markup for the control to which the control adapter is attached.

      31:         /// 

      32:         /// The  to use to render the target-specific output.

      33:         protected override void Render(System.Web.UI.HtmlTextWriter writer)

      34:         {

      35:  

      36:             base.Render(new RewriteFormActionHtmlTextWriter(writer));

      37:         }

      38:     }

      39: }

You'll notice that the control adapter needs a special HtmlTextWriter implementation to do the actual heavy lifting:

  
       1: using System;

       2: using System.Collections.Generic;

       3: using System.Linq;

       4: using System.Text;

       5: using System.Web;

       6: using System.Web.UI;

       7: using System.IO;

       8:  

       9: namespace MartinOnDotNet.Web.ControlExtensions

      10: {

      11:     /// 

      12:     /// Specialised  that handles populating the form action attribute appropriately for

      13:     /// url rewriting

      14:     /// 

      15:     public class RewriteFormActionHtmlTextWriter : HtmlTextWriter

      16:     {

      17:         private bool _haveAlreadyWritten;

      18:  

      19:         /// 

      20:         /// Initializes a new instance of the  class.

      21:         /// 

      22:         /// The writer.

      23:         public RewriteFormActionHtmlTextWriter(TextWriter writer) : base(writer) { InnerWriter = writer; }

      24:        

      25:         /// 

      26:         /// Initializes a new instance of the  class.

      27:         /// 

      28:         /// The writer.

      29:         public RewriteFormActionHtmlTextWriter(HtmlTextWriter writer) : base(writer) { InnerWriter = writer.InnerWriter; }

      30:  

      31:         /// 

      32:         /// Writes the specified markup attribute and value to the output stream, and, if specified, writes the value encoded.

      33:         /// 

      34:         /// The markup attribute to write to the output stream.

      35:         /// The value assigned to the attribute.

      36:         /// true to encode the attribute and its assigned value; otherwise, false.

      37:         public override void WriteAttribute(string name, string value, bool fEncode)

      38:         {

      39:             if (string.Equals(name, "action", StringComparison.OrdinalIgnoreCase) && !_haveAlreadyWritten)

      40:             {

      41:  

      42:                 value = HttpContext.Current.Request.RawUrl;

      43:                 _haveAlreadyWritten = true;

      44:  

      45:             }

      46:             base.WriteAttribute(name, value, fEncode);

      47:         }

      48:     }

      49: }

This is then all registered in your web application with a simple FormAdapter.Browser file in the App_Browsers folder of your Web App.

  
       1: browsers>

       2:   browser refID="Default">

       3:     controlAdapters>

       4:       adapter controlType="System.Web.UI.HtmlControls.HtmlForm"

       5:                adapterType="MartinOnDotNet.Web.ControlAdapters.FormActionRewriterControlAdapter" />

       6:             

       7:     controlAdapters>

       8:   browser>

       9: browsers>

These clases/config can now be reused across multiple projects quickly and easily.

Enjoy.
