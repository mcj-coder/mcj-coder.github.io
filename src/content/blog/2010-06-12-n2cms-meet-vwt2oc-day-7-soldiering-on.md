---
title: "N2CMS Meet VWT2OC: Day 7 – Soldiering On"
description: "Technical blog post from 2010-06-12"
pubDate: 2010-06-12
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

*Well, WebHost4Life are still trying to fix their migration issues (72 hours and counting!) which have taken down the current website and database which has quite effectively stopped my actual development on the project.  D’oh!  Apparently, the failure is so severe that they can’t even provide a back up of the database.  Double D’oh!  This has pretty much derailed my project plan….*

  *I’ll definitely be recommending we jump ship and go with a better hosting provider.*

  **

  **

  
## Creating a Store Root
  Since the VWT2OC Club has paid memberships it makes sense for me to develop two Add-ons ‘N2.Store’ and ‘N2.Club’.  Although these will be developed in concert it’s intended that N2.Store won’t require N2.Club (but N2.Store is a prerequisite of N2.Club).  At a very basic level the store functionality will be:

     * A collection of Products    * A collection of Orders    * A collection of Customers    * A collection of reference data    * A payment processing pipeline (shopping basket/checkout)    * Order Reports   To keep all of this data organised it will all be created under a ‘StoreRoot’ container, which may provide for the future possibility of multiple ‘Stores’ per N2CMS installation.  Defining this is as simple as:

```csharp
using N2.Definitions;
```

```csharp
using N2.Integrity;
```

```csharp



```csharp
namespace N2.Store.Items
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// This is a root for all of the store specific types
```

```csharp
/// 
```

```csharp
[RestrictParents(typeof(IRootPage), typeof(IStartPage))]
```

```csharp
[Throwable(AllowInTrash.No)]
```

```csharp
[Versionable(AllowVersions.Yes)]
```

```csharp
public class StoreRoot : ContentItem
```

```csharp
{
```

```csharp
}
```

```csharp
}
```

***Multilingual Gotcha** – I’ve had a (brief) look at the globalisation implementation for N2CMS and it’s too complex for me to implement at this time and VWT2OC is an English only site.  Usually, I code for a global audience (as far as possible) but for now I don’t have time.  If anyone’s interested I think I’m pretty sure that translations can be implemented in a similar fashion to normal content items.  Or simply hosting the Store Root under a localized start page would probably work as well….just need to make some minor adjustments to the N2.Store.ItemBridge to make sure it finds right version.*

## Storing Reference Data in [N2CMS](http://bit.ly/aco4m4)

N2CMS is a platform which is understandably focused on content that’s going to be displayed to the user.  Most of the examples out there on how to add your own data types and model are mostly suited to widgets and new page functionality.  To support the VWT2OC Club and Store functionality, I need lots of supporting reference data…such as:

  * Salutation Titles (Mr, Mrs, Ms., Miss, Dr, etc)

  * Countries

  * Genders

  * Membership Types

These are all data sets which once they’re created will mostly be left alone.

Fortunately, there are good examples on how to manage this type of data in the n2cms code base.  The feature I’ve chosen to model my approach against is the N2.Security Users Items and Edit Screens in N2.Management.   The technique is to create another container content item (for example - SalutationTitleList) and adding each SalutationTitle object to it as a child content item.

  
```csharp
using N2.Definitions;
```

```csharp
using N2.Details;
```

```csharp
using N2.Integrity;
```

```csharp



```csharp
namespace N2.Store.Items
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// Defines the container for salutation types
```

```csharp
/// 
```

```csharp
[WithEditableTitle("Title", 10)]
```

```csharp
[ItemAuthorizedRoles(Roles = new string[0])]
```

```csharp
[Throwable(AllowInTrash.No)]
```

```csharp
[RestrictParents(typeof(StoreRoot))]
```

```csharp
[SortChildren(SortBy.Unordered)]
```

```csharp
public class SalutationTitleList : N2.ContentItem
```

