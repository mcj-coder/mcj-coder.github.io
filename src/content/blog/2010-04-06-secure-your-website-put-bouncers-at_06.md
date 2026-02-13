---
title: 'Secure Your Website, Put Bouncers at the Door (Part 2)'
description: 'Practical implementation of website security measures for ASP.Net developers - covering input validation, input sanitation, robots.txt, authentication and HTTPS.'
pubDate: 2010-04-06
tags: ['best-practise']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/04/secure-your-website-put-bouncers-at_06.html'
heroImage: ../../assets/blog/hero-images/2010-04-06-secure-your-website-put-bouncers-at_06.jpg
---

In part 1, I gave an overview of the similarities in securing a good night club and a website. In this part I'll give an overview of what we as developers can do to implement these measures:

#### 4 and 5. Authentication and HTTPS

The implementation of these is very much driven by the business requirements of the site, if the site's free to access and there's no personal information they're a non-issue. There's [plenty](<https://learn.microsoft.com/en-us/previous-versions/eeyk640h(v=vs.140)>) of [good](http://www.codeproject.com/KB/aspnet/custom_authentication.aspx) [documentation](http://msdn.microsoft.com/en-us/library/aa480476.aspx) on implementing authentication on ASP.Net and if you require HTTPS then I can't recommend Matt Sollars' [Automatic HTTPS switching module](http://www.codeproject.com/KB/web-security/WebPageSecurity_v2.aspx) enough.

#### 3. Robots.txt

This is the file that no website should be without! If your website has an administration, registration, login or otherwise secure page that you don't want people to find easily via a quick Google hack, here's the place to stop it being indexed! It's so important it has an [entire website](http://www.robotstxt.org/) dedicated to it, it's a two minute job that could save masses of embarrassment (or data loss). An example robots.txt could be:

```text
Sitemap: http://www.example.com/sitemap.xml

User-agent: *
Disallow: /secure/
Disallow: /admin/
Disallow: /googlehackablepages/
Disallow: /configs/
```

#### 2. Input Sanitation

This is another no-brainer. Don't concatenate strings into SQL statements - ever! Use parameterised queries be they stored procedure or dynamic queries there's simply no excuse.

[![Bobby Tables XKCD comic](https://imgs.xkcd.com/comics/exploits_of_a_mom.png)](https://xkcd.com/327/)

For XSS injection this is a little trickier. I believe in escaping/html encoding text coming out of a database rather than when it's going in simply because you can never be 100% certain that someone hasn't fiddled the data in the database. Microsoft have released a good XSS encoding utility recently to handle this.

#### 1. Input Validation

By far the most important web development task is input validation. This has to happen on every request for every value that's received from the client, this is your website's front door. Unfortunately, it's also pretty mundane so there's not much out there on the best practice. Lots on [ASP.Net validation controls](<https://learn.microsoft.com/en-us/previous-versions/dotnet/articles/aa479045(v=msdn.10)>), which handle your business rule validation but not much on minimising the surface area of attack for your website.

As a developer you should have some pretty strict expectations about what will be contained in a variable and where it comes from. For example: if you use a CMS, you should know that the id for the content that you're displaying is referenced in the 'id' query string value and should be a positive integer. Anything outside of this is an erroneous value and should be rejected.

In this example there's implied checks that we need to test every time we read in that value:

- The 'id' value is always read from the query string (not a cookie or form variable)
- The 'id' is a whole number (integer)
- The 'id' is always greater than zero

(and that's before we check to see if the 'id' actually matches any content!)

We can perform these tests easily enough by reading the value explicitly from the query string, converting it to an integer and testing that it's greater than zero:

```csharp
// Not Request["id"] as this will hunt for a matching key in querystring,
// form variables and cookies
string value = Request.QueryString["id"];
int id = 0;
if (!Int32.TryParse(value, out id)) id = 0;
if (id <= 0) throw new NotSupportedException(string.Format(
    CultureInfo.InvariantCulture,
    "The querystring parameter 'id' must be a positive integer value, " +
    "the value given was '{0}'",
    Request.QueryString["id"]));
```

But that's a lot of code that needs to be written each time a variable is read from a request….in part 3, I'll go into the 'nitty-gritty' input validation and take a look at the most common methods of parsing values and present much tidier code.
