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

             1: 

       2:  

       3: DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

       4: html xmlns="http://www.w3.org/1999/xhtml">

       5: head runat="server">

       6:     title>title>

       7: head>

       8: body>

       9:     form id="form1" runat="server">

      10:     div>

      11:         asp:Button ID="EncryptButton" runat="server" Text="Encrypt" OnClick="EncryptButton_Click" />

      12:         asp:Button ID="DecryptButton" runat="server" Text="Decrypt" OnClick="DecryptButton_Click" />

      13:         asp:Button ID="IncrementButton" runat="server" Text="Increment" OnClick="IncrementButton_Click" />

      14:         asp:Label ID="CountLabel" runat="server" Text="0">asp:Label>

      15:         br />

      16:         asp:Label ID="StatusLabel" runat="server" Text="" EnableViewState="false">asp:Label>

      17:     div>

      18:     form>

      19: body>

      20: html>

  
       1: using System;

       2: using System.Configuration;

       3: using System.Linq;

       4: using System.Web.Configuration;

       5:  

       6: public partial class _Default : System.Web.UI.Page

       7: {

       8:  

       9:     /// 

      10:     /// Handles the PreRender event of the Page control.

      11:     /// 

      12:     /// The source of the event.

      13:     /// The  instance containing the event data.

      14:     protected void Page_PreRender(object sender, EventArgs e)

      15:     {

      16:         

      17:         

      18:         Configuration confg = WebConfigurationManager.OpenWebConfiguration(Request.ApplicationPath);

      19:         ConfigurationSection confStrSect = confg.GetSection(sectionKey);

      20:         StatusLabel.Text = "No Config Section";

      21:         if (confStrSect != null)

      22:         {

      23:             StatusLabel.Text = "Decrypted";

      24:             if (confStrSect.SectionInformation.IsProtected)

      25:             {

      26:                 StatusLabel.Text = "Encrypted";

      27:             }

      28:             int count = 0;

      29:             int.TryParse(confg.AppSettings.Settings[countKey].Value, out count);

      30:             CountLabel.Text = count.ToString();

      31:         }

      32:         

      33:  

      34:     }

      35:     

      36:     string providerKey = "RSAProtectedConfigurationProvider";

      37:     string sectionKey = "appSettings";

      38:     string countKey = "Count";

      39:  

      40:     /// 

      41:     /// Handles the Click event of the EncryptButton control.

      42:     /// 

      43:     /// The source of the event.

      44:     /// The  instance containing the event data.

      45:     protected void EncryptButton_Click(object sender, EventArgs e)

      46:     {

      47:         Configuration confg = WebConfigurationManager.OpenWebConfiguration(Request.ApplicationPath);

      48:         ConfigurationSection confStrSect = confg.GetSection(sectionKey);

      49:         if (confStrSect != null)

      50:         {

      51:             confStrSect.SectionInformation.ProtectSection(providerKey);

      52:             confg.Save();

      53:         }

      54:     }

      55:     /// 

      56:     /// Handles the Click event of the DecryptButton control.

      57:     /// 

      58:     /// The source of the event.

      59:     /// The  instance containing the event data.

      60:     protected void DecryptButton_Click(object sender, EventArgs e)

      61:     {

      62:         Configuration confg = WebConfigurationManager.OpenWebConfiguration(Request.ApplicationPath);

      63:         ConfigurationSection confStrSect = confg.GetSection(sectionKey);

      64:         if (confStrSect != null && confStrSect.SectionInformation.IsProtected)

      65:         {

      66:             confStrSect.SectionInformation.UnprotectSection();

      67:             confg.Save();

      68:         }

      69:     }

      70:     /// 

      71:     /// Handles the Click event of the IncrementButton control.

      72:     /// 

      73:     /// The source of the event.

      74:     /// The  instance containing the event data.

      75:     protected void IncrementButton_Click(object sender, EventArgs e)

      76:     {

      77:         int count = 0;

      78:         int.TryParse(WebConfigurationManager.AppSettings[countKey], out count);

      79:         count++;

      80:         

      81:         Configuration confg = WebConfigurationManager.OpenWebConfiguration(Request.ApplicationPath);

      82:         ConfigurationSection confStrSect = confg.GetSection(sectionKey);

      83:         {

      84:             if (confg.AppSettings.Settings.AllKeys.Contains(countKey))

      85:             {

      86:                 confg.AppSettings.Settings[countKey].Value = count.ToString();

      87:             }

      88:             else

      89:             {

      90:                 confg.AppSettings.Settings.Add(countKey, count.ToString());

      91:             }

      92:             confg.Save(ConfigurationSaveMode.Modified);

      93:         }

      94:     }

      95: }

Simples.
