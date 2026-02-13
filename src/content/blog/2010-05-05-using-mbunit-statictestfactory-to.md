---
title: Using MbUnit StaticTestFactory to Validate Sitemap.xml Links
description: 'How to use MbUnit StaticTestFactory to dynamically generate tests for each URL in a sitemap.xml, providing automated link validation for data-driven Ektron sites.'
pubDate: 2010-05-05
tags: ['ektron']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/05/using-mbunit-statictestfactory-to.html'
heroImage: ../../assets/blog/hero-images/2010-05-05-using-mbunit-statictestfactory-to.jpg
---

I've been investigating a replacement for our current link checker (SEO Optimization Toolkit) to be run automatically as part of our build so that we can get a quick heads up if one of our dynamic pages breaks. The problem is that as most of our sites are built with Ektron there's a lot of potential for a combination of content and code to break individual pages that share a template with working pages.

As these pages are data driven hard coding tests is very timely and very fragile. Fortunately, most of our Ektron sites have automatically generated sitemap.xml which gives us a neat list of urls to test which is where MbUnit's StaticTestFactory comes in useful as it allows us to dynamically create distinct tests for each url.

Enjoy.

```csharp
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Xml.Linq;
using MbUnit.Framework;

namespace MartinOnDotNet.VerificationTests
{
    /// <summary>
    /// Includes methods to verify the validity of a sitemap.xml
    /// </summary>
    public sealed class ValidateSiteMap
    {
        /// <summary>
        /// Generates a static test for each url referenced within the sitemap
        /// </summary>
        [StaticTestFactory, Parallelizable(TestScope.Descendants)]
        public static IEnumerable<Test> GenerateSiteMapLinkTests()
        {
            Uri sitemapUri = new Uri(Properties.Settings.Default.SiteMapXmlUri);
            int requestTimeout = Properties.Settings.Default.SiteMapRequestTimeout;

            IEnumerable<string> locations = GetSitemapLocations(sitemapUri);
            yield return CreateSitemapHasNodesTest(sitemapUri, locations);

            foreach (string location in locations)
            {
                yield return CreateLocationTest(requestTimeout, location, HttpStatusCode.OK);
            }

            Uri robotstxtUri = new Uri(sitemapUri, "/robots.txt");
            yield return CreateLocationTest(requestTimeout, robotstxtUri.ToString(), HttpStatusCode.OK);

            Uri nonExistantUri = new Uri(sitemapUri, "/nonexistantfileonserver/");
            yield return CreateLocationTest(requestTimeout, nonExistantUri.ToString(), HttpStatusCode.NotFound);
        }

        private static TestCase CreateSitemapHasNodesTest(Uri sitemapUri, IEnumerable<string> locations)
        {
            return new TestCase(string.Format(CultureInfo.InvariantCulture, "{0} - Sitemap Has Entries", sitemapUri), () =>
            {
                Assert.IsTrue(locations.Any());
            });
        }

        private static TestCase CreateLocationTest(int requestTimeout, string location, HttpStatusCode expectedResult)
        {
            return new TestCase(location, () =>
            {
                HttpWebRequest wrq = HttpWebRequest.Create(location) as HttpWebRequest;
                wrq.UserAgent = "Googlebot/2.1 (+http://www.google.com/bot.html)";
                wrq.Timeout = requestTimeout;
                HttpWebResponse wrp = null;
                try
                {
                    wrp = GetResponse(wrq);
                    Assert.AreEqual<System.Net.HttpStatusCode>(expectedResult, wrp.StatusCode);
                }
                finally
                {
                    if (wrp != null) wrp.Close();
                }
            });
        }

        #region Helper Methods

        private static IEnumerable<string> GetSitemapLocations(Uri sitemapUri)
        {
            XNamespace xn = XNamespace.Get(@"http://www.sitemaps.org/schemas/sitemap/0.9");
            XDocument xdoc = XDocument.Load(sitemapUri.ToString(), LoadOptions.PreserveWhitespace);
            return from loc in xdoc.Descendants(xn + "loc")
                   select loc.Value;
        }

        private static HttpWebResponse GetResponse(HttpWebRequest request)
        {
            try
            {
                return request.GetResponse() as HttpWebResponse;
            }
            catch (WebException wex)
            {
                if (wex.Status == WebExceptionStatus.ProtocolError)
                {
                    return wex.Response as HttpWebResponse;
                }
                else
                {
                    throw;
                }
            }
        }

        #endregion
    }
}
```

[Download the Verification Tests Visual Studio Project](/downloads/2010-05-05-using-mbunit-statictestfactory-to/Verification%20Tests.zip)
