---
title: 'SQL: Cleaning Up After the Database Tuning Engine Advisor'
description: 'SQL scripts to remove all indexes and statistics created by the SQL Server Database Tuning Engine Advisor (DTA) by targeting the _dta_ prefix.'
pubDate: 2010-11-01
tags: ['performance']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/11/sql-cleaning-up-after-database-tuning.html'
heroImage: ../../assets/blog/hero-images/2010-11-01-sql-cleaning-up-after-database-tuning.jpg
---

I've recently had to do a quick bit of DB performance analysis work on a 3rd Party database to see if I can improve performance (without being too invasive). The quickest way to do this is using the [Database Tuning Engine Advisor](http://msdn.microsoft.com/en-us/library/ms166575.aspx) tool that comes with SQL 2008 (the **_best_** way is to have loads of experience and a tonne of time to properly analyse the database).

Part of my analysis procedure was to make a script of queries that I could run with and without the DTA recommended indexes to evaluate any real world improvement. This meant I needed to be able to roll back any indexes created by DTA. Unfortunately, DTA gives you an install script for the new indexes but not a removal script. I needed to write something myself.

Fortunately, the DTA created indexes and statistics are all prefixed with **\_dta\_** so it's relatively easy to write a query to remove the automatically created scripts:

First to drop the generated statistics:

```sql
DECLARE @dtaStats AS TABLE(Id INT IDENTITY(1,1), StatName VARCHAR(255), TableName VARCHAR(255))
DECLARE @currentId AS INT
DECLARE @lastId AS INT
DECLARE @statName VARCHAR(255)
DECLARE @tableName VARCHAR(255)

INSERT INTO @dtaStats(StatName,TableName)
    SELECT name, OBJECT_NAME(OBJECT_ID) AS TABLENAME
    FROM sys.stats
    WHERE name like '_dta_stat_%'

SET @currentId=NULL
SET @lastId=0

SELECT @currentId=MIN(Id)
FROM @dtaStats
WHERE Id>@LastId

WHILE (@currentId IS NOT NULL)
BEGIN
    SELECT @statName=StatName, @tableName=TableName FROM @dtaStats WHERE Id=@currentId

    PRINT 'DROP STATISTICS ' + @tableName + '.' + @statName

    EXEC('DROP STATISTICS ' + @tableName + '.' + @statName)

    SET @lastId = @currentId
    SET @currentId=null

    SELECT @currentId=MIN(Id)
    FROM @dtaStats
    WHERE Id>@LastId
END
```

Then drop the generated indexes:

```sql
DECLARE @dtaIndex AS TABLE(Id INT IDENTITY(1,1), IndexName VARCHAR(255), TableName VARCHAR(255))
DECLARE @currentId AS INT
DECLARE @lastId AS INT
DECLARE @IndexName VARCHAR(255)
DECLARE @tableName VARCHAR(255)

INSERT INTO @dtaIndex(IndexName,TableName)
    SELECT name, OBJECT_NAME(OBJECT_ID) AS TABLENAME
    FROM sys.indexes
    WHERE name like '_dta_index_%'

SET @lastId=0
SET @currentId=NULL

SELECT @currentId=MIN(Id)
FROM @dtaIndex
WHERE Id>@LastId

PRINT @currentId

WHILE (@currentId IS NOT NULL)
BEGIN
    SELECT @IndexName=IndexName, @tableName=TableName FROM @dtaIndex WHERE Id=@currentId

    PRINT 'DROP INDEX ' + @IndexName + ' ON ' + @tableName

    EXEC('DROP INDEX ' + @IndexName + ' ON ' + @tableName)

    SET @lastId = @currentId
    SET @currentId=NULL

    SELECT @currentId=MIN(Id)
    FROM @dtaIndex
    WHERE Id>@LastId
END
```

The database is now back to a pre-DTA'ed state!
