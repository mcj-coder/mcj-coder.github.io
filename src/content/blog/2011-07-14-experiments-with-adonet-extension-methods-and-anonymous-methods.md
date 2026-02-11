---
title: "Experiments with ADO.Net, Extension Methods and Anonymous Methods"
description: "Technical blog post from 2011-07-14"
pubDate: 2011-07-14
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

As much as at pains me to admit it, an ORM Framework is not the answer to all data access problems.  Sometimes the quickest, easiest and most maintainable approach is back-to-basics flat ADO.Net.  For those developers whose (development) life began with Entity Framework, NHibernate or SubSonic.  This is a fairly typical example of an ADO.Net method (in a well structured code base):

             1: private static IEnumerable GetPendingApprovals(long approvalGroupId)

       2: {

       3:     List approvals = new List();

       4:     using (SqlConnection conn = new SqlConnection(ConfigurationManager.ConnectionStrings[Properties.Settings.Default.ConnectionStringName].ConnectionString))

       5:     {

       6:         using (SqlCommand cmd = conn.CreateCommand())

       7:         {

       8:             cmd.CommandText = "SELECT ContentId, LanguageId, Status FROM Approvals WHER ApprovalGroupID=@groupId";

       9:             cmd.Parameters.AddWithValue("groupId", approvalGroupId);

      10:             cmd.Connection.Open();

      11:             using (SqlDataReader dr = cmd.ExecuteReader())

      12:             {

      13:                 while (dr.Read())

      14:                 {

      15:                     approvals.Add(new ContentAwaitingApproval

      16:                     {

      17:                         ContentId = dr.GetInt64(0)

      18:                         ,

      19:                         LanguageId = dr.GetInt32(1)

      20:                         ,

      21:                         Status = dr.GetString(2)

      22:                     });

      23:                 }

      24:             }

      25:         }

      26:     }

      27:     return approvals;

      28: }

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

  
       1: private static SqlConnection ToConnection(this string connectionStringName)

       2: {

       3:     if (connectionStringName.IsNullOrWhiteSpace()) throw new ArgumentException("Connection String Name cannot be empty", "connectionStringName");

       4:     ConnectionStringSettings cns = ConfigurationManager.ConnectionStrings[connectionStringName];

       5:     if (cns == null) throw new ArgumentException("Connection String Name '{0}' cannot be found".ToFormattedString(connectionStringName), "connectionStringName");

       6:     return new SqlConnection(cns.ConnectionString);

       7: }

So replace:

  using (SqlConnection conn = new SqlConnection(ConfigurationManager.ConnectionStrings[Properties.Settings.Default.ConnectionStringName].ConnectionString))

With

  using (SqlConnection conn = Properties.Settings.Default.ConnectionStringName.ToConnection())

Next, that parameter mapping code can be easily refactored away into a reusable block and add some additional intelligence too:

  
       1: private static void AddParametersToCommand(IDictionarystring, object> parameters, SqlCommand cmd)

       2: {

       3:     if (parameters == null) return;

       4:     foreach (string key in parameters.Keys)

       5:     {

       6:         if (parameters[key] == null)

       7:         {

       8:             cmd.Parameters.AddWithValue(key, DBNull.Value);

       9:         }

      10:         else if (parameters[key].GetType().IsPrimitive)

      11:         {

      12:             cmd.Parameters.AddWithValue(key, parameters[key]);

      13:         }

      14:         else

      15:         {

      16:             cmd.Parameters.AddWithValue(key, "{0}".ToFormattedString(parameters[key]));

      17:         }

      18:  

      19:     }

      20: }

Finally, the per record processing can be made into delegate method, allowing you the opportunity to add additional exception information to the process:

  
       1: Funcbool> recordAction = (dr)=>{return true;};

       2:  

       3: using (SqlDataReader dr = cmd.ExecuteReader())

       4: {

       5:    int i = 0;

       6:    try

       7:    {

       8:        while (dr.Read() && recordAction(dr)) i++;

       9:    }

      10:    catch (Exception ex)

      11:    {

      12:        ex.Data["Record Ordinal"] = i;

      13:        throw;

      14:    }

      15: }

Combining all this can give us a set of reusable ADO.Net extension methods, which allow us to separate the business concern from the ADO.Net concerns, so the example code a the top of the page can become:

  
       1: private static IEnumerable GetPendingApprovals(long approvalGroupId)

       2: {

       3:     List approvals = new List();

       4:     "SELECT ContentId, LanguageId, Status FROM Approvals WHER ApprovalGroupID=@groupId"

       5:         .ProcessRecords(

       6:             Properties.Settings.Default.ConnectionStringName

       7:             , new Dictionarystring, object> { { "groupId", approvalGroupId } }

       8:             , (dr) =>

       9:                 {

      10:                     approvals.Add(new ContentAwaitingApproval

      11:                     {

      12:                         ContentId = dr.GetInt64(0)

      13:                         ,

      14:                         LanguageId = dr.GetInt32(1)

      15:                         ,

      16:                         Status = dr.GetString(2)

      17:                     });

      18:                     return true;

      19:                 }

      20:             );

      21:     return approvals;

      22: }

Every single line (all 3 if the readability whitespace is removed) are focused on the business side of the query with minimal ADO.Net specific requirements (if you count the connection string name as a ADO.Net specific).

