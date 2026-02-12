---
title: Ektron and Web Application Projects (Part 1)
description: ''
pubDate: 2010-03-22
updatedDate: 2010-03-29
tags: ['ektron']
source: hugo
originalUrl: 'https://codifice.dev/posts/2010-03-22-working-with-ektron-using-web/'
heroImage: ../../assets/blog/hero-images/2010-03-22-working-with-ektron-using-web.jpg
---

---

title: "Ektron and Web Application Projects (Part 1)"
date: 2010-03-22
lastmod: 2010-03-29
draft: false
comments: true
thumbnail: "/coding-gallery"
series: ["ektron"]
authors: ["martincjarvis"]
---## Like a lot of enterprise CMS production Ektron expects you to work in a particular way and provides lots of help for non-developers to quickly produce websites with minimal technical skills.  But what if you have more technical needs?

One of the downsides (in my opinion) of developing websites against Ektron, is the expectation that you will be integrating your code into the existing workarea Web Site Project.

Now, there are pros and cons on Web Site over Web Application projects but the big disadvantage for me is the sheer size of the workarea brings Visual Studio to a crawl when your editing code.  This is (partly) because of the background compilation that happens in the background to support IntelliSense.

There’s also some Best Practise issues:

     * **Code Standards**:  By ‘inheriting’ all of the 3rd Party code into your code base you’ve also limited your ability to ensure that ***your*** code works properly.  Static Analysis rules.
    * **Separation of Concerns**: Does your front end code need live in the same project as the administration screen?
    * **Clean Builds**:  Unfortunately, the workarea doesn’t build cleanly – there are compilation warnings, these will show up on any build metric reports….not good.  Of course, you can fix the warnings but then you’ll need to maintain the fixes with every release.
    * **Performance:** You may only have a three template website, but with an integrated workarea IIS still has to load all of the work area dependencies this takes time…and memory.
    * **Security**: By integrating into the 3rd Party code you’ve increased the Surface Area for attackers.  If you’re public facing website isn’t properly secured there are several Google queries that you can be run by hackers to find your site (and even the deployed version). *(You can stop this by properly configuring your robots.txt – it won’t make your website bullet proof, but it will be harder for hackers/bots to find you!  And change your default admin account!)*

So to my mind, there are three ways of developing against Ektron:

     * **Work within the workarea website**:  If your working on a small site, don’t currently apply any best practise processes in your build process (*or you may have a monster development PC*).  You’ll be able to leverage all of the built in Ektron functionality with minimal work.
    * **Build your Website in a WAP and deploy to workarea website**:  Keeps your code tidy and separate.  Good for running static analysis tools, etc.  It’s faster to develop (less VS overhead) and you can still use all of the Ektron functionality.
    * **Build your website in a WAP and deploy to a separate location (no workarea)**:  Disregard the provided controls and use the provided Ektron API as a repository.  Takes more development effort but gives you total control over the performance/security of the website.

In my next few posts, I’ll be covering how to achieve solutions 2. and 3. and what compromises you’ll need to make along the way…

     * Part 2 describes the folder structure and project configuration that you’ll need
