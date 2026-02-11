---
title: "Ektron: Treating Office Files as Normal DMS Assets"
description: ""
pubDate: 2011-08-04
tags: ["ektron"]
source: hugo
originalUrl: "https://codifice.dev/posts/2011-08-04-ektron-treating-office-files-as-normal/"
---

One of the features of Ektron is tight office integration allowing the editing of office files directly from the workarea.  However, in some circumstances you may want to treat these as normal DMS assets (like PDF files) as their the end results of an offline publishing process.

  The Ektron support fix for this is to modify the workarea files (detailed below), which would then need to be re-applyed with every upgrade.  This is easy enough to do (if you remember to do it with each upgrade), but I would prefer a more unobtrusive fix which is applied via configuration.

  #### The Manual Fix (Ektron Supported)  Edit /workarea/edit.aspx and comment out the following lines (~line 2110):

  
```
 
```

Also, comment out the following lines of /workarea/edit.aspx.vb  (~line 1945)

```
phContent.Visible = False
```

The workarea will now treat office files in the same manner as PDF DMS Assets.

#### The Unobtrusive Fix (Unsupported)

Looking at what the official fix achieves does, it all hangs on the value of the “isOffice” hidden field being ‘true’.  Realising this it’s an (almost) trivial task to create an HttpModule to manipulate the control tree of the edit page to get the same effect.  The major advantage of this is that it won’t require modification of Ektron files and can be disabled by simply unregistering the module within the web.config.

```
using System.Reflection;
```

Simply wire up the module in web.config and job’s a good ‘un.