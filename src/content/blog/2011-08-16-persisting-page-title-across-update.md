---
title: Persisting the Page Title across Update Panel Post backs
description: ""
pubDate: 2011-08-16
tags: ["troubleshooting"]
source: hugo
originalUrl: "https://codifice.dev/posts/2011-08-16-persisting-page-title-across-update/"
---

There’s a fun bug with AsyncPostbacks blanking out the Page Title (http://stackoverflow.com/questions/627378/page-losing-title-after-updatepanel-asyncpostback), the recommended fix is to rebind the page title on each Async Postback or to use the declarative page title attribute in the aspx.  My fix is to fix a JS bug in JS:

  

{{}}
$(function(){
     var prm = Sys.WebForms.PageRequestManager.getInstance();
     if (!(prm)) return;
     document.orginalTitle=document.title;
     instance.add_endRequest(function(s, e){
         if (document.title.replace(/\s/g,"").length==0)
             document.title=document.orginalTitle;
     });
 });
 {{}}

This JS code will ensure that the page title is persisted across ajax requests, with no changes to the server side code.   If you don’t have JQuery available (for shame!) then just move the function body into a code block which will execute on the GET request/first view of the page.