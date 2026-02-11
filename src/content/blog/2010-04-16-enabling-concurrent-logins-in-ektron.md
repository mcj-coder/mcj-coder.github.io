---
title: "Enabling Concurrent Logins in Ektron"
description: "Technical blog post from 2010-04-16"
pubDate: 2010-04-16
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

For one of our major clients we needed a semi-secure area – you needed credentials to view the content within, but there was only one set of credentials.   This meant that multiple users could access the site concurrently with the same credentials and this is a bit of a problem for the [Ektron](http://bit.ly/d0YHh7) security model as it’s based around a one session per login model.

  This model is enforced by a unique integer that is generated on login and persisted in the database (in ***[dbo].[users].[login_identification]*** schema fans) with the user account and also stored within a cookie (***‘ecm’***) that is returned to the client.  When an authenticated request comes in, Ektron checks the unique id in the cookie matches the value in the database and if not, your permission checks fail (*but doesn’t log you out – irritatingly you can be browse the site in a semi-authenticated state!*)

  
## The Fix
  To get around this we decided to fool the Ektron API into thinking that everyone using the credentials are in fact the same user by hijacking the ‘***ecm***’ cookie and updating the unique id for the provided user id using a HttpModule (*class definition and event wiring omitted for brevity*) : 

             1: private const string EcmCookie = "ecm";

       2: private const string IsMembershipUserKey = "isMembershipUser";

       3: private const string UserIdKey = "user_id";

       4: private const string UsernameKey = "username";

       5: private const string UniqueIdKey = "unique_id";

       6: private const string SiteIdKey = "site_id";

       7:  

       8: /// 

       9: /// Called at the begining of the request

      10: /// 

      11: /// The sender.

      12: /// The  instance containing the event data.

      13: private void OnBeginRequest(object sender, EventArgs e)

      14: {

      15:     HttpContext current = HttpContext.Current;

      16:     if (current == null || current.Request == null) return;

      17:     if (current.Request.Cookies.AllKeys.Contains(EcmCookie, StringComparer.OrdinalIgnoreCase))

      18:     {

      19:         HttpCookie ecm = current.Request.Cookies[EcmCookie];

      20:         if (ecm[IsMembershipUserKey].ToInt(0) != 1) return;

      21:         int userId = ecm[UserIdKey].ToInt(0); // uses extension method from http://bit.ly/bAZrMI

      22:         string username = ecm[UsernameKey];

      23:         if (userId > 0 && !string.IsNullOrEmpty(username))

      24:         {

      25:             string loginId = GetLoginId(userId, username); //get unique id

      26:             if (!string.IsNullOrEmpty(loginId))

      27:             {

      28:                 ecm[UniqueIdKey] = loginId;

      29:                 string[] siteId = ecm[SiteIdKey].Split(',');

      30:                 ecm[SiteIdKey] = string.Concat(siteId[0], ",", loginId);

      31:                 current.Response.Cookies.Add(ecm);

      32:             }

      33:         }

      34:     }

      35: }

      36:  

      37: private static string GetLoginId(int userId, string username)

      38: {

      39:     using (SqlConnection conn = new SqlConnection(EktronConnectionString))

      40:     {

      41:         using (SqlCommand cmd = conn.CreateCommand())

      42:         {

      43:             cmd.CommandText = LoginQuery;

      44:             cmd.Parameters.AddWithValue(UserIdKey, userId);

      45:             cmd.Parameters.AddWithValue(UsernameKey, username);

      46:             cmd.Connection.Open();

      47:             object result = cmd.ExecuteScalar();

      48:             if (result == null || result == DBNull.Value) return string.Empty;

      49:             return result.ToString();

      50:  

      51:         }

      52:     }

      53: }

      54:  

      55: private const string LoginQuery = "SELECT [login_identification] FROM [dbo].[users] WHERE [user_id] = @user_id AND [user_name] = @username";

      56:  

      57: private static string EktronConnectionString

      58: {

      59:     get

      60:     {

      61:         global::Ektron.Cms.CommonApi capi = new Ektron.Cms.CommonApi();

      62:         return capi.RequestInformationRef.ConnectionString;

      63:     }

      64: }

This approach doesn’t impact the level of security offered by Ektron as the secondary ASP.NET Authorization cookie is unaffected and all of these values are in the ‘public domain’ as they’re sent – unencrypted- to the client as a cookie.

## The Optimization

Whilst the above approach worked, it’s not particularly scalable as it adds additional database traffic to every authenticated request.  As this was expected to be a high-usage feature we need to balance keeping track of the latest login id with keeping additional database queries to a minimum.

To do this we’ve taken advantage of the ASP.NET 2.0/SQL Server 2005 SqlCacheDependency (in System.Web.Caching namespace) feature to allow us to cache the latest login id per user and have it evicted whenever it changes (when someone new logs in).  

Fortunately, this is fairly simple to.

Firstly, we needed to prepare the database for QUERY NOTIFICATIONS:

  
       1: USE master

       2: GO

       3: ALTER DATABASE [DatabaseName] SET ENABLE_BROKER WITH ROLLBACK IMMEDIATE;

       4: GO

       5: USE [DatabaseName] 

       6: GO

       7: GRANT CREATE PROCEDURE to [EktronDatabaseUser] 

       8: GRANT CREATE QUEUE to [EktronDatabaseUser]

       9: GRANT CREATE SERVICE to [EktronDatabaseUser]

      10: GRANT REFERENCES on

      11: CONTRACT::[http://schemas.microsoft.com/SQL/Notifications/PostQueryNotification] to [EktronDatabaseUser]

      12: GRANT VIEW DEFINITION TO [EktronDatabaseUser]

      13: GRANT SELECT to [EktronDatabaseUser]

      14: GRANT SUBSCRIBE QUERY NOTIFICATIONS TO [EktronDatabaseUser]

      15: GRANT RECEIVE ON QueryNotificationErrorsQueue TO [EktronDatabaseUser]

      16: GRANT REFERENCES on

      17: CONTRACT::[http://schemas.microsoft.com/SQL/Notifications/PostQueryNotification] to [EktronDatabaseUser]

      18: GO

Next, we need to ensure the SqlDependency.Start method is called using the Ektron.DbConnection connectionstring.  This is best done in the Global.asax Application_Start event:

  
       1: protected void Application_Start(object sender, EventArgs e)

       2: {

       3:    SqlDependency.Start(new global::Ektron.Cms.CommonApi().RequestInformationRef.ConnectionString);

       4: }

       5:  

       6: protected void Application_End(object sender, EventArgs e)

       7: {

       8:    SqlDependency.Stop(new global::Ektron.Cms.CommonApi().RequestInformationRef.ConnectionString);

       9: }

We could then amend our ‘GetLoginId’ method to implement the caching:

  
       1: private static string GetLoginId(int userId, string username)

       2: {

       3:     string cacheKey = string.Format(CultureInfo.InvariantCulture, "LoginId_{0}_{1}", userId, username);

       4:     string cachedValue = null;

       5:     if (HttpContext.Current !=null) cachedValue = HttpContext.Current.Cache[cacheKey] as string;

       6:     if (!string.IsNullOrEmpty(cachedValue)) return cachedValue;

       7:     using (SqlConnection conn = new SqlConnection(EktronConnectionString))

       8:     {

       9:         using (SqlCommand cmd = conn.CreateCommand())

      10:         {

      11:             cmd.CommandText = LoginQuery;

      12:             cmd.Parameters.AddWithValue(UserIdKey, userId);

      13:             cmd.Parameters.AddWithValue(UsernameKey, username);

      14:             SqlCacheDependency dependency = new SqlCacheDependency(cmd);

      15:             cmd.Connection.Open();

      16:             object result = cmd.ExecuteScalar();

      17:             if (result == null || result == DBNull.Value) return string.Empty;

      18:             if (HttpContext.Current !=null)

      19:             {

      20:                 HttpContext.Current.Cache.Insert(cacheKey, result.ToString(), dependency);

      21:             }

      22:             return result.ToString();

      23:  

      24:         }

      25:     }

      26: }

Job’s a good ‘un. (*Until Ektron change the membership user login mechanism*)  

## Preventing Account Lockouts

It may be worth disabling the Login attempts feature of Ektron to prevent the shared accounts from being locked.  Simply set the ek_loginAttemps value to –1 in appSettings:

  
       1: add key="ek_loginAttempts" value="-1" />
