---
title: "TIP: Improve Readability with Shorter String.Format Statements"
description: ""
pubDate: 2010-07-01
heroImage: ../../assets/blog/hero-images/post-00-hero.svg



tags: ["tips"]
source: hugo
originalUrl: "https://codifice.dev/posts/2010-07-01-tip-improve-readability-with-shorter/"
---

String.Format is a wonderful method, a real life saver when it comes to producing (readable) formatted text from within code.  I use it *everywhere*, but it gets a bit tedious typing the same boilerplate code to use it properly:

  
```
/// Populates the template using the provided arguments and the invariante culture
```

Now the above example becomes:

  
     string formatted = "Formatted text {0:-15} example generated on {1:d}".ToFormattedString(meaningfulString, DateTime.Now);

It’s definitely an improvement and the important bit of the statement (the template with formatting) is right at the front for easy debugging.

#### Excellent, How Do I Retrofit This Into My Existing Code?

Good question, glad you asked.  I simply used Visual Studios Find and Replace using regular expressions:

[](http://lh6.ggpht.com/_Vz_CYzsjR7M/TCzmgrm3DxI/AAAAAAAAAE4/PDs6mRw7k1g/s1600-h/image%5B2%5D.png) 

The find regex (using VS’s “special” regex format) is:

> 
  string.Format\(CultureInfo.InvariantCulture,:b*{:q|:i}:b@@,:b@@

The replace regex is:

> 
  \1.ToFormattedString(

Obviously, you’ll also need a ‘using’' statement at the top of your class file with the namespace of the static class containing the extension methods.