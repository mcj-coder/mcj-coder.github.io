---
title: 'TIP: Improve Readability with Shorter String.Format Statements'
description: 'C# extension methods to replace verbose string.Format(CultureInfo.InvariantCulture, ...) calls with a cleaner ToFormattedString syntax, plus a Visual Studio regex to retrofit existing code.'
pubDate: 2010-07-01
heroImage: ../../assets/blog/hero-images/2010-07-01-tip-improve-readability-with-shorter-methods.jpg
tags: ['tips']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/07/tip-improve-readability-with-shorter.html'
---

String.Format is a wonderful method, a real life saver when it comes to producing (readable) formatted text from within code. I use it _everywhere_, but it gets a bit tedious typing the same boilerplate code to use it properly:

```csharp
string formatted = string.Format(CultureInfo.InvariantCulture, "Formatted text {0:-15} example generated on {1:d}", meaningfulString, DateTime.Now);
```

That's over 40 characters before the actual template! The solution is a pair of extension methods:

```csharp
/// <summary>
/// Populates the template using the provided arguments and the invariante culture
/// </summary>
/// <param name="template">The template.</param>
/// <param name="args">The args.</param>
public static string ToFormattedString(this string template, params object[] args)
{
    return template.ToFormattedString(CultureInfo.InvariantCulture, args);
}

/// <summary>
/// Populates the template using the provided arguments using the provided formatter
/// </summary>
/// <param name="template">The template.</param>
/// <param name="formatter">The formatter.</param>
/// <param name="args">The args.</param>
public static string ToFormattedString(this string template, IFormatProvider formatter, params object[] args)
{
    if (string.IsNullOrEmpty(template)) return string.Empty;
    return string.Format(formatter, template, args);
}
```

Now the above example becomes:

```csharp
string formatted = "Formatted text {0:-15} example generated on {1:d}".ToFormattedString(meaningfulString, DateTime.Now);
```

It's definitely an improvement and the important bit of the statement (the template with formatting) is right at the front for easy debugging.

#### Excellent, How Do I Retrofit This Into My Existing Code?

Good question, glad you asked. I simply used Visual Studio's Find and Replace using regular expressions:

_[Original screenshot no longer available]_

The find regex (using VS's "special" regex format) is:

> string.Format\\(CultureInfo.InvariantCulture,:b\*{:q|:i}:b@@,:b@@

The replace regex is:

> \\1.ToFormattedString(

Obviously, you'll also need a 'using' statement at the top of your class file with the namespace of the static class containing the extension methods.
