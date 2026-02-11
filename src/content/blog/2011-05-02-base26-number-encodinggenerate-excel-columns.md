---
title: "Base26 Number Encoding/Generate Excel Columns"
description: "Technical blog post from 2011-05-02"
pubDate: 2011-05-02
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

Ever needed to convert an Excel Column Letter to a number or vice versa?  Here’s a couple of extension methods to do it:

             1: public static string ToLetterEncoded(this Int32 numberToEncode)

       2: {

       3:     if (numberToEncode throw new ArgumentOutOfRangeException("numberToEncode", numberToEncode, "Value must be greater than zero");

       4:     numberToEncode--;

       5:     if (numberToEncode >= 0 && numberToEncode 

       6:         return ((char)('A' + numberToEncode)).ToString();

       7:     else

       8:         return ToLetterEncoded(numberToEncode / 26) + ToLetterEncoded(numberToEncode % 26 + 1);

       9: }

  
       1: public static Int32 FromLetterEncodedInt32(this string letterEncodedNumber)

       2: {

       3:     if (letterEncodedNumber.IsNullOrWhiteSpace()) throw new ArgumentNullException("letterEncodedNumber");

       4:     char[] letters = letterEncodedNumber.ToUpperInvariant().ToCharArray().Reverse().ToArray(); //smallest column first

       5:     if (letters.Where(c => !char.IsLetter(c)).Any()) throw new ArgumentOutOfRangeException("letterEncodedNumber", "Encoded Number must only contain the letters A-Z");

       6:     int[] numbers = letters.Select(c => (((int)c - 'A') + 1)).ToArray();

       7:     Int32 columnNumber = 0;

       8:     for (int i = 0; i 

       9:     {

      10:         columnNumber += (Int32)Math.Pow(26, i) * numbers[i];

      11:     }

      12:     return columnNumber;

      13: }

I’ve used Int32 to represent the type of integer that you’re en(de)coding, for easy find ‘n’ replace.

These will only work for positive integer (1 and over).
