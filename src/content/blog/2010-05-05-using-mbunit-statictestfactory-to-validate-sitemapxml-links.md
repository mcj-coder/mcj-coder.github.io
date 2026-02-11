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

             1: using System;

       2: using System.Collections.Generic;

       3: using System.Globalization;

       4: using System.Linq;

       5: using System.Net;

       6: using System.Xml.Linq;

       7: using MbUnit.Framework;

       8:  

       9: namespace MartinOnDotNet.VerificationTests

      10: {

      11:     /// 

      12:     /// Includes methods to verify the validity of a sitemap.xml

      13:     /// 

      14:     public sealed class ValidateSiteMap

      15:     {

      16:  

      17:         /// 

      18:         /// Generates a static test for each url referenced within the sitemap

      19:         /// 

      20:         [StaticTestFactory, Parallelizable(TestScope.Descendants)]

      21:         public static IEnumerable GenerateSiteMapLinkTests()

      22:         {

      23:             Uri sitemapUri = new Uri(Properties.Settings.Default.SiteMapXmlUri); // Uri for Xml Sitemap to test : http://localhost/sitemap.xml

      24:             int requestTimeout = Properties.Settings.Default.SiteMapRequestTimeout; //timeout for each request in ms : 300ms

      25:  

      26:             IEnumerablestring> locations = GetSitemapLocations(sitemapUri);

      27:             //is sitemap populated

      28:             yield return CreateSitemapHasNodesTest(sitemapUri, locations);

      29:             

      30:             //are all reference urls valid

      31:             foreach (string location in locations)

      32:             {

      33:                 yield return CreateLocationTest(requestTimeout, location, HttpStatusCode.OK);

      34:             }

      35:             

      36:             // check that robots.txt is present

      37:             Uri robotstxtUri = new Uri(sitemapUri, "/robots.txt");

      38:             yield return CreateLocationTest(requestTimeout, robotstxtUri.ToString(), HttpStatusCode.OK);

      39:             //finally, let's check that a deliberately incorrect url

      40:             Uri nonExistantUri = new Uri(sitemapUri, "/nonexistantfileonserver/");

      41:             yield return CreateLocationTest(requestTimeout, nonExistantUri.ToString(), HttpStatusCode.NotFound);

      42:             

      43:         }

      44:  

      45:         /// 

      47:         /// 

      48:         /// The sitemap URI.

      49:         /// The locations.

      50:         /// A test that checks the sitemap has nodes

      51:         private static TestCase CreateSitemapHasNodesTest(Uri sitemapUri, IEnumerablestring> locations)

      52:         {

      53:             return new TestCase(string.Format(CultureInfo.InvariantCulture, "{0} - Sitemap Has Entries", sitemapUri), () =>

      54:             {

      55:                 Assert.IsTrue(locations.Any());

      56:             });

      57:         }

      58:  

      59:         /// 

      60:         /// Creates the location test.

      61:         /// 

      62:         /// The request timeout.

      63:         /// The location.

      64:         /// A unique test for a sitemap location

      65:         private static TestCase CreateLocationTest(int requestTimeout, string location, HttpStatusCode expectedResult)

      66:         {

      67:             return new TestCase(location, () =>

      68:             {

      69:                 HttpWebRequest wrq = HttpWebRequest.Create(location) as HttpWebRequest;

      70:                 wrq.UserAgent = "Googlebot/2.1 (+http://www.google.com/bot.html)"; // appear to be google to escape any custom error handling

      71:                 wrq.Timeout = requestTimeout;

      72:                 HttpWebResponse wrp = null;

      73:                 try

      74:                 {

      75:                     wrp = GetResponse(wrq);

      76:                     Assert.AreEqual(expectedResult, wrp.StatusCode);

      77:                 }

      78:                 finally

      79:                 {

      80:                     if (wrp != null) wrp.Close();

      81:                 }

      82:             });

      83:         }

      84:  

      85:         #region Helper Methods

      86:  

      87:         /// 

      88:         /// Gets the sitemap locations.

      89:         /// 

      90:         /// The sitemap URI.

      91:         /// A list of locations referenced within the sitemap

      92:         private static IEnumerablestring> GetSitemapLocations(Uri sitemapUri)

      93:         {

      94:             XNamespace xn = XNamespace.Get(@"http://www.sitemaps.org/schemas/sitemap/0.9");

      95:             XDocument xdoc = XDocument.Load(sitemapUri.ToString(), LoadOptions.PreserveWhitespace);

      96:             return from loc in xdoc.Descendants(xn + "loc")

      97:                             select loc.Value;

      98:         }

      99:    

     100:         /// 

     101:         /// Gets the response object and handles any protocol exceptions

     102:         /// 

     103:         /// The request.

     104:         /// The response object if available

     105:         private static HttpWebResponse GetResponse(HttpWebRequest request)

     106:         {

     107:             try

     108:             {

     109:                 return request.GetResponse() as HttpWebResponse;

     110:             }

     111:             catch (WebException wex)

     112:             {

     113:                 if (wex.Status == WebExceptionStatus.ProtocolError)

     114:                 {

     115:                     return wex.Response as HttpWebResponse;

     116:                 }

     117:                 else

     118:                 {

     119:                     throw;

     120:                 }

     121:             }

     122:         }

     123:  

     124:         #endregion

     125:  

     126:     }

     127: }

**Attachment: [Visual Studio Project](http://bit.ly/djjX5u)**
