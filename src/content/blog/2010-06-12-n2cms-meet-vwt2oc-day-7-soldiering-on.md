---
title: 'N2CMS Meet VWT2OC: Day 7 – Soldiering On'
description: 'Day 7 of the VWT2OC rebuild: building a Store add-on for N2CMS with reference data management, an ItemBridge for CRUD operations, and admin screens for salutation titles.'
pubDate: 2010-06-12
heroImage: ../../assets/blog/hero-images/2010-06-12-n2cms-meet-vwt2oc-day-7-soldiering-on.jpg
tags: ['n2cms']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/06/n2cms-meet-vwt2oc-day-7-soldiering-on.html'
---

_Well, WebHost4Life are still trying to fix their migration issues (72 hours and counting!) which have quite effectively stopped my actual development on the project. D'oh! Apparently, the failure is so severe that they can't even provide a back up of the database. Double D'oh! This has pretty much derailed my project plan…._

_I'll definitely be recommending we jump ship and go with a better hosting provider._

#### Creating a Store Root

Since the VWT2OC Club has paid memberships it makes sense for me to develop two Add-ons 'N2.Store' and 'N2.Club'. Although these will be developed in concert it's intended that N2.Store won't require N2.Club (but N2.Store is a prerequisite of N2.Club). At a very basic level the store functionality will be:

- A collection of Products
- A collection of Orders
- A collection of Customers
- A collection of reference data
- A payment processing pipeline (shopping basket/checkout)
- Order Reports

To keep all of this data organised it will all be created under a 'StoreRoot' container, which may provide for the future possibility of multiple 'Stores' per N2CMS installation. Defining this is as simple as:

```csharp
using N2.Definitions;
using N2.Integrity;

namespace N2.Store.Items
{
    /// <summary>
    /// This is a root for all of the store specific types
    /// </summary>
    [RestrictParents(typeof(IRootPage), typeof(IStartPage))]
    [Throwable(AllowInTrash.No)]
    [Versionable(AllowVersions.Yes)]
    public class StoreRoot : ContentItem
    {
    }
}
```

**\*Multilingual Gotcha** – I've had a (brief) look at the globalisation implementation for N2CMS and it's too complex for me to implement at this time and VWT2OC is an English only site. Usually, I code for a global audience (as far as possible) but for now I don't have time. If anyone's interested I think I'm pretty sure that translations can be implemented in a similar fashion to normal content items. Or simply hosting the Store Root under a localized start page would probably work as well….just need to make some minor adjustments to the N2.Store.ItemBridge to make sure it finds right version.\*

#### Storing Reference Data in N2CMS

N2CMS is a platform which is understandably focused on content that's going to be displayed to the user. Most of the examples out there on how to add your own data types and model are mostly suited to widgets and new page functionality. To support the VWT2OC Club and Store functionality, I need lots of supporting reference data…such as:

- Salutation Titles (Mr, Mrs, Ms., Miss, Dr, etc)
- Countries
- Genders
- Membership Types

These are all data sets which once they're created will mostly be left alone.

Fortunately, there are good examples on how to manage this type of data in the n2cms code base. The feature I've chosen to model my approach against is the N2.Security Users Items and Edit Screens in N2.Management. The technique is to create another container content item (for example - SalutationTitleList) and adding each SalutationTitle object to it as a child content item.

```csharp
using N2.Definitions;
using N2.Details;
using N2.Integrity;

namespace N2.Store.Items
{
    /// <summary>
    /// Defines the container for salutation types
    /// </summary>
    [WithEditableTitle("Title", 10)]
    [ItemAuthorizedRoles(Roles = new string[0])]
    [Throwable(AllowInTrash.No)]
    [RestrictParents(typeof(StoreRoot))]
    [SortChildren(SortBy.Unordered)]
    public class SalutationTitleList : N2.ContentItem
    {

    }
}
```

The actual reference data is defined as a more traditional n2cms ContentItem implementation:

```csharp
using N2.Details;
using N2.Integrity;
using N2.Definitions;

namespace N2.Store.Items
{
    /// <summary>
    /// Defines the different salutation types
    /// </summary>
    [RestrictParents(typeof(SalutationTitleList))]
    [Throwable(AllowInTrash.No)]
    [Versionable(AllowVersions.Yes)]
    public class SalutationTitle : N2.ContentItem
    {
        /// <summary>
        /// Gets or sets the item's title.
        /// </summary>
        [EditableTextBox("Title", 20, Required = true)]
        public override string Title
        {
            get { return base.Title; }
            set { base.Title = value; }
        }

        /// <summary>
        /// Gets or sets the value.
        /// </summary>
        [EditableTextBox("Value", 30, Required = false)]
        public virtual string Value
        {
            get { return GetDetail<string>("Value", Title); }
            set { SetDetail<string>("Value", value); }
        }
    }
}
```

