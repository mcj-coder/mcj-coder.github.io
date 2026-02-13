---
title: 'Ektron: High Indexing Service Processor Usage (Potential) Fix'
description: 'Diagnosing and fixing high CIDAEMON processor usage in Ektron caused by misconfigured QLFiltXml.xml after upgrading from v7.6.6 to v8.0.1.'
pubDate: 2010-12-16
heroImage: ../../assets/blog/hero-images/2010-12-16-ektron-high-indexing-service-processor.jpg
tags: ['ektron', 'troubleshooting']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/12/ektron-high-indexing-service-processor.html'
---

One of our larger client Ektron sites has had a history of poor performance that always seemed to be related to Indexing immediately after publishing content or syncing content to the live environment. The site heavily uses indexed smart form fields and indexed metadata fields for ordering/sorting lists of content.

The symptoms were:

- High CIDAEMON processor usage (95-100% of a processor core)
- Total Documents to Index in Indexing Service Manager getting stuck
- Indexing Service 'Service Too Busy' exceptions
- Analysing Crash Dumps of the CIDAEMON process shows the 'hot' thread stuck in the QLXFilter.dll module

After performing the basic performance optimisations (removing any unnecessary catalogs such as **_System_** and **_Web_**) there was no real performance improvement and as more content was added (at quite a high rate) the performance issues quickly became outages.

Fortunately, with support from Ektron, we managed to identify (and fix) the potential cause… a misconfiguration in one of the 3rd Party components the indexing service uses to parse the asset XML files. This file can be found in:

- C:\Windows\System32\QLFiltXml.xml
- C:\Windows\SysWOW64\QLFiltXml.xml (64 bit machines only)

Opening these files in IE (and collapsing to just Top Level nodes) showed the default filters only:

_[Original screenshot no longer available]_

There should be a filter for each configured smart form with indexed fields:

_[Original screenshot no longer available]_

You can identify which smart form corresponds to which filter by checking the 'Title' element.

It appears that during the upgrade from v7.6.6->v8.0.1 something went wrong which prevented the Ektron Windows Service from correctly maintaining the configuration file.

#### Repairing the QLXFilter configuration

The steps to repair the file are fairly straightforward (_but make sure Ektron support is at hand for any unforeseen complications!_).

- Delete all Catalogs from the Indexing Service (via Indexing Service Manager)
- Stop the Indexing Service
- Ensure that QLXFilter.dll is properly registered. Open a command prompt and execute:

  > regsvr32 c:\Windows\System32\QLXFilter.dll

- Locate your FriendlyNamesDefinition.txt (check the 'DefaultColumnFile' property value of the `[HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\ContentIndexCommon]` key) and remove any of the non-standard columns (indexed smart form fields, etc).

A list of standard column definitions is:

```text
DateCreated (VT_FILETIME) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktDateCreated
DateModified (VT_FILETIME) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktDateModified
GoLiveDate (VT_FILETIME) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktGoLiveDate
ExpiryDate (VT_FILETIME) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktExpiryDate
ExpiryType (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktExpiryType
TaxCategory (DBTYPE_WSTR | DBTYPE_BYREF) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktTaxCategory
ContentID (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktContentID
ContentLanguage (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktContentLanguage
ContentType (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktContentType
FolderId (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktFolderId
QuickLink (DBTYPE_WSTR | DBTYPE_BYREF) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktQuickLink
FolderName (DBTYPE_WSTR | DBTYPE_BYREF) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktFolderName
MapLongitude (DBTYPE_R8) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktLongitude
MapLatitude (DBTYPE_R8) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktLatitude
MapAddress (DBTYPE_WSTR | DBTYPE_BYREF) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktAddress
EDescription (DBTYPE_WSTR | DBTYPE_BYREF) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktEDescription
Keywords (DBTYPE_WSTR | DBTYPE_BYREF) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktKeywords
Title (DBTYPE_WSTR | DBTYPE_BYREF) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktTitle
MetaInfo (DBTYPE_WSTR | DBTYPE_BYREF) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktMetaInfo
CMSPath (DBTYPE_WSTR | DBTYPE_BYREF) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktCMSPath
CMSSize (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktCMSSize
InPerm (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktInPerm
Searchable (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktSearchable
description (DBTYPE_WSTR | DBTYPE_BYREF) = d5cdd505-2e9c-101b-9397-08002b2cf9ae Ektdescription
MapDate (VT_FILETIME) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktMapDate
ContentID64 (DBTYPE_I8) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktContentID64
FolderId64 (DBTYPE_I8) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktFolderId64
EProductType (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktProductType
ESkuNumber(DBTYPE_WSTR | DBTYPE_BYREF) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktSkuNumber
ESizeMeasure (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktSizeMeasure
EHeight(DBTYPE_R8) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktHeight
EWidth(DBTYPE_R8) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktWidth
ELength(DBTYPE_R8) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktLength
EWeight(DBTYPE_R8) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktWeight
EWeightMeasure (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktWeightMeasure
EUnitsInStock (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktUnitsInStock
EUnitsOnOrder (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktUnitsOnOrder
EReorderLevel (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktReorderLevel
EPurchased (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktPurchased
EImage(DBTYPE_WSTR | DBTYPE_BYREF) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktImage
ECurrencyId (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktCurrencyId
EListPrice (DBTYPE_R8) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktListPrice
ESalePrice (DBTYPE_R8) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktSalePrice
EBuyable (DBTYPE_I4) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktBuyable
xmlconfigid (DBTYPE_I8) = d5cdd505-2e9c-101b-9397-08002b2cf9ae Ektxmlconfigid
DisabledTaxCategory (DBTYPE_WSTR | DBTYPE_BYREF) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktDisabledTaxCategory
```

- Run the Ektron 'SearchConfigUI' utility to 'Create New Catalogs' (after checking all the settings are correct).

- Once 'SearchConfigUI' has passed the 'Updating XML Configuration for XML Content' step then you can ensure that:
  - The QLFiltXml.xml file has the correct filters installed
  - The FriendlyNamesDefinition.txt has your indexed properties restored

- Once 'SearchConfigUI' has completed then you should be able to monitor the Indexing Service scanning the files in a more reasonable and consistent manner.

The performance issue should now be fixed/reduced, hope this helps.
