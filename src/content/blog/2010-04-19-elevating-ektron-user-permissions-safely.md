---
title: "Elevating Ektron User Permissions Safely"
description: "Technical blog post from 2010-04-19"
pubDate: 2010-04-19
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

When you’re coding against the [Ektron](http://bit.ly/d0YHh7) API you frequently find yourself needing to add/modify content as a result of a user action or similar privileged tasks.  To do this you need to impersonate a more privileged user (such as  InternalAdmin) for the duration of the task and then revert to the current users privileges. 

  The approach most frequently quoted on the Ektron dev forums is along the lines of:

          ```

```csharp
/// ContentAPI contentApi = ApiFactory.Create&lt;ContentAPI&gt;();
```

```csharp
/// using (ElevatedPermissionScope adminScope = new ElevatedPermissionScope(contentApi))
```

```csharp
/// {
```

```csharp
///     //Perform Elevated Tasks Here
```

```csharp
///        
```

```csharp
/// }
```

```csharp
/// // perform normal tasks here
```

```csharp
/// 
```

```

```csharp
/// 
```

```csharp
/// As this class manipulates  objects it can only
```

```csharp
/// be used when there is a populated  available.
```

```csharp
/// 
```

```csharp
/// 
```

```csharp
public sealed class ElevatedPermissionScope : IDisposable
```

```csharp
{
```

```csharp
// Required Imports:
```

```csharp
// using Ektron.Cms;            // from Ektron.Cms.Common assembly
```

```csharp
// using Ektron.Cms.Common;     // from Ektron.Cms.Common assembly
```

```csharp



```csharp



```csharp
/// 
```

```csharp
/// Initializes a new instance of the  class and configures
```

```csharp
/// the latent userId to be the Ektron InternalAdmin user
```

```csharp
/// 
```

```csharp
/// The API to elevate
```

```csharp
public ElevatedPermissionScope(CommonApi api)
```

```csharp
: this(api, EkConstants.InternalAdmin, EkConstants.InternalAdmin)
```

```csharp
{ }
```

```csharp



```csharp



```csharp
/// 
```

```csharp
/// Initializes a new instance of the  class and configures
```

```csharp
/// the latent userId to the provided values
```

```csharp
/// 
```

```csharp
/// The API to elevate
```

```csharp
/// The caller id to impersonate
```

```csharp
/// The user id to impersonate
```

```csharp
public ElevatedPermissionScope(CommonApi api, long callerId, long userId)
```

```csharp
: this(api.RequestInformationRef, callerId, userId)
```

```csharp
{ }
```

```csharp



```csharp
/// 
```

```csharp
/// Initializes a new instance of the  class.
```

```csharp
/// 
```

```csharp
/// The request info to configure
```

```csharp
/// The caller id.
```

```csharp
/// The user id.
```

```csharp
public ElevatedPermissionScope(EkRequestInformation requestInfo, long callerId, long userId)
```

```csharp
{
```

```csharp



```csharp
if (requestInfo == null) throw new ArgumentNullException("requestInfo");
```

```csharp
RequestInfo = requestInfo;
```

```csharp
OriginalCallerId = RequestInfo.CallerId;
```

```csharp
OriginalUserId = RequestInfo.UserId;
```

```csharp
RequestInfo.CallerId = callerId;
```

```csharp
RequestInfo.UserId = userId;
```

```csharp
RequestInfo.UniqueId = 0;
```

```csharp
}
```

```csharp



```csharp
#region Internal Properties
```

```csharp



```csharp
/// 
```

```csharp
/// Gets or sets the request info.
```

```csharp
/// 
```

```csharp
/// The request info.
```

```csharp
internal EkRequestInformation RequestInfo { get; set; }
```

```csharp



```csharp
/// 
```

```csharp
/// Gets or sets the original caller id.
```

```csharp
/// 
```

```csharp
/// The original caller id.
```

```csharp
internal long OriginalCallerId { get; set; }
```

```csharp



```csharp
/// 
```

```csharp
/// Gets or sets the original user id.
```

```csharp
/// 
```

```csharp
/// The original user id.
```

```csharp
internal long OriginalUserId { get; set; }
```

```csharp



```csharp
#endregion
```

```csharp



```csharp
#region IDisposable Members
```

```csharp



```csharp
/// 
```

```csharp
/// Restores the original Latent User Id
```

```csharp
/// 
```

```csharp
public void Dispose()
```

```csharp
{
```

```csharp
RequestInfo.CallerId = OriginalCallerId;
```

```csharp
RequestInfo.UserId = OriginalUserId;
```

```csharp
GC.SuppressFinalize(this);
```

```csharp
}
```

```csharp



```csharp
#endregion
```

```csharp
}
```

```csharp



```csharp
}
```