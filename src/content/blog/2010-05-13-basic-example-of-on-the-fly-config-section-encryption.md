---
title: "Basic Example of On-The-Fly Config Section Encryption"
description: "Technical blog post from 2010-05-13"
pubDate: 2010-05-13
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

I recently answered a question about how you could securely modify a value within an encrypted configuration website without having to create a duplicate config file.  Well, the answer’s pretty simple and straightforward – just use the API!

  A quick example page could be:

```csharp



```csharp



```csharp
DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
```

```csharp
html xmlns="http://www.w3.org/1999/xhtml">
```

```csharp
head runat="server">
```

```csharp
title>title>
```

```csharp
head>
```

```csharp
body>
```

```csharp
form id="form1" runat="server">
```

```csharp
div>
```

```csharp
asp:Button ID="EncryptButton" runat="server" Text="Encrypt" OnClick="EncryptButton_Click" />
```

```csharp
asp:Button ID="DecryptButton" runat="server" Text="Decrypt" OnClick="DecryptButton_Click" />
```

```csharp
asp:Button ID="IncrementButton" runat="server" Text="Increment" OnClick="IncrementButton_Click" />
```

```csharp
asp:Label ID="CountLabel" runat="server" Text="0">asp:Label>
```

```csharp
br />
```

```csharp
asp:Label ID="StatusLabel" runat="server" Text="" EnableViewState="false">asp:Label>
```

```csharp
div>
```

```csharp
form>
```

```csharp
body>
```

```csharp
html>
```
  
```csharp
using System;
```

```csharp
using System.Configuration;
```

```csharp
using System.Linq;
```

```csharp
using System.Web.Configuration;
```

```csharp



```csharp
public partial class _Default : System.Web.UI.Page
```

```csharp
{
```

```csharp



```csharp
/// 
```

```csharp
/// Handles the PreRender event of the Page control.
```

```csharp
/// 
```

```csharp
/// The source of the event.
```

```csharp
/// The  instance containing the event data.
```

```csharp
protected void Page_PreRender(object sender, EventArgs e)
```

```csharp
{
```

```csharp



```csharp



```csharp
Configuration confg = WebConfigurationManager.OpenWebConfiguration(Request.ApplicationPath);
```

```csharp
ConfigurationSection confStrSect = confg.GetSection(sectionKey);
```

```csharp
StatusLabel.Text = "No Config Section";
```

```csharp
if (confStrSect != null)
```

```csharp
{
```

```csharp
StatusLabel.Text = "Decrypted";
```

```csharp
if (confStrSect.SectionInformation.IsProtected)
```

```csharp
{
```

```csharp
StatusLabel.Text = "Encrypted";
```

```csharp
}
```

```csharp
int count = 0;
```

```csharp
int.TryParse(confg.AppSettings.Settings[countKey].Value, out count);
```

```csharp
CountLabel.Text = count.ToString();
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



```csharp
string providerKey = "RSAProtectedConfigurationProvider";
```

```csharp
string sectionKey = "appSettings";
```

```csharp
string countKey = "Count";
```

```csharp



```csharp
/// 
```

```csharp
/// Handles the Click event of the EncryptButton control.
```

```csharp
/// 
```

```csharp
/// The source of the event.
```

```csharp
/// The  instance containing the event data.
```

```csharp
protected void EncryptButton_Click(object sender, EventArgs e)
```

```csharp
{
```

```csharp
Configuration confg = WebConfigurationManager.OpenWebConfiguration(Request.ApplicationPath);
```

```csharp
ConfigurationSection confStrSect = confg.GetSection(sectionKey);
```

```csharp
if (confStrSect != null)
```

```csharp
{
```

```csharp
confStrSect.SectionInformation.ProtectSection(providerKey);
```

```csharp
confg.Save();
```

```csharp
}
```

```csharp
}
```

```csharp
/// 
```

```csharp
/// Handles the Click event of the DecryptButton control.
```

```csharp
/// 
```

```csharp
/// The source of the event.
```

```csharp
/// The  instance containing the event data.
```

```csharp
protected void DecryptButton_Click(object sender, EventArgs e)
```

```csharp
{
```

```csharp
Configuration confg = WebConfigurationManager.OpenWebConfiguration(Request.ApplicationPath);
```

```csharp
ConfigurationSection confStrSect = confg.GetSection(sectionKey);
```

```csharp
if (confStrSect != null && confStrSect.SectionInformation.IsProtected)
```

```csharp
{
```

```csharp
confStrSect.SectionInformation.UnprotectSection();
```

```csharp
confg.Save();
```

```csharp
}
```

```csharp
}
```

```csharp
/// 
```

```csharp
/// Handles the Click event of the IncrementButton control.
```

```csharp
/// 
```

```csharp
/// The source of the event.
```

```csharp
/// The  instance containing the event data.
```

```csharp
protected void IncrementButton_Click(object sender, EventArgs e)
```

```csharp
{
```

```csharp
int count = 0;
```

```csharp
int.TryParse(WebConfigurationManager.AppSettings[countKey], out count);
```

```csharp
count++;
```

```csharp



```csharp
Configuration confg = WebConfigurationManager.OpenWebConfiguration(Request.ApplicationPath);
```

```csharp
ConfigurationSection confStrSect = confg.GetSection(sectionKey);
```

```csharp
{
```

```csharp
if (confg.AppSettings.Settings.AllKeys.Contains(countKey))
```

```csharp
{
```

```csharp
confg.AppSettings.Settings[countKey].Value = count.ToString();
```

```csharp
}
```

```csharp
else
```

```csharp
{
```

```csharp
confg.AppSettings.Settings.Add(countKey, count.ToString());
```

```csharp
}
```

```csharp
confg.Save(ConfigurationSaveMode.Modified);
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

Simples.