The full (experimental) extension method class is:

  
       1: using System;

       2: using System.Configuration;

       3: using System.Data.SqlClient;

       4: using System.Linq;

       5: using System.Collections.Generic;

       6: using MartinOnDotNet.TypeConversion;

       7:  

       8: namespace MartinOnDotNet.Data.SqlClient

       9: {

      10:     /// 

      11:     /// Handy methods for handling SQL

      12:     /// 

      13:     public static class SqlClientExtensions

      14:     {

      15:         private static SqlConnection ToConnection(this string connectionStringName)

      16:         {

      17:             if (connectionStringName.IsNullOrWhiteSpace()) throw new ArgumentException("Connection String Name cannot be empty", "connectionStringName");

      18:             ConnectionStringSettings cns = ConfigurationManager.ConnectionStrings[connectionStringName];

      19:             if (cns == null) throw new ArgumentException("Connection String Name '{0}' cannot be found".ToFormattedString(connectionStringName), "connectionStringName");

      20:             return new SqlConnection(cns.ConnectionString);

      21:         }

      22:  

      23:         public static void Execute(this string commandText, string connectionStringName)

      24:         {

      25:             commandText.Execute(connectionStringName, null);

      26:         }

      27:  

      28:         public static void Execute(this string commandText, string connectionStringName, IDictionarystring, object> parameters)

      29:         {

      30:             PerformSqlActionbool>(commandText, connectionStringName, parameters, (cmd) =>

      31:             {

      32:                 cmd.ExecuteNonQuery();

      33:                 return true;

      34:             });

      35:         }

      36:  

      37:         public static T ExecuteScalar(this string commandText, string connectionStringName)

      38:         {

      39:             return commandText.ExecuteScalar(connectionStringName, null);

      40:         }

      41:  

      42:         public static T ExecuteScalar(this string commandText, string connectionStringName, IDictionarystring, object> parameters)

      43:         {

      44:             return PerformSqlAction(commandText, connectionStringName, parameters, (cmd) =>

      45:             {

      46:                 object value = cmd.ExecuteScalar();

      47:                 if (value == DBNull.Value) return default(T);

      48:                 return (T)value;

      49:             });

      50:         }

      51:  

      52:         public static void ProcessRecords(this string commandText, string connectionStringName, Funcbool> recordAction)

      53:         {

      54:             commandText.ProcessRecords(connectionStringName, recordAction);

      55:         }

      56:  

      57:         public static void ProcessRecords(this string commandText, string connectionStringName, IDictionarystring, object> parameters, Funcbool> recordAction)

      58:         {

      59:             PerformSqlActionbool>(commandText, connectionStringName, parameters, (cmd) =>

      60:            {

      61:                using (SqlDataReader dr = cmd.ExecuteReader())

      62:                {

      63:                    int i = 0;

      64:                    try

      65:                    {

      66:                        while (dr.Read() && recordAction(dr)) i++;

      67:                    }

      68:                    catch (Exception ex)

      69:                    {

      70:                        ex.Data["Record Ordinal"] = i;

      71:                        throw;

      72:                    }

      73:                }

      74:                return true;

      75:            });

      76:         }

      77:  

      78:         private static void AddParametersToCommand(IDictionarystring, object> parameters, SqlCommand cmd)

      79:         {

      80:             if (parameters != null)

      81:             {

      82:                 foreach (string key in parameters.Keys)

      83:                 {

      84:                     if (parameters[key] == null)

      85:                     {

      86:                         cmd.Parameters.AddWithValue(key, DBNull.Value);

      87:                     }

      88:                     else if (parameters[key].GetType().IsPrimitive)

      89:                     {

      90:                         cmd.Parameters.AddWithValue(key, parameters[key]);

      91:                     }

      92:                     else

      93:                     {

      94:                         cmd.Parameters.AddWithValue(key, "{0}".ToFormattedString(parameters[key]));

      95:                     }

      96:  

      97:                 }

      98:             }

      99:         }

     100:  

     101:         public static bool HasResults(this string commandText, string connectionStringName)

     102:         {

     103:             return commandText.HasResults(connectionStringName, null);

     104:         }

     105:  

     106:         public static bool HasResults(this string commandText, string connectionStringName, IDictionarystring, object> parameters)

     107:         {

     108:             return PerformSqlActionbool>(commandText, connectionStringName, parameters, (cmd) =>

     109:             {

     110:                 using (SqlDataReader dr = cmd.ExecuteReader())

     111:                 {

     112:                     return dr.Read();

     113:                 }

     114:             });

     115:         }

     116:  

     117:         private static T PerformSqlAction(string commandText, string connectionStringName, IDictionarystring, object> parameters, Func action)

     118:         {

     119:             if (commandText.IsNullOrWhiteSpace()) throw new ArgumentException("Command cannot be empty", "commandText");

     120:             if (action == null) throw new ArgumentNullException("action");

     121:             try

     122:             {

     123:                 using (SqlConnection conn = connectionStringName.ToConnection())

     124:                 using (SqlCommand cmd = conn.CreateCommand())

     125:                 {

     126:                     cmd.CommandText = commandText;

     127:                     AddParametersToCommand(parameters, cmd);

     128:                     conn.Open();

     129:                     return action(cmd);

     130:                 }

     131:             }

     132:             catch (Exception ex)

     133:             {

     134:                 ex.Data["Connection String"] = connectionStringName;

     135:                 ex.Data["Command"] = commandText;

     136:                 if (parameters != null)

     137:                 {

     138:                     ex.Data["Parameters"] = parameters.Keys.Select(k => "{0} = '{1}'".ToFormattedString(k, parameters[k])).ToDelimitedString("\n");

     139:                 }

     140:                 throw;

     141:             }

     142:         }

     143:     }

     144: }

These provide DataReader, Scalar and Execute methods that all leverage the same generic ADO.Net method PerformSqlAction using best practise boiler plate code with detailed exception logging backed in.
