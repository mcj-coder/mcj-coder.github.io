---
title: Convert Accented Characters to Simple Characters
description: 'A C# extension method using Unicode normalisation to convert accented characters to simple English equivalents for readable friendly URLs.'
pubDate: 2010-06-28
updatedDate: 2010-07-12
tags: ['tips']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/06/convert-accented-characters-to-simple.html'
heroImage: ../../assets/blog/hero-images/2010-06-28-convert-accented-characters-to-simple.jpg
---

I recently needed a way to replace accented characters with simple English ones to allow more readable friendly URLs. I'm sure there are plenty of Danes out there who are sick of seeing their language butchered by UrlEncode. After a bit of reading up, it seems .Net 2.0 does 99% of the heavy lifting for you:

```csharp
//using System.Text;

/// <summary>
/// Replaces Accented Characters with Closest Equivalents
/// </summary>
/// <param name="original">The original.</param>
/// <returns></returns>
/// <remarks>Based on code from: http://blogs.msdn.com/b/michkap/archive/2007/05/14/2629747.aspx</remarks>
public static string ToSimpleCharacters(this string original)
{
    if (string.IsNullOrEmpty(original)) return string.Empty;
    string stFormD = original.Normalize(NormalizationForm.FormD);
    StringBuilder sb = new StringBuilder();

    for (int ich = 0; ich < stFormD.Length; ich++)
    {
        UnicodeCategory uc = CharUnicodeInfo.GetUnicodeCategory(stFormD[ich]);
        if (uc != UnicodeCategory.NonSpacingMark)
        {
            if (Lookup.ContainsKey(stFormD[ich]))
            {
                sb.Append(Lookup[stFormD[ich]]);
            }
            else
            {
                sb.Append(stFormD[ich]);
            }
        }
    }

    return (sb.ToString().Normalize(NormalizationForm.FormC));
}

private static Dictionary<char, string> _lookup;
private static Dictionary<char, string> Lookup
{
    get
    {
        if (_lookup == null)
        {
            _lookup = new Dictionary<char, string>();
            _lookup[char.ConvertFromUtf32(230)[0]] = "ae";//_lookup['æ']="ae";
            _lookup[char.ConvertFromUtf32(198)[0]] = "Ae";//_lookup['Æ']="Ae";
            _lookup[char.ConvertFromUtf32(240)[0]] = "d";//_lookup['ð']="d";
        }
        return _lookup;
    }
}
```

I'm sure that there must be a few substitutions that don't get caught by this code. If you've got one just drop me a line!
