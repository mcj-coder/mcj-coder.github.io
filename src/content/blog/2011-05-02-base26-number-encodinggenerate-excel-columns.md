---
title: "Base26 Number Encoding/Generate Excel Columns"
description: "Technical blog post from 2011-05-02"
pubDate: 2011-05-02
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

Ever needed to convert an Excel Column Letter to a number or vice versa?  Here’s a couple of extension methods to do it:

```csharp
public static string ToLetterEncoded(this Int32 numberToEncode)
```

```csharp
{
```

```csharp
if (numberToEncode throw new ArgumentOutOfRangeException("numberToEncode", numberToEncode, "Value must be greater than zero");
```

```csharp
numberToEncode--;
```

```csharp
if (numberToEncode >= 0 && numberToEncode 
```

```csharp
return ((char)('A' + numberToEncode)).ToString();
```

```csharp
else
```

```csharp
return ToLetterEncoded(numberToEncode / 26) + ToLetterEncoded(numberToEncode % 26 + 1);
```

```csharp
}
```
  
```csharp
public static Int32 FromLetterEncodedInt32(this string letterEncodedNumber)
```

```csharp
{
```

```csharp
if (letterEncodedNumber.IsNullOrWhiteSpace()) throw new ArgumentNullException("letterEncodedNumber");
```

```csharp
char[] letters = letterEncodedNumber.ToUpperInvariant().ToCharArray().Reverse().ToArray(); //smallest column first
```

```csharp
if (letters.Where(c => !char.IsLetter(c)).Any()) throw new ArgumentOutOfRangeException("letterEncodedNumber", "Encoded Number must only contain the letters A-Z");
```

```csharp
int[] numbers = letters.Select(c => (((int)c - 'A') + 1)).ToArray();
```

```csharp
Int32 columnNumber = 0;
```

```csharp
for (int i = 0; i 
```

```csharp
{
```

```csharp
columnNumber += (Int32)Math.Pow(26, i) * numbers[i];
```

```csharp
}
```

```csharp
return columnNumber;
```

```csharp
}
```

I’ve used Int32 to represent the type of integer that you’re en(de)coding, for easy find ‘n’ replace.

These will only work for positive integer (1 and over).
