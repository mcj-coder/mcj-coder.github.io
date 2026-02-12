---
title: Diagnosing an Ektron eSync Relationship
description: ''
pubDate: 2010-03-23
updatedDate: 2013-02-15
tags: ['ektron', 'troubleshooting']
source: hugo
originalUrl: 'https://codifice.dev/posts/2010-03-23-ektron-esync-error-servicechannel/'
heroImage: ../../assets/blog/hero-images/2010-03-23-ektron-esync-error-servicechannel.jpg
---

---

title: "Diagnosing an Ektron eSync Relationship"
date: 2010-03-23
lastmod: 2013-02-15
draft: false
comments: true
thumbnail: "/coding-gallery"
tags: ["esync"]
series: ["ektron", "troubleshooting"]
authors: ["martincjarvis"]
---Ektron’s eSync service is a great product when it’s working but getting the initial configuration right can be a bit fiddly.  I’ve compiled a quick diagnostic procedure to resolve the most common issues, as well as some of the more common issues.**
Note:**The Ektron Windows Service is usually in: _C:\Program Files\Ektron\EktronWindowsService30._ After any configuration change restart the Ektron Windows Service on every node in the relationship.\*\*

- Restart the Ektron Windows Service on every node within the relationship

- Ensure that the Ektron license is valid for every database within the relationship

- Ensure that you can access \*http://<DOMAINNAME>/workarea/ServerControlWS.asmx*\*\* on each node of the relationship.*In load balanced environments ensure that you test each node explicitly\*.  
  Check that this is the same as the WSPath in the AppSettings

- Check that this is the same in the sitedb.config file in the Ektron Windows Service folder

- Ensure that each node is accessible on port 8732 from the next nodes in the chain  
  From the command line enter ‘telnet _servername_ 8732’ (in Server 2008/Windows 7 you will need to install the telnet client)

- If a connection is successful, you fill see a blank screen press ctrl+c to exit and restart the service you just connected to

- Ensure that the SearchConfigUI tool can properly iterate through all of the IIS websites (it will group results by unique connectionstrings).  
  If the SearchConfigUI fails on an IIS 7 box ensure that IIS 6 Management Tools and Metabase compatability have been installed

- Ensure that all servers are using the same version of Ektron  
  Compare the filesize (and versions) of the following files within the Windows Service folder  
  Ektron.ASM.EktronServices30.exe

- Ektron.ASM.AssetConfig.dll

- Ektron.FileSync.Common.dll

- Ektron.FileSync.Framework.dll

- Ektron.Sync.Communication.dll

- Ektron.Sync.SyncServices.dll

- Ensure that the website is built against the same version of ektron as installed on each of the nodes  
  Check that the common libraries within the website bin folder and windows service folders match

- Check that the website bin directories are the same size on all nodes within the relationship

- Check the Windows Service Error Log for indications of a Transport Layer Error (log files are within the /logs folder)  
  The following errors can indicate a DNS or Proxy issue:  
  The remote server returned an unexpected response: (407) Proxy Authentication Required.

- The request failed with HTTP status 403: Forbidden

- The HTTP request was forbidden with client authentication scheme 'Anonymous'

- Ensure all nodes of the eSync relationship got all counterpart certificates installed (using _Security Configurator_)?  
  The Ektron Windows Service directory will contain all of the _\_SyncClient._ files for each node and the _\_SyncServer._ files for the local machine

- The website root direction should contain the local machines _\_SyncClient._ files and the timestamps should match the equivalent certificates in the Windows Service directory

- Check that local machines certificates are referenced within the **ektron.serviceModel** section of the web.config

- The Ektron.ASM.EktronServices30.exe.config file within the Windows Service folder should contain an element called **publicCertKeys**the has a reference to a client certificate for each server in the eSync relationship.  These should be present on every machine in the relationship (they may be in a different order).

- The website on each machine should have an **AppSetting** setting called **EncodedValue**this should be identical to the value stored within the Service Config file for the same machine.  _If not, copy from the Windows Service config into the AppSetting not vice-versa._

####

Common eSync Errors \***\*(as seen on Synchronisation Progress screen)**

Object Reference Not Set To An Instance of An Object

- Check that the client certificate is present in the root of the website

- Check that local machines certificates are referenced within the ektron.serviceModel\*\* section of the web.config

- Check the WSPath is correct and acccessble

- Ensure the **AppPool**is runnning under the **Network Service** identity

The communication object, System.ServiceModel.Channels.ServiceChannel, cannot be used for communication because it is in the Faulted state

- Restart all services

- Check that licenses are installed and valid

- Check that certificates are installed

- Check the WSPath is correct and acccessble

- Compare the EncodedValue setting in the web.config with the value stored in the Ektron Service config

SyncDatabaseFailed failed with message: Max index do not match. Local index:_X_, Remote index:_Y_

- Decide which server has the correct index (ie if one server has other eSync profiles that are working ok)

- On the server that has the wrong index open the ServerInfo.xml (within the x:\sync folder)

- Change all of the MaxId="X" values to the correct value

