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

```csharp
using System;
```

```csharp
using System.Collections.Generic;
```

```csharp
using System.Linq;
```

```csharp
using System.Text;
```

```csharp
using System.Web.UI.HtmlControls;
```

```csharp
using System.Web;
```

```csharp



```csharp
namespace MartinOnDotNet.Web.ControlAdapters
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// Control adapter to ensure the form action persists the rewritten url
```

```csharp
/// 
```

```csharp
public class FormActionRewriterControlAdapter : System.Web.UI.Adapters.ControlAdapter
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// Overrides the  method for the associated control.
```

```csharp
/// 
```

```csharp
/// An  that contains the event data.
```

```csharp
protected override void OnPreRender(EventArgs e)
```

```csharp
{
```

```csharp
HtmlForm form = Control as HtmlForm;
```

```csharp
if (form != null && HttpContext.Current != null)
```

```csharp
{
```

```csharp
form.Action = HttpContext.Current.Request.RawUrl;
```

```csharp
}
```

```csharp
base.OnPreRender(e);
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Generates the target-specific markup for the control to which the control adapter is attached.
```

```csharp
/// 
```

```csharp
/// The  to use to render the target-specific output.
```

```csharp
protected override void Render(System.Web.UI.HtmlTextWriter writer)
```

```csharp
{
```

```csharp



```csharp
base.Render(new RewriteFormActionHtmlTextWriter(writer));
```

```csharp
}
```

```csharp
}
```

```csharp
}
```

You'll notice that the control adapter needs a special HtmlTextWriter implementation to do the actual heavy lifting:

  
```csharp
using System;
```

```csharp
using System.Collections.Generic;
```

```csharp
using System.Linq;
```

```csharp
using System.Text;
```

```csharp
using System.Web;
```

```csharp
using System.Web.UI;
```

```csharp
using System.IO;
```

```csharp



```csharp
namespace MartinOnDotNet.Web.ControlExtensions
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// Specialised  that handles populating the form action attribute appropriately for
```

```csharp
/// url rewriting
```

```csharp
/// 
```

```csharp
public class RewriteFormActionHtmlTextWriter : HtmlTextWriter
```

```csharp
{
```

```csharp
private bool _haveAlreadyWritten;
```

```csharp



```csharp
/// 
```

```csharp
/// Initializes a new instance of the  class.
```

```csharp
/// 
```

```csharp
/// The writer.
```

```csharp
public RewriteFormActionHtmlTextWriter(TextWriter writer) : base(writer) { InnerWriter = writer; }
```

```csharp



```csharp
/// 
```

```csharp
/// Initializes a new instance of the  class.
```

```csharp
/// 
```

```csharp
/// The writer.
```

```csharp
public RewriteFormActionHtmlTextWriter(HtmlTextWriter writer) : base(writer) { InnerWriter = writer.InnerWriter; }
```

```csharp



```csharp
/// 
```

```csharp
/// Writes the specified markup attribute and value to the output stream, and, if specified, writes the value encoded.
```

```csharp
/// 
```

```csharp
/// The markup attribute to write to the output stream.
```

```csharp
/// The value assigned to the attribute.
```

```csharp
/// true to encode the attribute and its assigned value; otherwise, false.
```

```csharp
public override void WriteAttribute(string name, string value, bool fEncode)
```

```csharp
{
```

```csharp
if (string.Equals(name, "action", StringComparison.OrdinalIgnoreCase) && !_haveAlreadyWritten)
```

```csharp
{
```

```csharp



```csharp
value = HttpContext.Current.Request.RawUrl;
```

```csharp
_haveAlreadyWritten = true;
```

```csharp



```csharp
}
```

```csharp
base.WriteAttribute(name, value, fEncode);
```

```csharp
}
```

```csharp
}
```

```csharp
}
```

This is then all registered in your web application with a simple FormAdapter.Browser file in the App_Browsers folder of your Web App.

  
```csharp
browsers>
```

```csharp
browser refID="Default">
```

```csharp
controlAdapters>
```

```csharp
adapter controlType="System.Web.UI.HtmlControls.HtmlForm"
```

```csharp
adapterType="MartinOnDotNet.Web.ControlAdapters.FormActionRewriterControlAdapter" />
```

```csharp



```csharp
controlAdapters>
```

```csharp
browser>
```

```csharp
browsers>
```

These clases/config can now be reused across multiple projects quickly and easily.

Enjoy.