#### Taking it to the Bridge

So, now we've defined the content model for the Salutation Title content it's time to actually get some values into the database. To do this we need to create a bridge between the N2CMS content model and ASP.NET web controls – I've imaginatively called this class 'N2.Store.ItemBridge' and based it heavily on 'N2.Security.ItemBridge' in the n2cms codebase. This bridge will need to be instanced by the n2cms plugin system so it requires some specific constructors:

```csharp
using System.Collections.Generic;
using N2.Configuration;
using N2.Definitions;
using N2.Persistence;
using N2.Persistence.Finder;
using N2.Web;

namespace N2.Store
{
    /// <summary>
    /// Provides easy to use methods for manipulating reference data
    /// </summary>
    public class ItemBridge
    {

        readonly private IDefinitionManager _definitions;
        readonly private IItemFinder _finder;
        readonly private IPersister _persister;
        private readonly IHost _host;

        public ItemBridge(IDefinitionManager definitions, IItemFinder finder, IPersister persister, IHost host, EditSection config)
            : this(definitions, finder, persister, host)
        {

        }

        public ItemBridge(IDefinitionManager definitions, IItemFinder finder, IPersister persister, IHost host)
        {
            this._definitions = definitions;
            this._finder = finder;
            this._persister = persister;
            this._host = host;
        }

        // Implementation detail
    }
}
```

The class can now be registered with the n2cms engine for automatic initialization using an IPluginInitializer implementation:

```csharp
using N2.Plugin;

namespace N2.Store
{
    /// <summary>
    /// Initializes the Stores Reference Item Bridge
    /// </summary>
    [AutoInitialize]
    public class StoreInitializer : IPluginInitializer
    {
        public void Initialize(Engine.IEngine engine)
        {
            engine.AddComponent("n2.storeReferenceProvider", typeof(ItemBridge));
        }
    }
}
```

Within the Item Bridge I've written some basic generic methods that can be used to perform basic CRUD operations:

```csharp
#region Generic Persister Methods

  public IItemFinder Finder
  {
      get { return _finder; }
  }

  protected int ContainerParentID
  {
      get { return _host.CurrentSite.RootItemID; }
  }

  public virtual void Delete(ContentItem item)
  {
      _persister.Delete(item);
  }

  public virtual void Save(ContentItem item)
  {
      _persister.Save(item);
  }

  protected virtual T Create<T>(ContentItem parent, string name) where T : ContentItem
  {
      T m = Context.Definitions.CreateInstance<T>(parent);
      m.Title = typeof(T).Name;
      m.Name = name;
      _persister.Save(m);
      return m;
  }

  protected virtual T Retrieve<T>(ContentItem parent, string name, bool create) where T : ContentItem
  {
      return Retrieve<T>(parent.ID, name, create);
  }

  protected virtual T Retrieve<T>(int containerParentId, string name, bool create) where T : ContentItem
  {
      var q = Finder.Where.Name.Eq(name).And.ParentID.Eq(containerParentId).MaxResults(1);
      foreach (var item in q.Select<T>())
      {
          return item;
      }

      if (!create)
          return null;

      ContentItem parent = _persister.Get(containerParentId);
      return Create<T>(parent, name);
  }

  #endregion
```

N2CMS promotes a lazy construction methodology to creating structural content items, so the ItemBridge is coded to (optionally) create missing containers. By following through this pattern you can guarantee that the correct data structure gets created the first time someone attempts to use it.

