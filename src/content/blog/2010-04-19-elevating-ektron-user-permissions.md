---
title: Elevating Ektron User Permissions Safely
description: ""
pubDate: 2010-04-19
tags: ["ektron"]
source: hugo
originalUrl: "https://codifice.dev/posts/2010-04-19-elevating-ektron-user-permissions/"
---

When you’re coding against the Ektron API you frequently find yourself needing to add/modify content as a result of a user action or similar privileged tasks.  To do this you need to impersonate a more privileged user (such as  InternalAdmin) for the duration of the task and then revert to the current users privileges. 

  The approach most frequently quoted on the Ektron dev forums is along the lines of:

  
```
{
```

This works fine (as long as nothing goes wrong) but if an exception is thrown whilst performing the elevated method then there’s a risk that the rest of the request will run using the InternalAdmin permissions.  This could cause havoc!

So a smart approach would be:

```
{
```

This guarantees that the real user is restored in any eventuality (*where the request would be able to continue processing – clearly a finally block won’t protect your code from a meteor strike!*).  But that’s a lot of boiler place code wrapping a single line representing work.  When you actually start doing work it’s going to get very complicated, very quickly!

Through a little IDisposable abuse it’s possible to replace a lot of this boiler plate code with a using statement, so the above code can be neatened up into something like this:

```
{
```

Much neater.

Here’s the ElevatedPermissionScope implementation:

```
using System;
```