---
title: Preventing spamming from a mail forwarding address
description: ""
pubDate: 2011-07-08
tags: ["devops"]
source: hugo
originalUrl: "https://codifice.dev/posts/2011-07-08-preventing-spamming-from-mail/"
heroImage: ../../assets/blog/hero-images/2011-07-08-preventing-spamming-from-mail.jpg
---

My webhosting company (arvixe) recently suspended my account due to a flood of ‘Inbox Full’ emails being sent to a mail forwarding alias (which then forwarded to the same accounts, which were full – D’Oh!).  After a bit of investigation it turns out some kind soul has been spoofing emails from that account.

  Apparently, there’s a nice little DNS entry that you can add so that email servers can validate that the emails have only been sent from recognised servers.  There’s a sweet little wizard which walks you through generating the record: 

  [http://www.microsoft.com/mscorp/safety/content/technologies/senderid/wizard/default.aspx](http://www.microsoft.com/mscorp/safety/content/technologies/senderid/wizard/default.aspx)