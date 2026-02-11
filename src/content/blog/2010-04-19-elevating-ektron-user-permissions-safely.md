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

      18:     /// ContentAPI contentApi = ApiFactory.Create&lt;ContentAPI&gt;();

      19:     /// using (ElevatedPermissionScope adminScope = new ElevatedPermissionScope(contentApi))

      20:     /// {

      21:     ///     //Perform Elevated Tasks Here

      22:     ///        

      23:     /// }

      24:     /// // perform normal tasks here

      25:     /// 
```

      26:     /// 

      27:     /// As this class manipulates  objects it can only

      28:     /// be used when there is a populated  available.

      29:     /// 

      30:     /// 

      31:     public sealed class ElevatedPermissionScope : IDisposable

      32:     {

      33:         // Required Imports:

      34:         // using Ektron.Cms;            // from Ektron.Cms.Common assembly

      35:         // using Ektron.Cms.Common;     // from Ektron.Cms.Common assembly

      36:  

      37:  

      38:         /// 

      39:         /// Initializes a new instance of the  class and configures

      40:         /// the latent userId to be the Ektron InternalAdmin user

      41:         /// 

      42:         /// The API to elevate

      43:         public ElevatedPermissionScope(CommonApi api)

      44:             : this(api, EkConstants.InternalAdmin, EkConstants.InternalAdmin)

      45:         { }

      46:  

      47:  

      48:         /// 

      49:         /// Initializes a new instance of the  class and configures

      50:         /// the latent userId to the provided values

      51:         /// 

      52:         /// The API to elevate

      53:         /// The caller id to impersonate

      54:         /// The user id to impersonate

      55:         public ElevatedPermissionScope(CommonApi api, long callerId, long userId)

      56:             : this(api.RequestInformationRef, callerId, userId)

      57:         { }

      58:  

      59:         /// 

      60:         /// Initializes a new instance of the  class.

      61:         /// 

      62:         /// The request info to configure

      63:         /// The caller id.

      64:         /// The user id.

      65:         public ElevatedPermissionScope(EkRequestInformation requestInfo, long callerId, long userId)

      66:         {

      67:  

      68:             if (requestInfo == null) throw new ArgumentNullException("requestInfo");

      69:             RequestInfo = requestInfo;

      70:             OriginalCallerId = RequestInfo.CallerId;

      71:             OriginalUserId = RequestInfo.UserId;

      72:             RequestInfo.CallerId = callerId;

      73:             RequestInfo.UserId = userId;

      74:             RequestInfo.UniqueId = 0;

      75:         }

      76:  

      77:         #region Internal Properties

      78:  

      79:         /// 

      80:         /// Gets or sets the request info.

      81:         /// 

      82:         /// The request info.

      83:         internal EkRequestInformation RequestInfo { get; set; }

      84:  

      85:         /// 

      86:         /// Gets or sets the original caller id.

      87:         /// 

      88:         /// The original caller id.

      89:         internal long OriginalCallerId { get; set; }

      90:  

      91:         /// 

      92:         /// Gets or sets the original user id.

      93:         /// 

      94:         /// The original user id.

      95:         internal long OriginalUserId { get; set; }

      96:  

      97:         #endregion

      98:  

      99:         #region IDisposable Members

     100:  

     101:         /// 

     102:         /// Restores the original Latent User Id

     103:         /// 

     104:         public void Dispose()

     105:         {

     106:             RequestInfo.CallerId = OriginalCallerId;

     107:             RequestInfo.UserId = OriginalUserId;

     108:             GC.SuppressFinalize(this);

     109:         }

     110:  

     111:         #endregion

     112:     }

     113:  

     114: }
