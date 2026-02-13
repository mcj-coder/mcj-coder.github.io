---
title: 'Secure Your Website, Put Bouncers at the Door (Part 1)'
description: 'Using a nightclub analogy to explain website security layers - from input validation and authentication to HTTPS and robots.txt, and why low-profile security measures matter most.'
pubDate: 2010-04-04
tags: ['best-practise']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/04/secure-your-website-put-bouncers-at.html'
heroImage: ../../assets/blog/hero-images/2010-04-04-secure-your-website-put-bouncers-at.jpg
---

A good website is much like a nightclub, we want the general population to be able to use the facilities freely (_or for a nominal fee!_) but we don't want the trouble makers that will spoil it for everyone. Pushing the analogy further, nightclubs have a few different types of security in place:

| **Visibility**   | **Implementation** | **Mitigates**                                     |
| ---------------- | ------------------ | ------------------------------------------------- |
| **High Profile** | Bouncers           | Filter out trouble makers at point of entry       |
|                  | Internal Security  | Eject people that become troublemakers            |
| **Low Profile**  | Bars on Windows    | Prevent people sneaking in                        |
|                  | Alarmed Exits      |                                                   |
|                  | Metal Detectors    | Passively check for people about to cause trouble |
|                  | Security Cameras   |                                                   |

As web developers we have a very similar set of tools that we can use to secure our website:

| **Visibility**   | **Implementation**                                       | **Mitigates**                                 |
| ---------------- | -------------------------------------------------------- | --------------------------------------------- |
| **High Profile** | Input Validation _(Metal Detectors)_                     | Filters out bad information early             |
|                  | Authentication _(Bouncer)_                               | Only allow members on to the site             |
|                  | HTTPS _(Bars on Windows)_                                | Prevent people monitoring user traffic        |
| **Low Profile**  | Input Sanitation _(Security Cameras)_                    | Filter out bad requests                       |
|                  | Robots.txt _(Bars on Windows)_                           | Hide sensitive pages from popular web spiders |
|                  | Network Segregation and Infrastructure _(Alarmed Exits)_ | Control access to sensitive information       |

There's lots of information out there about configuring the High Profile security measures and Network Segregation and Infrastructure is best implemented by the network specialists (it doesn't hurt to understand the basics) and these things are generally well implemented.

As web developers, we have to worry about the things that happen inside the website, making sure that the front entrance is the only way in and limiting the damage if someone does get in. So our implementation priorities for any website have to be:

- **Input Validation** – every piece of information that comes from the client is suspect and should be validated, this includes query string, form fields (even hidden ones!) and cookie values
- **Input Sanitation** - ensure that any injected SQL or XSS script is neutralised
- **Robots.txt** – it may not be a bullet proof defence if someone's targeting your site, but at least you can minimise drive-by hacking through Google!
- **Authentication** – allow only authorised users through
- **HTTPS** – secure the traffic from client to server

In Part 2, I'll go over some of the best practises that we can follow, as developers, to make our website secure.
