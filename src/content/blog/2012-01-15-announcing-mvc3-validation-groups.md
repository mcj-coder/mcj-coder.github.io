---
title: Announcing MVC3 Validation Groups
description: 'Introducing a reusable MVC3 library for validation groups, enabling multi-part form validation with arbitrary page navigation.'
pubDate: 2012-01-15
updatedDate: 2012-01-17
heroImage: ../../assets/blog/hero-images/2012-01-15-announcing-mvc3-validation-groups.jpg
tags: ['project']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2012/01/announcing-mvc3-validation-groups.html'
---

I've recently had to organise the validation for long/multipart forms. Ordinarily, you'd divide the form up into smaller models and create a wizard style user journey. But in this case the UI design called for the user to arbitrarily jump back and forth between pages in the wizard and other restrictions meant that we couldn't persist each sub-page on change. What we needed were validation groups!

As this work involved a bit of the old copy-paste-adapt from the standard MVC code, it's a bit complicated to go into the fine details of how to replicate the functionality for yourself. So I've setup a [codeplex](http://mvc3validationgroups.codeplex.com/) project with a reusable library all ready to go! (_Of course all the source code is up there as well!_)

#### How to use

_Download the latest release._ (Get the latest Example Site as well to see a preconfigured MVC3 Website and example integration)

- Add a reference to 'McjDevelopment.Mvc3ValidationGroups.dll' to your MVC3 project

  _[Original screenshot no longer available]_

- Copy 'jquery.validate.unobtrusive.validationgroups.js' to your 'scripts' folder

  _[Original screenshot no longer available]_

- Decorate your view models with the \[ValidatorGroup] attribute specifying the validation groups that that field belongs to (space delimited)

  _[Original screenshot no longer available]_

- Update your view to use 'jquery.validate.unobtrusive.validationgroups.js' immediately after 'jquery.validate.unobtrusive.js' (or 'jquery.validate.unobtrusive.min.js')

  _[Original screenshot no longer available]_

- Update your view to include where you want each groups Validation Summary to appear

  _[Original screenshot no longer available]_

- Amend your 'Action' buttons and links to include 'data-val-valgroup-name' attribute and specify which validation groups should be triggered by the user clicking on that element

  _[Original screenshot no longer available]_

- Amend your controller to check the appropriate validation groups when called. (This implementation shows a common action being called which uses the clicked button name to select the validation group, an alternative is to use JS to dynamically alter the form's action location)

  _[Original screenshot no longer available]_

- Test validation groups!

  _[Original screenshot no longer available]_
