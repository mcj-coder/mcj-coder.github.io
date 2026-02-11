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

```csharp
var isOffice = document.getElementById("isOfficeDoc");
```

```csharp



```csharp
if ((isOffice != null) && (isOffice.value == "true") && (ShowMultipleUpload() || !IsBrowserIE()))
```

```csharp
{
```

```csharp
g_initialPaneToShow = 'dvSummary';
```

```csharp
var contentTabHeader = document.getElementById("dvContent");
```

```csharp
var contentTabContent = document.getElementById("_dvContent");
```

```csharp
if (contentTabHeader != null)
```

```csharp
contentTabHeader.style.display="none";
```

```csharp
if (contentTabContent != null)
```

```csharp
contentTabContent.style.display="none";
```

```csharp
}
```

Also, comment out the following lines of /workarea/edit.aspx.vb  (~line 1945)

  
```csharp
If (isOfficeDoc.Value = "true") Then
```

```csharp
phContent.Visible = False
```

```csharp
phEditContent.Visible = False
```

```csharp
End If
```

The workarea will now treat office files in the same manner as PDF DMS Assets.

## The Unobtrusive Fix (Unsupported)

Looking at what the official fix achieves does, it all hangs on the value of the “isOffice” hidden field being ‘true’.  Realising this it’s an (almost) trivial task to create an HttpModule to manipulate the control tree of the edit page to get the same effect.  The major advantage of this is that it won’t require modification of Ektron files and can be disabled by simply unregistering the module within the web.config.

  
```csharp
using System;
```

```csharp
using System.Reflection;
```

```csharp
using System.Web;
```

```csharp
using System.Web.UI;
```

```csharp
using System.Web.UI.HtmlControls;
```

```csharp



```csharp
namespace MartinOnDotNet.Support
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// Force OfficeDocuments to be treated as normal DMS Assets
```

```csharp
/// 
```

```csharp
public class OfficeDocumentFixModule : IHttpModule
```

```csharp
{
```

```csharp



```csharp
/// 
```

```csharp
/// Initializes a module and prepares it to handle requests.
```

```csharp
/// 
```

```csharp
/// An  that provides access to the methods, properties, and events common to all application objects within an ASP.NET application
```

```csharp
public void Init(HttpApplication context)
```

```csharp
{
```

```csharp
if (context == null) throw new ArgumentNullException("context");
```

```csharp
context.PreRequestHandlerExecute += new EventHandler(OnPreRequestHandlerExecute);
```

```csharp
}
```

```csharp



```csharp
private void OnPreRequestHandlerExecute(object sender, EventArgs e)
```

```csharp
{
```

```csharp
HttpContext current = HttpContext.Current;
```

```csharp
if (current == null
```

```csharp
|| current.Handler == null
```

```csharp
|| current.Request == null
```

```csharp
|| !current.Request.Url.AbsolutePath.EndsWith("/workarea/edit.aspx", StringComparison.OrdinalIgnoreCase)) return;
```

```csharp



```csharp
Page page = current.Handler as Page;
```

```csharp
page.PreInit += new EventHandler(OnPreInit);
```

```csharp



```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Always return false regardless of actual value
```

```csharp
/// 
```

```csharp
public class AlwaysFalseHiddenField : System.Web.UI.HtmlControls.HtmlInputHidden
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// Gets or sets the value associated with the  control.
```

```csharp
/// 
```

```csharp
/// 
```

```csharp
/// 
```

```csharp
/// The value associated with the .
```

```csharp
/// 
```

```csharp
public override string Value
```

```csharp
{
```

```csharp
get
```

```csharp
{
```

```csharp
return "false";
```

```csharp
}
```

```csharp
set
```

```csharp
{
```

```csharp
base.Value = value;
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

```csharp



```csharp



```csharp



```csharp
/// 
```

```csharp
/// Called when the Page load event fires
```

```csharp
/// 
```

```csharp
/// The sender.
```

```csharp
/// The  instance containing the event data.
```

```csharp
private void OnPreInit(object sender, EventArgs e)
```

```csharp
{
```

```csharp
Page page = sender as Page;
```

```csharp
if (page == null) return;
```

```csharp
PropertyInfo officeDocProperty = page.GetType().GetProperty("isOfficeDoc", BindingFlags.Instance | BindingFlags.NonPublic);
```

```csharp
if (officeDocProperty == null) return;
```

```csharp



```csharp
HtmlInputHidden hil = officeDocProperty.GetValue(page, null) as HtmlInputHidden;
```

```csharp
AlwaysFalseHiddenField fhil = new AlwaysFalseHiddenField();
```

```csharp
fhil.ID = hil.ID;
```

```csharp
fhil.Name = hil.Name;
```

```csharp
fhil.Value="false";
```

```csharp
page.PreRenderComplete += (s, ea) =>
```

```csharp
{
```

```csharp
hil.Value = "false";
```

```csharp
};
```

```csharp
officeDocProperty.SetValue(page, fhil, null);
```

```csharp



```csharp
}
```

```csharp



```csharp



```csharp
/// 
```

```csharp
/// Disposes of the resources (other than memory) used by the module that implements .
```

```csharp
/// 
```

```csharp
public void Dispose()
```

```csharp
{
```

```csharp
//throw new NotImplementedException();
```

```csharp
}
```

```csharp



```csharp



```csharp
}
```

```csharp
}
```

Simply wire up the module in web.config and job’s a good ‘un.
