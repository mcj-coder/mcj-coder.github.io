---
title: "Mmmmm\u2026 clean, sweet WCF proxy usage with TidyProxy!"
description: ''
pubDate: 2010-03-20
updatedDate: 2010-03-23
tags: ['best-practise']
source: hugo
originalUrl: 'https://codifice.dev/posts/2010-03-20-mmmmm-clean-sweet-wcf-proxy-usage/'
heroImage: ../../assets/blog/hero-images/2010-03-20-mmmmm-clean-sweet-wcf-proxy-usage.jpg
---

Everyone knows (hopefully) how WCF has made multi-tiered application development easier and cleaner.  You get nicely generated client proxies that reuse common libraries straight out of Visual Studio – no more having to convert between _your_ DTOs and the Web Service DTOs.  They even implement IDisposable - you can just wrap them in using statements and you’re good to go!  How neat is that!

```
{
```

But only if nothing goes wrong.

If the service you’re calling throws an exception (or Faults) then the Clients dispose method will throw another exception – masking the actual problem…  There’s an entire MSDN article on the issue.  The suggested fix?  Replace the using block above with something like this:

```
try
```

```

```

[](http://11011.net/software/vspaste)
WCF not looking so sweet now, is it?

Now, I’ve got an issue with this type of boilerplate code, it’s verbose and awkward and _reeks_ of having to clean up someone else's mess.  So, what can we do about?  Well, there’s a couple of good ideas out there from replacing the default ClientBase to adding an additional partial class to the generated code.  These are good solutions, but will require modification of the generated code and I’m too lazy to do that for each service I’m consuming.

So, I want a way to leverage the existing, _generated_ client and keep the implementation as close to the neat using statement as possible.  Thankfully, through the wonders of Generics and the Adapter pattern WCF can be redeemed – here’s TidyProxy:

```
using System;
```

So, what does this get me?  Well, to call my magically complex service I now just need to write:

```
using (var proxy = new TidyProxy<SomeWCFServiceClient>())
```

Awesome.
