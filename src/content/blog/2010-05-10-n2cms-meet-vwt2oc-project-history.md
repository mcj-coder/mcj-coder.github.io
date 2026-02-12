---
title: 'N2CMS Meet VWT2OC: Project History'
description: ''
pubDate: 2010-05-10
tags: ['n2cms']
source: hugo
originalUrl: 'https://codifice.dev/posts/2010-05-10-n2cms-meet-vwt2oc-project-history/'
heroImage: ../../assets/blog/hero-images/2010-05-10-n2cms-meet-vwt2oc-project-history.jpg
---

Many moons ago (~3 years) I did a bit of family rate development to create a simple website for the Volkswagen Type 2 Owners Club – <www.vwt2oc.com>.  The brief was fairly sparse on detail, they needed a website to manage their memberships and take orders online, a few content manages pages and a basic forum to take over from their previous mainly static site that was looking a little long in the tooth.

The key point at the time was that the system had to be fairly basic simple to use as the club was run by volunteers who wouldn’t have time for learning how more developed solutions worked.  Which suited me as, to be blunt, I wanted to get my teeth into a nice green field project where I didn’t have to work with someone else’s poorly provisioned API (at the time I worked for a very small time agency with a very buggy platform).

So a few busy weekends, I released my first line-in-the-sand website that members could use to renew, had some basic pages, a basic design and a very simple forum.  This was a version of the site with maybe a three month lifespan which could be used as a discussion point to drive more specific requirements.

Tragically (for my wallet) the site has worked well enough for them so no further changes have been needed…….until now!

#### A Change of Focus The next version VWT2OC is going to improve the website and community driven features of the site, there needs to be greater control of the layout of the site, member profiles, image galleries and the forum needs to be more comprehensive and, most importantly, the club has developed the skills to support the extra features.  In short, the mainly administration focused website needs to become the hub for the clubs online activity

So now the challenge is to migrate my previous three year old codebase into a new application and keep the membership administration features and functionality that the club still wants.  It’s my second favourite type of project – brown field…. building something new whilst keeping the best of the old.

#### The Winner of the One Horse Race – N2CMS Essentially, to save myself  the extra work of adapting/extending the basic CMS functionality the site already has I needed a (free) cms system that would do the widget/drag-drop/web-part heavy lifting for me so I could focus on integrating the existing code base in around it.

Unfortunately, whilst there are lots of CMS products out there only one didn’t seem to want to inflict a particular way of working on to me – n2cms.  Or more to the point, I already work (for preference) in a very similar manner as to the guys doing this so adapting to their code shouldn’t be a problem.

_As an added bonus is that there is an established Forum Add in available (based on Yet Another Forum) which should take care of the new forum requirements._
