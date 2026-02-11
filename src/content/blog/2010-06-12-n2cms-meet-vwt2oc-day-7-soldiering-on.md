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

             1: using N2.Definitions;

       2: using N2.Integrity;

       3:  

       4: namespace N2.Store.Items

       5: {

       6:     /// 

       7:     /// This is a root for all of the store specific types

       8:     /// 

       9:     [RestrictParents(typeof(IRootPage), typeof(IStartPage))]

      10:     [Throwable(AllowInTrash.No)]

      11:     [Versionable(AllowVersions.Yes)]

      12:     public class StoreRoot : ContentItem

      13:     {

      14:     }

      15: }

***Multilingual Gotcha** – I’ve had a (brief) look at the globalisation implementation for N2CMS and it’s too complex for me to implement at this time and VWT2OC is an English only site.  Usually, I code for a global audience (as far as possible) but for now I don’t have time.  If anyone’s interested I think I’m pretty sure that translations can be implemented in a similar fashion to normal content items.  Or simply hosting the Store Root under a localized start page would probably work as well….just need to make some minor adjustments to the N2.Store.ItemBridge to make sure it finds right version.*

## Storing Reference Data in [N2CMS](http://bit.ly/aco4m4)

N2CMS is a platform which is understandably focused on content that’s going to be displayed to the user.  Most of the examples out there on how to add your own data types and model are mostly suited to widgets and new page functionality.  To support the VWT2OC Club and Store functionality, I need lots of supporting reference data…such as:

  * Salutation Titles (Mr, Mrs, Ms., Miss, Dr, etc)

  * Countries

  * Genders

  * Membership Types

These are all data sets which once they’re created will mostly be left alone.

Fortunately, there are good examples on how to manage this type of data in the n2cms code base.  The feature I’ve chosen to model my approach against is the N2.Security Users Items and Edit Screens in N2.Management.   The technique is to create another container content item (for example - SalutationTitleList) and adding each SalutationTitle object to it as a child content item.

  
       1: using N2.Definitions;

       2: using N2.Details;

       3: using N2.Integrity;

       4:  

       5: namespace N2.Store.Items

       6: {

       7:     /// 

       8:     /// Defines the container for salutation types

       9:     /// 

      10:     [WithEditableTitle("Title", 10)]

      11:     [ItemAuthorizedRoles(Roles = new string[0])]

      12:     [Throwable(AllowInTrash.No)]

      13:     [RestrictParents(typeof(StoreRoot))]

      14:     [SortChildren(SortBy.Unordered)]

      15:     public class SalutationTitleList : N2.ContentItem

      16:     {

      17:        

      18:     }

      19: }

The actual reference data is defined as a more traditional n2cms ContentItem implementation:

  
       1: using N2.Details;

       2: using N2.Integrity;

       3: using N2.Definitions;

       4:  

       5: namespace N2.Store.Items

       6: {

       7:     /// 

       8:     /// Defines the different salutation types

       9:     /// 

      10:     [RestrictParents(typeof(SalutationTitleList))]

      11:     [Throwable(AllowInTrash.No)]

      12:     [Versionable(AllowVersions.Yes)]

      13:     public class SalutationTitle : N2.ContentItem

      14:     {

      15:         /// 

      16:         /// Gets or sets the item's title. This is used in edit mode and probably in a custom implementation.

      17:         /// 

      18:         /// 

      19:         [EditableTextBox("Title", 20, Required = true)]

      20:         public override string Title

      21:         {

      22:             get { return base.Title; }

      23:             set { base.Title = value; }

      24:         }

      25:  

      26:         /// 

      27:         /// Gets or sets the value.

      28:         /// 

      29:         /// The value.

      30:         [EditableTextBox("Value", 30, Required = false)]

      31:         public virtual string Value

      32:         {

      33:             get { return GetDetailstring>("Value", Title); }

      34:             set { SetDetailstring>("Value", value); }

      35:         }

      36:     }

      37: }

## Taking it to the Bridge!

