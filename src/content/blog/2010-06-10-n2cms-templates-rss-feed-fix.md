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

```csharp
public virtual IEnumerable GetItems()
```

```csharp
{
```

```csharp
foreach (ISyndicatable item in N2.Find.Items
```

```csharp
.Where.Detail(SyndicatableDefinitionAppender.SyndicatableDetailName).Eq(true)
```

```csharp
.Filters(GetFilters())
```

```csharp
.MaxResults(NumberOfItems)
```

```csharp
.OrderBy.Published.Desc
```

```csharp
.Select())
```

```csharp
{
```

```csharp
yield return item;
```

```csharp
}
```

```csharp
}
```

```csharp



```csharp
private ItemFilter[] GetFilters()
```

```csharp
{
```

```csharp
ItemFilter[] filters;
```

```csharp
if (FeedRoot != null)
```

```csharp
filters = new ItemFilter[] { new TypeFilter(typeof(ISyndicatable)), new AccessFilter(), new ParentFilter(FeedRoot) };
```

```csharp
else
```

```csharp
filters = new ItemFilter[] { new TypeFilter(typeof(ISyndicatable)), new AccessFilter() };
```

```csharp
return filters;
```

```csharp
}
```

With:

  
```csharp
public virtual IEnumerable GetItems()
```

```csharp
{
```

```csharp
var filter = new AccessFilter();
```

```csharp
var q = N2.Find.Items.Where.Detail(SyndicatableDefinitionAppender.SyndicatableDetailName).Eq(true);
```

```csharp
if (FeedRoot != null)
```

```csharp
q = q.And.AncestralTrail.Like(Utility.GetTrail(FeedRoot) + "%");
```

```csharp



```csharp
foreach (ContentItem item in q
```

```csharp
.OrderBy.Published.Desc
```

```csharp
.Select().Take(NumberOfItems))
```

```csharp
{
```

```csharp
var syndicatable = item as ISyndicatable;
```

```csharp
if (syndicatable != null && filter.Match(item))
```

```csharp
{
```

```csharp
yield return syndicatable;
```

```csharp
}
```

```csharp
}
```

```csharp
}
```

And add ‘using System.Linq’ to the top of the file.

Easy…though it would be nice to see this fix make it into the trunk repository!
