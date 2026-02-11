---
title: "TIP: How to Handle Form Postbacks when Url Rewriting"
description: ""
pubDate: 2010-07-15
tags: ["tips"]
source: hugo
originalUrl: "https://codifice.dev/posts/2010-07-15-tip-how-to-handle-form-postbacks-when/"
---

Url Rewriting is great and I love it a lot, you get to create nice readable (and memorable) urls without having to create hundred of files.  However, there can be issues.  

  For example, when you post back to a page where the url has been rewritten, it won’t be to the nice alias, it will be to the direct ***page.aspx?id=blah ***location.  Which is a bit nasty.

  To stop this, I make use of a Control Adapters which alters the rendering logic of the HtmlForm control on every ASP.Net page, to amend the action to be the nice alias.

  
```
using System.Collections.Generic;
```

You'll notice that the control adapter needs a special HtmlTextWriter implementation to do the actual heavy lifting:

```
using System.Collections.Generic;
```

This is then all registered in your web application with a simple FormAdapter.Browser file in the App_Browsers folder of your Web App.

```
<browser refID="Default">
```

These clases/config can now be reused across multiple projects quickly and easily.

Enjoy.