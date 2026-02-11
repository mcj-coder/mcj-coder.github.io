---
title: "N2CMS Templates RSS Feed Fix"
description: "Technical blog post from 2010-06-10"
pubDate: 2010-06-10
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

[N2CMS](http://bit.ly/aco4m4) comes with some pretty fully featured examples, the most useful to me is the N2.Templates example site.  Unfortunately, as it stands the RSS feed is broken and give the error:

  
## *Cannot use filters when using MaxResults, sorry.*
  Fortunately a fix can be found the N2.Templates.Mvc project, you just need to replace the following functions in N2.Templates.Items.RssFeed :

             1: public virtual IEnumerable GetItems()

       2: {

       3:     foreach (ISyndicatable item in N2.Find.Items

       4:         .Where.Detail(SyndicatableDefinitionAppender.SyndicatableDetailName).Eq(true)

       5:         .Filters(GetFilters())

       6:         .MaxResults(NumberOfItems)

       7:         .OrderBy.Published.Desc

       8:         .Select())

       9:     {

      10:         yield return item;

      11:     }

      12: }

      13:  

      14: private ItemFilter[] GetFilters()

      15: {

      16:     ItemFilter[] filters;

      17:     if (FeedRoot != null)

      18:         filters = new ItemFilter[] { new TypeFilter(typeof(ISyndicatable)), new AccessFilter(), new ParentFilter(FeedRoot) };

      19:     else

      20:         filters = new ItemFilter[] { new TypeFilter(typeof(ISyndicatable)), new AccessFilter() };

      21:     return filters;

      22: }

With:

  
       1: public virtual IEnumerable GetItems()

       2: {

       3:     var filter = new AccessFilter();

       4:     var q = N2.Find.Items.Where.Detail(SyndicatableDefinitionAppender.SyndicatableDetailName).Eq(true);

       5:     if (FeedRoot != null)

       6:         q = q.And.AncestralTrail.Like(Utility.GetTrail(FeedRoot) + "%");

       7:  

       8:     foreach (ContentItem item in q

       9:             .OrderBy.Published.Desc

      10:             .Select().Take(NumberOfItems))

      11:     {

      12:         var syndicatable = item as ISyndicatable;

      13:         if (syndicatable != null && filter.Match(item))

      14:         {

      15:             yield return syndicatable;

      16:         }

      17:     }

      18: }

And add ‘using System.Linq’ to the top of the file.

Easy…though it would be nice to see this fix make it into the trunk repository!
