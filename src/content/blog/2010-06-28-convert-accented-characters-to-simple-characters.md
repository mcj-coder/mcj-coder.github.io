---
title: "Convert Accented Characters to Simple Characters"
description: "Technical blog post from 2010-06-28"
pubDate: 2010-06-28
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

I recently needed a way to replace accented characters with simple english ones to allow more readable friendly urls. I'm sure there are plenty of Danes out there who are sick of seeing their language butchered by UrlEncode.  After bit of reading up, it seems .Net 2.0 does 99% of the heavy lifting for you:

             1: //using System.Text;

       2:  

       3: /// 

       4: /// Replaces Accented Characters with Closest Equivalents

       5: /// 

       6: /// The original.

       7: /// 

       8: /// Based on code from: http://blogs.msdn.com/b/michkap/archive/2007/05/14/2629747.aspx

       9: public static string ToSimpleCharacters(this string original)

      10: {

      11:     if (string.IsNullOrEmpty(original)) return string.Empty;

      12:     string stFormD = original.Normalize(NormalizationForm.FormD);

      13:     StringBuilder sb = new StringBuilder();

      14:  

      15:     for (int ich = 0; ich 

      16:     {

      17:         UnicodeCategory uc = CharUnicodeInfo.GetUnicodeCategory(stFormD[ich]);

      18:         if (uc != UnicodeCategory.NonSpacingMark)

      19:         {

      20:             if (Lookup.ContainsKey(stFormD[ich]))

      21:             {

      22:                 sb.Append(Lookup[stFormD[ich]]);

      23:             }

      24:             else

      25:             {

      26:                 sb.Append(stFormD[ich]);

      27:             }

      28:         }

      29:     }

      30:  

      31:     return (sb.ToString().Normalize(NormalizationForm.FormC));

      32: }

      33:  

      34: private static Dictionarychar, string> _lookup;

      35: private static Dictionarychar, string> Lookup

      36: {

      37:     get

      38:     {

      39:         if (_lookup == null)

      40:         {

      41:             _lookup = new Dictionarychar, string>();

      42:             _lookup[char.ConvertFromUtf32(230)[0]] = "ae";//_lookup['æ']="ae";

      43:             _lookup[char.ConvertFromUtf32(198)[0]] = "Ae";//_lookup['Æ']="Ae";

      44:             _lookup[char.ConvertFromUtf32(240)[0]] = "d";//_lookup['ð']="d";

      45:         }

      46:         return _lookup;

      47:     }

      48: }

I’m sure that there must be a few substitutions that don’t get caught by this code.  If you’ve got one just drop me a line!