So, now we’ve defined the content model for the Salutation Title content it’s time to actually get some values into the database.  To do this we need to create a bridge between the N2CMS  content model and ASP.NET web controls – I’ve imaginatively called this class ‘N2.Store.ItemBridge’ and based it heavily on ‘N2.Security.ItemBridge’ in the n2cms codebase.  This bridge will need to be instances by the n2cms plugin system so it requires some specific constructors:

  
       1: using System.Collections.Generic;

       2: using N2.Configuration;

       3: using N2.Definitions;

       4: using N2.Persistence;

       5: using N2.Persistence.Finder;

       6: using N2.Web;

       7:  

       8: namespace N2.Store

       9: {

      10:     /// 

      11:     /// Provides easy to use methods for manipulating reference data

      12:     /// 

      13:     public class ItemBridge

      14:     {

      15:  

      16:         readonly private IDefinitionManager _definitions;

      17:         readonly private IItemFinder _finder;

      18:         readonly private IPersister _persister;

      19:         private readonly IHost _host;

      20:  

      21:         /// 

      22:         /// Initializes a new instance of the  class.

      23:         /// 

      24:         /// The definitions.

      25:         /// The finder.

      26:         /// The persister.

      27:         /// The host.

      28:         /// The config.

      29:         public ItemBridge(IDefinitionManager definitions, IItemFinder finder, IPersister persister, IHost host, EditSection config)

      30:             : this(definitions, finder, persister, host)

      31:         {

      32:  

      33:         }

      34:  

      35:         /// 

      36:         /// Initializes a new instance of the  class.

      37:         /// 

      38:         /// The definitions.

      39:         /// The finder.

      40:         /// The persister.

      41:         /// The host.

      42:         public ItemBridge(IDefinitionManager definitions, IItemFinder finder, IPersister persister, IHost host)

      43:         {

      44:             this._definitions = definitions;

      45:             this._finder = finder;

      46:             this._persister = persister;

      47:             this._host = host;

      48:         }

      49:  

      50:         // Implementation detail

      51:     }

      52: }

The class can now be registered with the n2cms engine for automatic intialization using an IPluginInitializer implementation:

  
       1: using N2.Plugin;

       2:  

       3: namespace N2.Store

       4: {

       5:     /// 

       6:     /// Initializes the Stores Reference Item Bridge

       7:     /// 

       8:     [AutoInitialize]

       9:     public class StoreInitializer : IPluginInitializer

      10:     {

      11:         /// 

      12:         /// Invoked after the factory has been initialized.

      13:         /// 

      14:         /// The factory that has been initialized.

      15:         public void Initialize(Engine.IEngine engine)

      16:         {

      17:             engine.AddComponent("n2.storeReferenceProvider", typeof(ItemBridge));

      18:         }

      19:     }

      20: }

Within the Item Bridge I’ve written some basic generic methods that can be used to perform basic CRUD operations:

  
       1: #region Generic Persister Methods

       2:  

       3:   /// 

       4:   /// Gets the finder.

       5:   /// 

       6:   /// The finder.

       7:   public IItemFinder Finder

       8:   {

       9:       get { return _finder; }

      10:   }

      11:  

      12:   /// 

      13:   /// Gets the container parent ID.

      14:   /// 

      15:   /// The container parent ID.

      16:   protected int ContainerParentID

      17:   {

      18:       get { return _host.CurrentSite.RootItemID; }

      19:   }

      20:  

      21:   /// 

      22:   /// Deletes the specified item.

      23:   /// 

      24:   /// The item.

      25:   public virtual void Delete(ContentItem item)

      26:   {

      27:       _persister.Delete(item);

      28:   }

      29:  

      30:   /// 

      31:   /// Saves the specified item.

      32:   /// 

      33:   /// The item.

      34:   public virtual void Save(ContentItem item)

      35:   {

      36:       _persister.Save(item);

      37:   }

      38:  

      39:   /// 

      40:   /// Creates a new item within the specified parent container.

      41:   /// 

      42:   /// 

      43:   /// The parent.

      44:   /// The name.

      45:   /// 

      46:   protected virtual T Create(ContentItem parent, string name) where T : ContentItem

      47:   {

      48:       T m = Context.Definitions.CreateInstance(parent);

      49:       m.Title = typeof(T).Name;

      50:       m.Name = name;

      51:       _persister.Save(m);

      52:       return m;

      53:   }

      54:  

      55:   /// 

      56:   /// Retrieves the specified create.

      57:   /// 

      58:   /// 

      59:   /// if set to true [create].

      60:   /// The name.

      61:   /// The parent.

      62:   /// 

      63:   protected virtual T Retrieve(ContentItem parent, string name, bool create) where T : ContentItem

      64:   {

      65:       return Retrieve(parent.ID, name, create);

      66:   }

      67:  

      68:   /// 

      69:   /// Retrieves the specified content item, creating a new item if required.

      70:   /// 

      71:   /// 

      72:   /// if set to true [create].

      73:   /// The name.

      74:   /// The container parent id.

      75:   /// 

      76:   protected virtual T Retrieve(int containerParentId, string name, bool create) where T : ContentItem

      77:   {

      78:       var q = Finder.Where.Name.Eq(name).And.ParentID.Eq(containerParentId).MaxResults(1);

      79:       foreach (var item in q.Select())

      80:       {

      81:           return item;

      82:       }

      83:  

      84:       if (!create)

      85:           return null;

      86:  

      87:       ContentItem parent = _persister.Get(containerParentId);

      88:       return Create(parent, name);

      89:   }

      90:  

      91:   #endregion

