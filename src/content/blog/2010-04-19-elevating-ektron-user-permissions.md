---
title: Elevating Ektron User Permissions Safely
description: 'How to safely impersonate the Ektron InternalAdmin user using an IDisposable ElevatedPermissionScope wrapper that guarantees permission restoration.'
pubDate: 2010-04-19
tags: ['ektron']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/04/elevating-ektron-user-permissions.html'
heroImage: ../../assets/blog/hero-images/2010-04-19-elevating-ektron-user-permissions.jpg
---

When you're coding against the Ektron API you frequently find yourself needing to add/modify content as a result of a user action or similar privileged tasks. To do this you need to impersonate a more privileged user (such as InternalAdmin) for the duration of the task and then revert to the current user's privileges.

The approach most frequently quoted on the Ektron dev forums is along the lines of:

```csharp
public void DoElevatedPermission()
{
    int currentCallerId;
    int currentUserId;

    Ektron.Cms.CommonApi capi = new Ektron.Cms.CommonApi();
    currentCallerId = capi.RequestInformationRef.CallerId;
    currentUserId = capi.RequestInformationRef.UserId;

    // impersonate InternalAdmin
    capi.RequestInformationRef.CallerId = Ektron.Cms.Common.EkConstants.InternalAdmin;
    capi.RequestInformationRef.UserId = Ektron.Cms.Common.EkConstants.InternalAdmin;

    // Do work that requires elevated/impersonated permissions

    // set back to current user
    capi.RequestInformationRef.CallerId = currentCallerId;
    capi.RequestInformationRef.UserId = currentUserId;
}
```

This works fine (as long as nothing goes wrong) but if an exception is thrown whilst performing the elevated method then there's a risk that the rest of the request will run using the InternalAdmin permissions. This could cause havoc!

So a smart approach would be:

```csharp
public void DoElevatedPermission()
{
    int currentCallerId;
    int currentUserId;
    Ektron.Cms.CommonApi capi = new Ektron.Cms.CommonApi();
    try
    {
        currentCallerId = capi.RequestInformationRef.CallerId;
        currentUserId = capi.RequestInformationRef.UserId;

        // impersonate InternalAdmin
        capi.RequestInformationRef.CallerId = Ektron.Cms.Common.EkConstants.InternalAdmin;
        capi.RequestInformationRef.UserId = Ektron.Cms.Common.EkConstants.InternalAdmin;

        // Do work that requires elevated/impersonated permissions
    }
    finally
    {
        // set back to current user
        capi.RequestInformationRef.CallerId = currentCallerId;
        capi.RequestInformationRef.UserId = currentUserId;
    }
}
```

This guarantees that the real user is restored in any eventuality (_where the request would be able to continue processing – clearly a finally block won't protect your code from a meteor strike!_). But that's a lot of boiler plate code wrapping a single line representing work. When you actually start doing work it's going to get very complicated, very quickly!

Through a little IDisposable abuse it's possible to replace a lot of this boiler plate code with a using statement, so the above code can be neatened up into something like this:

```csharp
public void DoElevatedPermission()
{
    Ektron.Cms.CommonApi contentApi = new Ektron.Cms.CommonApi();
    using (ElevatedPermissionScope adminScope = new ElevatedPermissionScope(contentApi))
    {
        // Perform Elevated Tasks Here
    }
    // normal permissions have been restored
}
```

Much neater.

Here's the ElevatedPermissionScope implementation:

```csharp
using System;
using Ektron.Cms;
using Ektron.Cms.Common;

namespace MartinOnDotNet.Ektron.Security
{
    /// <summary>
    /// Utility class used to wrap a set of operations that must
    /// be done within a more elevated security context than the current user.
    /// </summary>
    public sealed class ElevatedPermissionScope : IDisposable
    {
        public ElevatedPermissionScope(CommonApi api)
            : this(api, EkConstants.InternalAdmin, EkConstants.InternalAdmin)
        { }

        public ElevatedPermissionScope(CommonApi api, long callerId, long userId)
            : this(api.RequestInformationRef, callerId, userId)
        { }

        public ElevatedPermissionScope(EkRequestInformation requestInfo, long callerId, long userId)
        {
            if (requestInfo == null) throw new ArgumentNullException("requestInfo");
            RequestInfo = requestInfo;
            OriginalCallerId = RequestInfo.CallerId;
            OriginalUserId = RequestInfo.UserId;
            RequestInfo.CallerId = callerId;
            RequestInfo.UserId = userId;
            RequestInfo.UniqueId = 0;
        }

        internal EkRequestInformation RequestInfo { get; set; }
        internal long OriginalCallerId { get; set; }
        internal long OriginalUserId { get; set; }

        public void Dispose()
        {
            RequestInfo.CallerId = OriginalCallerId;
            RequestInfo.UserId = OriginalUserId;
            GC.SuppressFinalize(this);
        }
    }
}
```