```csharp
#region Store Root

 private string _storeContainerName = "Store Settings";

 public string StoreContainerName
 {
     get { return _storeContainerName; }
     set { _storeContainerName = value; }
 }

 public virtual Items.StoreRoot GetStoreContainer(bool create)
 {
     return Retrieve<Items.StoreRoot>(ContainerParentID, StoreContainerName, create);
 }

 #endregion

 #region Salutation Titles

 private string _titleContainerName = "TemplateTitles";

 public string SalutationTitleContainerName
 {
     get { return _titleContainerName; }
     set { _titleContainerName = value; }
 }

 public virtual Items.SalutationTitleList GetTitleContainer(bool create)
 {
     Items.StoreRoot store = GetStoreContainer(create);
     return Retrieve<Items.SalutationTitleList>(store, SalutationTitleContainerName, create);
 }

 protected Items.SalutationTitleList CreateTitleContainer(ContentItem parent)
 {
     return Create<Items.SalutationTitleList>(parent, SalutationTitleContainerName);
 }

 public virtual IEnumerable<Items.SalutationTitle> GetAllTitles()
 {
     Items.SalutationTitleList titles = GetTitleContainer(true);
     if (titles == null)
         return new List<Items.SalutationTitle>();
     return Finder.Where.Parent.Eq(titles)
         .And.Type.Eq(typeof(Items.SalutationTitle))
         .OrderBy.SortOrder.Asc
         .Select<Items.SalutationTitle>();
 }

 public Items.SalutationTitle CreateTitle(string title)
 {
     Items.SalutationTitleList titles = GetTitleContainer(true);
     foreach (Items.SalutationTitle tExisting in Finder.Where.Parent.Eq(titles)
         .And.Title.Eq(title)
         .And.Type.Eq(typeof(Items.SalutationTitle))
         .OrderBy.Title.Asc
         .Select<Items.SalutationTitle>())
         return tExisting;

     Items.SalutationTitle t = _definitions.CreateInstance<Items.SalutationTitle>(titles);
     t.Title = title;
     t.Value = title.Trim().ToLowerInvariant();
     t.SortOrder = titles.Children.Count;
     _persister.Save(t);
     return t;
 }

 #endregion
```

The ItemBridge can now be used to create an ObjectDataSource class to allow ASP.NET Databinding:

```csharp
using System.Collections.Generic;

namespace N2.Store
{
    /// <summary>
    /// An ObjectDataSource accessible wrapper for the ReferenceItemBridge
    /// </summary>
    public class ReferenceItemDataSource
    {
        private ItemBridge _bridge;

        protected virtual ItemBridge Bridge
        {
            get { return _bridge ?? (_bridge = Context.Current.Resolve<ItemBridge>()); }
        }

        public IEnumerable<Items.SalutationTitle> GetAllTitles()
        {
            return Bridge.GetAllTitles();
        }

    }
}
```

Phew! Ground work done for the store in general and implemented the SalutationTitle content items.

#### Show Me the Money Titles

So we can actually view, create and edit the SalutationTitle content, we need to create some Admin Screens. Way back in [Day 3](/blog/2010-06-08-n2cms-meet-vwt2oc-day-3-grinding-to), I showed how to create a new navigation menu in the editor, now we need to create a link on that menu to show us a list of the SalutationTitles in the database (/N2/Store/Titles/Titles.aspx) and set its target to the 'preview' frame.

My list page is a simple databound gridview implementation with some custom sort order management (which is why SalutationTitleList has a \[SortChildren(SortBy.Unordered)\] attribute to prevent n2cms from automatically ordering it!).

**N2/Store/Titles/Titles.aspx:**

```aspx
<%@ Page Language="C#" MasterPageFile="../../Content/Framed.Master" AutoEventWireup="true"
    CodeBehind="Titles.aspx.cs" Inherits="N2.Edit.Store.Titles.Titles" %>

<asp:Content ID="ContentHead" ContentPlaceHolderID="Head" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="Toolbar" runat="server">
    <asp:HyperLink ID="HyperLink1" runat="server" NavigateUrl="New.aspx" CssClass="command">new</asp:HyperLink>
</asp:Content>
<asp:Content ID="Content4" ContentPlaceHolderID="Content" runat="server">
    <asp:DataGrid ID="TitleList" runat="server" DataSourceID="TitleSource" AutoGenerateColumns="False"
        UseAccessibleHeader="True" OnItemCommand="TitleList_ItemCommand" DataKeyField="Value"
        BorderWidth="0px" CssClass="gv">
        <Columns>
            <asp:HyperLinkColumn DataNavigateUrlField="Value" DataTextField="Title" DataNavigateUrlFormatString="Edit.aspx?title={0}" />
            <asp:TemplateColumn ItemStyle-Width="20px">
                <ItemTemplate>
                    <asp:ImageButton ID="ImageButton1" AlternateText="Move Up" ImageUrl="~/N2/Resources/icons/arrow_up.png"
                        runat="server" CommandName="up" />
                </ItemTemplate>
            </asp:TemplateColumn>
              <asp:TemplateColumn  ItemStyle-Width="20px">
                <ItemTemplate>
                    <asp:ImageButton ID="ImageButton2"  AlternateText="Move Down" ImageUrl="~/N2/Resources/icons/arrow_down.png"
                        runat="server" CommandName="down" />
                </ItemTemplate>
            </asp:TemplateColumn>
            <asp:TemplateColumn  ItemStyle-Width="20px">
                <ItemTemplate>
                    <asp:ImageButton AlternateText="Delete" ImageUrl="~/N2/Resources/icons/delete.png"
                        runat="server" CommandName="Delete" />
                </ItemTemplate>
            </asp:TemplateColumn>

        </Columns>
    </asp:DataGrid>
    <asp:ObjectDataSource ID="TitleSource" runat="server" TypeName="N2.Store.ReferenceItemDataSource"
        SelectMethod="GetAllTitles" />
</asp:Content>
```

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.UI.WebControls;
using N2.Edit.Web;
using N2.Store;

