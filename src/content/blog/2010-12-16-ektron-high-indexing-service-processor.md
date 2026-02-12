---
title: 'Ektron: High Indexing Service Processor Usage (Potential) Fix'
description: ''
pubDate: 2010-12-16
heroImage: ../../assets/blog/hero-images/2010-12-16-ektron-high-indexing-service-processor.jpg

tags: ['ektron', 'troubleshooting']
source: hugo
originalUrl: 'https://codifice.dev/posts/2010-12-16-ektron-high-indexing-service-processor/'
---

One of our larger client Ektron sites has had a history of poor performance that always seemed to be related to Indexing immediately after publishing content or syncing content to the live environment.  The site heavily uses indexed smart form fields and indexed metadata fields for ordering/sorting lists of content.

The symptoms were:

     * High CIDAEMON processor usage (95-100% of a processor core)
    * Total Documents to Index in Indexing Service Manager getting stuck
    * Indexing Service ‘Service Too Busy’ exceptions
    * Analysing Crash Dumps of the CIDAEMON process shows the ‘hot’ thread stuck in the QLXFilter.dll module

After performing the basic performance optimisations (removing any unnecessary catalogs such as **_System_** and **_Web_**) there was no real performance improvements and as more content was added (at quite a high rate) the performance issues quickly became outages.

Fortunately, with support from Ektron, we managed to identify (and fix) the potential cause… a misconfiguration in one of the 3rd Party components the indexing service uses to parse the asset xml files.  This file can be found in:

     * C:\Windows\System32\QLFiltXml.xml
    * C:\Windows\SysWOW64\QLFiltXml.xml (64 bit machines only)

Opening these files in IE (and collapsing to just Top Level nodes) showed the default filters only:

[](http://lh5.ggpht.com/_Vz_CYzsjR7M/TQp3cpDQc0I/AAAAAAAAAHA/OBNVB_oyMMs/s1600-h/image%5B2%5D.png)

There should be a filter for each configured smart form with indexed fields:

[](http://lh4.ggpht.com/_Vz_CYzsjR7M/TQp3dYMAnvI/AAAAAAAAAHI/S1HQ3RSiWW0/s1600-h/image%5B5%5D.png)

You can identify which smart form corresponds which filter by checking the ‘Title’ element.

It appears the during the upgrade from v7.6.6->v8.0.1 something went wrong which prevented the Ektron Windows Service from correctly maintaining the configuration file.

Repairing the QLXFilter configuration The steps to repair the file are fairly straightforward (_but make sure Ektron support is at hand for any unforeseen complications!_).

     * Delete all Catalogs from the Indexing Service (via Indexing Service Manager)
    * Stop the Indexing Service
    * Ensure that QLXFilter.dll is properly registered.  Open a command prompt and execute      > regsvr32 c:\Windows\System32\QLXFilter.dll
    * Locate your ‘FriendlyNamesDefinition.txt (check the ‘DefaultColumnFile’ property value of the ‘[HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\ContentIndexCommon]’ key) and remove any of the non-standard  columns (indexed smart form fields, etc).

A list of standard column definitions is:

```
DateCreated (VT_FILETIME) = d5cdd505-2e9c-101b-9397-08002b2cf9ae EktDateCreated
```

- Run the Ektron ‘SearchConfigUI’ utility to ‘Create New Catalogs’ (after checking all the settings are correct).

- Once ‘SearchConfigUI’ has passed the ‘Updating XML Configuration for XML Content’ step then you can ensure that:

  The QLFiltXml.xml file to ensure the correct filters have been installed
  - The FriendlyNamesDefinition.txt to ensure that your indexed properties have been restored

- Once ‘SearchConfigUI’ has completed then you should be able to monitor the Indexing Service scanning the files in a more reasonable and consistent manner

The performance issue should now be fixed/reduced, hope this helps.
