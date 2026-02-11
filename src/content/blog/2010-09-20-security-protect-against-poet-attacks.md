---
title: "Security: Protect against POET Attacks with Custom Errors!"
description: ""
pubDate: 2010-09-20
tags: ["tips"]
source: hugo
originalUrl: "https://codifice.dev/posts/2010-09-20-security-protect-against-poet-attacks/"
---

There’s been a [big](http://bit.ly/adYPvZ) [deal](http://bit.ly/9ANVPs) made of a [serious security flaw](http://bit.ly/9KxgtL) in ASP.Net which potentially affects a lot of .Net sites, that allows a 3rd Party to trick ASP.Net into serving sensitive files within a web application folder.  Microsoft have released official advise on how to [temporarily patch](http://bit.ly/adYPvZ) the problem which revolves around forcing Error  and Page Not found pages to return the same status page.  This would need to stay in place until a permanent fix is released.

  This workaround clearly introduces an usability issue, which client may not accept. 

  Fortunately a quick amend to my [Custom Error Module](http://bit.ly/d3b0Xt) can secure your site against the attack with minimal impact to usability.  

  

  
```
using System.Web;
```

The amendments hinge on the fact that the exploit only really affects the WebResource.axd and ScriptResource.axd so any error relating from these handlers is automatically given an 500 status (Internal Server Error) and treated as a normal error.  This is an acceptable compromise for me as all references to these handlers should be programmatically generated and by your site and therefore ‘correct’.

As per, Scott Gu’s recommendation I’ve added a random <500ms delay to the processing of all errors to help muddy the waters and added support for the ResponseRewrite property on the CustomErrors element.