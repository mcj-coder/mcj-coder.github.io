---
title: "SQL: Cleaning Up After the Database Tuning Engine Advisor"
description: "Technical blog post from 2010-11-01"
pubDate: 2010-11-01
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

I’ve recently had to do a quick bit of DB performance analysis work on a 3rd Party database to see if I can improve performance(without being too invasive).  The quickest way to do this, is using the [Database Tuning Engine Advisor](http://bit.ly/cf52sU) tool that comes with SQL 2008 (the ***best*** way is to have loads of experience and a tonne of time to properly analyse the database). 

  Part of my analysis procedure was to make a script of queries that I could run with and without the DTA recommended indexes to evaluate any real world improvement.  This meant I needed to be able to roll back any indexes created by DTA.  Unfortunately, DTA gives you and install script for the new indexes but not a removal script.  I needed to write something myself.

  Fortunately, the DTA created indexes and statistics are all prefixed with ***_dta_ ***so it’s relatively easy to write a query to remove the automatically created scripts:

  First to drop the generated statistics:

```csharp
DECLARE @dtaStats AS TABLE(Id INT IDENTITY(1,1), StatName VARCHAR(255), TableName VARCHAR(255))
```

```csharp
DECLARE @currentId AS INT
```

```csharp
DECLARE @lastId AS INT
```

```csharp



```csharp
DECLARE @statName VARCHAR(255)
```

```csharp
DECLARE @tableName VARCHAR(255)
```

```csharp



```csharp
INSERT INTO @dtaStats(StatName,TableName)
```

```csharp
SELECT name, OBJECT_NAME(OBJECT_ID) AS TABLENAME
```

```csharp
FROM sys.stats
```

```csharp
WHERE name like '_dta_stat_%'
```

```csharp



```csharp
SET @currentId=NULL
```

```csharp
SET @lastId=0
```

```csharp



```csharp
SELECT @currentId=MIN(Id)
```

```csharp
FROM @dtaStats 
```

```csharp
WHERE Id>@LastId
```

```csharp



```csharp
WHILE (@currentId IS NOT NULL)
```

```csharp
BEGIN
```

```csharp



```csharp
SELECT @statName=StatName, @tableName=TableName FROM @dtaStats WHERE Id=@currentId
```

```csharp



```csharp
PRINT 'DROP STATISTICS ' + @tableName + '.' + @statName
```

```csharp



```csharp
EXEC('DROP STATISTICS ' + @tableName + '.' + @statName)
```

```csharp



```csharp
SET @lastId = @currentId 
```

```csharp
SET @currentId=null
```

```csharp



```csharp
SELECT @currentId=MIN(Id)
```

```csharp
FROM @dtaStats 
```

```csharp
WHERE Id>@LastId
```

```csharp



```csharp
END
```

```csharp



```csharp



Then drop the generated indexes:

  
```csharp



```csharp
DECLARE @dtaIndex AS TABLE(Id INT IDENTITY(1,1), IndexName VARCHAR(255), TableName VARCHAR(255))
```

```csharp
DECLARE @currentId AS INT
```

```csharp
DECLARE @lastId AS INT
```

```csharp



```csharp
DECLARE @IndexName VARCHAR(255)
```

```csharp
DECLARE @tableName VARCHAR(255)
```

```csharp



```csharp
INSERT INTO @dtaIndex(IndexName,TableName)
```

```csharp
SELECT name, OBJECT_NAME(OBJECT_ID) AS TABLENAME
```

```csharp
FROM sys.indexes
```

```csharp
WHERE name like '_dta_index_%'
```

```csharp



```csharp
SET @lastId=0
```

```csharp
SET @currentId=NULL
```

```csharp



```csharp
SELECT @currentId=MIN(Id)
```

```csharp
FROM @dtaIndex 
```

```csharp
WHERE Id>@LastId
```

```csharp



```csharp
PRINT @currentId
```

```csharp



```csharp
WHILE (@currentId IS NOT NULL)
```

```csharp
BEGIN
```

```csharp



```csharp
SELECT @IndexName=IndexName, @tableName=TableName FROM @dtaIndex WHERE Id=@currentId
```

```csharp



```csharp
PRINT 'DROP INDEX ' + @IndexName + ' ON ' + @tableName
```

```csharp



```csharp
EXEC('DROP INDEX ' + @IndexName + ' ON ' + @tableName)
```

```csharp



```csharp
SET @lastId = @currentId 
```

```csharp
SET @currentId=NULL
```

```csharp



```csharp
SELECT @currentId=MIN(Id)
```

```csharp
FROM @dtaIndex 
```

```csharp
WHERE Id>@LastId
```

```csharp



```csharp
END
```

```csharp



```csharp



The database is now back to a pre-DTA’ed state!
