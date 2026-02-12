---
title: 'ASP.Net and Custom Error Pages, an SEO nightmare?'
description: ''
pubDate: 2010-03-20
updatedDate: 2010-03-25
tags: ['best-practise']
source: hugo
originalUrl: 'https://codifice.dev/posts/2010-03-20-aspnet-and-custom-error-pages-seo/'
heroImage: ../../assets/blog/hero-images/2010-03-20-aspnet-and-custom-error-pages-seo.jpg
---

It’s a (conscientious) developer’s worst fear:

> You’ve slaved long and hard to produce a top-notch, blistering fast website that fully shows off your coding prowess and skills, you unveil the website to critical acclaim and universal client approval (imagine the cheering crowds) but then out-of-hours the database server fails!  **_Yerrk_**!

    All the developer’s are out celebrating a successful so no-one notices the log file growing bigger and bigger, screaming to be heard…..and then the client notices *and it really hits the fan!*

    After a frantic few hours the DB hardware’s restored and the website returns to it’s former glory….crisis over.

Or is it?

You’re a good web developer, of course you are, you’ve enabled the custom error pages in ASP.Net (you’ve probably event set the servers [deployment property to retail](http://bit.ly/9xIZCr)\*\* to make doubly sure).  Every visitor to the site during your downtime would have seen a nice and friendly message informing them that there’s a problem with the site and it will be up again shortly.

Maybe, you’ve even reduced the potential impact by adding some marketing blurb about how great your products are, nice meaning full copy to make your visitors want to return to the site when it’s back when the sites back up.  In fact, just the sort of copy that search engines love – **_D’oh_**!  If your site has had issues whilst being indexed, that error message could very well come back to haunt you!

Now in fairness, it’s unlikely that your error page will be ranked as the #1 authority for a particular subject. Search engines have gotten pretty good at spotting these gaffs, but it won’t be helping your page rankings any either.

Here’s why, when your ASP.Net application throws an unhandled exception it naturally wants to return a 500 status code (Internal Server Error) and if you don’t have custom errors switched on, that’s what you get which leads to the Yellow Screen of Death!  But with custom error handling switched on there’s a neat little HttpModule that detects the 500 status code (Internal Server Error) and turns this in a redirect (302 status code) to your nice custom error page.  This then renders successfully (they’ll be no errors with your error page after all!) and returns a 200 status (OK).

For a visitor (human or web crawler), this looks _exactly_ the same as a normal redirect.

Clearly then what we need is a smarter custom error HttpModule to selectively redirect the visitor based on whether or not they’re a search engine.  In fact, one just like this:

```
using System.Web;
```

You’ll notice that this module also handles logging the error and differentiates between real exceptions (500) and file not found (404)  allowing a custom page to be displayed for either.

To use the code simply register the module in the system.web/httpModules (for IIS 6) of System.Webserver/Modules (for IIS 7) section of your web.config and you’re good to go.  For best affect, it will probably be worthwhile putting an up-to-day .browsers file in your App_Browsers directory as well.
