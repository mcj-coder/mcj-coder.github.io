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

             1: BEGIN TRANSACTION

       2:  

       3: CREATE TABLE #NewMenu  (

       4:     [mnu_id] [bigint] NOT NULL,

       5:     [mnu_name] [nvarchar](255) NULL,

       6:     [mnu_description] [nvarchar](255) NULL,

       7:     [folder_id] [bigint] NOT NULL,

       8:     [recursive] [int] NOT NULL,

       9:     [user_id] [bigint] NULL,

      10:     [date_created] [datetime] NOT NULL,

      11:     [last_edit_date] [datetime] NULL,

      12:     [last_edit_lname] [nvarchar](50) NOT NULL,

      13:     [last_edit_fname] [nvarchar](50) NOT NULL,

      14:     [mnu_type] [int] NOT NULL,

      15:     [mnu_link] [nvarchar](255) NULL,

      16:     [template_link] [nvarchar](255) NULL,

      17:     [parent_id] [bigint] NULL,

      18:     [ancestor_id] [bigint] NULL,

      19:     [content_language] [int] NOT NULL,

      20:     [mnu_image] [nvarchar](512) NULL,

      21:     [mnu_image_override] [int] NULL,

      22:     [mnu_to_folders] [nvarchar](512) NULL,

      23:     [mnu_to_templates] [nvarchar](255) NULL,

      24:     [dynamic_replication_method] [int] NULL)

      25: GO

      26:  

      27: WITH MenuCTE AS (

      28: SELECT  *

      29:   FROM [dbo].[menu_tbl]

      30:   WHERE [mnu_id]=60 -- MENUID TO CLONE

      31:   AND [content_language]=2057 -- LANGUAGE OF MENU TO CLONE

      32:   UNION ALL 

      33:   SELECT  [dbo].[menu_tbl].*

      34:   FROM [dbo].[menu_tbl]

      35:     INNER JOIN MenuCTE ON MenuCTE.mnu_id=[dbo].[menu_tbl].[ancestor_id]

      36:     AND MenuCTE.content_language=[dbo].[menu_tbl].content_language

      37:     AND MenuCTE.[ancestor_id]!=[dbo].[menu_tbl].mnu_id

      38: )

      39: -- Clone menu

      40: INSERT INTO #NewMenu([mnu_id]

      41:       ,[mnu_name]

      42:       ,[mnu_description]

      43:       ,[folder_id]

      44:       ,[recursive]

      45:       ,[user_id]

      46:       ,[date_created]

      47:       ,[last_edit_date]

      48:       ,[last_edit_lname]

      49:       ,[last_edit_fname]

      50:       ,[mnu_type]

      51:       ,[mnu_link]

      52:       ,[template_link]

      53:       ,[parent_id]

      54:       ,[ancestor_id]

      55:       ,[content_language]

      56:       ,[mnu_image]

      57:       ,[mnu_image_override]

      58:       ,[mnu_to_folders]

      59:       ,[mnu_to_templates]

      60:       ,[dynamic_replication_method] )

      61: SELECT [mnu_id]

      62:       ,UPPER([L].[browser_code]) + ' ' + [mnu_name]

      63:       ,[mnu_description]

      64:       ,[folder_id]

      65:       ,[recursive]

      66:       ,[user_id]

      67:       ,[date_created]

      68:       ,[last_edit_date]

      69:       ,[last_edit_lname]

      70:       ,[last_edit_fname]

      71:       ,[mnu_type]

      72:       ,[mnu_link]

      73:       ,[template_link]

      74:       ,[parent_id]

      75:       ,[ancestor_id]

      76:       ,[L].language_id--[content_language]

      77:       ,[mnu_image]

      78:       ,[mnu_image_override]

      79:       ,[mnu_to_folders]

      80:       ,[mnu_to_templates]

      81:       ,[dynamic_replication_method] 

      82: FROM MenuCTE

      83: INNER JOIN language_type [L] ON [L].language_id IN (1033,1036,1034,2052,1031,1040,1046,1049) -- LANGUAGES TO CLONE INTO

      84:  

      85: -- Conflicting Rows

      86: SELECT * FROM #NewMenu [NM]

      87: INNER JOIN [menu_tbl] [M] ON [NM].mnu_id=[M].mnu_id AND [NM].content_language = [M].content_language

      88:  

      89: /*  uncomment this block when ready to add new menus! 

      90: INSERT INTO [menu_tbl]([mnu_id]

      91:       ,[mnu_name]

      92:       ,[mnu_description]

      93:       ,[folder_id]

      94:       ,[recursive]

      95:       ,[user_id]

      96:       ,[date_created]

      97:       ,[last_edit_date]

      98:       ,[last_edit_lname]

      99:       ,[last_edit_fname]

     100:       ,[mnu_type]

     101:       ,[mnu_link]

     102:       ,[template_link]

     103:       ,[parent_id]

     104:       ,[ancestor_id]

     105:       ,[content_language]

     106:       ,[mnu_image]

     107:       ,[mnu_image_override]

     108:       ,[mnu_to_folders]

     109:       ,[mnu_to_templates]

     110:       ,[dynamic_replication_method] )

     111: SELECT [mnu_id]

     112:       ,[mnu_name]

     113:       ,[mnu_description]

     114:       ,[folder_id]

     115:       ,[recursive]

     116:       ,[user_id]

     117:       ,[date_created]

     118:       ,[last_edit_date]

     119:       ,[last_edit_lname]

     120:       ,[last_edit_fname]

     121:       ,[mnu_type]

     122:       ,[mnu_link]

     123:       ,[template_link]

     124:       ,[parent_id]

     125:       ,[ancestor_id]

     126:       ,[content_language]

     127:       ,[mnu_image]

     128:       ,[mnu_image_override]

     129:       ,[mnu_to_folders]

     130:       ,[mnu_to_templates]

     131:       ,[dynamic_replication_method]

     132: FROM #NewMenu

     133: 

     134: INSERT INTO [menu_to_item_tbl]([mnu_id]

     135:       ,[item_id]

     136:       ,[item_type]

     137:       ,[item_title]

     138:       ,[item_link]

     139:       ,[item_target]

     140:       ,[order_loc]

     141:       ,[item_description]

     142:       ,[link_type]

     143:       ,[id]

     144:       ,[content_language]

     145:       ,[item_image]

     146:       ,[item_image_override])

     147: SELECT [MI].[mnu_id]

     148:       ,[item_id]

     149:       ,[item_type]

     150:       ,[item_title]

     151:       ,[item_link]

     152:       ,[item_target]

     153:       ,[order_loc]

     154:       ,[item_description]

     155:       ,[link_type]

     156:       ,[id]

     157:       ,[NM].[content_language]

     158:       ,[item_image]

     159:       ,[item_image_override]

     160: FROM [dbo].[menu_to_item_tbl] [MI]

     161: INNER JOIN #NewMenu [NM] ON [MI].mnu_id=[NM].mnu_id 

     162: 

     163: */

     164:  

     165: -- INSERTED ROWS

     166: SELECT * FROM #NewMenu

     167:  

     168: SELECT [MI].[mnu_id]

     169:       ,[item_id]

     170:       ,[item_type]

     171:       ,[item_title]

     172:       ,[item_link]

     173:       ,[item_target]

     174:       ,[order_loc]

     175:       ,[item_description]

     176:       ,[link_type]

     177:       ,[id]

     178:       ,[NM].[content_language]

     179:       ,[item_image]

     180:       ,[item_image_override]

     181: FROM [dbo].[menu_to_item_tbl] [MI]

     182: INNER JOIN #NewMenu [NM] ON [MI].mnu_id=[NM].mnu_id 

     183:  

     184: DROP TABLE #NewMenu

     185:  

     186: ROLLBACK TRANSACTION -- keep in place until 100% happy!

     187: -- COMMIT TRANSACTION -- remove comment when ready!

You’ll notice that this query uses a CTE (needs SQL 2005 and above) to recursively retrieve all of the menu entries.  It’s also wrapped in a transaction (which will ROLLBACK until you modify the script, and I’ve commented out the section that inserts records into your table – you’ll need to uncomment it to make it work.

I’ve added inline comments to highlight what particular magic numbers mean and you’ll need to substitute this for your own.  Cloned menu items are prefixed with the languages two-letter browser code.

Obviously, back up your database first and remember you’re running the script **at your own risk!**
