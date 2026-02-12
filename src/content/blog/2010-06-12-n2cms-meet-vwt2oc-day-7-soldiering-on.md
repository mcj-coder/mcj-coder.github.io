---
title: "N2CMS Meet VWT2OC: Day 7 \u2013 Soldiering On"
description: ''
pubDate: 2010-06-12
heroImage: ../../assets/blog/hero-images/2010-06-12-n2cms-meet-vwt2oc-day-7-soldiering-on.jpg

tags: ['n2cms']
source: hugo
originalUrl: 'https://codifice.dev/posts/2010-06-12-n2cms-meet-vwt2oc-day-7-soldiering-on/'
---

_Well, WebHost4Life are still trying to fix their migration issues (72 hours and counting!) which have taken down the current website and database which has quite effectively stopped my actual development on the project.  D’oh!  Apparently, the failure is so severe that they can’t even provide a back up of the database.  Double D’oh!  This has pretty much derailed my project plan…._

_I’ll definitely be recommending we jump ship and go with a better hosting provider._

\*\*

\*\*

#### Creating a Store Root Since the VWT2OC Club has paid memberships it makes sense for me to develop two Add-ons ‘N2.Store’ and ‘N2.Club’.  Although these will be developed in concert it’s intended that N2.Store won’t require N2.Club (but N2.Store is a prerequisite of N2.Club).  At a very basic level the store functionality will be

     * A collection of Products
    * A collection of Orders
    * A collection of Customers
    * A collection of reference data
    * A payment processing pipeline (shopping basket/checkout)
    * Order Reports

To keep all of this data organised it will all be created under a ‘StoreRoot’ container, which may provide for the future possibility of multiple ‘Stores’ per N2CMS installation.  Defining this is as simple as:

```
using N2.Integrity;
```

**\*Multilingual Gotcha** – I’ve had a (brief) look at the globalisation implementation for N2CMS and it’s too complex for me to implement at this time and VWT2OC is an English only site.  Usually, I code for a global audience (as far as possible) but for now I don’t have time.  If anyone’s interested I think I’m pretty sure that translations can be implemented in a similar fashion to normal content items.  Or simply hosting the Store Root under a localized start page would probably work as well….just need to make some minor adjustments to the N2.Store.ItemBridge to make sure it finds right version.\*

#### Storing Reference Data in N2CMS

N2CMS is a platform which is understandably focused on content that’s going to be displayed to the user.  Most of the examples out there on how to add your own data types and model are mostly suited to widgets and new page functionality.  To support the VWT2OC Club and Store functionality, I need lots of supporting reference data…such as:

- Salutation Titles (Mr, Mrs, Ms., Miss, Dr, etc)

- Countries

- Genders

- Membership Types

These are all data sets which once they’re created will mostly be left alone.

Fortunately, there are good examples on how to manage this type of data in the n2cms code base.  The feature I’ve chosen to model my approach against is the N2.Security Users Items and Edit Screens in N2.Management.   The technique is to create another container content item (for example - SalutationTitleList) and adding each SalutationTitle object to it as a child content item.

```
using N2.Details;
```

The actual reference data is defined as a more traditional n2cms ContentItem implementation:

```
using N2.Integrity;
```

#### Taking it to the Bridge

So, now we’ve defined the content model for the Salutation Title content it’s time to actually get some values into the database.  To do this we need to create a bridge between the N2CMS  content model and ASP.NET web controls – I’ve imaginatively called this class ‘N2.Store.ItemBridge’ and based it heavily on ‘N2.Security.ItemBridge’ in the n2cms codebase.  This bridge will need to be instances by the n2cms plugin system so it requires some specific constructors:

```
using N2.Configuration;
```

The class can now be registered with the n2cms engine for automatic intialization using an IPluginInitializer implementation:

```
 
```

Within the Item Bridge I’ve written some basic generic methods that can be used to perform basic CRUD operations:

```
 
```

N2CMS promotes a lazy construction methodology to creating structural content items, so the ItemBridge is coded to (optionally) create missing containers.  By following through this pattern you can guarantee that the correct data structure gets created the first time someone attempts to use it.

```
 
```

The ItemBridge can now be used to create an ObjectDataSource class to allow ASP.NET Databinding:

```
 
```

Phew!  Ground work done for the store in general and implemented the SalutationTitle content items.

#### Show Me the Money Titles

So we can actually view, create and edit the SalutationTitle content, we need to create some Admin Screens.  Way back in [Day 3](http://martinondotnet.blogspot.com/2010/06/n2cms-meet-vwt2oc-day-3-grinding-to.html), I showed how to create a new navigation menu in the editor, now we  need to create a link on that menu to show us a list of the SalutationTitles in the database (/N2/Store/Titles/Titles.aspx) and set it’s target to the ‘preview’ frame.

My list page is a simple databound gridview implementation with some custom sort order management (which is why SalutationTitleList as a [SortChildren(SortBy.Unordered)] attribute to prevent n2cms from automatically ordering it!).

N2/Store/Titles/Titles.aspx

```
CodeBehind="Titles.aspx.cs" Inherits="N2.Edit.Store.Titles.Titles" %>
```

```
using System.Collections.Generic;
```

As you can see it leverages the existing master pages and edit functionality from the N2.Management project to promote a more consistent look and feel.

Creating the New.aspx and Edit.aspx pages are just as simple.

N2/Store/Titles/New.aspx

```
CodeBehind="New.aspx.cs" Inherits="N2.Edit.Store.Titles.New" %>
```

```
using System;
```

N2/Store/Titles/Edit.aspx

```
<%@@ Page Language="C#" MasterPageFile="../../Content/Framed.Master" AutoEventWireup="true"
```

```
using System.Linq;
```

The final admin page now looks like:

[](http://lh5.ggpht.com/_Vz_CYzsjR7M/TBOeGqlnd_I/AAAAAAAAAEw/gRptcqxQaTA/s1600-h/image%5B2%5D.png)

Now to replicate the functionality for all of the other reference data content types.  _You never know maybe by the time I’m done WebHost4Life will have sorted out their issues and I can carry on!._
