---
title: Logging is the new Exception Swallowing
description: ""
pubDate: 2011-05-03
tags: ["best practise"]
source: hugo
originalUrl: "https://codifice.dev/posts/2011-05-03-logging-is-new-exception-swallowing/"
heroImage: ../../assets/blog/hero-images/2011-05-03-logging-is-new-exception-swallowing.jpg
---

For a long time now I’ve been stamping down hard on empty catch blocks in code, for obvious reasons.  When I can dictate coding standards that’s pretty much top the list.  

     *      #### Every ‘catch’ block must (at a minimum) log or throw   
   I now realise I made a mistake with this rule...it should be:

     *      #### Every ‘catch’ block must (at a minimum) *throw* or log   
   It’s a subtle (the wording – not the formatting) difference in the way we need to think about this rule but it’s one I think we don’t think about enough.  

  For example, this is a common pattern of code that I’m seeing during Code Review sessions:

  
```
{
```

It’s pretty clear that this Catch/Log pattern has become a developers default exception handling boiler plate code.  It’s adding no value and actually making the troubleshooting processes more complicated and time consuming.  

My response to this is simple…***remove all exception handling***!

In the vast majority of cases, if an exception is thrown the application is already broken and letting it limp along is an act of cruelty.  The application should handle these critical failures as ***exceptional*** and handle all of these events the same way in an application scoped way (Custom Error Page for Web Applications, etc).  By all means log the exception at the application scope level, it will have actual diagnostic value there(complete stack trace, etc). 

Of course, there are exceptions to this policy such as when you can legitimately recover from the fault.  But these cases are few and far between.