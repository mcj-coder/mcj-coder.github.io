---
title: "SQL: Cleaning Up After the Database Tuning Engine Advisor"
description: ""
pubDate: 2010-11-01
tags: ["performance"]
source: hugo
originalUrl: "https://codifice.dev/posts/2010-11-01-sql-cleaning-up-after-database-tuning/"
---

I’ve recently had to do a quick bit of DB performance analysis work on a 3rd Party database to see if I can improve performance(without being too invasive).  The quickest way to do this, is using the [Database Tuning Engine Advisor](http://bit.ly/cf52sU) tool that comes with SQL 2008 (the ***best*** way is to have loads of experience and a tonne of time to properly analyse the database). 

  Part of my analysis procedure was to make a script of queries that I could run with and without the DTA recommended indexes to evaluate any real world improvement.  This meant I needed to be able to roll back any indexes created by DTA.  Unfortunately, DTA gives you and install script for the new indexes but not a removal script.  I needed to write something myself.

  Fortunately, the DTA created indexes and statistics are all prefixed with ***_dta_ ***so it’s relatively easy to write a query to remove the automatically created scripts:

  First to drop the generated statistics:

  
```
DECLARE @@currentId AS INT
```

Then drop the generated indexes:

```
DECLARE @@dtaIndex AS TABLE(Id INT IDENTITY(1,1), IndexName VARCHAR(255), TableName VARCHAR(255))
```

The database is now back to a pre-DTA’ed state!