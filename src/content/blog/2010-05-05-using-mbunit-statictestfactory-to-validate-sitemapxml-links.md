---
title: "Using MbUnit StaticTestFactory to Validate Sitemap.xml Links"
description: "Technical blog post from 2010-05-05"
pubDate: 2010-05-05
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

I’ve been investigating a replacement for our current link checker ([SEO Optimization Toolkit](http://bit.ly/apKrIM)) to be run automatically as part of our build so that we can get a quick heads up if one of our dynamic pages breaks.  The problem is that as most of our sites are built with [Ektron](http://bit.ly/d0YHh7) there’s a lot of potential for a combination of content and code to break individual pages that share a template with working pages.  

  As these pages are data driven hard coding tests is very timely and very fragile.  Fortunately, most of our Ektron sites have automatically generated [sitemap.xml](http://bit.ly/bSpvE0) which gives us a neat list of urls to test which is where [MbUnit](http://bit.ly/bvliTQ)’s [StaticTestFactory](http://bit.ly/9RRIV5) comes in useful as it allows us to dynamically create distinct tests for each url.

  Enjoy.

```csharp
using System;
```

```csharp
using System.Collections.Generic;
```

```csharp
using System.Globalization;
```

```csharp
using System.Linq;
```

```csharp
using System.Net;
```

```csharp
using System.Xml.Linq;
```

```csharp
using MbUnit.Framework;
```

```csharp



```csharp
namespace MartinOnDotNet.VerificationTests
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// Includes methods to verify the validity of a sitemap.xml
```

```csharp
/// 
```

```csharp
public sealed class ValidateSiteMap
```

```csharp
{
```

```csharp



```csharp
/// 
```

```csharp
/// Generates a static test for each url referenced within the sitemap
```

```csharp
/// 
```

```csharp
[StaticTestFactory, Parallelizable(TestScope.Descendants)]
```

```csharp
public static IEnumerable GenerateSiteMapLinkTests()
```

```csharp
{
```

```csharp
Uri sitemapUri = new Uri(Properties.Settings.Default.SiteMapXmlUri); // Uri for Xml Sitemap to test : http://localhost/sitemap.xml
```

```csharp
int requestTimeout = Properties.Settings.Default.SiteMapRequestTimeout; //timeout for each request in ms : 300ms
```

```csharp



```csharp
IEnumerablestring> locations = GetSitemapLocations(sitemapUri);
```

```csharp
//is sitemap populated
```

```csharp
yield return CreateSitemapHasNodesTest(sitemapUri, locations);
```

```csharp



```csharp
//are all reference urls valid
```

```csharp
foreach (string location in locations)
```

```csharp
{
```

```csharp
yield return CreateLocationTest(requestTimeout, location, HttpStatusCode.OK);
```

```csharp
}
```

```csharp



```csharp
// check that robots.txt is present
```

```csharp
Uri robotstxtUri = new Uri(sitemapUri, "/robots.txt");
```

```csharp
yield return CreateLocationTest(requestTimeout, robotstxtUri.ToString(), HttpStatusCode.OK);
```

```csharp
//finally, let's check that a deliberately incorrect url
```

```csharp
Uri nonExistantUri = new Uri(sitemapUri, "/nonexistantfileonserver/");
```

```csharp
yield return CreateLocationTest(requestTimeout, nonExistantUri.ToString(), HttpStatusCode.NotFound);
```

```csharp



```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// 
```

```csharp
/// The sitemap URI.
```

```csharp
/// The locations.
```

```csharp
/// A test that checks the sitemap has nodes
```

```csharp
private static TestCase CreateSitemapHasNodesTest(Uri sitemapUri, IEnumerablestring> locations)
```

```csharp
{
```

```csharp
return new TestCase(string.Format(CultureInfo.InvariantCulture, "{0} - Sitemap Has Entries", sitemapUri), () =>
```

```csharp
{
```

```csharp
Assert.IsTrue(locations.Any());
```

```csharp
});
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Creates the location test.
```

```csharp
/// 
```

```csharp
/// The request timeout.
```

```csharp
/// The location.
```

```csharp
/// A unique test for a sitemap location
```

```csharp
private static TestCase CreateLocationTest(int requestTimeout, string location, HttpStatusCode expectedResult)
```

```csharp
{
```

```csharp
return new TestCase(location, () =>
```

```csharp
{
```

```csharp
HttpWebRequest wrq = HttpWebRequest.Create(location) as HttpWebRequest;
```

```csharp
wrq.UserAgent = "Googlebot/2.1 (+http://www.google.com/bot.html)"; // appear to be google to escape any custom error handling
```

```csharp
wrq.Timeout = requestTimeout;
```

```csharp
HttpWebResponse wrp = null;
```

```csharp
try
```

```csharp
{
```

```csharp
wrp = GetResponse(wrq);
```

```csharp
Assert.AreEqual(expectedResult, wrp.StatusCode);
```

```csharp
}
```

```csharp
finally
```

```csharp
{
```

```csharp
if (wrp != null) wrp.Close();
```

```csharp
}
```

```csharp
});
```

```csharp
}
```

```csharp



```csharp
#region Helper Methods
```

```csharp



```csharp
/// 
```

```csharp
/// Gets the sitemap locations.
```

```csharp
/// 
```

```csharp
/// The sitemap URI.
```

```csharp
/// A list of locations referenced within the sitemap
```

```csharp
private static IEnumerablestring> GetSitemapLocations(Uri sitemapUri)
```

```csharp
{
```

```csharp
XNamespace xn = XNamespace.Get(@"http://www.sitemaps.org/schemas/sitemap/0.9");
```

```csharp
XDocument xdoc = XDocument.Load(sitemapUri.ToString(), LoadOptions.PreserveWhitespace);
```

```csharp
return from loc in xdoc.Descendants(xn + "loc")
```

```csharp
select loc.Value;
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Gets the response object and handles any protocol exceptions
```

```csharp
/// 
```

```csharp
/// The request.
```

```csharp
/// The response object if available
```

```csharp
private static HttpWebResponse GetResponse(HttpWebRequest request)
```

```csharp
{
```

```csharp
try
```

```csharp
{
```

```csharp
return request.GetResponse() as HttpWebResponse;
```

```csharp
}
```

```csharp
catch (WebException wex)
```

```csharp
{
```

```csharp
if (wex.Status == WebExceptionStatus.ProtocolError)
```

```csharp
{
```

```csharp
return wex.Response as HttpWebResponse;
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
throw;
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
#endregion
```

```csharp



```csharp
}
```

```csharp
}
```

**Attachment: [Visual Studio Project](http://bit.ly/djjX5u)**
