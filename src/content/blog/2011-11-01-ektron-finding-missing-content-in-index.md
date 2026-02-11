---
title: "Ektron: Finding \u201cMissing\u201d Content in the Index on 64bit Windows"
description: ""
pubDate: 2011-11-01
updatedDate: 2012-02-02
heroImage: ../../assets/blog/hero-images/ai/cms-admin.jpg
tags: ["ektron", "troubleshooting"]
source: hugo
originalUrl: "https://codifice.dev/posts/2011-11-01-ektron-finding-missing-content-in-index/"
---

When content is created on an Ektron with a large content id (commonly on eSync enabled workareas) it may corrupt the content id.  

  For example if a new content item has an id of 6442451035 it will actually be indexed with a contentid of 2147483739.  This is because the original id is larger than an unsigned integer can hold.    

```
Console.WriteLine((uint)contentId); //2147483739
```

  

You can then query your public index to see if content has been misindexed by running a query to find your content

SELECT Filename, Path, ContentID64, ContentLanguage FROM **<<PUBLIC_CATALOG>>**..SCOPE() WHERE contentid64=**6442451035** OR contentid64=**2147483739**

[](http://lh5.ggpht.com/-mbZJZSuGekY/TypzeanJJWI/AAAAAAAAAOk/dnhuuYMAEpE/s1600-h/image%25255B3%25255D.png)

If the content is not indexed at all, you won’t find any content and the issue is something else.  However, if you get  a result but the CONTENTID64 value is wrong, then you should be able to fix the problem.

To fix this you can follow the following procedure:

  * Download [Updated QLXFilters](http://bit.ly/qlxfilter) (and check that they are newer than your current dlls!)

  * Backup QLXFilter.dll from c:\windows\system32 and c:\windows\sysWoW64 on the server 

  * Stop the Indexing Service 

  * Replace the dlls with the updated versions

  * Start the Indexing Service 

  * Run a full SearchConfigUI, if you have assets missing from the current server please untick Documents from the advanced tab. 

  * Select Re-index existing Catalogues  - this may affect the stability of you website.

  * After this has completed please check the Docs to Index on the indexing service and ensure that this has finished indexing.

  * After this is complete please run your query and you should now see the results return correctly.