---
title: 'Experiments with ADO.Net, Extension Methods and Anonymous Methods'
description: 'Using C# extension methods and anonymous delegates to reduce ADO.Net boilerplate code down to just the business-relevant lines.'
pubDate: 2011-07-14
tags: ['playground']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2011/07/experiments-with-adonet-extension.html'
heroImage: ../../assets/blog/hero-images/2011-07-14-experiments-with-adonet-extension.jpg
---

As much as at pains me to admit it, an ORM Framework is not the answer to all data access problems. Sometimes the quickest, easiest and most maintainable approach is back-to-basics flat ADO.Net. For those developers whose (development) life began with Entity Framework, NHibernate or SubSonic. This is a fairly typical example of an ADO.Net method (in a well structured code base):

```csharp
private static IEnumerable<ContentAwaitingApproval> GetPendingApprovals(long approvalGroupId)
{
    List<ContentAwaitingApproval> approvals = new List<ContentAwaitingApproval>();
    using (SqlConnection conn = new SqlConnection(ConfigurationManager.ConnectionStrings[Properties.Settings.Default.ConnectionStringName].ConnectionString))
    {
        using (SqlCommand cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT ContentId, LanguageId, Status FROM Approvals WHERE ApprovalGroupID=@groupId";
            cmd.Parameters.AddWithValue("groupId", approvalGroupId);
            cmd.Connection.Open();
            using (SqlDataReader dr = cmd.ExecuteReader())
            {
                while (dr.Read())
                {
                    approvals.Add(new ContentAwaitingApproval
                    {
                        ContentId = dr.GetInt64(0)
                        ,
                        LanguageId = dr.GetInt32(1)
                        ,
                        Status = dr.GetString(2)
                    });
                }
            }
        }
    }
    return approvals;
}
```

What's occurring:

- **_Create a list to contain the results_**
- Create a new connection object (using a connection string defined in the configuration file)
- Create a SQL Command object
- **_Set the parameterised query text_** (if this is a stored procedure then you need to set the CommandType to StoredProcedure)
- Set any parameters the query requires
- Open the connection to the database
- Execute the query
- Read through all the results record by record
- **_For each record add a new entry to the results list_**
- Close the reader, command and connection and dispose objects
- **_Return the results list_**

So, out of 11 steps only 4 actually related to the functionality of the method. The other 7 are all boiler plate, repeat each time, steps that are required for ADO.Net. If you want to add more detailed exception handling then that's even more boiler plate code messing up your coding zen. When you look at it like that, it's easy to start reaching from the ORM toolbox.

But wait, ORM isn't the only thing that's happened over the last 10 years! We've now got refactoring tools, extension methods and anonymous methods! What can these modern day miracles do for us?

Well, for starters we can tidy up that SqlConnection initializer to get something a bit cleaner and maybe some configuration validation code in place:

```csharp
private static SqlConnection ToConnection(this string connectionStringName)
{
    if (connectionStringName.IsNullOrWhiteSpace()) throw new ArgumentException("Connection String Name cannot be empty", "connectionStringName");
    ConnectionStringSettings cns = ConfigurationManager.ConnectionStrings[connectionStringName];
    if (cns == null) throw new ArgumentException("Connection String Name '{0}' cannot be found".ToFormattedString(connectionStringName), "connectionStringName");
    return new SqlConnection(cns.ConnectionString);
}
```

So replace:

> using (SqlConnection conn = new SqlConnection(ConfigurationManager.ConnectionStrings\[Properties.Settings.Default.ConnectionStringName].ConnectionString))

With

> using (SqlConnection conn = Properties.Settings.Default.ConnectionStringName.ToConnection())

Next, that parameter mapping code can be easily refactored away into a reusable block and add some additional intelligence too:

```csharp
private static void AddParametersToCommand(IDictionary<string, object> parameters, SqlCommand cmd)
{
    if (parameters == null) return;
    foreach (string key in parameters.Keys)
    {
        if (parameters[key] == null)
        {
            cmd.Parameters.AddWithValue(key, DBNull.Value);
        }
        else if (parameters[key].GetType().IsPrimitive)
        {
            cmd.Parameters.AddWithValue(key, parameters[key]);
        }
        else
        {
            cmd.Parameters.AddWithValue(key, "{0}".ToFormattedString(parameters[key]));
        }
    }
}
```

Finally, the per record processing can be made into delegate method, allowing you the opportunity to add additional exception information to the process:

```csharp
Func<SqlDataReader, bool> recordAction = (dr) => { return true; };

using (SqlDataReader dr = cmd.ExecuteReader())
{
    int i = 0;
    try
    {
        while (dr.Read() && recordAction(dr)) i++;
    }
    catch (Exception ex)
    {
        ex.Data["Record Ordinal"] = i;
        throw;
    }
}
```

Combining all this can give us a set of reusable ADO.Net extension methods, which allow us to separate the business concern from the ADO.Net concerns, so the example code at the top of the page can become:

```csharp
private static IEnumerable<ContentAwaitingApproval> GetPendingApprovals(long approvalGroupId)
{
    List<ContentAwaitingApproval> approvals = new List<ContentAwaitingApproval>();
    "SELECT ContentId, LanguageId, Status FROM Approvals WHERE ApprovalGroupID=@groupId"
        .ProcessRecords(
            Properties.Settings.Default.ConnectionStringName
            , new Dictionary<string, object> { { "groupId", approvalGroupId } }
            , (dr) =>
                {
                    approvals.Add(new ContentAwaitingApproval
                    {
                        ContentId = dr.GetInt64(0)
                        ,
                        LanguageId = dr.GetInt32(1)
                        ,
                        Status = dr.GetString(2)
                    });
                    return true;
                }
            );
    return approvals;
}
```

