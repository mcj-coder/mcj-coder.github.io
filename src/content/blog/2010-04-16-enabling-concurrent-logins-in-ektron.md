---
title: Enabling Concurrent Logins in Ektron
description: ""
pubDate: 2010-04-16
updatedDate: 2010-04-19
tags: ["ektron"]
source: hugo
originalUrl: "https://codifice.dev/posts/2010-04-16-enabling-concurrent-logins-in-ektron/"
heroImage: ../../assets/blog/hero-images/2010-04-16-enabling-concurrent-logins-in-ektron.jpg
---

For one of our major clients we needed a semi-secure area – you needed credentials to view the content within, but there was only one set of credentials.   This meant that multiple users could access the site concurrently with the same credentials and this is a bit of a problem for the Ektron security model as it’s based around a one session per login model.

  This model is enforced by a unique integer that is generated on login and persisted in the database (in ***[dbo].[users].[login_identification]*** schema fans) with the user account and also stored within a cookie (***‘ecm’***) that is returned to the client.  When an authenticated request comes in, Ektron checks the unique id in the cookie matches the value in the database and if not, your permission checks fail (*but doesn’t log you out – irritatingly you can be browse the site in a semi-authenticated state!*)

  #### The Fix  To get around this we decided to fool the Ektron API into thinking that everyone using the credentials are in fact the same user by hijacking the ‘***ecm***’ cookie and updating the unique id for the provided user id using a HttpModule (*class definition and event wiring omitted for brevity*) : 

  
```
private const string IsMembershipUserKey = "isMembershipUser";
```

This approach doesn’t impact the level of security offered by Ektron as the secondary ASP.NET Authorization cookie is unaffected and all of these values are in the ‘public domain’ as they’re sent – unencrypted- to the client as a cookie.

#### The Optimization

Whilst the above approach worked, it’s not particularly scalable as it adds additional database traffic to every authenticated request.  As this was expected to be a high-usage feature we need to balance keeping track of the latest login id with keeping additional database queries to a minimum.

To do this we’ve taken advantage of the ASP.NET 2.0/SQL Server 2005 SqlCacheDependency (in System.Web.Caching namespace) feature to allow us to cache the latest login id per user and have it evicted whenever it changes (when someone new logs in).  

Fortunately, this is fairly simple to.

Firstly, we needed to prepare the database for QUERY NOTIFICATIONS:

```
GO
```

Next, we need to ensure the SqlDependency.Start method is called using the Ektron.DbConnection connectionstring.  This is best done in the Global.asax Application_Start event:

```
{
```

We could then amend our ‘GetLoginId’ method to implement the caching:

```
{
```

Job’s a good ‘un. (*Until Ektron change the membership user login mechanism*)  

#### Preventing Account Lockouts

It may be worth disabling the Login attempts feature of Ektron to prevent the shared accounts from being locked.  Simply set the ek_loginAttemps value to –1 in appSettings:

```
<add key="ek_loginAttempts" value="-1" />
```