namespace N2.Edit.Store.Titles
{
    public partial class Titles : EditPage
    {
        private ItemBridge _bridge;

        protected virtual ItemBridge Bridge
        {
            get { return _bridge ?? (_bridge = N2.Context.Current.Resolve<ItemBridge>()); }
        }

        protected void TitleList_ItemCommand(object sender, DataGridCommandEventArgs args)
        {
            IList<N2.Store.Items.SalutationTitle> titles = Bridge.GetAllTitles().ToList();
            N2.Store.Items.SalutationTitle t = titles
                  .Where(title => string.Equals(title.Value, (string)TitleList.DataKeys[args.Item.ItemIndex], StringComparison.OrdinalIgnoreCase))
                  .First();
            if (args.CommandName == "Delete")
            {
                Bridge.Delete(t);
            }
            else if (args.CommandName == "up" && args.Item.ItemIndex > 0)
            {
                titles.Remove(t);
                titles.Insert(args.Item.ItemIndex - 1, t);
            }
            else if (args.CommandName == "down" && args.Item.ItemIndex < titles.Count - 1)
            {
                titles.Remove(t);
                titles.Insert(args.Item.ItemIndex + 1, t);
            }
            if (args.CommandName == "up" || args.CommandName == "down")
            {
                foreach (N2.Store.Items.SalutationTitle t2 in titles)
                {
                    t2.SortOrder = titles.IndexOf(t2);
                    Bridge.Save(t2);
                }
            }
            TitleList.DataBind();
        }
    }
}
```

As you can see it leverages the existing master pages and edit functionality from the N2.Management project to promote a more consistent look and feel.

Creating the New.aspx and Edit.aspx pages are just as simple.

**N2/Store/Titles/New.aspx:**

```aspx
<%@ Page Language="C#" MasterPageFile="../../Content/Framed.Master" AutoEventWireup="true"
    CodeBehind="New.aspx.cs" Inherits="N2.Edit.Store.Titles.New" %>

<asp:Content ID="ContentHead" ContentPlaceHolderID="Head" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="Toolbar" runat="server">
    <asp:HyperLink ID="HyperLink1" runat="server" NavigateUrl="Titles.aspx" CssClass="command">back</asp:HyperLink>
</asp:Content>
<asp:Content ID="Content4" ContentPlaceHolderID="Content" runat="server">
    <asp:ValidationSummary ID="NewTitleSummary" runat="server" ValidationGroup="NewTitle"
        DisplayMode="BulletList" HeaderText="Please fix the following issues:" />
    <p>
        <asp:Label ID="NewTitleLabel" runat="server" Text="New Title" AssociatedControlID="NewTitle"></asp:Label>
        <asp:TextBox ID="NewTitle" runat="server"></asp:TextBox>
        <asp:RequiredFieldValidator
            ID="NewTitleRequired" ControlToValidate="NewTitle" Text="*" ValidationGroup="NewTitle"
            runat="server" ErrorMessage="You must enter title text"></asp:RequiredFieldValidator>
            <asp:CustomValidator
                ID="TitleIsUnique" runat="server" Text="*"  ControlToValidate="NewTitle" OnServerValidate="OnTitleIsUniqueServerValidate"  ValidationGroup="NewTitle" ErrorMessage="This title already exists"></asp:CustomValidator>
    </p>
    <p>
        <asp:Button ID="Create" OnClick="CreateOnClick" runat="server" Text="Create" />
    </p>
</asp:Content>
```

```csharp
using System;
using System.Linq;
using System.Web.UI;
using System.Web.UI.WebControls;
using N2.Edit.Web;
using N2.Store;

namespace N2.Edit.Store.Titles
{
    public partial class New : EditPage
    {

        private ItemBridge _bridge;

