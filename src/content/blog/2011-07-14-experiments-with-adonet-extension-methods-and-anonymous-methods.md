---
title: "Experiments with ADO.Net, Extension Methods and Anonymous Methods"
description: "Technical blog post from 2011-07-14"
pubDate: 2011-07-14
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

As much as at pains me to admit it, an ORM Framework is not the answer to all data access problems.  Sometimes the quickest, easiest and most maintainable approach is back-to-basics flat ADO.Net.  For those developers whose (development) life began with Entity Framework, NHibernate or SubSonic.  This is a fairly typical example of an ADO.Net method (in a well structured code base):

```csharp
private static IEnumerable GetPendingApprovals(long approvalGroupId)
```

```csharp
{
```

```csharp
List approvals = new List();
```

```csharp
using (SqlConnection conn = new SqlConnection(ConfigurationManager.ConnectionStrings[Properties.Settings.Default.ConnectionStringName].ConnectionString))
```

```csharp
{
```

```csharp
using (SqlCommand cmd = conn.CreateCommand())
```

```csharp
{
```

```csharp
cmd.CommandText = "SELECT ContentId, LanguageId, Status FROM Approvals WHER ApprovalGroupID=@groupId";
```

```csharp
cmd.Parameters.AddWithValue("groupId", approvalGroupId);
```

```csharp
cmd.Connection.Open();
```

```csharp
using (SqlDataReader dr = cmd.ExecuteReader())
```

```csharp
{
```

```csharp
while (dr.Read())
```

```csharp
{
```

```csharp
approvals.Add(new ContentAwaitingApproval
```

```csharp
{
```

```csharp
ContentId = dr.GetInt64(0)
```

```csharp
,
```

```csharp
LanguageId = dr.GetInt32(1)
```

```csharp
,
```

```csharp
Status = dr.GetString(2)
```

