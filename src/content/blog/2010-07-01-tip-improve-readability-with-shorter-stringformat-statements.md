---
title: "TIP: Improve Readability with Shorter String.Format Statements"
description: "Technical blog post from 2010-07-01"
pubDate: 2010-07-01
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

String.Format is a wonderful method, a real life saver when it comes to producing (readable) formatted text from within code.  I use it *everywhere*, but it gets a bit tedious typing the same boilerplate code to use it properly:

             1: string formatted = string.Format(CultureInfo.InvariantCulture, "Formatted text {0:-15} example generated on {1:d}", meaningfulString, DateTime.Now);

That “string.Format(CultureInfo.InvariantCulture,” over 40 characters before you get the meat of the statement.  Sure you can drop the invariant culture bit but then you can introduce weird formatting problems on different machines….no what I need is a useful extension method to take my pain away:

  
       1: /// 

       2: /// Populates the template using the provided arguments and the invariante culture

       3: /// 

       4: /// The template.

       5: /// The args.

       6: public static string ToFormattedString(this string template, params object[] args)

       7: {

       8:     return template.ToFormattedString(CultureInfo.InvariantCulture, args);

       9: }

      10:  

      11: /// 

      12: /// Populates the template using the provided arguments usign the provided formatter

      13: /// 

      14: /// The template.

      15: /// The formatter.

      16: /// The args.

      17: public static string ToFormattedString(this string template, IFormatProvider formatter, params object[] args)

      18: {

      19:     if (string.IsNullOrEmpty(template)) return string.Empty;

      20:     return string.Format(formatter, template, args);

      21: }

Now the above example becomes:

  
       1: string formatted = "Formatted text {0:-15} example generated on {1:d}".ToFormattedString(meaningfulString, DateTime.Now);

It’s definitely an improvement and the important bit of the statement (the template with formatting) is right at the front for easy debugging.

## Excellent, How Do I Retrofit This Into My Existing Code?

Good question, glad you asked.  I simply used Visual Studios Find and Replace using regular expressions:

[](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgU1h1IMO2IiWdPAmak1oVwemzzk3bxTdbqfJOAX-bPvI60Ecip42-8JSrn2PQUva_zN2l5qw3Iu3ygoQzd4ocKbC-Afl9CFDFinX4FuRhV8wU2Q_Rg4OsQTNgXfgcoQ1JnwEgH2Op9/s1600-h/image%5B2%5D.png) 

The find regex (using VS’s “special” regex format) is:

  string.Format\(CultureInfo.InvariantCulture,:b*{:q|:i}:b@,:b@

The replace regex is:

  \1.ToFormattedString(

Obviously, you’ll also need a ‘using’' statement at the top of your class file with the namespace of the static class containing the extension methods.
