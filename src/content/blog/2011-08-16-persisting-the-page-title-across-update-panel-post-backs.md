---
title: "Persisting the Page Title across Update Panel Post backs"
description: "Technical blog post from 2011-08-16"
pubDate: 2011-08-16
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

There’s a fun bug with AsyncPostbacks blanking out the Page Title ([http://stackoverflow.com/questions/627378/page-losing-title-after-updatepanel-asyncpostback)](http://stackoverflow.com/questions/627378/page-losing-title-after-updatepanel-asyncpostback), the recommended fix is to rebind the page title on each Async Postback or to use the declarative page title attribute in the aspx.  My fix is to fix a JS bug in JS:

```csharp
$(function(){
```

```csharp
var prm = Sys.WebForms.PageRequestManager.getInstance();
```

```csharp
if (!(prm)) return;
```

```csharp
document.orginalTitle=document.title;
```

```csharp
instance.add_endRequest(function(s, e){
```

```csharp
if (document.title.replace(/\s/g,"").length==0)
```

```csharp
document.title=document.orginalTitle;
```

```csharp
});
```

```csharp
});
```

This JS code will ensure that the page title is persisted across ajax requests, with no changes to the server side code.   If you don’t have JQuery available (for shame!) then just move the function body into a code block which will execute on the GET request/first view of the page.
