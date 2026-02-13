---
title: 'Ektron: SQL Script To Clone A Menu into Multiple Languages'
description: 'A T-SQL script using a recursive CTE to clone Ektron menu structures across multiple languages whilst maintaining consistent menu IDs.'
pubDate: 2010-07-27
tags: ['ektron']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/07/ektron-sql-script-to-clone-menu-into.html'
heroImage: ../../assets/blog/hero-images/2010-07-27-ektron-sql-script-to-clone-menu-into.jpg
---

I've recently needed to have a multilingual menu where the id for each menu item is the same across all languages, this is a bit of a tall order using the workarea as only the root menu item will share the id.

So I've knocked out a quick'n'dirty TSQL script to clone a menu across several languages whilst maintaining the relevant ids.

```sql
BEGIN TRANSACTION

CREATE TABLE #NewMenu  (
    [mnu_id] [bigint] NOT NULL,
    [mnu_name] [nvarchar](255) NULL,
    [mnu_description] [nvarchar](255) NULL,
    [folder_id] [bigint] NOT NULL,
    [recursive] [int] NOT NULL,
    [user_id] [bigint] NULL,
    [date_created] [datetime] NOT NULL,
    [last_edit_date] [datetime] NULL,
    [last_edit_lname] [nvarchar](50) NOT NULL,
    [last_edit_fname] [nvarchar](50) NOT NULL,
    [mnu_type] [int] NOT NULL,
    [mnu_link] [nvarchar](255) NULL,
    [template_link] [nvarchar](255) NULL,
    [parent_id] [bigint] NULL,
    [ancestor_id] [bigint] NULL,
    [content_language] [int] NOT NULL,
    [mnu_image] [nvarchar](512) NULL,
    [mnu_image_override] [int] NULL,
    [mnu_to_folders] [nvarchar](512) NULL,
    [mnu_to_templates] [nvarchar](255) NULL,
    [dynamic_replication_method] [int] NULL)
GO

WITH MenuCTE AS (
SELECT  *
  FROM [dbo].[menu_tbl]
  WHERE [mnu_id]=60 -- MENUID TO CLONE
  AND [content_language]=2057 -- LANGUAGE OF MENU TO CLONE
  UNION ALL
  SELECT  [dbo].[menu_tbl].*
  FROM [dbo].[menu_tbl]
    INNER JOIN MenuCTE ON MenuCTE.mnu_id=[dbo].[menu_tbl].[ancestor_id]
    AND MenuCTE.content_language=[dbo].[menu_tbl].content_language
    AND MenuCTE.[ancestor_id]!=[dbo].[menu_tbl].mnu_id
)
-- Clone menu
INSERT INTO #NewMenu([mnu_id]
      ,[mnu_name]
      ,[mnu_description]
      ,[folder_id]
      ,[recursive]
      ,[user_id]
      ,[date_created]
      ,[last_edit_date]
      ,[last_edit_lname]
      ,[last_edit_fname]
      ,[mnu_type]
      ,[mnu_link]
      ,[template_link]
      ,[parent_id]
      ,[ancestor_id]
      ,[content_language]
      ,[mnu_image]
      ,[mnu_image_override]
      ,[mnu_to_folders]
      ,[mnu_to_templates]
      ,[dynamic_replication_method] )
SELECT [mnu_id]
      ,UPPER([L].[browser_code]) + ' ' + [mnu_name]
      ,[mnu_description]
      ,[folder_id]
      ,[recursive]
      ,[user_id]
      ,[date_created]
      ,[last_edit_date]
      ,[last_edit_lname]
      ,[last_edit_fname]
      ,[mnu_type]
      ,[mnu_link]
      ,[template_link]
      ,[parent_id]
      ,[ancestor_id]
      ,[L].language_id--[content_language]
      ,[mnu_image]
      ,[mnu_image_override]
      ,[mnu_to_folders]
      ,[mnu_to_templates]
      ,[dynamic_replication_method]
FROM MenuCTE
INNER JOIN language_type [L] ON [L].language_id IN (1033,1036,1034,2052,1031,1040,1046,1049) -- LANGUAGES TO CLONE INTO

-- Conflicting Rows
SELECT * FROM #NewMenu [NM]
INNER JOIN [menu_tbl] [M] ON [NM].mnu_id=[M].mnu_id AND [NM].content_language = [M].content_language

/*  uncomment this block when ready to add new menus!
INSERT INTO [menu_tbl]([mnu_id]
      ,[mnu_name]
      ,[mnu_description]
      ,[folder_id]
      ,[recursive]
      ,[user_id]
      ,[date_created]
      ,[last_edit_date]
      ,[last_edit_lname]
      ,[last_edit_fname]
      ,[mnu_type]
      ,[mnu_link]
      ,[template_link]
      ,[parent_id]
      ,[ancestor_id]
      ,[content_language]
      ,[mnu_image]
      ,[mnu_image_override]
      ,[mnu_to_folders]
      ,[mnu_to_templates]
      ,[dynamic_replication_method] )
SELECT [mnu_id]
      ,[mnu_name]
      ,[mnu_description]
      ,[folder_id]
      ,[recursive]
      ,[user_id]
      ,[date_created]
      ,[last_edit_date]
      ,[last_edit_lname]
      ,[last_edit_fname]
      ,[mnu_type]
      ,[mnu_link]
      ,[template_link]
      ,[parent_id]
      ,[ancestor_id]
      ,[content_language]
      ,[mnu_image]
      ,[mnu_image_override]
      ,[mnu_to_folders]
      ,[mnu_to_templates]
      ,[dynamic_replication_method]
FROM #NewMenu

INSERT INTO [menu_to_item_tbl]([mnu_id]
      ,[item_id]
      ,[item_type]
      ,[item_title]
      ,[item_link]
      ,[item_target]
      ,[order_loc]
      ,[item_description]
      ,[link_type]
      ,[id]
      ,[content_language]
      ,[item_image]
      ,[item_image_override])
SELECT [MI].[mnu_id]
      ,[item_id]
      ,[item_type]
      ,[item_title]
      ,[item_link]
      ,[item_target]
      ,[order_loc]
      ,[item_description]
      ,[link_type]
      ,[id]
      ,[NM].[content_language]
      ,[item_image]
      ,[item_image_override]
FROM [dbo].[menu_to_item_tbl] [MI]
INNER JOIN #NewMenu [NM] ON [MI].mnu_id=[NM].mnu_id

*/

-- INSERTED ROWS
SELECT * FROM #NewMenu

SELECT [MI].[mnu_id]
      ,[item_id]
      ,[item_type]
      ,[item_title]
      ,[item_link]
      ,[item_target]
      ,[order_loc]
      ,[item_description]
      ,[link_type]
      ,[id]
      ,[NM].[content_language]
      ,[item_image]
      ,[item_image_override]
FROM [dbo].[menu_to_item_tbl] [MI]
INNER JOIN #NewMenu [NM] ON [MI].mnu_id=[NM].mnu_id

DROP TABLE #NewMenu

ROLLBACK TRANSACTION -- keep in place until 100% happy!
-- COMMIT TRANSACTION -- remove comment when ready!
```

You'll notice that this query uses a CTE (needs SQL 2005 and above) to recursively retrieve all of the menu entries. It's also wrapped in a transaction (which will ROLLBACK until you modify the script), and I've commented out the section that inserts records into your table – you'll need to uncomment it to make it work.

I've added inline comments to highlight what particular magic numbers mean and you'll need to substitute these for your own. Cloned menu items are prefixed with the language's two-letter browser code.

Obviously, back up your database first and remember you're running the script **at your own risk!**
