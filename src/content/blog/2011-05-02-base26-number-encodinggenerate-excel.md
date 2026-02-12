---
title: Base26 Number Encoding/Generate Excel Columns
description: ''
pubDate: 2011-05-02
tags: ['tips']
source: hugo
originalUrl: 'https://codifice.dev/posts/2011-05-02-base26-number-encodinggenerate-excel/'
heroImage: ../../assets/blog/hero-images/2011-05-02-base26-number-encodinggenerate-excel.jpg
---

Ever needed to convert an Excel Column Letter to a number or vice versa?  Here’s a couple of extension methods to do it:

```
{
```

```
public static Int32 FromLetterEncodedInt32(this string letterEncodedNumber)
```

I’ve used Int32 to represent the type of integer that you’re en(de)coding, for easy find ‘n’ replace.

These will only work for positive integer (1 and over).
