---
title: 'Infrastructure: Replacing a Dead RAID 5 Drive in QNAP NAS'
description: ''
pubDate: 2010-10-30
tags: ['devops']
source: hugo
originalUrl: 'https://codifice.dev/posts/2010-10-30-infrastructure-replacing-dead-raid-5/'
heroImage: ../../assets/blog/hero-images/2010-10-30-infrastructure-replacing-dead-raid-5.jpg
---

It’s been a while since I last posted – it’s been crazy busy at work – and this is a completely non-.Net related post (**_sorry_**).  However, like many of you (I’m  sure) I’ve got a personal SVN repository (where I keep my .Net code, so there is a tenuous link!) which is hosted on my QNAP 419P NAS Drive on a RAID5 volume across 4 Hot Swappable Disks.

For the non-technical, this is a little whizzy box with tonnes of space and can withstand a single complete hard disk failure without loosing data.

Recently one of the disk drives failed in the volume (completely dead) and whilst my data’s intact and everything carried on as best as it could, I needed to replace the drive.  I was completely under the impression that this operation went along the lines of:

     * Remove Dead Drive
    * Insert New Disk
    * Click ‘Repair’ on RAID volume in config
    * Wait for repair to complete
    * PROFIT!!

And with most corporate RAID solutions that’s exactly what happens.  However, after completing Step 2 of my plan I discovered that the QNAP didn’t recognise the new disk at all and the Repair button was greyed out.

WTF?!?

Well, it turns out the QNAP’s software raid manager can’t automatically recover from actual dead disks, only disks incorrectly flagged as faulty.  Genius.

After a bit of Googling, I found that ‘all’ I needed to do was duplicate the partition table from one of the remaining live disks to the new disk and hopefully the low-level raid manager will them automatically rebuild the array.

So the actual steps are:

     * Replace disk with new one
    * SSH into QNAP box with Administrator priveleges
    * Get the partition settings from fdisk (type: ***fdisk –l***)
    * Identify a live disk in the output, in my case these were /dev/sda, /dev/sdb, /dev/sdc  (there should also have been /dev/sdd – but that was the dead one):         Device Boot      Start         End      Blocks   Id  System

/dev/sdc1   \*           1          66      530113+  83  Linux  
/dev/sdc2              67         132      530145   82  Linux swap / Solaris  
/dev/sdc3             133      243138  1951945695   83  Linux  
/dev/sdc4          243139      243200      498015   83  Linux

    * Now to replicate this config to the new drive (/dev/sdd).  My commands are in ***bold italics***:

[~] # ***fdisk /dev/sdd  
***Device contains neither a valid DOS partition table, nor Sun, SGI or OSF disklabel  
Building a new DOS disklabel. Changes will remain in memory only,  
until you decide to write them. After that, of course, the previous  
content won't be recoverable.

The number of cylinders for this disk is set to 243201.  
There is nothing wrong with that, but this is larger than 1024,  
and could in certain setups cause problems with:

1.  software that runs at boot time (e.g., old versions of LILO)
2.  booting and partitioning software from other OSs  
       (e.g., DOS FDISK, OS/2 FDISK)  
    Warning: invalid flag 0x0000 of partition table 4 will be corrected by w(rite)

          Command (m for help): ***n

    ***Command action  
       e   extended  
       p   primary partition (1-4)  
    ***p  
    ***Partition number (1-4):***1  
    ***First cylinder (1-243201, default 1):***1**  
    *Using default value 1  
    Last cylinder or +size or +sizeM or +sizeK (1-243201, default 243201):***66\*\*\*

          Command (m for help): ***n

    ***Command action  
       e   extended  
       p   primary partition (1-4)  
    ***p  
    ***Partition number (1-4):***2  
    ***First cylinder (67-243201, default 67):***67  
    ***Using default value 67  
    Last cylinder or +size or +sizeM or +sizeK (67-243201, default 243201):***132\*\*\*

          Command (m for help): ***n

    ***Command action  
       e   extended  
       p   primary partition (1-4)  
    ***p  
    ***Partition number (1-4):***3  
    **\*First cylinder (133-243201, default 133):\_**133**\_  
    Using default value 133  
    Last cylinder or +size or +sizeM or +sizeK (133-243201, default 243201):\***243138\*\*\*

          Command (m for help): n

    Command action  
       e   extended  
       p   primary partition (1-4)  
    **_p_**  
    Selected partition ***4  
    ***First cylinder (243139-243201, default 243139):**\_243139\_\_\_  
    Using default value 243139  
    Last cylinder or +size or +sizeM or +sizeK (243139-243201, default 243201): **_243200_\*\*

        * Next to mark /dev/sdd1 as bootable Command (m for help): ***a***

    Partition number (1-4): **_1_**

        * Then change partition 2 to ‘Linux Swap / Solaris’ format Command (m for help): ***t

    **\*Partition number (1-4): \_**2***  
    Hex code (type L to list codes): ***82\*\*\_  
    Changed system type of partition 2 to 82 (Linux swap / Solaris)
    - Finally, save the new partition table Command (m for help): \*\*\*w  
      \*\*\*The partition table has been altered!

          * Ctrl-C to exit fdisk
          * Eject the new disk and reinsert
          * The new disk is recognised and rebuilding begins
          * Wait for rebuild to complete
          * PROFIT!!

    I’m aware that on a full linux distribution there are better approaches than this, but on the QNAP with it’s subset of commands this gets the job done reasonably well.
