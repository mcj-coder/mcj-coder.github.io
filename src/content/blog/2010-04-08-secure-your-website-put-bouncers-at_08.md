---
title: 'Secure Your Website, Put Bouncers at the Door (Part 3)'
description: ''
pubDate: 2010-04-08
tags: ['best-practise']
source: hugo
originalUrl: 'https://codifice.dev/posts/2010-04-08-secure-your-website-put-bouncers-at_08/'
heroImage: ../../assets/blog/hero-images/2010-04-08-secure-your-website-put-bouncers-at_08.jpg
---

---

title: "Secure Your Website, Put Bouncers at the Door (Part 3)"
date: 2010-04-08
lastmod: 2010-04-08
draft: false
comments: true
thumbnail: "/security-gallery"
tags: ["seo", "security"]
series: ["best-practise"]
authors: ["martincjarvis"]
---####

In part 1, I gave an overview of the similarities in securing a good night club and a website and in part 2 I gave an overview of what we, as developers, can do to secure our websites.  In this final part, I give details on how we should be doing the most important (and mundane) part of securing our websites:\*\*

####

1. Input Validation (Continued)
   One important fact that many web developers fail to take on board, is that everything you receive from the client is a string; Query strings, post back values and cookies.  It may look like something else, but it’s actually a little crack in the armour of your website.

For example, a query string of  “?id=56” doesn’t mean that id is equal to the integer 56, only it’s string form.  It can just as easily be manipulated to read “?id=Bob+The+Builder” or the more vicious “id=’);drop table Users;”.   _If you’ve ever used string concatenation in a SQL statement, your blood should have just run cold!_

An excellent habit to get into is to convert every parameter you need as early as possible in the request and use that value from that point on, if the value can’t be converted then throw an exception to stop processing the request.  This is one of your websites bouncers, it’ll let through good values but prevent the troublemakers from ruining it for everyone.

This type of conversion is simple, but can be a little long winded to do in a best practice way.  The two most common ways I see of doing this in .Net is by using the Convert class or the target types Parse method.  These are nice quick one line commands to parse a string into an integer, such as:

```
1: int id = Convert.ToInt32(Request.QueryString["id"]);
```

The above code will work fine as long as the string does actually represent that data type, otherwise you need some boiler plate code to correctly handle the ‘FormatException’ that gets thrown:

```
1: int id=0;
```

Of course, you don’t need to wrap the FormatException but it will make debugging easier if there was a little more information than ‘something wasn’t an formatted correctly’.  These methods also have a performance hit associated with them as they throw exceptions on failure (that’s fine for this example – but in others, you may have default values that should be used) and each thrown exception causes the ASP.Net to prioritise handling that exception over running code….

So to avoid the exception there’s now (in .Net 2.0) TryParse:

```
1: int id = 0;
```

That’s better but still two lines of boiler plate code (and a slightly strange pattern) that will need to be parroted out for each parameter on every request and more boiler plate code means it’s less likely developers will stick to doing it.

Of course, this is exactly why the [programming gods](http://www.amazon.co.uk/gp/product/020161622X?ie=UTF8&tag=maronnet-21&linkCode=as2&camp=1634&creative=6738&creativeASIN=020161622X) gave us the concept of Refactoring and Separation of Concerns, you can easily write a reusable wrapper method around the TryParse functionality to make it easier to code with.  Thanks to the good people of Microsoft it’s trivial to create an Extension method to provide the functionality to all strings:

```
1: /// <summary>
```

This makes our ‘id’ parsing example as easy as:

```
1: int id = Request.QueryString["id"].ToInt32(0);
```

That’s a sweet, safe one line conversion that’s fewer keystrokes than the most basic Convert and Parse methods.

To save everyone and their dog from creating versions of these wrappers, I’ve created a small class that provides localization aware type conversion methods.

Attachment**: [**Type Converter Helper**](http://bit.ly/9F7YDr)**

Conversion Performance
I know that some developers feel particularly attached to their ‘Convert’ and ‘Parse’ methods so I’ve created a little performance comparison app and gathered some performance statistics:

      Method**

      **5000 Successful Parses (“12345”)**

      **5000 Failed Conversions (“Not An Integer”)**


      Convert

      6ms

      52s


      Parse

      7ms

      54s


      TryParse

      6ms

      6ms


      TryParse (Extension)

      6ms

      6ms

This shows that when everything runs as expected (the ‘Happy Path’) there’s not much difference, but  when invalid data is given there’s a 10000x performance decrease.  That should be enough to get even the most entrenched Convert/Parse only developer to change their ways!

The application I used to create these numbers is included in the helper library project.