```csharp
});
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

```csharp
}
```

```csharp
return approvals;
```

```csharp
}
```

What’s occuring:

  * ***Create a list to contain the results*** 

  * Create a new connection object (using a connection string defined in the configuration file) 

  * Create a SQL Command object 

  * ***Set the parameterised query text*** (if this is a stored procedure then you need to set the CommandType to StoredProcedure) 

  * Set any parameters the query requires 

  * Open the connection to the database 

  * Execute the query 

  * Read through all the results record by record 

  * ***For each record add a new entry to the results list*** 

  * Close the reader,command and connection and dispose objects 

  * ***Return the results list*** 

So, out of 11 steps only 4 actually related to the functionality of the method.  The other 7 are all boiler plate, repeat each time, steps that are required for ADO.Net.  If you want to add more detailed exception handling then that’s even more boiler plate code messing up your coding zen.  When you look at it like that, it’s easy to start reaching from the ORM toolbox.

But wait, ORM isn’t the only thing that’s happened over the last 10 years!  We’ve now got refactoring tools, extension methods and anonymous methods!  What can these modern day miracles do for us?

Well, for starters we can tidy up that SqlConnection initializer to get something a bit cleaner and maybe some configuration validation code in place:

  
```csharp
private static SqlConnection ToConnection(this string connectionStringName)
```

```csharp
{
```

```csharp
if (connectionStringName.IsNullOrWhiteSpace()) throw new ArgumentException("Connection String Name cannot be empty", "connectionStringName");
```

```csharp
ConnectionStringSettings cns = ConfigurationManager.ConnectionStrings[connectionStringName];
```

```csharp
if (cns == null) throw new ArgumentException("Connection String Name '{0}' cannot be found".ToFormattedString(connectionStringName), "connectionStringName");
```

```csharp
return new SqlConnection(cns.ConnectionString);
```

```csharp
}
```

So replace:

  using (SqlConnection conn = new SqlConnection(ConfigurationManager.ConnectionStrings[Properties.Settings.Default.ConnectionStringName].ConnectionString))

With

  using (SqlConnection conn = Properties.Settings.Default.ConnectionStringName.ToConnection())

Next, that parameter mapping code can be easily refactored away into a reusable block and add some additional intelligence too:

  
```csharp
private static void AddParametersToCommand(IDictionarystring, object> parameters, SqlCommand cmd)
```

```csharp
{
```

```csharp
if (parameters == null) return;
```

```csharp
foreach (string key in parameters.Keys)
```

```csharp
{
```

```csharp
if (parameters[key] == null)
```

```csharp
{
```

```csharp
cmd.Parameters.AddWithValue(key, DBNull.Value);
```

```csharp
}
```

```csharp
else if (parameters[key].GetType().IsPrimitive)
```

```csharp
{
```

```csharp
cmd.Parameters.AddWithValue(key, parameters[key]);
```

```csharp
}
```

```csharp
else
```

```csharp
{
```

```csharp
cmd.Parameters.AddWithValue(key, "{0}".ToFormattedString(parameters[key]));
```

```csharp
}
```

```csharp



```csharp
}
```

```csharp
}
```

Finally, the per record processing can be made into delegate method, allowing you the opportunity to add additional exception information to the process:

  
```csharp
Funcbool> recordAction = (dr)=>{return true;};
```

```csharp



```csharp
using (SqlDataReader dr = cmd.ExecuteReader())
```

```csharp
{
```

```csharp
int i = 0;
```

```csharp
try
```

```csharp
{
```

```csharp
while (dr.Read() && recordAction(dr)) i++;
```

```csharp
}
```

```csharp
catch (Exception ex)
```

```csharp
{
```

```csharp
ex.Data["Record Ordinal"] = i;
```

```csharp
throw;
```

```csharp
}
```

```csharp
}
```

Combining all this can give us a set of reusable ADO.Net extension methods, which allow us to separate the business concern from the ADO.Net concerns, so the example code a the top of the page can become:

  
```csharp
private static IEnumerable GetPendingApprovals(long approvalGroupId)
```

```csharp
{
```

```csharp
List approvals = new List();
```

```csharp
"SELECT ContentId, LanguageId, Status FROM Approvals WHER ApprovalGroupID=@groupId"
```

```csharp
.ProcessRecords(
```

```csharp
Properties.Settings.Default.ConnectionStringName
```

```csharp
, new Dictionarystring, object> { { "groupId", approvalGroupId } }
```

```csharp
, (dr) =>
```

```csharp
{
```

```csharp
approvals.Add(new ContentAwaitingApproval
```

```csharp
{
```

```csharp
ContentId = dr.GetInt64(0)
```

```csharp
,
```

```csharp
LanguageId = dr.GetInt32(1)
```

```csharp
,
```

```csharp
Status = dr.GetString(2)
```

```csharp
});
```

```csharp
return true;
```

```csharp
}
```

```csharp
);
```

```csharp
return approvals;
```

```csharp
}
```

Every single line (all 3 if the readability whitespace is removed) are focused on the business side of the query with minimal ADO.Net specific requirements (if you count the connection string name as a ADO.Net specific).

The full (experimental) extension method class is:

  
```csharp
using System;
```

```csharp
using System.Configuration;
```

```csharp
using System.Data.SqlClient;
```

```csharp
using System.Linq;
```

```csharp
using System.Collections.Generic;
```

```csharp
using MartinOnDotNet.TypeConversion;
```

```csharp



```csharp
namespace MartinOnDotNet.Data.SqlClient
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// Handy methods for handling SQL
```

```csharp
/// 
```

```csharp
public static class SqlClientExtensions
```

```csharp
{
```

```csharp
private static SqlConnection ToConnection(this string connectionStringName)
```

```csharp
{
```

```csharp
if (connectionStringName.IsNullOrWhiteSpace()) throw new ArgumentException("Connection String Name cannot be empty", "connectionStringName");
```

```csharp
ConnectionStringSettings cns = ConfigurationManager.ConnectionStrings[connectionStringName];
```

```csharp
if (cns == null) throw new ArgumentException("Connection String Name '{0}' cannot be found".ToFormattedString(connectionStringName), "connectionStringName");
```

```csharp
return new SqlConnection(cns.ConnectionString);
```

```csharp
}
```

```csharp



```csharp
public static void Execute(this string commandText, string connectionStringName)
```

```csharp
{
```

```csharp
commandText.Execute(connectionStringName, null);
```

```csharp
}
```

```csharp



```csharp
public static void Execute(this string commandText, string connectionStringName, IDictionarystring, object> parameters)
```

```csharp
{
```

```csharp
PerformSqlActionbool>(commandText, connectionStringName, parameters, (cmd) =>
```

```csharp
{
```

```csharp
cmd.ExecuteNonQuery();
```

```csharp
return true;
```

```csharp
});
```

```csharp
}
```

```csharp



```csharp
public static T ExecuteScalar(this string commandText, string connectionStringName)
```

```csharp
{
```

```csharp
return commandText.ExecuteScalar(connectionStringName, null);
```

```csharp
}
```

```csharp



```csharp
public static T ExecuteScalar(this string commandText, string connectionStringName, IDictionarystring, object> parameters)
```

```csharp
{
```

```csharp
return PerformSqlAction(commandText, connectionStringName, parameters, (cmd) =>
```

```csharp
{
```

```csharp
object value = cmd.ExecuteScalar();
```

```csharp
if (value == DBNull.Value) return default(T);
```

```csharp
return (T)value;
```

```csharp
});
```

```csharp
}
```

```csharp



```csharp
public static void ProcessRecords(this string commandText, string connectionStringName, Funcbool> recordAction)
```

```csharp
{
```

```csharp
commandText.ProcessRecords(connectionStringName, recordAction);
```

```csharp
}
```

```csharp



```csharp
public static void ProcessRecords(this string commandText, string connectionStringName, IDictionarystring, object> parameters, Funcbool> recordAction)
```

```csharp
{
```

```csharp
PerformSqlActionbool>(commandText, connectionStringName, parameters, (cmd) =>
```

```csharp
{
```

```csharp
using (SqlDataReader dr = cmd.ExecuteReader())
```

```csharp
{
```

```csharp
int i = 0;
```

```csharp
try
```

```csharp
{
```

```csharp
while (dr.Read() && recordAction(dr)) i++;
```

```csharp
}
```

```csharp
catch (Exception ex)
```

```csharp
{
```

```csharp
ex.Data["Record Ordinal"] = i;
```

```csharp
throw;
```

```csharp
}
```

```csharp
}
```

```csharp
return true;
```

```csharp
});
```

```csharp
}
```

```csharp



```csharp
private static void AddParametersToCommand(IDictionarystring, object> parameters, SqlCommand cmd)
```

```csharp
{
```

```csharp
if (parameters != null)
```

```csharp
{
```

```csharp
foreach (string key in parameters.Keys)
```

```csharp
{
```

```csharp
if (parameters[key] == null)
```

```csharp
{
```

```csharp
cmd.Parameters.AddWithValue(key, DBNull.Value);
```

```csharp
}
```

```csharp
else if (parameters[key].GetType().IsPrimitive)
```

```csharp
{
```

```csharp
cmd.Parameters.AddWithValue(key, parameters[key]);
```

```csharp
}
```

```csharp
else
```

```csharp
{
```

```csharp
cmd.Parameters.AddWithValue(key, "{0}".ToFormattedString(parameters[key]));
```

```csharp
}
```

```csharp



```csharp
}
```

```csharp
}
```

```csharp
}
```

```csharp



```csharp
public static bool HasResults(this string commandText, string connectionStringName)
```

```csharp
{
```

```csharp
return commandText.HasResults(connectionStringName, null);
```

```csharp
}
```

```csharp



```csharp
public static bool HasResults(this string commandText, string connectionStringName, IDictionarystring, object> parameters)
```

```csharp
{
```

```csharp
return PerformSqlActionbool>(commandText, connectionStringName, parameters, (cmd) =>
```

```csharp
{
```

```csharp
using (SqlDataReader dr = cmd.ExecuteReader())
```

```csharp
{
```

```csharp
return dr.Read();
```

```csharp
}
```

```csharp
});
```

```csharp
}
```

```csharp



```csharp
private static T PerformSqlAction(string commandText, string connectionStringName, IDictionarystring, object> parameters, Func action)
```

```csharp
{
```

```csharp
if (commandText.IsNullOrWhiteSpace()) throw new ArgumentException("Command cannot be empty", "commandText");
```

```csharp
if (action == null) throw new ArgumentNullException("action");
```

```csharp
try
```

```csharp
{
```

```csharp
using (SqlConnection conn = connectionStringName.ToConnection())
```

```csharp
using (SqlCommand cmd = conn.CreateCommand())
```

```csharp
{
```

```csharp
cmd.CommandText = commandText;
```

```csharp
AddParametersToCommand(parameters, cmd);
```

```csharp
conn.Open();
```

```csharp
return action(cmd);
```

```csharp
}
```

```csharp
}
```

```csharp
catch (Exception ex)
```

```csharp
{
```

```csharp
ex.Data["Connection String"] = connectionStringName;
```

```csharp
ex.Data["Command"] = commandText;
```

```csharp
if (parameters != null)
```

```csharp
{
```

```csharp
ex.Data["Parameters"] = parameters.Keys.Select(k => "{0} = '{1}'".ToFormattedString(k, parameters[k])).ToDelimitedString("\n");
```

```csharp
}
```

```csharp
throw;
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

```csharp
}
```

These provide DataReader, Scalar and Execute methods that all leverage the same generic ADO.Net method PerformSqlAction using best practise boiler plate code with detailed exception logging backed in.
