---
title: Educating Clients About The Way the Web Works
description: 'Why large corporate clients need educating about web conventions for multilingual, multi-branded websites - and how their wants often conflict with their needs.'
pubDate: 2010-04-05
tags: ['seo']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/04/educating-clients-about-way-web-works.html'
heroImage: ../../assets/blog/hero-images/2010-04-05-educating-clients-about-way-web-works.jpg
---

Craig's pointed out an interesting discussion about managing client expectations (that kicked off from a very preachy design article) around the final display of a website across browsers. This sort of discussion has been around for a while now and I think clients are starting to wise up to browser display issues.

Personally, I'm fairly indifferent about how most websites look provided they behave as I expect and don't actively get in my way. I expect that most users of websites feel pretty much the same way although web designers will probably disagree. Where these design issues are very obvious to end users, website implementation issues aren't. So the general level of understanding from clients is quite low, particularly when it comes to localized websites.

#### Multilingual _and_ Multi-branded

For large corporate clients I've found that the client wants to represent their internal subdivisions and have similar general requirements:

- A global site with:
  - Micro sites for territories (country sites) with English copy with native translations
  - Micro sites for brands
  - News pages for each of the above
- News _feeds_ for each of the above
- Contact pages for each of the above
- Search pages for each of the above
- A single point of administration

Now as a web developer, I see this as being implemented as a single white-label codebase that has multiple brands/themes that represent different aspects of the same company maintained through a single admin screen.

As a user (albeit with a bit of knowledge about the web), I'd expect it to be presented as:

- A '_client_.com' site for the global website with generic (_targeted at Americans_) overview information about the company/services that's written in Americanised English – so describing Paris as "Paris, France" would be acceptable in copy
- A set '_brand.client_.com' sites that again give generic information about that particular brand and with any appropriate TLDs for localized copy/information
- A set of country sites (with appropriate [TLDs](https://en.wikipedia.org/wiki/Top-level_domain)) (_client_.co.uk, _client_.fr, _client_.de) that display _localized_ content in the native language for that country. As a Briton (born in Scotland, raised in England), it's really irritating to see "color" and "Paris, France" on a .co.uk website. It's snubs like this that really put me off a company (localized isn't the same as translated – there's a difference between en-GB and en-US!)

#### What the Web Wants, it Should Get!

Putting my web developer hat on again, if these were the requirements and expectation delivering the website would be relatively straightforward, each territory/brand website is a white label brand the _locale_ can be picked up from the TLD domain.

Google expects this, Ektron expects this (as would most CMS's that support multiple sites) and users expect this.

But the client doesn't _want_ this. The client _wants_:

- All the content under the global domain
- To re-use copy between territories/brands
- For localization to happen 'auto-magically' in the background
- For Google to 'auto-magically' find the localized content for each territory

On top of this there's actually the un-spoken needs:

- It should be reliable
- It should be fast
- The site should be intuitive
- It shouldn't put people off the brand
- It should be delivered promptly

Now, there's nothing in the clients "wants" list that can't be delivered, but each item will impact at least one thing from the "needs" list and as we're now coding around the conventions there'll be an ongoing maintenance cost as well. It's important that the client understands this.

So the client will need to be educated about the inherent complexities about their website, to make it appear simple and work simply for the future. They need to stop thinking about the website as purely a marketing tool, but as an adapter making their company accessible to web users via the website.

It wouldn't hurt long-term SEO either.
