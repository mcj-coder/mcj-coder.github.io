---
title: 'Experiments with ADO.Net, Extension Methods and Anonymous Methods'
description: ''
pubDate: 2011-07-14
tags: ['platground']
source: hugo
originalUrl: 'https://codifice.dev/posts/2011-07-14-experiments-with-adonet-extension/'
heroImage: ../../assets/blog/hero-images/2011-07-14-experiments-with-adonet-extension.jpg
---

As much as at pains me to admit it, an ORM Framework is not the answer to all data access problems.  Sometimes the quickest, easiest and most maintainable approach is back-to-basics flat ADO.Net.  For those developers whose (development) life began with Entity Framework, NHibernate or SubSonic.  This is a fairly typical example of an ADO.Net method (in a well structured code base):

```
{
```

What’s occuring:

- **_Create a list to contain the results_**

- Create a new connection object (using a connection string defined in the configuration file)

- Create a SQL Command object

- **_Set the parameterised query text_** (if this is a stored procedure then you need to set the CommandType to StoredProcedure)

- Set any parameters the query requires

- Open the connection to the database

- Execute the query

- Read through all the results record by record

- **_For each record add a new entry to the results list_**

- Close the reader,command and connection and dispose objects

- **_Return the results list_**

So, out of 11 steps only 4 actually related to the functionality of the method.  The other 7 are all boiler plate, repeat each time, steps that are required for ADO.Net.  If you want to add more detailed exception handling then that’s even more boiler plate code messing up your coding zen.  When you look at it like that, it’s easy to start reaching from the ORM toolbox.

But wait, ORM isn’t the only thing that’s happened over the last 10 years!  We’ve now got refactoring tools, extension methods and anonymous methods!  What can these modern day miracles do for us?

Well, for starters we can tidy up that SqlConnection initializer to get something a bit cleaner and maybe some configuration validation code in place:

```
{
```

So replace:

> using (SqlConnection conn = new SqlConnection(ConfigurationManager.ConnectionStrings[Properties.Settings.Default.ConnectionStringName].ConnectionString))

With

> using (SqlConnection conn = Properties.Settings.Default.ConnectionStringName.ToConnection())

Next, that parameter mapping code can be easily refactored away into a reusable block and add some additional intelligence too:

```
{
```

Finally, the per record processing can be made into delegate method, allowing you the opportunity to add additional exception information to the process:

```
 
```

Combining all this can give us a set of reusable ADO.Net extension methods, which allow us to separate the business concern from the ADO.Net concerns, so the example code a the top of the page can become:

```
{
```

Every single line (all 3 if the readability whitespace is removed) are focused on the business side of the query with minimal ADO.Net specific requirements (if you count the connection string name as a ADO.Net specific).

The full (experimental) extension method class is:

```
using System;
```

These provide DataReader, Scalar and Execute methods that all leverage the same generic ADO.Net method PerformSqlAction using best practise boiler plate code with detailed exception logging backed in.
