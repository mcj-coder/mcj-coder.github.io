---
title: Announcing MVC3 Validation Groups
description: ""
pubDate: 2012-01-15
updatedDate: 2012-01-17
heroImage: ../../assets/blog/hero-images/ai/network-switch.jpg
tags: ["project"]
source: hugo
originalUrl: "https://codifice.dev/posts/2012-01-15-announcing-mvc3-validation-groups/"
---

---
title: "Announcing MVC3 Validation Groups"
date: 2012-01-15
lastmod: 2012-01-17
draft: false
comments: true
thumbnail: "/coding-gallery"
series: ["project"]
authors: ["martincjarvis"]
---I’ve recently had to organise the validation for long/multipart forms.  Ordinarily, you’d divide the form up into smaller models and create a wizard style user journey.  But in this case the UI design called for the user to arbitrarily jump back and forth between pages in the wizard and other restrictions meant that we couldn’t persist each sub-page on change.  What we needed were validation groups!
As this work involved a bit of the old copy-paste-adapt from the standard MVC code, it’s a bit complicated to go into the fine details of how to replicate the functionality for yourself.  So I’ve setup a [codeplex](http://bit.ly/zRmxwD) project with a reusable library all ready to go!  (*Of course all the source code is up there as well!*)
 #### How to use  * Download the latest release.*  (Get the latest Example Site as well to see a preconfigured MVC3 Website and example integration)*  
* Add a reference to ‘McjDevelopment.Mvc3ValidationGroups.dll’ to your MVC3 project 
[](http://lh4.ggpht.com/-CEmxbHsnnfw/TxXZgxl_E-I/AAAAAAAAAMk/Jn2-KLMFL4w/s1600-h/image_thumb8%25255B3%25255D.png)  
* Copy ‘jquery.validate.unobtrusive.validationgroups.js’ to your ‘scripts’ folder 
[](http://lh3.ggpht.com/-BIJueaCnSso/TxXZilfL8yI/AAAAAAAAAMw/ByaLSUPJAhs/s1600-h/image_thumb%25255B1%25255D%25255B2%25255D.png)  
* Decorate your view models with the [ValidatorGroup] attribute specifying the validation groups that that field belongs to (space delimited) 
[](http://lh5.ggpht.com/-wWGKvkvjX3M/TxXZkQViUfI/AAAAAAAAANE/eZKS3rWclPw/s1600-h/image_thumb6%25255B3%25255D.png)  
* Update your view to use ‘jquery.validate.unobtrusive.validationgroups.js’ immediately after ‘jquery.validate.unobtrusive.js’ (or ‘jquery.validate.unobtrusive.min.js’) 
[](http://lh5.ggpht.com/-UJskgIIu36g/TxXZmOmTdyI/AAAAAAAAANU/uc1F9ZxMr3c/s1600-h/image_thumb%25255B3%25255D%25255B2%25255D.png)  
* Update your view to include where you want each groups Validation Summary to appear 
[](http://lh3.ggpht.com/-J351R9KIbfM/TxXZnjATeUI/AAAAAAAAANk/bnQ_AwK2P9k/s1600-h/image_thumb5%25255B3%25255D.png)  
* Amend your ‘Action’ buttons and links to include ‘data-val-valgroup-name’ attribute and specify which validation groups should be triggered by the user clicking on that element 
[](http://lh6.ggpht.com/-spKoUXSYFcA/TxXZpsFqLhI/AAAAAAAAAN0/cBSjB4qzrFQ/s1600-h/image_thumb12%25255B3%25255D.png)  
* Amend you’re controller to check the appropriate validation groups when called.  (this implementation shows a common action being called with uses the clicked button name to select the validation group, an alternative is to us JS to dynamically alter the form’s action location) 
[](http://lh6.ggpht.com/-jBXtUg7FRVA/TxXZrr0GfmI/AAAAAAAAAOE/qUaPvE5bIyE/s1600-h/image_thumb15%25255B2%25255D.png)  
* Test validation groups! 
[](http://lh5.ggpht.com/-ye8LhnBJ0XY/TxXZtNmLTAI/AAAAAAAAAOU/NqiYVPnBXNk/s1600-h/image_thumb17%25255B3%25255D.png)