        protected virtual ItemBridge Bridge
        {
            get { return _bridge ?? (_bridge = N2.Context.Current.Resolve<ItemBridge>()); }
        }

        protected void OnTitleIsUniqueServerValidate(object source, ServerValidateEventArgs args)
        {
           args.IsValid = !Bridge.GetAllTitles()
               .Where(title => string.Equals(title.Value, args.Value, StringComparison.OrdinalIgnoreCase)
                    || string.Equals(title.Title, args.Value, StringComparison.OrdinalIgnoreCase))
               .Any();
        }

        protected void CreateOnClick(object sender, EventArgs e)
        {
            if (Page.IsValid)
            {
                Bridge.CreateTitle(NewTitle.Text);
                Response.Redirect("Titles.aspx");
            }
        }
    }
}
```

**N2/Store/Titles/Edit.aspx:**

```aspx
<%@ Page Language="C#" MasterPageFile="../../Content/Framed.Master" AutoEventWireup="true"
    CodeBehind="Edit.aspx.cs" Inherits="N2.Edit.Store.Titles.Edit" %>

<asp:Content ID="ContentHead" ContentPlaceHolderID="Head" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="Toolbar" runat="server">
    <asp:HyperLink ID="HyperLink1" runat="server" NavigateUrl="Titles.aspx" CssClass="command">back</asp:HyperLink>
</asp:Content>
<asp:Content ID="Content4" ContentPlaceHolderID="Content" runat="server">
    <asp:ValidationSummary ID="NewTitleSummary" runat="server" ValidationGroup="NewTitle"
        DisplayMode="BulletList" HeaderText="Please fix the following issues:" />
    <p>
        <asp:Label ID="NewTitleLabel" runat="server" Text="New Title" AssociatedControlID="NewTitle"></asp:Label>
        <asp:TextBox ID="NewTitle" runat="server"></asp:TextBox>
        <asp:RequiredFieldValidator
            ID="NewTitleRequired" ControlToValidate="NewTitle" Text="*" ValidationGroup="NewTitle"
            runat="server" ErrorMessage="You must enter title text"></asp:RequiredFieldValidator>
            <asp:CustomValidator
                ID="TitleIsUnique" runat="server" Text="*"  ControlToValidate="NewTitle" OnServerValidate="OnTitleIsUniqueServerValidate"  ValidationGroup="NewTitle" ErrorMessage="This title already exists"></asp:CustomValidator>
    </p>
    <p>
        <asp:Button ID="Amend" OnClick="AmendOnClick" runat="server" Text="Amend" />
    </p>
</asp:Content>
```

```csharp
using System;
using System.Linq;
using System.Web.UI;
using System.Web.UI.WebControls;
using N2.Edit.Web;
using N2.Store;

namespace N2.Edit.Store.Titles
{
    public partial class Edit : EditPage
    {

        private ItemBridge _bridge;

        protected virtual ItemBridge Bridge
        {
            get { return _bridge ?? (_bridge = N2.Context.Current.Resolve<ItemBridge>()); }
        }

        protected override void OnLoad(EventArgs e)
        {
            base.OnLoad(e);
            if (!Page.IsPostBack)
            {
                N2.Store.Items.SalutationTitle t = Bridge.GetAllTitles()
                    .Where(title => string.Equals(title.Value, Request.QueryString["title"], StringComparison.OrdinalIgnoreCase))
                    .First();
                NewTitle.Text = t.Title;
            }
        }

        protected void OnTitleIsUniqueServerValidate(object source, ServerValidateEventArgs args)
        {
            args.IsValid = !Bridge.GetAllTitles()
                .Where(title => string.Equals(title.Value, args.Value, StringComparison.OrdinalIgnoreCase)
                    || string.Equals(title.Title, args.Value, StringComparison.OrdinalIgnoreCase))
                .Any();
        }

        protected void AmendOnClick(object sender, EventArgs e)
        {
            if (Page.IsValid)
            {
                N2.Store.Items.SalutationTitle t = Bridge.GetAllTitles()
                    .Where(title => string.Equals(title.Value, Request.QueryString["title"], StringComparison.OrdinalIgnoreCase))
                        .First();
                t.Title = NewTitle.Text;
                Bridge.Save(t);
                Response.Redirect("Titles.aspx");
            }
        }
    }
}
```

The final admin page now looks like:

_\[Original admin page screenshot no longer available\]_

Now to replicate the functionality for all of the other reference data content types. _You never know maybe by the time I'm done WebHost4Life will have sorted out their issues and I can carry on!_
