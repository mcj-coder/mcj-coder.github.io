---
title: Basic Example of On-The-Fly Config Section Encryption
description: 'A simple ASP.NET example showing how to encrypt, decrypt, and modify values within an encrypted web.config section using the Configuration API.'
pubDate: 2010-05-13
tags: ['aspnet']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/05/basic-example-of-on-fly-config-section.html'
heroImage: ../../assets/blog/hero-images/2010-05-13-basic-example-of-on-fly-config-section.jpg
---

I recently answered a question about how you could securely modify a value within an encrypted configuration website without having to create a duplicate config file. Well, the answer's pretty simple and straightforward – just use the API!

A quick example page could be:

```aspx
<%@ Page Language="C#" AutoEventWireup="true" CodeFile="Default.aspx.cs" Inherits="_Default" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title></title>
</head>
<body>
    <form id="form1" runat="server">
    <div>
        <asp:Button ID="EncryptButton" runat="server" Text="Encrypt" OnClick="EncryptButton_Click" />
        <asp:Button ID="DecryptButton" runat="server" Text="Decrypt" OnClick="DecryptButton_Click" />
        <asp:Button ID="IncrementButton" runat="server" Text="Increment" OnClick="IncrementButton_Click" />
        <asp:Label ID="CountLabel" runat="server" Text="0"></asp:Label>
        <br />
        <asp:Label ID="StatusLabel" runat="server" Text="" EnableViewState="false"></asp:Label>
    </div>
    </form>
</body>
</html>
```

```csharp
using System;
using System.Configuration;
using System.Linq;
using System.Web.Configuration;

public partial class _Default : System.Web.UI.Page
{
    string providerKey = "RSAProtectedConfigurationProvider";
    string sectionKey = "appSettings";
    string countKey = "Count";

    protected void Page_PreRender(object sender, EventArgs e)
    {
        Configuration confg = WebConfigurationManager.OpenWebConfiguration(Request.ApplicationPath);
        ConfigurationSection confStrSect = confg.GetSection(sectionKey);
        StatusLabel.Text = "No Config Section";
        if (confStrSect != null)
        {
            StatusLabel.Text = "Decrypted";
            if (confStrSect.SectionInformation.IsProtected)
            {
                StatusLabel.Text = "Encrypted";
            }
            int count = 0;
            int.TryParse(confg.AppSettings.Settings[countKey].Value, out count);
            CountLabel.Text = count.ToString();
        }
    }

    protected void EncryptButton_Click(object sender, EventArgs e)
    {
        Configuration confg = WebConfigurationManager.OpenWebConfiguration(Request.ApplicationPath);
        ConfigurationSection confStrSect = confg.GetSection(sectionKey);
        if (confStrSect != null)
        {
            confStrSect.SectionInformation.ProtectSection(providerKey);
            confg.Save();
        }
    }

    protected void DecryptButton_Click(object sender, EventArgs e)
    {
        Configuration confg = WebConfigurationManager.OpenWebConfiguration(Request.ApplicationPath);
        ConfigurationSection confStrSect = confg.GetSection(sectionKey);
        if (confStrSect != null && confStrSect.SectionInformation.IsProtected)
        {
            confStrSect.SectionInformation.UnprotectSection();
            confg.Save();
        }
    }

    protected void IncrementButton_Click(object sender, EventArgs e)
    {
        int count = 0;
        int.TryParse(WebConfigurationManager.AppSettings[countKey], out count);
        count++;

        Configuration confg = WebConfigurationManager.OpenWebConfiguration(Request.ApplicationPath);
        ConfigurationSection confStrSect = confg.GetSection(sectionKey);
        {
            if (confg.AppSettings.Settings.AllKeys.Contains(countKey))
            {
                confg.AppSettings.Settings[countKey].Value = count.ToString();
            }
            else
            {
                confg.AppSettings.Settings.Add(countKey, count.ToString());
            }
            confg.Save(ConfigurationSaveMode.Modified);
        }
    }
}
```

Simples.
