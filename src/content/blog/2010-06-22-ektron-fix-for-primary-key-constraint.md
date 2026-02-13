---
title: 'Ektron: Fix for Primary Key Constraint Error When Creating A User'
description: 'How to fix the PK_notification_preference_default primary key constraint violation in Ektron 8.0.1 when creating users, with a SQL script to repair the data.'
pubDate: 2010-06-22
tags: ['ektron', 'troubleshooting']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/06/ektron-fix-for-primary-key-constraint.html'
heroImage: ../../assets/blog/hero-images/2010-06-22-ektron-fix-for-primary-key-constraint.jpg
---

We've recently had an issue with creating users in our Ektron 8.0.1 installation where we could no longer create users. The error we got was:

> **Error cms_addUser: Error[cms_SetupDefaultNotificationPreferencesForUser]:**
>
> **Violation of PRIMARY KEY constraint 'PK_notification_preference_default'.**
>
> **Cannot insert duplicate key in object 'dbo.notification_preference_default'.**
>
> **\[EkUser->AddUserv2_0\]\[UserApi->AddUser\]**

Scary Stuff.

Still, the Ektron provided fixes are simple enough (although by no means intuitive!):

#### Simple Fix

- Restart Ektron Windows Services
- Perform a full eSync (_from Synchronisation screen_)

#### Complex Fix

If the above doesn't work try this:

- Backup database…just in case
- Remove any entries from **[perform_action]** table with an **action_priority** of **–8**
- Get the maximum **PreferenceID** from **[notification_preferences_default]**

  > SELECT MAX(PreferenceID) FROM [notification_preferences_default]

- If the [max_table_number] value in [max_entries] table for [table_name] notification_preference_default is less than the maximum preference id then update it to the maximum value plus two.

To save any potential issues with this, I've written a quick SQL script:

```sql
BEGIN TRANSACTION;

/* Rows that need deleting */
SELECT * FROM [perform_action] WHERE [Action_priority]=-8

DELETE FROM [perform_action] WHERE [Action_priority]=-8

DECLARE @MaxPreferenceId BIGINT

SELECT @MaxPreferenceId = MAX([PreferenceId])
FROM [dbo].[notification_preference_default]

/* Before! */
SELECT [table_name], [max_table_number], @MaxPreferenceId AS MaxValue
FROM [max_entries]
WHERE [table_name]='notification_preference_default'

UPDATE [max_entries] SET [max_table_number] = @MaxPreferenceId + 2
WHERE [table_name]='notification_preference_default' AND [max_table_number]<@MaxPreferenceId

/* After! */
SELECT [table_name], [max_table_number], @MaxPreferenceId AS MaxValue
FROM [max_entries]
WHERE [table_name]='notification_preference_default'

/*Change To COMMIT TRANSACTION when happy */
ROLLBACK TRANSACTION;
```

**\*NOTE:** All the changes are performed in a transaction (which is rolled back), you'll need to change the script so that it Commits the results when you're happy.\*