- Open the Ektron database for the website with the incorrect index and modify the 'share_index' field of the settings table to the correct value

- Restart all Ektron Windows Services within the relationship

Invalid method invocation. Remote position is NOT staged.

- Stop all [Ektron](http://bit.ly/d0YHh7) Windows Services within the relationship

- Create a copy of the*x*:\sync folder (where _x_ is the drive letter for your workarea website)

- Delete all of the contents of the _x_:\sync folder

- Restart all of the Ektron Windows Services within the relationship

- Rerun synchronisation to rebuild relationship

SyncAssetLibraryFailed failed with message: Object reference not set to an instance of an object.

- Ensure that the ‘StorageLocation’ attribute of ‘DocumentManagerData’ is set to a unique location for each environment (this is within the AssetManagement.config) (if hosted on the same server)

No CMS400.NET sites were found at this location _(when configuring a new relationship)_

- Ensure that the certificates have been correctly installed on each node of the relationship.

The Remote Position is NOT Staged (_when performaning an intitial sync_)

- If a previous relationship existed between the two servers, ensure that the records relating to them have been removed from the [dbo].[scheduler] database table.

- Remove all folders relating to the previous relationship from the x:\sync folder (and in all child folders)

- Try running the sync from the target website

- If problem persists, recreate the target min database – a previous initial sync attempt has semi-populated the target database beyond economical repair.

eSync Status is ‘Running’ Even When There Is No Sync In Progress

- Ensure that all Ektron services related to the website (development machines, build servers, etc, etc) have **_exactly_** the same version.

- Manually set the status to ‘completed’ in the [dbo].[scheduler] table and restart the services.

- If the problem recurs using SQL Profiler to find which server is updating the status (using the additional  HostName column).  The problem  command starts with ‘**exec cms_updateschedulerun**’

Service Not Listening on port 8732 and EktronL2 Event Log contains ‘Service initialized successfully’ and ‘Service stopped successfully’

- Ensure that the workarea can be opened without an error (cmslogin.aspx and /workarea/servercontrolws.asmx)

- Restart service

- Ensure ‘Service started successfully’ message is recorded

SyncDatabaseFailed failed with message: The message with Action '[http://tempuri.org/ISyncService/InitSession'](http://tempuri.org/ISyncService/InitSession%27) cannot be processed at the receiver, due to a ContractFilter mismatch at the EndpointDispatcher

- Ensure that the same esync service version is installed on all nodes of the relationship

Failed to execute the command 'DeleteCommand' for table 'content_folder_tbl' (or similar)

- There’s been an irresolvable conflict, try reversing the conflict policy temporarily and resyncing after a successful sync, the original policy can be restored.

Initial Sync Fails with a Database Constraint Error
The initial sync fails with a constraint error similar to:\*\*

- Violation of PRIMARY KEY constraint 'PK_history_meta_tbl'

- The ALTER TABLE statement conflicted with the FOREIGN KEY constraint "folder_taxonomy_tbl_fk2"

- Violation of PRIMARY KEY constraint 'PK_content_meta_tbl'

- Remove the damaged sync profile ([see below](http://www.blogger.com/blogger.g?blogID=7125820631218721012#removesync))

- Stop users from editing content whilst the _initial_ sync is run

Initial Sync Fails with:  Could not find file ‘….\uploadedFiles\\metaconfig.doc'

- Copy ‘metaconfig.doc’ from /assets into the uploadedFiles and uploadedImages

- Run SearchConfigUI and rebuild catalogs

- Re-run the intitial sync (it should pick up where it left off!).  You shouldn’t need to remove the relationship and rebuild.

Out of Memory Exceptions

- Ensure that all servers have adequate memory

- Reduce the batch size of the Ektron Windows Service by adding \*batchsize=100\*\*\*to the 'DatabaseRuntime’ element within DbSync.config in the Ektron Windows Service folder.

- Ensure that all servers in the relationship have the same batchsize configured.

- Restart Ektron Service

- Rerun sync

####

The system can not find the file specified

- Ensure that the three _\_SyncClient._ files the the local machine

- Ensure that local machines certificates are referenced within the **ektron.serviceModel** section of the web.config

- If the certificates have been accidently deleted, you can copy them from the Ektron Windows Service folder into the root folder.

####

Removing a Damaged eSync Relationship[](http://www.blogger.com/blogger.g?blogID=7125820631218721012)
If an initial sync has failed it can leave a partially populated sync relationship that will need to be removed.  Each time this is run the Max Server index will be incremented.

The procedure to do this is:

- Stop Ektron Service

- Deleting the target database

- Remove the corresponding entries from 'scheduler' table in the sending database

- Remove entries from 'X:\sync\ServerInfo.xml' on both servers

- Remove any folders (for the target environment) in X:\sync folder

- Remote entries from sitedb.conf for connections on both servers

- Remove contents of 'assets' and 'privateAssets' on target server

- Reinstall min database (using Site Setup)

- Recreate indexies using SearchConfigUI on target server

- Configure and run initial sync
