---
title: Base26 Number Encoding/Generate Excel Columns
description: 'C# extension methods to convert between Excel column letters (A, B, AA, etc.) and numeric column indexes using Base26 encoding.'
pubDate: 2011-05-02
tags: ['tips']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2011/05/base26-number-encodinggenerate-excel.html'
heroImage: ../../assets/blog/hero-images/2011-05-02-base26-number-encodinggenerate-excel.jpg
---

Ever needed to convert an Excel Column Letter to a number or vice versa? Here's a couple of extension methods to do it:

```csharp
public static string ToLetterEncoded(this Int32 numberToEncode)
{
    if (numberToEncode <= 0) throw new ArgumentOutOfRangeException("numberToEncode", numberToEncode, "Value must be greater than zero");
    numberToEncode--;
    if (numberToEncode >= 0 && numberToEncode < 26)
        return ((char)('A' + numberToEncode)).ToString();
    else
        return ToLetterEncoded(numberToEncode / 26) + ToLetterEncoded(numberToEncode % 26 + 1);
}
```

```csharp
public static Int32 FromLetterEncodedInt32(this string letterEncodedNumber)
{
    if (letterEncodedNumber.IsNullOrWhiteSpace()) throw new ArgumentNullException("letterEncodedNumber");
    char[] letters = letterEncodedNumber.ToUpperInvariant().ToCharArray().Reverse().ToArray(); //smallest column first
    if (letters.Where(c => !char.IsLetter(c)).Any()) throw new ArgumentOutOfRangeException("letterEncodedNumber", "Encoded Number must only contain the letters A-Z");
    int[] numbers = letters.Select(c => (((int)c - 'A') + 1)).ToArray();
    Int32 columnNumber = 0;
    for (int i = 0; i < letters.Length; i++)
    {
        columnNumber += (Int32)Math.Pow(26, i) * numbers[i];
    }
    return columnNumber;
}
```

I've used Int32 to represent the type of integer that you're en(de)coding, for easy find 'n' replace.

These will only work for positive integer (1 and over).
