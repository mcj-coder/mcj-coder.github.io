---
title: "Ektron: SQL Script To Clone A Menu into Multiple Languages"
description: "Technical blog post from 2010-07-27"
pubDate: 2010-07-27
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

I’ve recently needed to have a multilingual menu where the id for each menu item is the same across all languages, this is a bit of a tall order using the workarea as only the root menu item will share the id.

  So I’ve knocked out a quick’n’dirty TSQL script to clone a menu across across several languages whilst maintaining the relevant ids.

```csharp
BEGIN TRANSACTION
```

```csharp



```csharp
CREATE TABLE #NewMenu  (
```

```csharp
[mnu_id] [bigint] NOT NULL,
```

```csharp
[mnu_name] [nvarchar](255) NULL,
```

```csharp
[mnu_description] [nvarchar](255) NULL,
```

```csharp
[folder_id] [bigint] NOT NULL,
```

```csharp
[recursive] [int] NOT NULL,
```

```csharp
[user_id] [bigint] NULL,
```

```csharp
[date_created] [datetime] NOT NULL,
```

```csharp
[last_edit_date] [datetime] NULL,
```

```csharp
[last_edit_lname] [nvarchar](50) NOT NULL,
```

```csharp
[last_edit_fname] [nvarchar](50) NOT NULL,
```

```csharp
[mnu_type] [int] NOT NULL,
```

```csharp
[mnu_link] [nvarchar](255) NULL,
```

```csharp
[template_link] [nvarchar](255) NULL,
```

```csharp
[parent_id] [bigint] NULL,
```

```csharp
[ancestor_id] [bigint] NULL,
```

```csharp
[content_language] [int] NOT NULL,
```

```csharp
[mnu_image] [nvarchar](512) NULL,
```

```csharp
[mnu_image_override] [int] NULL,
```

```csharp
[mnu_to_folders] [nvarchar](512) NULL,
```

```csharp
[mnu_to_templates] [nvarchar](255) NULL,
```

```csharp
[dynamic_replication_method] [int] NULL)
```

```csharp
GO
```

```csharp



```csharp
WITH MenuCTE AS (
```

```csharp
SELECT  *
```

```csharp
FROM [dbo].[menu_tbl]
```

```csharp
WHERE [mnu_id]=60 -- MENUID TO CLONE
```

```csharp
AND [content_language]=2057 -- LANGUAGE OF MENU TO CLONE
```

```csharp
UNION ALL 
```

```csharp
SELECT  [dbo].[menu_tbl].*
```

```csharp
FROM [dbo].[menu_tbl]
```

```csharp
INNER JOIN MenuCTE ON MenuCTE.mnu_id=[dbo].[menu_tbl].[ancestor_id]
```

```csharp
AND MenuCTE.content_language=[dbo].[menu_tbl].content_language
```

```csharp
AND MenuCTE.[ancestor_id]!=[dbo].[menu_tbl].mnu_id
```

```csharp
)
```

```csharp
-- Clone menu
```

```csharp
INSERT INTO #NewMenu([mnu_id]
```

```csharp
,[mnu_name]
```

```csharp
,[mnu_description]
```

```csharp
,[folder_id]
```

```csharp
,[recursive]
```

```csharp
,[user_id]
```

```csharp
,[date_created]
```

```csharp
,[last_edit_date]
```

```csharp
,[last_edit_lname]
```

```csharp
,[last_edit_fname]
```

```csharp
,[mnu_type]
```

```csharp
,[mnu_link]
```

```csharp
,[template_link]
```

```csharp
,[parent_id]
```

```csharp
,[ancestor_id]
```

```csharp
,[content_language]
```

```csharp
,[mnu_image]
```

```csharp
,[mnu_image_override]
```

```csharp
,[mnu_to_folders]
```

```csharp
,[mnu_to_templates]
```

```csharp
,[dynamic_replication_method] )
```

```csharp
SELECT [mnu_id]
```

```csharp
,UPPER([L].[browser_code]) + ' ' + [mnu_name]
```

```csharp
,[mnu_description]
```

```csharp
,[folder_id]
```

```csharp
,[recursive]
```

```csharp
,[user_id]
```

```csharp
,[date_created]
```

```csharp
,[last_edit_date]
```

```csharp
,[last_edit_lname]
```

```csharp
,[last_edit_fname]
```

```csharp
,[mnu_type]
```

```csharp
,[mnu_link]
```

```csharp
,[template_link]
```

```csharp
,[parent_id]
```

```csharp
,[ancestor_id]
```

```csharp
,[L].language_id--[content_language]
```

```csharp
,[mnu_image]
```

```csharp
,[mnu_image_override]
```

```csharp
,[mnu_to_folders]
```

```csharp
,[mnu_to_templates]
```

```csharp
,[dynamic_replication_method] 
```

```csharp
FROM MenuCTE
```

```csharp
INNER JOIN language_type [L] ON [L].language_id IN (1033,1036,1034,2052,1031,1040,1046,1049) -- LANGUAGES TO CLONE INTO
```

