---
title: "Ektron: High Indexing Service Processor Usage (Potential) Fix"
description: "Technical blog post from 2010-12-16"
pubDate: 2010-12-16
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

One of our larger client Ektron sites has had a history of poor performance that always seemed to be related to Indexing immediately after publishing content or syncing content to the live environment.  The site heavily uses indexed smart form fields and indexed metadata fields for ordering/sorting lists of content.

  The symptoms were:

     * High CIDAEMON processor usage (95-100% of a processor core)     * Total Documents to Index in Indexing Service Manager getting stuck     * Indexing Service ‘Service Too Busy’ exceptions     * Analysing Crash Dumps of the CIDAEMON process shows the ‘hot’ thread stuck in the QLXFilter.dll module    After performing the basic performance optimisations (removing any unnecessary catalogs such as ***System*** and ***Web***) there was no real performance improvements and as more content was added (at quite a high rate) the performance issues quickly became outages.

  Fortunately, with support from [Ektron](http://bit.ly/d0YHh7), we managed to identify (and fix) the potential cause… a misconfiguration in one of the 3rd Party components the indexing service uses to parse the asset xml files.  This file can be found in:

     * C:\Windows\System32\QLFiltXml.xml     * C:\Windows\SysWOW64\QLFiltXml.xml (64 bit machines only)    Opening these files in IE (and collapsing to just Top Level nodes) showed the default filters only:

  [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiyCDkBdc5qSyHekKJ5djuTdjzXnX6D3I-qgLc-FZUUvaX6BhFfAEKegFApGEud6JkJslFJdjNzmxjhvIlnqeJ7NEkjdXSTAYWwsZhkoLksCdMRLme8wtEuUsYnwUgwimgHjS-Ai8_8/s1600-h/image%5B2%5D.png)

  There should be a filter for each configured smart form with indexed fields:

  [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjFc1p36S8QZJrHWkuJLVd7Kkud9qnouMDFgxe5a0r71YTG_VgmpKIG70sH8pkGH1CidS5s-njbFORt6Jb4uBZOWRwgEj6K_Z9Y9wXTREbrTqx6FpZ9dwNU-4DCB2NVojzUPqUoT2AK/s1600-h/image%5B5%5D.png)

  You can identify which smart form corresponds which filter by checking the ‘Title’ element.

  It appears the during the upgrade from v7.6.6->v8.0.1 something went wrong which prevented the Ektron Windows Service from correctly maintaining the configuration file. 

  Repairing the QLXFilter configuration  The steps to repair the file are fairly straightforward (*but make sure Ektron support is at hand for any unforeseen complications!*).

     * Delete all Catalogs from the Indexing Service (via Indexing Service Manager)     * Stop the Indexing Service     * Ensure that QLXFilter.dll is properly registered.  Open a command prompt and execute      regsvr32 c:\Windows\System32\QLXFilter.dll       * Locate your ‘FriendlyNamesDefinition.txt (check the ‘DefaultColumnFile’ property value of the ‘[HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\ContentIndexCommon]’ key) and remove any of the non-standard  columns (indexed smart form fields, etc).             A list of standard column definitions is:                                           1: [Names]

```csharp
DateCreated (VT_FILETIME) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktDateCreated
```

```csharp
DateModified (VT_FILETIME) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktDateModified
```

```csharp
GoLiveDate (VT_FILETIME) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktGoLiveDate
```

```csharp
ExpiryDate (VT_FILETIME) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktExpiryDate
```

```csharp
ExpiryType (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktExpiryType
```

```csharp
TaxCategory (DBTYPE_WSTR | DBTYPE_BYREF) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktTaxCategory
```

```csharp
ContentID (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktContentID
```

```csharp
ContentLanguage (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktContentLanguage
```

```csharp
ContentType (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktContentType 
```

```csharp
FolderId (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktFolderId
```

```csharp
QuickLink (DBTYPE_WSTR | DBTYPE_BYREF) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktQuickLink
```

```csharp
FolderName (DBTYPE_WSTR | DBTYPE_BYREF) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktFolderName 
```

```csharp
MapLongitude (DBTYPE_R8) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktLongitude 
```

```csharp
MapLatitude (DBTYPE_R8) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktLatitude 
```

```csharp
MapAddress (DBTYPE_WSTR | DBTYPE_BYREF) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktAddress 
```

```csharp
EDescription (DBTYPE_WSTR | DBTYPE_BYREF) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktEDescription 
```

```csharp
Keywords (DBTYPE_WSTR | DBTYPE_BYREF) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktKeywords 
```

```csharp
Title (DBTYPE_WSTR | DBTYPE_BYREF) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktTitle 
```

```csharp
MetaInfo (DBTYPE_WSTR | DBTYPE_BYREF) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktMetaInfo
```

```csharp
CMSPath (DBTYPE_WSTR | DBTYPE_BYREF) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktCMSPath
```

```csharp
CMSSize (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktCMSSize
```

```csharp
InPerm (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktInPerm
```

```csharp
Searchable (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktSearchable
```

```csharp
description  (DBTYPE_WSTR | DBTYPE_BYREF) = d5cdd505-2e9c-101b-9397-08002b2cf9ae  Ektdescription
```

```csharp
MapDate (VT_FILETIME) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktMapDate
```

```csharp
ContentID64 (DBTYPE_I8) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktContentID64
```

```csharp
FolderId64 (DBTYPE_I8) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktFolderId64
```

```csharp
EProductType (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktProductType
```

```csharp
ESkuNumber(DBTYPE_WSTR | DBTYPE_BYREF) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktSkuNumber
```

```csharp
ESizeMeasure (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktSizeMeasure
```

```csharp
EHeight(DBTYPE_R8) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktHeight
```

```csharp
EWidth(DBTYPE_R8) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktWidth
```

```csharp
ELength(DBTYPE_R8) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktLength
```

```csharp
EWeight(DBTYPE_R8) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktWeight
```

```csharp
EWeightMeasure (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktWeightMeasure
```

```csharp
EUnitsInStock (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktUnitsInStock
```

```csharp
EUnitsOnOrder (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktUnitsOnOrder
```

```csharp
EReorderLevel (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktReorderLevel
```

```csharp
EPurchased (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktPurchased
```

```csharp
EImage(DBTYPE_WSTR | DBTYPE_BYREF) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktImage 
```

```csharp
ECurrencyId (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktCurrencyId 
```

```csharp
EListPrice (DBTYPE_R8) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktListPrice 
```

```csharp
ESalePrice (DBTYPE_R8) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktSalePrice 
```

```csharp
EBuyable (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktBuyable 
```

```csharp
xmlconfigid (DBTYPE_I8) = d5cdd505-2e9c-101b-9397-08002b2cf9ae Ektxmlconfigid
```

```csharp
DisabledTaxCategory (DBTYPE_WSTR | DBTYPE_BYREF) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktDisabledTaxCategory
```
      
    
  

  * Run the Ektron ‘SearchConfigUI’ utility to ‘Create New Catalogs’ (after checking all the settings are correct).  

  * Once ‘SearchConfigUI’ has passed the ‘Updating XML Configuration for XML Content’ step then you can ensure that: 
    
      The QLFiltXml.xml file to ensure the correct filters have been installed 

      * The FriendlyNamesDefinition.txt to ensure that your indexed properties have been restored 
    
  

  * Once ‘SearchConfigUI’ has completed then you should be able to monitor the Indexing Service scanning the files in a more reasonable and consistent manner 

The performance issue should now be fixed/reduced, hope this helps.
