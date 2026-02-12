---
title: 'Ektron: SQL Script To Clone A Menu into Multiple Languages'
description: ''
pubDate: 2010-07-27
tags: ['ektron']
source: hugo
originalUrl: 'https://codifice.dev/posts/2010-07-27-ektron-sql-script-to-clone-menu-into/'
heroImage: ../../assets/blog/hero-images/2010-07-27-ektron-sql-script-to-clone-menu-into.jpg
---

I’ve recently needed to have a multilingual menu where the id for each menu item is the same across all languages, this is a bit of a tall order using the workarea as only the root menu item will share the id.

So I’ve knocked out a quick’n’dirty TSQL script to clone a menu across across several languages whilst maintaining the relevant ids.

```
 
```

You’ll notice that this query uses a CTE (needs SQL 2005 and above) to recursively retrieve all of the menu entries.  It’s also wrapped in a transaction (which will ROLLBACK until you modify the script, and I’ve commented out the section that inserts records into your table – you’ll need to uncomment it to make it work.

I’ve added inline comments to highlight what particular magic numbers mean and you’ll need to substitute this for your own.  Cloned menu items are prefixed with the languages two-letter browser code.

Obviously, back up your database first and remember you’re running the script **at your own risk!**
