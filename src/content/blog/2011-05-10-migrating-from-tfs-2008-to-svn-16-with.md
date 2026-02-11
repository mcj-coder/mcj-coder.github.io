---
title: Migrating from TFS 2008 to SVN 1.6 with tfs2svn
description: ""
pubDate: 2011-05-10
tags: ["devops"]
source: hugo
originalUrl: "https://codifice.dev/posts/2011-05-10-migrating-from-tfs-2008-to-svn-16-with/"
---

This is tricky because [tfs2svn](http://bit.ly/jQElgA) stopped being updated when subversion 1.4 ruled the roost.  

  Here are the steps that I took:

     * Have a subversion repository ready to receive the project (including ‘pre-revprop-change’ hook – mine is a simple ‘exit 0’ batch file)
    * Install TortoiseSVN 1.6
    * Download Collabnets command line client for svn 1.6 (svn-win32-1.6.15.zip)
    * Install [tfs2svn](http://sourceforge.net/projects/tfs2svn/) 1.1 (http://sourceforge.net/projects/tfs2svn/files/tfs2svn/1.1/tfs2svn.setup.msi/download) on my development VM
    * Extract the svn-win32 command line client and copy the contents of ‘bin’ folder over the contents in ‘C:\Program Files (x86)\Kevin Colyar\tfs2svn\libs\svn-win32-1.4.6\bin’
    * Checkout revision 104 of tfs2svn using TortoiseSVN (repository url: https://tfs2svn.svn.sourceforge.net/svnroot/tfs2svn)
    * Save the patch from http://sourceforge.net/projects/tfs2svn/forums/forum/772710/topic/4510118 as tfs2svn_update.patch (make sure all &amp; are converted to & and all links have any <a> tags removed)
    * Using TortoiseSVN apply the patch to the trunk branch.  All the files should be matched successfully.  If not check for stray html encoding/links in patch file.
    * Open the tfs2svn.sln from trunk (upgrading the solution if using VS2008)
    * Build ‘tfs2svn.WinForms’ and copy the output over the contents of ‘C:\Program Files (x86)\Kevin Colyar\tfs2svn’ *apart from the ‘libs’ folder*.
    * Launch tfs2svn and fill in the fairly straightforward form and hit convert!
   tfs2svn should now spin through your TFS repository and migrate each changeset to subversion (keeping the history).  The few errors that I encountered (after applying the patch!) were easy to fix as they were missing folder (from svn) issues when a changeset included a branch or merge operation.  Simply creating and committing the missing folder  allowed the migration to continue.