---
title: Persisting the Page Title across Update Panel Post backs
description: 'A JavaScript fix for the ASP.NET UpdatePanel bug that blanks out the page title after async postbacks.'
pubDate: 2011-08-16
tags: ['troubleshooting']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2011/08/persisting-page-title-across-update.html'
heroImage: ../../assets/blog/hero-images/2011-08-16-persisting-page-title-across-update.jpg
---

There's a fun bug with AsyncPostbacks blanking out the Page Title (<http://stackoverflow.com/questions/627378/page-losing-title-after-updatepanel-asyncpostback>), the recommended fix is to rebind the page title on each Async Postback or to use the declarative page title attribute in the aspx. My fix is to fix a JS bug in JS:

```javascript
$(function () {
  var prm = Sys.WebForms.PageRequestManager.getInstance();
  if (!prm) return;
  document.orginalTitle = document.title;
  prm.add_endRequest(function (s, e) {
    if (document.title.replace(/\s/g, '').length == 0) document.title = document.orginalTitle;
  });
});
```

This JS code will ensure that the page title is persisted across ajax requests, with no changes to the server side code. If you don't have JQuery available (for shame!) then just move the function body into a code block which will execute on the GET request/first view of the page.
