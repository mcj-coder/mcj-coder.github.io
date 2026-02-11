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

             1: DECLARE @dtaStats AS TABLE(Id INT IDENTITY(1,1), StatName VARCHAR(255), TableName VARCHAR(255))

       2: DECLARE @currentId AS INT

       3: DECLARE @lastId AS INT

       4:  

       5: DECLARE @statName VARCHAR(255)

       6: DECLARE @tableName VARCHAR(255)

       7:  

       8: INSERT INTO @dtaStats(StatName,TableName)

       9:     SELECT name, OBJECT_NAME(OBJECT_ID) AS TABLENAME

      10:     FROM sys.stats

      11:     WHERE name like '_dta_stat_%'

      12:  

      13: SET @currentId=NULL

      14: SET @lastId=0

      15:  

      16: SELECT @currentId=MIN(Id)

      17: FROM @dtaStats 

      18: WHERE Id>@LastId

      19:  

      20: WHILE (@currentId IS NOT NULL)

      21: BEGIN

      22:  

      23:     SELECT @statName=StatName, @tableName=TableName FROM @dtaStats WHERE Id=@currentId

      24:     

      25:     PRINT 'DROP STATISTICS ' + @tableName + '.' + @statName

      26:     

      27:     EXEC('DROP STATISTICS ' + @tableName + '.' + @statName)

      28:     

      29:     SET @lastId = @currentId 

      30:     SET @currentId=null

      31:  

      32:     SELECT @currentId=MIN(Id)

      33:     FROM @dtaStats 

      34:     WHERE Id>@LastId

      35:  

      36: END

      37:  

      38:  

Then drop the generated indexes:

  
       1:  

       2: DECLARE @dtaIndex AS TABLE(Id INT IDENTITY(1,1), IndexName VARCHAR(255), TableName VARCHAR(255))

       3: DECLARE @currentId AS INT

       4: DECLARE @lastId AS INT

       5:  

       6: DECLARE @IndexName VARCHAR(255)

       7: DECLARE @tableName VARCHAR(255)

       8:  

       9: INSERT INTO @dtaIndex(IndexName,TableName)

      10:     SELECT name, OBJECT_NAME(OBJECT_ID) AS TABLENAME

      11:     FROM sys.indexes

      12:     WHERE name like '_dta_index_%'

      13:     

      14: SET @lastId=0

      15: SET @currentId=NULL

      16:  

      17: SELECT @currentId=MIN(Id)

      18: FROM @dtaIndex 

      19: WHERE Id>@LastId

      20:  

      21: PRINT @currentId

      22:  

      23: WHILE (@currentId IS NOT NULL)

      24: BEGIN

      25:  

      26:     SELECT @IndexName=IndexName, @tableName=TableName FROM @dtaIndex WHERE Id=@currentId

      27:     

      28:     PRINT 'DROP INDEX ' + @IndexName + ' ON ' + @tableName

      29:     

      30:     EXEC('DROP INDEX ' + @IndexName + ' ON ' + @tableName)

      31:     

      32:     SET @lastId = @currentId 

      33:     SET @currentId=NULL

      34:  

      35:     SELECT @currentId=MIN(Id)

      36:     FROM @dtaIndex 

      37:     WHERE Id>@LastId

      38:  

      39: END

      40:  

      41:  

The database is now back to a pre-DTA’ed state!
