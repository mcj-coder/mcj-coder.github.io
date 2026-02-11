---
title: "Ektron: Finding “Missing” Content in the Index on 64bit Windows"
description: "Technical blog post from 2011-11-01"
pubDate: 2011-11-01
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

When content is created on an [Ektron](http://bit.ly/d0YHh7) with a large content id (commonly on eSync enabled workareas) it may corrupt the content id.  

  For example if a new content item has an id of 6442451035 it will actually be indexed with a contentid of 2147483739.  This is because the original id is larger than an unsigned integer can hold.                   1: long contentId = 6442451035;

         2: Console.WriteLine((uint)contentId); //2147483739

  

You can then query your public index to see if content has been misindexed by running a query to find your content

SELECT Filename, Path, ContentID64, ContentLanguage FROM **>**..SCOPE() WHERE contentid64=**6442451035** OR contentid64=**2147483739**

[](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgjjsth4p37x8Ny8bIamJAgKE-6JPy2hKsWuZsEX9HxoTzT9E8djTSlWy8Wl-6ZYlM5Bcg0iUBo3GLA1PsigR8-dvOpOIVXktGyyjGf6eWVq1EzEE_e5saF5b8W4C9dJFM23QruBkK0/s1600-h/image%25255B3%25255D.png)

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
