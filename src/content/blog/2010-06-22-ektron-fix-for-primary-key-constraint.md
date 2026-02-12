---
title: 'Ektron: Fix for Primary Key Constraint Error When Creating A User'
description: ''
pubDate: 2010-06-22
tags: ['ektron', 'troubleshooting']
source: hugo
originalUrl: 'https://codifice.dev/posts/2010-06-22-ektron-fix-for-primary-key-constraint/'
heroImage: ../../assets/blog/hero-images/2010-06-22-ektron-fix-for-primary-key-constraint.jpg
---

We’ve recently had an issue with creating users in our Ektron 8.0.1 installation where we could no longer create users.  The error we got was:

> **Error cms_addUser: Error[cms_SetupDefaultNotificationPreferencesForUser]:**

    **Violation of PRIMARY KEY constraint 'PK_notification_preference_default'.**

    **Cannot insert duplicate key in object 'dbo.notification_preference_default'.**

    **[EkUser->AddUserv2_0][UserApi->AddUser]**

Scary Stuff.

Still, the Ektron provided fixes are simple enough (although by no means intuitive!):

#### Simple Fix \* Restart Ektron Windows Services

    * Perform a full eSync (*from Synchronisation screen*)

#### Complex Fix If the above doesn’t work try this

     * Backup database…just incase
    * Remove any entries from **[perform_action]** table with an **action_priority** of **–8**
    * Get the maximum **PreferenceID** from **[notification_preferences_default] **
      > SELECT MAX(PreferenceID) FROM [notification_preferences_default]
    * If the [max_table_number] value in [max_entries] table for [table_name] notification_preference_default is less than the maximum preference id then update it to the maximum value plus two.

To save any potential issues with this, I’ve written a quick SQL script:

```
 
```

**\*NOTE:** All the changes are performed in a transaction (which is rolled back), you’ll need to change the script so that it Commit the results when you’re happy.\*
