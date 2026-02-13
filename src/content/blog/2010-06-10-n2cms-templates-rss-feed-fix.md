---
title: N2CMS Templates RSS Feed Fix
description: 'How to fix the broken RSS feed in N2CMS Templates by replacing the incompatible Filters/MaxResults query with LINQ Take and manual filtering.'
pubDate: 2010-06-10
tags: ['n2cms']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/06/n2cms-templates-rss-feed-fix.html'
heroImage: ../../assets/blog/hero-images/2010-06-10-n2cms-templates-rss-feed-fix.jpg
---

N2CMS comes with some pretty fully featured examples, the most useful to me is the N2.Templates example site. Unfortunately, as it stands the RSS feed is broken and gives the error:

#### _Cannot use filters when using MaxResults, sorry._

Fortunately a fix can be found in the N2.Templates.Mvc project, you just need to replace the following functions in N2.Templates.Items.RssFeed:

```csharp
public virtual IEnumerable<ISyndicatable> GetItems()
{
    foreach (ISyndicatable item in N2.Find.Items
        .Where.Detail(SyndicatableDefinitionAppender.SyndicatableDetailName).Eq(true)
        .Filters(GetFilters())
        .MaxResults(NumberOfItems)
        .OrderBy.Published.Desc
        .Select())
    {
        yield return item;
    }
}

private ItemFilter[] GetFilters()
{
    ItemFilter[] filters;
    if (FeedRoot != null)
        filters = new ItemFilter[] { new TypeFilter(typeof(ISyndicatable)), new AccessFilter(), new ParentFilter(FeedRoot) };
    else
        filters = new ItemFilter[] { new TypeFilter(typeof(ISyndicatable)), new AccessFilter() };
    return filters;
}
```

With:

```csharp
public virtual IEnumerable<ISyndicatable> GetItems()
{
    var filter = new AccessFilter();
    var q = N2.Find.Items.Where.Detail(SyndicatableDefinitionAppender.SyndicatableDetailName).Eq(true);
    if (FeedRoot != null)
        q = q.And.AncestralTrail.Like(Utility.GetTrail(FeedRoot) + "%");

    foreach (ContentItem item in q
            .OrderBy.Published.Desc
            .Select().Take(NumberOfItems))
    {
        var syndicatable = item as ISyndicatable;
        if (syndicatable != null && filter.Match(item))
        {
            yield return syndicatable;
        }
    }
}
```

And add `using System.Linq;` to the top of the file.

Easy…though it would be nice to see this fix make it into the trunk repository!
