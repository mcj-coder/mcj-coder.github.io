---
title: N2CMS Templates RSS Feed Fix
description: ''
pubDate: 2010-06-10
tags: ['n2cms']
source: hugo
originalUrl: 'https://codifice.dev/posts/2010-06-10-n2cms-templates-rss-feed-fix/'
heroImage: ../../assets/blog/hero-images/2010-06-10-n2cms-templates-rss-feed-fix.jpg
---

N2CMS comes with some pretty fully featured examples, the most useful to me is the N2.Templates example site.  Unfortunately, as it stands the RSS feed is broken and give the error:

#### _Cannot use filters when using MaxResults, sorry._ Fortunately a fix can be found the N2.Templates.Mvc project, you just need to replace the following functions in N2.Templates.Items.RssFeed

```
{
```

With:

```
{
```

And add ‘using System.Linq’ to the top of the file.

Easy…though it would be nice to see this fix make it into the trunk repository!
