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

```csharp
private const string EcmCookie = "ecm";
```

```csharp
private const string IsMembershipUserKey = "isMembershipUser";
```

```csharp
private const string UserIdKey = "user_id";
```

```csharp
private const string UsernameKey = "username";
```

```csharp
private const string UniqueIdKey = "unique_id";
```

```csharp
private const string SiteIdKey = "site_id";
```

```csharp



```csharp
/// 
```

```csharp
/// Called at the begining of the request
```

```csharp
/// 
```

```csharp
/// The sender.
```

```csharp
/// The  instance containing the event data.
```

```csharp
private void OnBeginRequest(object sender, EventArgs e)
```

```csharp
{
```

```csharp
HttpContext current = HttpContext.Current;
```

```csharp
if (current == null || current.Request == null) return;
```

```csharp
if (current.Request.Cookies.AllKeys.Contains(EcmCookie, StringComparer.OrdinalIgnoreCase))
```

```csharp
{
```

```csharp
HttpCookie ecm = current.Request.Cookies[EcmCookie];
```

```csharp
if (ecm[IsMembershipUserKey].ToInt(0) != 1) return;
```

```csharp
int userId = ecm[UserIdKey].ToInt(0); // uses extension method from http://bit.ly/bAZrMI
```

```csharp
string username = ecm[UsernameKey];
```

```csharp
if (userId > 0 && !string.IsNullOrEmpty(username))
```

```csharp
{
```

```csharp
string loginId = GetLoginId(userId, username); //get unique id
```

```csharp
if (!string.IsNullOrEmpty(loginId))
```

```csharp
{
```

```csharp
ecm[UniqueIdKey] = loginId;
```

```csharp
string[] siteId = ecm[SiteIdKey].Split(',');
```

```csharp
ecm[SiteIdKey] = string.Concat(siteId[0], ",", loginId);
```

```csharp
current.Response.Cookies.Add(ecm);
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



```csharp
private static string GetLoginId(int userId, string username)
```

```csharp
{
```

```csharp
using (SqlConnection conn = new SqlConnection(EktronConnectionString))
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
cmd.CommandText = LoginQuery;
```

```csharp
cmd.Parameters.AddWithValue(UserIdKey, userId);
```

```csharp
cmd.Parameters.AddWithValue(UsernameKey, username);
```

```csharp
cmd.Connection.Open();
```

```csharp
object result = cmd.ExecuteScalar();
```

```csharp
if (result == null || result == DBNull.Value) return string.Empty;
```

```csharp
return result.ToString();
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
private const string LoginQuery = "SELECT [login_identification] FROM [dbo].[users] WHERE [user_id] = @user_id AND [user_name] = @username";
```

```csharp



```csharp
private static string EktronConnectionString
```

```csharp
{
```

```csharp
get
```

```csharp
{
```

```csharp
global::Ektron.Cms.CommonApi capi = new Ektron.Cms.CommonApi();
```

```csharp
return capi.RequestInformationRef.ConnectionString;
```

```csharp
}
```

```csharp
}
```

This approach doesn’t impact the level of security offered by Ektron as the secondary ASP.NET Authorization cookie is unaffected and all of these values are in the ‘public domain’ as they’re sent – unencrypted- to the client as a cookie.

## The Optimization

Whilst the above approach worked, it’s not particularly scalable as it adds additional database traffic to every authenticated request.  As this was expected to be a high-usage feature we need to balance keeping track of the latest login id with keeping additional database queries to a minimum.

To do this we’ve taken advantage of the ASP.NET 2.0/SQL Server 2005 SqlCacheDependency (in System.Web.Caching namespace) feature to allow us to cache the latest login id per user and have it evicted whenever it changes (when someone new logs in).  

Fortunately, this is fairly simple to.

Firstly, we needed to prepare the database for QUERY NOTIFICATIONS:

  
```csharp
USE master
```

```csharp
GO
```

```csharp
ALTER DATABASE [DatabaseName] SET ENABLE_BROKER WITH ROLLBACK IMMEDIATE;
```

```csharp
GO
```

```csharp
USE [DatabaseName] 
```

```csharp
GO
```

```csharp
GRANT CREATE PROCEDURE to [EktronDatabaseUser] 
```

```csharp
GRANT CREATE QUEUE to [EktronDatabaseUser]
```

```csharp
GRANT CREATE SERVICE to [EktronDatabaseUser]
```

```csharp
GRANT REFERENCES on
```

```csharp
CONTRACT::[http://schemas.microsoft.com/SQL/Notifications/PostQueryNotification] to [EktronDatabaseUser]
```

```csharp
GRANT VIEW DEFINITION TO [EktronDatabaseUser]
```

```csharp
GRANT SELECT to [EktronDatabaseUser]
```

```csharp
GRANT SUBSCRIBE QUERY NOTIFICATIONS TO [EktronDatabaseUser]
```

```csharp
GRANT RECEIVE ON QueryNotificationErrorsQueue TO [EktronDatabaseUser]
```

```csharp
GRANT REFERENCES on
```

```csharp
CONTRACT::[http://schemas.microsoft.com/SQL/Notifications/PostQueryNotification] to [EktronDatabaseUser]
```

```csharp
GO
```

Next, we need to ensure the SqlDependency.Start method is called using the Ektron.DbConnection connectionstring.  This is best done in the Global.asax Application_Start event:

  
```csharp
protected void Application_Start(object sender, EventArgs e)
```

```csharp
{
```

```csharp
SqlDependency.Start(new global::Ektron.Cms.CommonApi().RequestInformationRef.ConnectionString);
```

```csharp
}
```

```csharp



```csharp
protected void Application_End(object sender, EventArgs e)
```

```csharp
{
```

```csharp
SqlDependency.Stop(new global::Ektron.Cms.CommonApi().RequestInformationRef.ConnectionString);
```

```csharp
}
```

We could then amend our ‘GetLoginId’ method to implement the caching:

  
```csharp
private static string GetLoginId(int userId, string username)
```

```csharp
{
```

```csharp
string cacheKey = string.Format(CultureInfo.InvariantCulture, "LoginId_{0}_{1}", userId, username);
```

```csharp
string cachedValue = null;
```

```csharp
if (HttpContext.Current !=null) cachedValue = HttpContext.Current.Cache[cacheKey] as string;
```

```csharp
if (!string.IsNullOrEmpty(cachedValue)) return cachedValue;
```

```csharp
using (SqlConnection conn = new SqlConnection(EktronConnectionString))
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
cmd.CommandText = LoginQuery;
```

```csharp
cmd.Parameters.AddWithValue(UserIdKey, userId);
```

```csharp
cmd.Parameters.AddWithValue(UsernameKey, username);
```

```csharp
SqlCacheDependency dependency = new SqlCacheDependency(cmd);
```

```csharp
cmd.Connection.Open();
```

```csharp
object result = cmd.ExecuteScalar();
```

```csharp
if (result == null || result == DBNull.Value) return string.Empty;
```

```csharp
if (HttpContext.Current !=null)
```

```csharp
{
```

```csharp
HttpContext.Current.Cache.Insert(cacheKey, result.ToString(), dependency);
```

```csharp
}
```

```csharp
return result.ToString();
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

Job’s a good ‘un. (*Until Ektron change the membership user login mechanism*)  

## Preventing Account Lockouts

It may be worth disabling the Login attempts feature of Ektron to prevent the shared accounts from being locked.  Simply set the ek_loginAttemps value to –1 in appSettings:

  
```csharp
add key="ek_loginAttempts" value="-1" />
```