```csharp
{
```

```csharp



```csharp
}
```

```csharp
}
```

The actual reference data is defined as a more traditional n2cms ContentItem implementation:

  
```csharp
using N2.Details;
```

```csharp
using N2.Integrity;
```

```csharp
using N2.Definitions;
```

```csharp



```csharp
namespace N2.Store.Items
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// Defines the different salutation types
```

```csharp
/// 
```

```csharp
[RestrictParents(typeof(SalutationTitleList))]
```

```csharp
[Throwable(AllowInTrash.No)]
```

```csharp
[Versionable(AllowVersions.Yes)]
```

```csharp
public class SalutationTitle : N2.ContentItem
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// Gets or sets the item's title. This is used in edit mode and probably in a custom implementation.
```

```csharp
/// 
```

```csharp
/// 
```

```csharp
[EditableTextBox("Title", 20, Required = true)]
```

```csharp
public override string Title
```

```csharp
{
```

```csharp
get { return base.Title; }
```

```csharp
set { base.Title = value; }
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Gets or sets the value.
```

```csharp
/// 
```

```csharp
/// The value.
```

```csharp
[EditableTextBox("Value", 30, Required = false)]
```

```csharp
public virtual string Value
```

```csharp
{
```

```csharp
get { return GetDetailstring>("Value", Title); }
```

```csharp
set { SetDetailstring>("Value", value); }
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

## Taking it to the Bridge!

So, now we’ve defined the content model for the Salutation Title content it’s time to actually get some values into the database.  To do this we need to create a bridge between the N2CMS  content model and ASP.NET web controls – I’ve imaginatively called this class ‘N2.Store.ItemBridge’ and based it heavily on ‘N2.Security.ItemBridge’ in the n2cms codebase.  This bridge will need to be instances by the n2cms plugin system so it requires some specific constructors:

  
```csharp
using System.Collections.Generic;
```

```csharp
using N2.Configuration;
```

```csharp
using N2.Definitions;
```

```csharp
using N2.Persistence;
```

```csharp
using N2.Persistence.Finder;
```

```csharp
using N2.Web;
```

```csharp



```csharp
namespace N2.Store
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// Provides easy to use methods for manipulating reference data
```

```csharp
/// 
```

```csharp
public class ItemBridge
```

```csharp
{
```

