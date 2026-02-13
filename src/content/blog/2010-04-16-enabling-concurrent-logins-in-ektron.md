---
title: Enabling Concurrent Logins in Ektron
description: 'How to enable concurrent logins with shared credentials in Ektron CMS by hijacking the ecm cookie via an HttpModule, with SqlCacheDependency optimization.'
pubDate: 2010-04-16
updatedDate: 2010-04-19
tags: ['ektron']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/04/enabling-concurrent-logins-in-ektron.html'
heroImage: ../../assets/blog/hero-images/2010-04-16-enabling-concurrent-logins-in-ektron.jpg
---

For one of our major clients we needed a semi-secure area – you needed credentials to view the content within, but there was only one set of credentials. This meant that multiple users could access the site concurrently with the same credentials and this is a bit of a problem for the Ektron security model as it's based around a one session per login model.

This model is enforced by a unique integer that is generated on login and persisted in the database (in **_[dbo].[users].[login_identification]_** schema fans) with the user account and also stored within a cookie (**_'ecm'_**) that is returned to the client. When an authenticated request comes in, Ektron checks the unique id in the cookie matches the value in the database and if not, your permission checks fail (_but doesn't log you out – irritatingly you can browse the site in a semi-authenticated state!_)

#### The Fix

To get around this we decided to fool the Ektron API into thinking that everyone using the credentials are in fact the same user by hijacking the '**_ecm_**' cookie and updating the unique id for the provided user id using an HttpModule (_class definition and event wiring omitted for brevity_):

```csharp
private const string IsMembershipUserKey = "isMembershipUser";

private void OnBeginRequest(object sender, EventArgs e)
{
    HttpContext context = HttpContext.Current;
    if (context == null || context.Request == null) return;

    HttpCookie ecmCookie = context.Request.Cookies["ecm"];
    if (ecmCookie == null) return;

    string userId = ecmCookie["user_id"];
    string username = ecmCookie["username"];
    if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(username)) return;

    int loginId = GetLoginId(userId);
    if (loginId <= 0) return;

    ecmCookie["unique_id"] = loginId.ToString(CultureInfo.InvariantCulture);
    ecmCookie["site_id"] = loginId.ToString(CultureInfo.InvariantCulture);
    context.Response.Cookies.Set(ecmCookie);
}
```

This approach doesn't impact the level of security offered by Ektron as the secondary ASP.NET Authorization cookie is unaffected and all of these values are in the 'public domain' as they're sent – unencrypted - to the client as a cookie.

#### The Optimization

Whilst the above approach worked, it's not particularly scalable as it adds additional database traffic to every authenticated request. As this was expected to be a high-usage feature we need to balance keeping track of the latest login id with keeping additional database queries to a minimum.

To do this we've taken advantage of the ASP.NET 2.0/SQL Server 2005 SqlCacheDependency (in System.Web.Caching namespace) feature to allow us to cache the latest login id per user and have it evicted whenever it changes (when someone new logs in).

Fortunately, this is fairly simple to do.

Firstly, we needed to prepare the database for QUERY NOTIFICATIONS:

```sql
ALTER DATABASE [DatabaseName] SET ENABLE_BROKER WITH ROLLBACK IMMEDIATE;
GO
```

Next, we need to ensure the SqlDependency.Start method is called using the Ektron.DbConnection connection string. This is best done in the Global.asax Application_Start event:

```csharp
protected void Application_Start(object sender, EventArgs e)
{
    string connectionString = ConfigurationManager.ConnectionStrings["Ektron.DbConnection"].ConnectionString;
    SqlDependency.Start(connectionString);
}
```

We could then amend our 'GetLoginId' method to implement the caching:

```csharp
private int GetLoginId(string userId)
{
    string cacheKey = "LoginId_" + userId;
    int? cachedId = HttpRuntime.Cache[cacheKey] as int?;
    if (cachedId.HasValue) return cachedId.Value;

    string connectionString = ConfigurationManager.ConnectionStrings["Ektron.DbConnection"].ConnectionString;
    using (SqlConnection conn = new SqlConnection(connectionString))
    {
        SqlCommand cmd = new SqlCommand(
            "SELECT login_identification FROM [dbo].[users] WHERE user_id = @userId", conn);
        cmd.Parameters.AddWithValue("@userId", userId);

        SqlCacheDependency dependency = new SqlCacheDependency(cmd);
        conn.Open();
        object result = cmd.ExecuteScalar();
        int loginId = result != null ? Convert.ToInt32(result) : 0;

        HttpRuntime.Cache.Insert(cacheKey, loginId, dependency);
        return loginId;
    }
}
```

Job's a good 'un. (_Until Ektron change the membership user login mechanism_)

#### Preventing Account Lockouts

It may be worth disabling the Login attempts feature of Ektron to prevent the shared accounts from being locked. Simply set the ek_loginAttempts value to -1 in appSettings:

```xml
<add key="ek_loginAttempts" value="-1" />
```