N2CMS promotes a lazy construction methodology to creating structural content items, so the ItemBridge is coded to (optionally) create missing containers.  By following through this pattern you can guarantee that the correct data structure gets created the first time someone attempts to use it.

  
       1: #region Store Root

       2:  

       3:  private string _storeContainerName = "Store Settings";

       4:  

       5:  /// 

       6:  /// Gets or sets the name of the salutation title container.

       7:  /// 

       8:  /// The name of the salutation title container.

       9:  public string StoreContainerName

      10:  {

      11:      get { return _storeContainerName; }

      12:      set { _storeContainerName = value; }

      13:  }

      14:  

      15:  /// 

      16:  /// Gets the store container.

      17:  /// 

      18:  /// if set to true [create].

      19:  /// 

      20:  public virtual Items.StoreRoot GetStoreContainer(bool create)

      21:  {

      22:      return Retrieve(ContainerParentID, StoreContainerName, create);

      23:  }

      24:  

      25:  #endregion

      26:  

      27:  #region Salutation Titles

      28:  

      29:  private string _titleContainerName = "TemplateTitles";

      30:  

      31:  /// 

      32:  /// Gets or sets the name of the salutation title container.

      33:  /// 

      34:  /// The name of the salutation title container.

      35:  public string SalutationTitleContainerName

      36:  {

      37:      get { return _titleContainerName; }

      38:      set { _titleContainerName = value; }

      39:  }

      40:  

      41:  /// 

      42:  /// Gets the title container.

      43:  /// 

      44:  /// if set to true [create].

      45:  /// 

      46:  public virtual Items.SalutationTitleList GetTitleContainer(bool create)

      47:  {

      48:      Items.StoreRoot store = GetStoreContainer(create);

      49:      return Retrieve(store, SalutationTitleContainerName, create);

      50:  }

      51:  

      52:  /// 

      53:  /// Creates the title container.

      54:  /// 

      55:  /// The parent.

      56:  /// 

      57:  protected Items.SalutationTitleList CreateTitleContainer(ContentItem parent)

      58:  {

      59:      return Create(parent, SalutationTitleContainerName);

      60:  }

      61:  

      62:  /// 

      63:  /// Gets all titles.

      64:  /// 

      65:  /// 

      66:  public virtual IEnumerable GetAllTitles()

      67:  {

      68:      Items.SalutationTitleList titles = GetTitleContainer(true);

      69:      if (titles == null)

      70:          return new List();

      71:      return Finder.Where.Parent.Eq(titles)

      72:          .And.Type.Eq(typeof(Items.SalutationTitle))

      73:          .OrderBy.SortOrder.Asc

      74:          .Select();

      75:  }

      76:  

      77:  /// 

      78:  /// Adds the title.

      79:  /// 

      80:  /// The title.

      81:  public Items.SalutationTitle CreateTitle(string title)

      82:  {

      83:      Items.SalutationTitleList titles = GetTitleContainer(true);

      84:      foreach (Items.SalutationTitle tExisting in Finder.Where.Parent.Eq(titles)

      85:          .And.Title.Eq(title)

      86:          .And.Type.Eq(typeof(Items.SalutationTitle))

      87:          .OrderBy.Title.Asc

      88:          .Select())

      89:          return tExisting;

      90:  

      91:      Items.SalutationTitle t = _definitions.CreateInstance(titles);

      92:      t.Title = title;

      93:      t.Value = title.Trim().ToLowerInvariant();

      94:      t.SortOrder = titles.Children.Count;

      95:      _persister.Save(t);

      96:      return t;

      97:  }

      98:  

      99:  #endregion

