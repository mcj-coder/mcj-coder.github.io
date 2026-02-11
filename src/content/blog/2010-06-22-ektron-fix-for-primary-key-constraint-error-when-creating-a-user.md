---
title: "Ektron: Fix for Primary Key Constraint Error When Creating A User"
description: "Technical blog post from 2010-06-22"
pubDate: 2010-06-22
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

We’ve recently had an issue with creating users in our [Ektron](http://bit.ly/d0YHh7) 8.0.1 installation where we could no longer create users.  The error we got was:

     **Error cms_addUser: Error[cms_SetupDefaultNotificationPreferencesForUser]:**

    **Violation of PRIMARY KEY constraint 'PK_notification_preference_default'.**

    **Cannot insert duplicate key in object 'dbo.notification_preference_default'.**

    **[EkUser->AddUserv2_0][UserApi->AddUser]** 

   Scary Stuff.

  Still, the Ektron provided fixes are simple enough (although by no means intuitive!):

  
## Simple Fix
     * Restart Ektron Windows Services     * Perform a full eSync (*from Synchronisation screen*)    
## Complex Fix
  If the above doesn’t work try this:

     * Backup database…just incase     * Remove any entries from **[perform_action]** table with an **action_priority** of **–8**     * Get the maximum **PreferenceID** from **[notification_preferences_default] **            SELECT MAX(PreferenceID) FROM [notification_preferences_default]       * If the [max_table_number] value in [max_entries] table for [table_name] notification_preference_default is less than the maximum preference id then update it to the maximum value plus two.   To save any potential issues with this, I’ve written a quick SQL script:

```csharp
BEGIN TRANSACTION;
```

```csharp



```csharp
/* Rows that need deleting */
```

```csharp
SELECT * FROM [perform_action] WHERE [Action_priority]=-8
```

```csharp



```csharp
DELETE FROM [perform_action] WHERE [Action_priority]=-8
```

```csharp



```csharp
DECLARE @MaxPreferenceId BIGINT
```

```csharp



```csharp
SELECT @MaxPreferenceId = MAX([PreferenceId])
```

```csharp
FROM [dbo].[notification_preference_default]
```

```csharp



```csharp
/* Before! */
```

```csharp
SELECT [table_name], [max_table_number], @MaxPreferenceId AS MaxValue
```

```csharp
FROM [max_entries]
```

```csharp
WHERE [table_name]='notification_preference_default'
```

```csharp



```csharp
UPDATE [max_entries] SET [max_table_number] = @MaxPreferenceId + 2
```

```csharp
WHERE [table_name]='notification_preference_default' AND [max_table_number]
```

```csharp



```csharp
/* After! */
```

```csharp
SELECT [table_name], [max_table_number], @MaxPreferenceId AS MaxValue
```

```csharp
FROM [max_entries]
```

```csharp
WHERE [table_name]='notification_preference_default'
```

```csharp



```csharp
/*Change To COMMIT TRANSACTION when happy */  
```

```csharp
ROLLBACK TRANSACTION;
```

***NOTE:** All the changes are performed in a transaction (which is rolled back), you’ll need to change the script so that it Commit the results when you’re happy.*