```csharp



```csharp
-- Conflicting Rows
```

```csharp
SELECT * FROM #NewMenu [NM]
```

```csharp
INNER JOIN [menu_tbl] [M] ON [NM].mnu_id=[M].mnu_id AND [NM].content_language = [M].content_language
```

```csharp



```csharp
/*  uncomment this block when ready to add new menus! 
```

```csharp
INSERT INTO [menu_tbl]([mnu_id]
```

```csharp
,[mnu_name]
```

```csharp
,[mnu_description]
```

```csharp
,[folder_id]
```

```csharp
,[recursive]
```

```csharp
,[user_id]
```

```csharp
,[date_created]
```

```csharp
,[last_edit_date]
```

```csharp
,[last_edit_lname]
```

```csharp
,[last_edit_fname]
```

```csharp
,[mnu_type]
```

```csharp
,[mnu_link]
```

```csharp
,[template_link]
```

```csharp
,[parent_id]
```

```csharp
,[ancestor_id]
```

```csharp
,[content_language]
```

```csharp
,[mnu_image]
```

```csharp
,[mnu_image_override]
```

```csharp
,[mnu_to_folders]
```

```csharp
,[mnu_to_templates]
```

```csharp
,[dynamic_replication_method] )
```

```csharp
SELECT [mnu_id]
```

```csharp
,[mnu_name]
```

```csharp
,[mnu_description]
```

```csharp
,[folder_id]
```

```csharp
,[recursive]
```

```csharp
,[user_id]
```

```csharp
,[date_created]
```

```csharp
,[last_edit_date]
```

```csharp
,[last_edit_lname]
```

```csharp
,[last_edit_fname]
```

```csharp
,[mnu_type]
```

```csharp
,[mnu_link]
```

```csharp
,[template_link]
```

```csharp
,[parent_id]
```

```csharp
,[ancestor_id]
```

```csharp
,[content_language]
```

```csharp
,[mnu_image]
```

```csharp
,[mnu_image_override]
```

```csharp
,[mnu_to_folders]
```

```csharp
,[mnu_to_templates]
```

```csharp
,[dynamic_replication_method]
```

```csharp
FROM #NewMenu
```

```csharp



```csharp
INSERT INTO [menu_to_item_tbl]([mnu_id]
```

```csharp
,[item_id]
```

```csharp
,[item_type]
```

```csharp
,[item_title]
```

```csharp
,[item_link]
```

```csharp
,[item_target]
```

```csharp
,[order_loc]
```

```csharp
,[item_description]
```

```csharp
,[link_type]
```

```csharp
,[id]
```

```csharp
,[content_language]
```

```csharp
,[item_image]
```

```csharp
,[item_image_override])
```

```csharp
SELECT [MI].[mnu_id]
```

```csharp
,[item_id]
```

```csharp
,[item_type]
```

```csharp
,[item_title]
```

```csharp
,[item_link]
```

```csharp
,[item_target]
```

```csharp
,[order_loc]
```

```csharp
,[item_description]
```

```csharp
,[link_type]
```

```csharp
,[id]
```

```csharp
,[NM].[content_language]
```

```csharp
,[item_image]
```

```csharp
,[item_image_override]
```

```csharp
FROM [dbo].[menu_to_item_tbl] [MI]
```

```csharp
INNER JOIN #NewMenu [NM] ON [MI].mnu_id=[NM].mnu_id 
```

```csharp



```csharp
*/
```

```csharp



```csharp
-- INSERTED ROWS
```

```csharp
SELECT * FROM #NewMenu
```

```csharp



```csharp
SELECT [MI].[mnu_id]
```

```csharp
,[item_id]
```

```csharp
,[item_type]
```

```csharp
,[item_title]
```

```csharp
,[item_link]
```

```csharp
,[item_target]
```

```csharp
,[order_loc]
```

```csharp
,[item_description]
```

```csharp
,[link_type]
```

```csharp
,[id]
```

```csharp
,[NM].[content_language]
```

```csharp
,[item_image]
```

```csharp
,[item_image_override]
```

```csharp
FROM [dbo].[menu_to_item_tbl] [MI]
```

```csharp
INNER JOIN #NewMenu [NM] ON [MI].mnu_id=[NM].mnu_id 
```

```csharp



```csharp
DROP TABLE #NewMenu
```

```csharp



```csharp
ROLLBACK TRANSACTION -- keep in place until 100% happy!
```

```csharp
-- COMMIT TRANSACTION -- remove comment when ready!
```

You’ll notice that this query uses a CTE (needs SQL 2005 and above) to recursively retrieve all of the menu entries.  It’s also wrapped in a transaction (which will ROLLBACK until you modify the script, and I’ve commented out the section that inserts records into your table – you’ll need to uncomment it to make it work.

I’ve added inline comments to highlight what particular magic numbers mean and you’ll need to substitute this for your own.  Cloned menu items are prefixed with the languages two-letter browser code.

Obviously, back up your database first and remember you’re running the script **at your own risk!**