The ItemBridge can now be used to create an ObjectDataSource class to allow ASP.NET Databinding:

  
       1: using System.Collections.Generic;

       2:  

       3: namespace N2.Store

       4: {

       5:     /// 

       6:     /// An ObjectDataSource accessible wrapper for the ReferenceItemBridge

       7:     /// 

       8:     public class ReferenceItemDataSource

       9:     {

      10:         private ItemBridge _bridge;

      11:  

      12:         /// 

      13:         /// Gets the bridge.

      14:         /// 

      15:         /// The bridge.

      16:         protected virtual ItemBridge Bridge

      17:         {

      18:             get { return _bridge ?? (_bridge = Context.Current.Resolve()); }

      19:         }

      20:  

      21:         /// 

      22:         /// Gets all titles.

      23:         /// 

      24:         /// 

      25:         public IEnumerable GetAllTitles()

      26:         {

      27:             return Bridge.GetAllTitles();

      28:         }

      29:  

      30:     }

      31: }

Phew!  Ground work done for the store in general and implemented the SalutationTitle content items.

## Show Me the Money Titles!

So we can actually view, create and edit the SalutationTitle content, we need to create some Admin Screens.  Way back in [Day 3](http://martinondotnet.blogspot.com/2010/06/n2cms-meet-vwt2oc-day-3-grinding-to.html), I showed how to create a new navigation menu in the editor, now we  need to create a link on that menu to show us a list of the SalutationTitles in the database (/N2/Store/Titles/Titles.aspx) and set it’s target to the ‘preview’ frame.

My list page is a simple databound gridview implementation with some custom sort order management (which is why SalutationTitleList as a [SortChildren(SortBy.Unordered)] attribute to prevent n2cms from automatically ordering it!).

N2/Store/Titles/Titles.aspx

  
       1: 

       2:     CodeBehind="Titles.aspx.cs" Inherits="N2.Edit.Store.Titles.Titles" %>

       3:  

       4: asp:Content ID="ContentHead" ContentPlaceHolderID="Head" runat="server">

       5: asp:Content>

       6: asp:Content ID="Content2" ContentPlaceHolderID="Toolbar" runat="server">

       7:     asp:HyperLink ID="HyperLink1" runat="server" NavigateUrl="New.aspx" CssClass="command">newasp:HyperLink>

       8: asp:Content>

       9: asp:Content ID="Content4" ContentPlaceHolderID="Content" runat="server">

      10:     asp:DataGrid ID="TitleList" runat="server" DataSourceID="TitleSource" AutoGenerateColumns="False"

      11:         UseAccessibleHeader="True" OnItemCommand="TitleList_ItemCommand" DataKeyField="Value"

      12:         BorderWidth="0px" CssClass="gv">

      13:         Columns>

      14:             asp:HyperLinkColumn DataNavigateUrlField="Value" DataTextField="Title" DataNavigateUrlFormatString="Edit.aspx?title={0}" />

      15:             asp:TemplateColumn ItemStyle-Width="20px">

      16:                 ItemTemplate>

      17:                     asp:ImageButton ID="ImageButton1" AlternateText="Move Up" ImageUrl="~/N2/Resources/icons/arrow_up.png"

      18:                         runat="server" CommandName="up" />

      19:                 ItemTemplate>

      20:             asp:TemplateColumn>

      21:               asp:TemplateColumn  ItemStyle-Width="20px">

      22:                 ItemTemplate>

      23:                     asp:ImageButton ID="ImageButton2"  AlternateText="Move Down" ImageUrl="~/N2/Resources/icons/arrow_down.png"

      24:                         runat="server" CommandName="down" />

      25:                 ItemTemplate>

      26:             asp:TemplateColumn>

      27:             asp:TemplateColumn  ItemStyle-Width="20px">

      28:                 ItemTemplate>

      29:                     asp:ImageButton AlternateText="Delete" ImageUrl="~/N2/Resources/icons/delete.png"

      30:                         runat="server" CommandName="Delete" />

      31:                 ItemTemplate>

      32:             asp:TemplateColumn>

      33:             

      34:         Columns>

      35:     asp:DataGrid>

      36:     asp:ObjectDataSource ID="TitleSource" runat="server" TypeName="N2.Store.ReferenceItemDataSource"

      37:         SelectMethod="GetAllTitles" />

      38: asp:Content>

  
       1: using System;

       2: using System.Collections.Generic;

       3: using System.Linq;

       4: using System.Web.UI.WebControls;

       5: using N2.Edit.Web;

       6: using N2.Store;

       7:  

       8: namespace N2.Edit.Store.Titles

       9: {

      10:     /// 

      11:     /// Editor page for Store titles

      12:     /// 

      13:     public partial class Titles : EditPage

      14:     {

      15:         private ItemBridge _bridge;

      16:  

      17:         /// 

      18:         /// Gets the bridge.

      19:         /// 

      20:         /// The bridge.

      21:         protected virtual ItemBridge Bridge

      22:         {

      23:             get { return _bridge ?? (_bridge = N2.Context.Current.Resolve()); }

      24:         }

      25:  

      26:         /// 

      27:         /// Handles the ItemCommand event of the TitleList control.

      28:         /// 

      29:         /// The source of the event.

      30:         /// The  instance containing the event data.

      31:         protected void TitleList_ItemCommand(object sender, DataGridCommandEventArgs args)

      32:         {

      33:             IList titles = Bridge.GetAllTitles().ToList();

      34:             N2.Store.Items.SalutationTitle t = titles

      35:                   .Where(title => string.Equals(title.Value, (string)TitleList.DataKeys[args.Item.ItemIndex], StringComparison.OrdinalIgnoreCase))

      36:                   .First();

      37:             if (args.CommandName == "Delete")

      38:             {

      39:                 Bridge.Delete(t);

      40:             }

      41:             else if (args.CommandName == "up" && args.Item.ItemIndex > 0)

      42:             {

      43:                 titles.Remove(t);

      44:                 titles.Insert(args.Item.ItemIndex - 1, t);

      45:             }

      46:             else if (args.CommandName == "down" && args.Item.ItemIndex 

      47:             {

      48:                 titles.Remove(t);

      49:                 titles.Insert(args.Item.ItemIndex + 1, t);

      50:             }

      51:             if (args.CommandName == "up" || args.CommandName == "down")

      52:             {

      53:                 foreach (N2.Store.Items.SalutationTitle t2 in titles)

      54:                 {

      55:                     t2.SortOrder = titles.IndexOf(t2);

      56:                     Bridge.Save(t2);

      57:                 }

      58:             }

      59:             TitleList.DataBind();

      60:         }

      61:     }

      62: }

As you can see it leverages the existing master pages and edit functionality from the N2.Management project to promote a more consistent look and feel.

Creating the New.aspx and Edit.aspx pages are just as simple.

N2/Store/Titles/New.aspx

  
       1: 

       2:     CodeBehind="New.aspx.cs" Inherits="N2.Edit.Store.Titles.New" %>

       3:  

       4: asp:Content ID="ContentHead" ContentPlaceHolderID="Head" runat="server">

       5: asp:Content>

       6: asp:Content ID="Content2" ContentPlaceHolderID="Toolbar" runat="server">

       7:     asp:HyperLink ID="HyperLink1" runat="server" NavigateUrl="Titles.aspx" CssClass="command">backasp:HyperLink>

       8: asp:Content>

       9: asp:Content ID="Content4" ContentPlaceHolderID="Content" runat="server">

      10:     asp:ValidationSummary ID="NewTitleSummary" runat="server" ValidationGroup="NewTitle"

      11:         DisplayMode="BulletList" HeaderText="Please fix the following issues:" />

      12:     p>

      13:         asp:Label ID="NewTitleLabel" runat="server" Text="New Title" AssociatedControlID="NewTitle">asp:Label>

      14:         asp:TextBox ID="NewTitle" runat="server">asp:TextBox>

      15:         asp:RequiredFieldValidator

      16:             ID="NewTitleRequired" ControlToValidate="NewTitle" Text="*" ValidationGroup="NewTitle"

      17:             runat="server" ErrorMessage="You must enter title text">asp:RequiredFieldValidator>

      18:             asp:CustomValidator

      19:                 ID="TitleIsUnique" runat="server" Text="*"  ControlToValidate="NewTitle" OnServerValidate="OnTitleIsUniqueServerValidate"  ValidationGroup="NewTitle" ErrorMessage="This title already exists">asp:CustomValidator>

      20:             

      21:     p>

      22:     p>

      23:         asp:Button ID="Create" OnClick="CreateOnClick" runat="server" Text="Create" />

      24:     p>

      25: asp:Content>

  
       1: using System;

       2: using System.Linq;

       3: using System.Web.UI;

       4: using System.Web.UI.WebControls;

       5: using N2.Edit.Web;

       6: using N2.Store;

       7:  

       8: namespace N2.Edit.Store.Titles

       9: {

      10:     /// 

      11:     /// Editor page for Store titles

      12:     /// 

      13:     public partial class New : EditPage

      14:     {

      15:  

      16:         private ItemBridge _bridge;

      17:  

      18:         /// 

      19:         /// Gets the bridge.

      20:         /// 

      21:         /// The bridge.

      22:         protected virtual ItemBridge Bridge

      23:         {

      24:             get { return _bridge ?? (_bridge = N2.Context.Current.Resolve()); }

      25:         }

      26:  

      27:        

      28:  

      29:         /// 

      30:         /// Called when validating the new title is unique

      31:         /// 

      32:         /// The source.

      33:         /// The  instance containing the event data.

      34:         protected void OnTitleIsUniqueServerValidate(object source, ServerValidateEventArgs args)

      35:         {

      36:            args.IsValid = !Bridge.GetAllTitles()

      37:                .Where(title => string.Equals(title.Value, args.Value, StringComparison.OrdinalIgnoreCase)

      38:                     || string.Equals(title.Title, args.Value, StringComparison.OrdinalIgnoreCase))

      39:                .Any();

      40:         }

      41:  

      42:         /// 

      43:         /// Creates the on click.

      44:         /// 

      45:         /// The sender.

      46:         /// The  instance containing the event data.

      47:         protected void CreateOnClick(object sender, EventArgs e)

      48:         {

      49:             if (Page.IsValid)

      50:             {

      51:                 Bridge.CreateTitle(NewTitle.Text);

      52:                 Response.Redirect("Titles.aspx");

      53:             }

      54:         }

      55:     }

      56: }

N2/Store/Titles/Edit.aspx

  
       1: 

       2:     CodeBehind="Edit.aspx.cs" Inherits="N2.Edit.Store.Titles.Edit" %>

       3:  

       4: asp:Content ID="ContentHead" ContentPlaceHolderID="Head" runat="server">

       5: asp:Content>

       6: asp:Content ID="Content2" ContentPlaceHolderID="Toolbar" runat="server">

       7:     asp:HyperLink ID="HyperLink1" runat="server" NavigateUrl="Titles.aspx" CssClass="command">backasp:HyperLink>

       8: asp:Content>

       9: asp:Content ID="Content4" ContentPlaceHolderID="Content" runat="server">

      10:     asp:ValidationSummary ID="NewTitleSummary" runat="server" ValidationGroup="NewTitle"

      11:         DisplayMode="BulletList" HeaderText="Please fix the following issues:" />

      12:     p>

      13:         asp:Label ID="NewTitleLabel" runat="server" Text="New Title" AssociatedControlID="NewTitle">asp:Label>

      14:         asp:TextBox ID="NewTitle" runat="server">asp:TextBox>

      15:         asp:RequiredFieldValidator

      16:             ID="NewTitleRequired" ControlToValidate="NewTitle" Text="*" ValidationGroup="NewTitle"

      17:             runat="server" ErrorMessage="You must enter title text">asp:RequiredFieldValidator>

      18:             asp:CustomValidator

      19:                 ID="TitleIsUnique" runat="server" Text="*"  ControlToValidate="NewTitle" OnServerValidate="OnTitleIsUniqueServerValidate"  ValidationGroup="NewTitle" ErrorMessage="This title already exists">asp:CustomValidator>

      20:             

      21:     p>

      22:     p>

      23:         asp:Button ID="Amend" OnClick="AmendOnClick" runat="server" Text="Amend" />

      24:     p>

      25: asp:Content>

  
       1: using System;

       2: using System.Linq;

       3: using System.Web.UI;

       4: using System.Web.UI.WebControls;

       5: using N2.Edit.Web;

       6: using N2.Store;

       7:  

       8: namespace N2.Edit.Store.Titles

       9: {

      10:     /// 

      11:     /// Editor page for Store titles

      12:     /// 

      13:     public partial class Edit : EditPage

      14:     {

      15:  

      16:         private ItemBridge _bridge;

      17:  

      18:         /// 

      19:         /// Gets the bridge.

      20:         /// 

      21:         /// The bridge.

      22:         protected virtual ItemBridge Bridge

      23:         {

      24:             get { return _bridge ?? (_bridge = N2.Context.Current.Resolve()); }

      25:         }

      26:  

      27:  

      28:         /// 

      29:         /// Raises the  event.

      30:         /// 

      31:         /// The  object that contains the event data.

      32:         protected override void OnLoad(EventArgs e)

      33:         {

      34:             base.OnLoad(e);

      35:             if (!Page.IsPostBack)

      36:             {

      37:                 N2.Store.Items.SalutationTitle t = Bridge.GetAllTitles()

      38:                     .Where(title => string.Equals(title.Value, Request.QueryString["title"], StringComparison.OrdinalIgnoreCase))

      39:                     .First();

      40:                 NewTitle.Text = t.Title;

      41:             }

      42:         }

      43:  

      44:         /// 

      45:         /// Called when validating the new title is unique

      46:         /// 

      47:         /// The source.

      48:         /// The  instance containing the event data.

      49:         protected void OnTitleIsUniqueServerValidate(object source, ServerValidateEventArgs args)

      50:         {

      51:             args.IsValid = !Bridge.GetAllTitles()

      52:                 .Where(title => string.Equals(title.Value, args.Value, StringComparison.OrdinalIgnoreCase) 

      53:                     || string.Equals(title.Title, args.Value, StringComparison.OrdinalIgnoreCase))

      54:                 .Any();

      55:         }

      56:  

      57:         /// 

      58:         /// Creates the on click.

      59:         /// 

      60:         /// The sender.

      61:         /// The  instance containing the event data.

      62:         protected void AmendOnClick(object sender, EventArgs e)

      63:         {

      64:             if (Page.IsValid)

      65:             {

      66:                 N2.Store.Items.SalutationTitle t = Bridge.GetAllTitles()

      67:                     .Where(title => string.Equals(title.Value, Request.QueryString["title"], StringComparison.OrdinalIgnoreCase))

      68:                         .First();

      69:                 t.Title = NewTitle.Text;

      70:                 Bridge.Save(t);

      71:                 Response.Redirect("Titles.aspx");

      72:             }

      73:         }

      74:     }

      75: }

The final admin page now looks like:

[](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj7UpeYd2QW_xmL7CnFGwFMx4GukSfxZxHooSMams1eF7bA8-TPOM_WePJdNIhhgmIf-v1fn6l5VC6QXDsqdz-5hLWZsavjHIqK-LhWixj2WJ9S4MiLBS5KtgupyPhUGW66GYfO9zOo/s1600-h/image%5B2%5D.png) 

Now to replicate the functionality for all of the other reference data content types.  *You never know maybe by the time I’m done WebHost4Life will have sorted out their issues and I can carry on!.*