Every single line (all 3 if the readability whitespace is removed) are focused on the business side of the query with minimal ADO.Net specific requirements (if you count the connection string name as a ADO.Net specific).

The full (experimental) extension method class is:

```csharp
using System;
using System.Configuration;
using System.Data.SqlClient;
using System.Linq;
using System.Collections.Generic;
using MartinOnDotNet.TypeConversion;

namespace MartinOnDotNet.Data.SqlClient
{
    /// <summary>
    /// Handy methods for handling SQL
    /// </summary>
    public static class SqlClientExtensions
    {
        private static SqlConnection ToConnection(this string connectionStringName)
        {
            if (connectionStringName.IsNullOrWhiteSpace()) throw new ArgumentException("Connection String Name cannot be empty", "connectionStringName");
            ConnectionStringSettings cns = ConfigurationManager.ConnectionStrings[connectionStringName];
            if (cns == null) throw new ArgumentException("Connection String Name '{0}' cannot be found".ToFormattedString(connectionStringName), "connectionStringName");
            return new SqlConnection(cns.ConnectionString);
        }

        public static void Execute(this string commandText, string connectionStringName)
        {
            commandText.Execute(connectionStringName, null);
        }

        public static void Execute(this string commandText, string connectionStringName, IDictionary<string, object> parameters)
        {
            PerformSqlAction<bool>(commandText, connectionStringName, parameters, (cmd) =>
            {
                cmd.ExecuteNonQuery();
                return true;
            });
        }

        public static T ExecuteScalar<T>(this string commandText, string connectionStringName)
        {
            return commandText.ExecuteScalar<T>(connectionStringName, null);
        }

        public static T ExecuteScalar<T>(this string commandText, string connectionStringName, IDictionary<string, object> parameters)
        {
            return PerformSqlAction<T>(commandText, connectionStringName, parameters, (cmd) =>
            {
                object value = cmd.ExecuteScalar();
                if (value == DBNull.Value) return default(T);
                return (T)value;
            });
        }

        public static void ProcessRecords(this string commandText, string connectionStringName, Func<SqlDataReader, bool> recordAction)
        {
            commandText.ProcessRecords(connectionStringName, null, recordAction);
        }

        public static void ProcessRecords(this string commandText, string connectionStringName, IDictionary<string, object> parameters, Func<SqlDataReader, bool> recordAction)
        {
            PerformSqlAction<bool>(commandText, connectionStringName, parameters, (cmd) =>
            {
                using (SqlDataReader dr = cmd.ExecuteReader())
                {
                    int i = 0;
                    try
                    {
                        while (dr.Read() && recordAction(dr)) i++;
                    }
                    catch (Exception ex)
                    {
                        ex.Data["Record Ordinal"] = i;
                        throw;
                    }
                }
                return true;
            });
        }

        private static void AddParametersToCommand(IDictionary<string, object> parameters, SqlCommand cmd)
        {
            if (parameters != null)
            {
                foreach (string key in parameters.Keys)
                {
                    if (parameters[key] == null)
                    {
                        cmd.Parameters.AddWithValue(key, DBNull.Value);
                    }
                    else if (parameters[key].GetType().IsPrimitive)
                    {
                        cmd.Parameters.AddWithValue(key, parameters[key]);
                    }
                    else
                    {
                        cmd.Parameters.AddWithValue(key, "{0}".ToFormattedString(parameters[key]));
                    }
                }
            }
        }

        public static bool HasResults(this string commandText, string connectionStringName)
        {
            return commandText.HasResults(connectionStringName, null);
        }

        public static bool HasResults(this string commandText, string connectionStringName, IDictionary<string, object> parameters)
        {
            return PerformSqlAction<bool>(commandText, connectionStringName, parameters, (cmd) =>
            {
                using (SqlDataReader dr = cmd.ExecuteReader())
                {
                    return dr.Read();
                }
            });
        }

        private static T PerformSqlAction<T>(string commandText, string connectionStringName, IDictionary<string, object> parameters, Func<SqlCommand, T> action)
        {
            if (commandText.IsNullOrWhiteSpace()) throw new ArgumentException("Command cannot be empty", "commandText");
            if (action == null) throw new ArgumentNullException("action");
            try
            {
                using (SqlConnection conn = connectionStringName.ToConnection())
                using (SqlCommand cmd = conn.CreateCommand())
                {
                    cmd.CommandText = commandText;
                    AddParametersToCommand(parameters, cmd);
                    conn.Open();
                    return action(cmd);
                }
            }
            catch (Exception ex)
            {
                ex.Data["Connection String"] = connectionStringName;
                ex.Data["Command"] = commandText;
                if (parameters != null)
                {
                    ex.Data["Parameters"] = parameters.Keys.Select(k => "{0} = '{1}'".ToFormattedString(k, parameters[k])).ToDelimitedString("\n");
                }
                throw;
            }
        }
    }
}
```

These provide DataReader, Scalar and Execute methods that all leverage the same generic ADO.Net method PerformSqlAction using best practise boiler plate code with detailed exception logging baked in.