```csharp



```csharp
readonly private IDefinitionManager _definitions;
```

```csharp
readonly private IItemFinder _finder;
```

```csharp
readonly private IPersister _persister;
```

```csharp
private readonly IHost _host;
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
/// The definitions.
```

```csharp
/// The finder.
```

```csharp
/// The persister.
```

```csharp
/// The host.
```

```csharp
/// The config.
```

```csharp
public ItemBridge(IDefinitionManager definitions, IItemFinder finder, IPersister persister, IHost host, EditSection config)
```

```csharp
: this(definitions, finder, persister, host)
```

```csharp
{
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
/// Initializes a new instance of the  class.
```

```csharp
/// 
```

```csharp
/// The definitions.
```

```csharp
/// The finder.
```

```csharp
/// The persister.
```

```csharp
/// The host.
```

```csharp
public ItemBridge(IDefinitionManager definitions, IItemFinder finder, IPersister persister, IHost host)
```

```csharp
{
```

```csharp
this._definitions = definitions;
```

```csharp
this._finder = finder;
```

```csharp
this._persister = persister;
```

```csharp
this._host = host;
```

```csharp
}
```

```csharp



```csharp
// Implementation detail
```

```csharp
}
```

```csharp
}
```

The class can now be registered with the n2cms engine for automatic intialization using an IPluginInitializer implementation:

  
```csharp
using N2.Plugin;
```

```csharp



```csharp
namespace N2.Store
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// Initializes the Stores Reference Item Bridge
```

```csharp
/// 
```

```csharp
[AutoInitialize]
```

```csharp
public class StoreInitializer : IPluginInitializer
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// Invoked after the factory has been initialized.
```

```csharp
/// 
```

```csharp
/// The factory that has been initialized.
```

```csharp
public void Initialize(Engine.IEngine engine)
```

```csharp
{
```

```csharp
engine.AddComponent("n2.storeReferenceProvider", typeof(ItemBridge));
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

Within the Item Bridge I’ve written some basic generic methods that can be used to perform basic CRUD operations:

  
```csharp
#region Generic Persister Methods
```

```csharp



```csharp
/// 
```

```csharp
/// Gets the finder.
```

```csharp
/// 
```

```csharp
/// The finder.
```

```csharp
public IItemFinder Finder
```

```csharp
{
```

```csharp
get { return _finder; }
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Gets the container parent ID.
```

```csharp
/// 
```

```csharp
/// The container parent ID.
```

```csharp
protected int ContainerParentID
```

```csharp
{
```

```csharp
get { return _host.CurrentSite.RootItemID; }
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Deletes the specified item.
```

```csharp
/// 
```

```csharp
/// The item.
```

```csharp
public virtual void Delete(ContentItem item)
```

```csharp
{
```

```csharp
_persister.Delete(item);
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Saves the specified item.
```

```csharp
/// 
```

```csharp
/// The item.
```

```csharp
public virtual void Save(ContentItem item)
```

```csharp
{
```

```csharp
_persister.Save(item);
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Creates a new item within the specified parent container.
```

```csharp
/// 
```

```csharp
/// 
```

```csharp
/// The parent.
```

```csharp
/// The name.
```

```csharp
/// 
```

```csharp
protected virtual T Create(ContentItem parent, string name) where T : ContentItem
```

```csharp
{
```

```csharp
T m = Context.Definitions.CreateInstance(parent);
```

```csharp
m.Title = typeof(T).Name;
```

```csharp
m.Name = name;
```

```csharp
_persister.Save(m);
```

```csharp
return m;
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Retrieves the specified create.
```

```csharp
/// 
```

```csharp
/// 
```

```csharp
/// if set to true [create].
```

```csharp
/// The name.
```

```csharp
/// The parent.
```

```csharp
/// 
```

```csharp
protected virtual T Retrieve(ContentItem parent, string name, bool create) where T : ContentItem
```

```csharp
{
```

```csharp
return Retrieve(parent.ID, name, create);
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Retrieves the specified content item, creating a new item if required.
```

```csharp
/// 
```

```csharp
/// 
```

```csharp
/// if set to true [create].
```

```csharp
/// The name.
```

```csharp
/// The container parent id.
```

```csharp
/// 
```

```csharp
protected virtual T Retrieve(int containerParentId, string name, bool create) where T : ContentItem
```

```csharp
{
```

```csharp
var q = Finder.Where.Name.Eq(name).And.ParentID.Eq(containerParentId).MaxResults(1);
```

```csharp
foreach (var item in q.Select())
```

```csharp
{
```

```csharp
return item;
```

```csharp
}
```

```csharp



```csharp
if (!create)
```

```csharp
return null;
```

```csharp



```csharp
ContentItem parent = _persister.Get(containerParentId);
```

```csharp
return Create(parent, name);
```

```csharp
}
```

```csharp



```csharp
#endregion
```

N2CMS promotes a lazy construction methodology to creating structural content items, so the ItemBridge is coded to (optionally) create missing containers.  By following through this pattern you can guarantee that the correct data structure gets created the first time someone attempts to use it.

  
```csharp
#region Store Root
```

```csharp



```csharp
private string _storeContainerName = "Store Settings";
```

```csharp



```csharp
/// 
```

```csharp
/// Gets or sets the name of the salutation title container.
```

```csharp
/// 
```

```csharp
/// The name of the salutation title container.
```

```csharp
public string StoreContainerName
```

```csharp
{
```

```csharp
get { return _storeContainerName; }
```

```csharp
set { _storeContainerName = value; }
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Gets the store container.
```

```csharp
/// 
```

```csharp
/// if set to true [create].
```

```csharp
/// 
```

```csharp
public virtual Items.StoreRoot GetStoreContainer(bool create)
```

```csharp
{
```

```csharp
return Retrieve(ContainerParentID, StoreContainerName, create);
```

```csharp
}
```

```csharp



```csharp
#endregion
```

```csharp



```csharp
#region Salutation Titles
```

```csharp



```csharp
private string _titleContainerName = "TemplateTitles";
```

```csharp



```csharp
/// 
```

```csharp
/// Gets or sets the name of the salutation title container.
```

```csharp
/// 
```

```csharp
/// The name of the salutation title container.
```

```csharp
public string SalutationTitleContainerName
```

```csharp
{
```

```csharp
get { return _titleContainerName; }
```

```csharp
set { _titleContainerName = value; }
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Gets the title container.
```

```csharp
/// 
```

```csharp
/// if set to true [create].
```

```csharp
/// 
```

```csharp
public virtual Items.SalutationTitleList GetTitleContainer(bool create)
```

```csharp
{
```

```csharp
Items.StoreRoot store = GetStoreContainer(create);
```

```csharp
return Retrieve(store, SalutationTitleContainerName, create);
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Creates the title container.
```

```csharp
/// 
```

```csharp
/// The parent.
```

```csharp
/// 
```

```csharp
protected Items.SalutationTitleList CreateTitleContainer(ContentItem parent)
```

```csharp
{
```

```csharp
return Create(parent, SalutationTitleContainerName);
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Gets all titles.
```

```csharp
/// 
```

```csharp
/// 
```

```csharp
public virtual IEnumerable GetAllTitles()
```

```csharp
{
```

```csharp
Items.SalutationTitleList titles = GetTitleContainer(true);
```

```csharp
if (titles == null)
```

```csharp
return new List();
```

```csharp
return Finder.Where.Parent.Eq(titles)
```

```csharp
.And.Type.Eq(typeof(Items.SalutationTitle))
```

```csharp
.OrderBy.SortOrder.Asc
```

```csharp
.Select();
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Adds the title.
```

```csharp
/// 
```

```csharp
/// The title.
```

```csharp
public Items.SalutationTitle CreateTitle(string title)
```

```csharp
{
```

```csharp
Items.SalutationTitleList titles = GetTitleContainer(true);
```

```csharp
foreach (Items.SalutationTitle tExisting in Finder.Where.Parent.Eq(titles)
```

```csharp
.And.Title.Eq(title)
```

```csharp
.And.Type.Eq(typeof(Items.SalutationTitle))
```

```csharp
.OrderBy.Title.Asc
```

```csharp
.Select())
```

```csharp
return tExisting;
```

```csharp



```csharp
Items.SalutationTitle t = _definitions.CreateInstance(titles);
```

```csharp
t.Title = title;
```

```csharp
t.Value = title.Trim().ToLowerInvariant();
```

```csharp
t.SortOrder = titles.Children.Count;
```

```csharp
_persister.Save(t);
```

```csharp
return t;
```

```csharp
}
```

```csharp



```csharp
#endregion
```

The ItemBridge can now be used to create an ObjectDataSource class to allow ASP.NET Databinding:

  
```csharp
using System.Collections.Generic;
```

```csharp



```csharp
namespace N2.Store
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// An ObjectDataSource accessible wrapper for the ReferenceItemBridge
```

```csharp
/// 
```

```csharp
public class ReferenceItemDataSource
```

```csharp
{
```

```csharp
private ItemBridge _bridge;
```

```csharp



```csharp
/// 
```

```csharp
/// Gets the bridge.
```

```csharp
/// 
```

```csharp
/// The bridge.
```

```csharp
protected virtual ItemBridge Bridge
```

```csharp
{
```

```csharp
get { return _bridge ?? (_bridge = Context.Current.Resolve()); }
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Gets all titles.
```

```csharp
/// 
```

```csharp
/// 
```

```csharp
public IEnumerable GetAllTitles()
```

```csharp
{
```

```csharp
return Bridge.GetAllTitles();
```

```csharp
}
```

```csharp



```csharp
}
```

```csharp
}
```

Phew!  Ground work done for the store in general and implemented the SalutationTitle content items.

## Show Me the Money Titles!

So we can actually view, create and edit the SalutationTitle content, we need to create some Admin Screens.  Way back in [Day 3](http://martinondotnet.blogspot.com/2010/06/n2cms-meet-vwt2oc-day-3-grinding-to.html), I showed how to create a new navigation menu in the editor, now we  need to create a link on that menu to show us a list of the SalutationTitles in the database (/N2/Store/Titles/Titles.aspx) and set it’s target to the ‘preview’ frame.

My list page is a simple databound gridview implementation with some custom sort order management (which is why SalutationTitleList as a [SortChildren(SortBy.Unordered)] attribute to prevent n2cms from automatically ordering it!).

N2/Store/Titles/Titles.aspx

  
```csharp



```csharp
CodeBehind="Titles.aspx.cs" Inherits="N2.Edit.Store.Titles.Titles" %>
```

```csharp



```csharp
asp:Content ID="ContentHead" ContentPlaceHolderID="Head" runat="server">
```

```csharp
asp:Content>
```

```csharp
asp:Content ID="Content2" ContentPlaceHolderID="Toolbar" runat="server">
```

```csharp
asp:HyperLink ID="HyperLink1" runat="server" NavigateUrl="New.aspx" CssClass="command">newasp:HyperLink>
```

```csharp
asp:Content>
```

```csharp
asp:Content ID="Content4" ContentPlaceHolderID="Content" runat="server">
```

```csharp
asp:DataGrid ID="TitleList" runat="server" DataSourceID="TitleSource" AutoGenerateColumns="False"
```

```csharp
UseAccessibleHeader="True" OnItemCommand="TitleList_ItemCommand" DataKeyField="Value"
```

```csharp
BorderWidth="0px" CssClass="gv">
```

```csharp
Columns>
```

```csharp
asp:HyperLinkColumn DataNavigateUrlField="Value" DataTextField="Title" DataNavigateUrlFormatString="Edit.aspx?title={0}" />
```

```csharp
asp:TemplateColumn ItemStyle-Width="20px">
```

```csharp
ItemTemplate>
```

```csharp
asp:ImageButton ID="ImageButton1" AlternateText="Move Up" ImageUrl="~/N2/Resources/icons/arrow_up.png"
```

```csharp
runat="server" CommandName="up" />
```

```csharp
ItemTemplate>
```

```csharp
asp:TemplateColumn>
```

```csharp
asp:TemplateColumn  ItemStyle-Width="20px">
```

```csharp
ItemTemplate>
```

```csharp
asp:ImageButton ID="ImageButton2"  AlternateText="Move Down" ImageUrl="~/N2/Resources/icons/arrow_down.png"
```

```csharp
runat="server" CommandName="down" />
```

```csharp
ItemTemplate>
```

```csharp
asp:TemplateColumn>
```

```csharp
asp:TemplateColumn  ItemStyle-Width="20px">
```

```csharp
ItemTemplate>
```

```csharp
asp:ImageButton AlternateText="Delete" ImageUrl="~/N2/Resources/icons/delete.png"
```

```csharp
runat="server" CommandName="Delete" />
```

```csharp
ItemTemplate>
```

```csharp
asp:TemplateColumn>
```

```csharp



```csharp
Columns>
```

```csharp
asp:DataGrid>
```

```csharp
asp:ObjectDataSource ID="TitleSource" runat="server" TypeName="N2.Store.ReferenceItemDataSource"
```

```csharp
SelectMethod="GetAllTitles" />
```

```csharp
asp:Content>
```
  
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
using System.Web.UI.WebControls;
```

```csharp
using N2.Edit.Web;
```

```csharp
using N2.Store;
```

```csharp



```csharp
namespace N2.Edit.Store.Titles
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// Editor page for Store titles
```

```csharp
/// 
```

```csharp
public partial class Titles : EditPage
```

```csharp
{
```

```csharp
private ItemBridge _bridge;
```

```csharp



```csharp
/// 
```

```csharp
/// Gets the bridge.
```

```csharp
/// 
```

```csharp
/// The bridge.
```

```csharp
protected virtual ItemBridge Bridge
```

```csharp
{
```

```csharp
get { return _bridge ?? (_bridge = N2.Context.Current.Resolve()); }
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Handles the ItemCommand event of the TitleList control.
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
protected void TitleList_ItemCommand(object sender, DataGridCommandEventArgs args)
```

```csharp
{
```

```csharp
IList titles = Bridge.GetAllTitles().ToList();
```

```csharp
N2.Store.Items.SalutationTitle t = titles
```

```csharp
.Where(title => string.Equals(title.Value, (string)TitleList.DataKeys[args.Item.ItemIndex], StringComparison.OrdinalIgnoreCase))
```

```csharp
.First();
```

```csharp
if (args.CommandName == "Delete")
```

```csharp
{
```

```csharp
Bridge.Delete(t);
```

```csharp
}
```

```csharp
else if (args.CommandName == "up" && args.Item.ItemIndex > 0)
```

```csharp
{
```

```csharp
titles.Remove(t);
```

```csharp
titles.Insert(args.Item.ItemIndex - 1, t);
```

```csharp
}
```

```csharp
else if (args.CommandName == "down" && args.Item.ItemIndex 
```

```csharp
{
```

```csharp
titles.Remove(t);
```

```csharp
titles.Insert(args.Item.ItemIndex + 1, t);
```

```csharp
}
```

```csharp
if (args.CommandName == "up" || args.CommandName == "down")
```

```csharp
{
```

```csharp
foreach (N2.Store.Items.SalutationTitle t2 in titles)
```

```csharp
{
```

```csharp
t2.SortOrder = titles.IndexOf(t2);
```

```csharp
Bridge.Save(t2);
```

```csharp
}
```

```csharp
}
```

```csharp
TitleList.DataBind();
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

As you can see it leverages the existing master pages and edit functionality from the N2.Management project to promote a more consistent look and feel.

Creating the New.aspx and Edit.aspx pages are just as simple.

N2/Store/Titles/New.aspx

  
```csharp



```csharp
CodeBehind="New.aspx.cs" Inherits="N2.Edit.Store.Titles.New" %>
```

```csharp



```csharp
asp:Content ID="ContentHead" ContentPlaceHolderID="Head" runat="server">
```

```csharp
asp:Content>
```

```csharp
asp:Content ID="Content2" ContentPlaceHolderID="Toolbar" runat="server">
```

```csharp
asp:HyperLink ID="HyperLink1" runat="server" NavigateUrl="Titles.aspx" CssClass="command">backasp:HyperLink>
```

```csharp
asp:Content>
```

```csharp
asp:Content ID="Content4" ContentPlaceHolderID="Content" runat="server">
```

```csharp
asp:ValidationSummary ID="NewTitleSummary" runat="server" ValidationGroup="NewTitle"
```

```csharp
DisplayMode="BulletList" HeaderText="Please fix the following issues:" />
```

```csharp
p>
```

```csharp
asp:Label ID="NewTitleLabel" runat="server" Text="New Title" AssociatedControlID="NewTitle">asp:Label>
```

```csharp
asp:TextBox ID="NewTitle" runat="server">asp:TextBox>
```

```csharp
asp:RequiredFieldValidator
```

```csharp
ID="NewTitleRequired" ControlToValidate="NewTitle" Text="*" ValidationGroup="NewTitle"
```

```csharp
runat="server" ErrorMessage="You must enter title text">asp:RequiredFieldValidator>
```

```csharp
asp:CustomValidator
```

```csharp
ID="TitleIsUnique" runat="server" Text="*"  ControlToValidate="NewTitle" OnServerValidate="OnTitleIsUniqueServerValidate"  ValidationGroup="NewTitle" ErrorMessage="This title already exists">asp:CustomValidator>
```

```csharp



```csharp
p>
```

```csharp
p>
```

```csharp
asp:Button ID="Create" OnClick="CreateOnClick" runat="server" Text="Create" />
```

```csharp
p>
```

```csharp
asp:Content>
```
  
```csharp
using System;
```

```csharp
using System.Linq;
```

```csharp
using System.Web.UI;
```

```csharp
using System.Web.UI.WebControls;
```

```csharp
using N2.Edit.Web;
```

```csharp
using N2.Store;
```

```csharp



```csharp
namespace N2.Edit.Store.Titles
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// Editor page for Store titles
```

```csharp
/// 
```

```csharp
public partial class New : EditPage
```

```csharp
{
```

```csharp



```csharp
private ItemBridge _bridge;
```

```csharp



```csharp
/// 
```

```csharp
/// Gets the bridge.
```

```csharp
/// 
```

```csharp
/// The bridge.
```

```csharp
protected virtual ItemBridge Bridge
```

```csharp
{
```

```csharp
get { return _bridge ?? (_bridge = N2.Context.Current.Resolve()); }
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
/// Called when validating the new title is unique
```

```csharp
/// 
```

```csharp
/// The source.
```

```csharp
/// The  instance containing the event data.
```

```csharp
protected void OnTitleIsUniqueServerValidate(object source, ServerValidateEventArgs args)
```

```csharp
{
```

```csharp
args.IsValid = !Bridge.GetAllTitles()
```

```csharp
.Where(title => string.Equals(title.Value, args.Value, StringComparison.OrdinalIgnoreCase)
```

```csharp
|| string.Equals(title.Title, args.Value, StringComparison.OrdinalIgnoreCase))
```

```csharp
.Any();
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Creates the on click.
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
protected void CreateOnClick(object sender, EventArgs e)
```

```csharp
{
```

```csharp
if (Page.IsValid)
```

```csharp
{
```

```csharp
Bridge.CreateTitle(NewTitle.Text);
```

```csharp
Response.Redirect("Titles.aspx");
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
}
```

N2/Store/Titles/Edit.aspx

  
```csharp



```csharp
CodeBehind="Edit.aspx.cs" Inherits="N2.Edit.Store.Titles.Edit" %>
```

```csharp



```csharp
asp:Content ID="ContentHead" ContentPlaceHolderID="Head" runat="server">
```

```csharp
asp:Content>
```

```csharp
asp:Content ID="Content2" ContentPlaceHolderID="Toolbar" runat="server">
```

```csharp
asp:HyperLink ID="HyperLink1" runat="server" NavigateUrl="Titles.aspx" CssClass="command">backasp:HyperLink>
```

```csharp
asp:Content>
```

```csharp
asp:Content ID="Content4" ContentPlaceHolderID="Content" runat="server">
```

```csharp
asp:ValidationSummary ID="NewTitleSummary" runat="server" ValidationGroup="NewTitle"
```

```csharp
DisplayMode="BulletList" HeaderText="Please fix the following issues:" />
```

```csharp
p>
```

```csharp
asp:Label ID="NewTitleLabel" runat="server" Text="New Title" AssociatedControlID="NewTitle">asp:Label>
```

```csharp
asp:TextBox ID="NewTitle" runat="server">asp:TextBox>
```

```csharp
asp:RequiredFieldValidator
```

```csharp
ID="NewTitleRequired" ControlToValidate="NewTitle" Text="*" ValidationGroup="NewTitle"
```

```csharp
runat="server" ErrorMessage="You must enter title text">asp:RequiredFieldValidator>
```

```csharp
asp:CustomValidator
```

```csharp
ID="TitleIsUnique" runat="server" Text="*"  ControlToValidate="NewTitle" OnServerValidate="OnTitleIsUniqueServerValidate"  ValidationGroup="NewTitle" ErrorMessage="This title already exists">asp:CustomValidator>
```

```csharp



```csharp
p>
```

```csharp
p>
```

```csharp
asp:Button ID="Amend" OnClick="AmendOnClick" runat="server" Text="Amend" />
```

```csharp
p>
```

```csharp
asp:Content>
```
  
```csharp
using System;
```

```csharp
using System.Linq;
```

```csharp
using System.Web.UI;
```

```csharp
using System.Web.UI.WebControls;
```

```csharp
using N2.Edit.Web;
```

```csharp
using N2.Store;
```

```csharp



```csharp
namespace N2.Edit.Store.Titles
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// Editor page for Store titles
```

```csharp
/// 
```

```csharp
public partial class Edit : EditPage
```

```csharp
{
```

```csharp



```csharp
private ItemBridge _bridge;
```

```csharp



```csharp
/// 
```

```csharp
/// Gets the bridge.
```

```csharp
/// 
```

```csharp
/// The bridge.
```

```csharp
protected virtual ItemBridge Bridge
```

```csharp
{
```

```csharp
get { return _bridge ?? (_bridge = N2.Context.Current.Resolve()); }
```

```csharp
}
```

```csharp



```csharp



```csharp
/// 
```

```csharp
/// Raises the  event.
```

```csharp
/// 
```

```csharp
/// The  object that contains the event data.
```

```csharp
protected override void OnLoad(EventArgs e)
```

```csharp
{
```

```csharp
base.OnLoad(e);
```

```csharp
if (!Page.IsPostBack)
```

```csharp
{
```

```csharp
N2.Store.Items.SalutationTitle t = Bridge.GetAllTitles()
```

```csharp
.Where(title => string.Equals(title.Value, Request.QueryString["title"], StringComparison.OrdinalIgnoreCase))
```

```csharp
.First();
```

```csharp
NewTitle.Text = t.Title;
```

```csharp
}
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Called when validating the new title is unique
```

```csharp
/// 
```

```csharp
/// The source.
```

```csharp
/// The  instance containing the event data.
```

```csharp
protected void OnTitleIsUniqueServerValidate(object source, ServerValidateEventArgs args)
```

```csharp
{
```

```csharp
args.IsValid = !Bridge.GetAllTitles()
```

```csharp
.Where(title => string.Equals(title.Value, args.Value, StringComparison.OrdinalIgnoreCase) 
```

```csharp
|| string.Equals(title.Title, args.Value, StringComparison.OrdinalIgnoreCase))
```

```csharp
.Any();
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Creates the on click.
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
protected void AmendOnClick(object sender, EventArgs e)
```

```csharp
{
```

```csharp
if (Page.IsValid)
```

```csharp
{
```

```csharp
N2.Store.Items.SalutationTitle t = Bridge.GetAllTitles()
```

```csharp
.Where(title => string.Equals(title.Value, Request.QueryString["title"], StringComparison.OrdinalIgnoreCase))
```

```csharp
.First();
```

```csharp
t.Title = NewTitle.Text;
```

```csharp
Bridge.Save(t);
```

```csharp
Response.Redirect("Titles.aspx");
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
}
```

The final admin page now looks like:

[](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj7UpeYd2QW_xmL7CnFGwFMx4GukSfxZxHooSMams1eF7bA8-TPOM_WePJdNIhhgmIf-v1fn6l5VC6QXDsqdz-5hLWZsavjHIqK-LhWixj2WJ9S4MiLBS5KtgupyPhUGW66GYfO9zOo/s1600-h/image%5B2%5D.png) 

Now to replicate the functionality for all of the other reference data content types.  *You never know maybe by the time I’m done WebHost4Life will have sorted out their issues and I can carry on!.*
