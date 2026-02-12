---
title: "N2CMS Meet VWT2OC: Day 4 \u2013 Wheel Spinning"
description: ""
pubDate: 2010-06-09
updatedDate: 2010-06-10
tags: ["n2cms"]
source: hugo
originalUrl: "https://codifice.dev/posts/2010-06-09-n2cms-meet-vwt2oc-day-4-wheel-spinning/"
heroImage: ../../assets/blog/hero-images/2010-06-09-n2cms-meet-vwt2oc-day-4-wheel-spinning.jpg
---

---
title: "N2CMS Meet VWT2OC: Day 4 – Wheel Spinning"
date: 2010-06-09
lastmod: 2010-06-10
draft: false
comments: true
thumbnail: "/coding-gallery"
series: ["n2cms"]
authors: ["martincjarvis"]
---Well, Webhost4Life have yet to restore the current site so I can’t work through the develop model/import data/rinse/repeat iterations which I’ll need to ensure a clean migration at the end of the project.  Still at least they’re keeping me updated…and not at all keeping me in the dark with vague promised that someone's working on it.  Bastards.

I guess it’s my fault for trusting them to do all the database backups (like they’re paid to do)…..I should have been doing them myself.

#### 
Still On The Brightside – [n2cms](http://bit.ly/aco4m4) 2.0 has been released!
Ok, so it’s only 7 revisions from my current version so it’s unlikely to have any game changing fixes of features but it does give me an opportunity to test my N2CMS upgrade and deployment mechanism that I devised on [Day 1](http://martinondotnet.blogspot.com/2010/06/n2cms-meet-vwt2oc-day-1-project-setup.html).

In fact, given how mechanical the process is…I’ll script it out.  First step is to merge in the latest changes and merge them into my customised branch (UpdateN2.bat):

```
1: :UpdateN2.bat
```

Apologies for the batching…but sometimes it’s just easier!

Now we need to build the custom version, rebuild the Forum addon and prepare the compiled version ready for deployment (into the VWT2OC project) (BuildN2.bat):

```
1: @@echo off
```

And finally deploy the compiled version into the VWT2OC project (DeployN2.bat):

```
1: :DeployN2.bat
```

And finally one to make it one swift command (Update AndDeployN2.bat):

```
1: :UpdateAndDeployN2.bat
```