---
title: "Ektron: Safely Impersonating Users within Ektron"
description: ""
pubDate: 2010-07-21
tags: ["ektron", "best practise"]
source: hugo
originalUrl: "https://codifice.dev/posts/2010-07-21-ektron-safely-impersonating-users/"
heroImage: ../../assets/blog/hero-images/2010-07-21-ektron-safely-impersonating-users.jpg
---

I [recently](http://bit.ly/dgQrns) hit an scenario where I needed to impersonate a lesser privileged workarea user to perform some content creation/approvals whilst working within the Approval Chain. 

  My initial attempts leveraged my [ElevatedPermissionScope](http://bit.ly/b4KGXR) class, which failed with an error similar to:

  
```
array.[EkSite-->;GetPermissions(Int,Int,Int,String,[&Collection)]][EkSite->GetPermissions(Int,Int,String,[&Collection]]
```

Now the error is suitable vague that it made diagnosing the issue next to impossible.  After a lot of experimentation with different API calls and approaches (thank you eGandalf), I was ready to throw my toys out of the pram and go home when eventually Ektron support provided the following snippet that seemed to do what I was looking for:

```
Dim userObj As Ektron.Cms.UserData
```

A quick bit of experimentation proved that this would solve my problem, with a couple of side affects:

  * Automatically logging in as a person has some side affects….if the password changes the account could be locked very quickly!

  * At the end of the operation the user would be logged out of the workarea

Well, there’s not much I could do about point 1.  But I could work a bit of IDisposable Scope magic to manage the changes to the ‘ecm’ cookie which stores the login details for the current session. 

#### Introducing the ImpersonationScope

This scope works in a very similar manner to the ElevatedPermissionScope in that you wrap the block of code you want to execute as the impersonated user in a using statement containing the ImpersonationScope object you want to use.

```
{
```

When the executing code leaves scope, the impersonated credentials are automatically replaced with the previous set.

So, without further waffle - here’s the implementation:

```
using System.Web;
```

Enjoy.