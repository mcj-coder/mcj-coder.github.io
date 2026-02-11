---
title: "Convert Accented Characters to Simple Characters"
description: "Technical blog post from 2010-06-28"
pubDate: 2010-06-28
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

I recently needed a way to replace accented characters with simple english ones to allow more readable friendly urls. I'm sure there are plenty of Danes out there who are sick of seeing their language butchered by UrlEncode.  After bit of reading up, it seems .Net 2.0 does 99% of the heavy lifting for you:

```csharp
//using System.Text;
```

```csharp



```csharp
/// 
```

```csharp
/// Replaces Accented Characters with Closest Equivalents
```

```csharp
/// 
```

```csharp
/// The original.
```

```csharp
/// 
```

```csharp
/// Based on code from: http://blogs.msdn.com/b/michkap/archive/2007/05/14/2629747.aspx
```

```csharp
public static string ToSimpleCharacters(this string original)
```

```csharp
{
```

```csharp
if (string.IsNullOrEmpty(original)) return string.Empty;
```

```csharp
string stFormD = original.Normalize(NormalizationForm.FormD);
```

```csharp
StringBuilder sb = new StringBuilder();
```

```csharp



```csharp
for (int ich = 0; ich 
```

```csharp
{
```

```csharp
UnicodeCategory uc = CharUnicodeInfo.GetUnicodeCategory(stFormD[ich]);
```

```csharp
if (uc != UnicodeCategory.NonSpacingMark)
```

```csharp
{
```

```csharp
if (Lookup.ContainsKey(stFormD[ich]))
```

```csharp
{
```

```csharp
sb.Append(Lookup[stFormD[ich]]);
```

```csharp
}
```

```csharp
else
```

```csharp
{
```

```csharp
sb.Append(stFormD[ich]);
```

```csharp
}
```

```csharp
}
```

```csharp
}
```

```csharp



```csharp
return (sb.ToString().Normalize(NormalizationForm.FormC));
```

```csharp
}
```

```csharp



```csharp
private static Dictionarychar, string> _lookup;
```

```csharp
private static Dictionarychar, string> Lookup
```

```csharp
{
```

```csharp
get
```

```csharp
{
```

```csharp
if (_lookup == null)
```

```csharp
{
```

```csharp
_lookup = new Dictionarychar, string>();
```

```csharp
_lookup[char.ConvertFromUtf32(230)[0]] = "ae";//_lookup['æ']="ae";
```

```csharp
_lookup[char.ConvertFromUtf32(198)[0]] = "Ae";//_lookup['Æ']="Ae";
```

```csharp
_lookup[char.ConvertFromUtf32(240)[0]] = "d";//_lookup['ð']="d";
```

```csharp
}
```

```csharp
return _lookup;
```

```csharp
}
```

```csharp
}
```

I’m sure that there must be a few substitutions that don’t get caught by this code.  If you’ve got one just drop me a line!
