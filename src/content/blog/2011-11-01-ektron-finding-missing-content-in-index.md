---
title: 'Ektron: Finding "Missing" Content in the Index on 64bit Windows'
description: 'Diagnosing and fixing Ektron content indexing corruption where large content IDs overflow unsigned integers on 64-bit Windows systems.'
pubDate: 2011-11-01
updatedDate: 2012-02-02
heroImage: ../../assets/blog/hero-images/2011-11-01-ektron-finding-missing-content-in-index.jpg
tags: ['ektron', 'troubleshooting']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2011/11/ektron-finding-missing-content-in-index.html'
---

When content is created on an Ektron with a large content id (commonly on eSync enabled workareas) it may corrupt the content id.

For example if a new content item has an id of 6442451035 it will actually be indexed with a contentid of 2147483739. This is because the original id is larger than an unsigned integer can hold.

```csharp
long contentId = 6442451035;
Console.WriteLine((uint)contentId); //2147483739
```

You can then query your public index to see if content has been misindexed by running a query to find your content:

```sql
SELECT Filename, Path, ContentID64, ContentLanguage
FROM <<PUBLIC_CATALOG>>..SCOPE()
WHERE contentid64=6442451035 OR contentid64=2147483739
```

_[Original screenshot no longer available]_

If the content is not indexed at all, you won't find any content and the issue is something else. However, if you get a result but the CONTENTID64 value is wrong, then you should be able to fix the problem.

To fix this you can follow the following procedure:

- Download [Updated QLXFilters](/downloads/2011-11-01-ektron-finding-missing-content-in-index/QLXFilters.zip) (and check that they are newer than your current dlls!)
- Backup QLXFilter.dll from c:\windows\system32 and c:\windows\sysWoW64 on the server
- Stop the Indexing Service
- Replace the dlls with the updated versions
- Start the Indexing Service
- Run a full SearchConfigUI, if you have assets missing from the current server please untick Documents from the advanced tab.
- Select Re-index existing Catalogues - this may affect the stability of your website.
- After this has completed please check the Docs to Index on the indexing service and ensure that this has finished indexing.
- After this is complete please run your query and you should now see the results return correctly.
