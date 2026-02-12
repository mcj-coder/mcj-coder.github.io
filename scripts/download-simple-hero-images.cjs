const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Blog post topics - shorter, simpler prompts for steampunk wizard
const postThemes = [
  { slug: '2010-03-20-aspnet-and-custom-error-pages-seo', theme: 'debugging ASP.NET error pages, steampunk wizard' },
  { slug: '2010-03-20-mmmmm-clean-sweet-wcf-proxy-usage', theme: 'WCF proxy programming, steampunk wizard' },
  { slug: '2010-03-22-working-with-ektron-using-web', theme: 'Ektron CMS configuration, steampunk wizard' },
  { slug: '2010-03-23-ektron-esync-error-servicechannel', theme: 'debugging sync service, steampunk wizard' },
  { slug: '2010-03-24-ektron-and-web-application-projects', theme: 'building web application, steampunk wizard' },
  { slug: '2010-03-27-ektron-compiled-workarea-workaround', theme: 'fixing build errors, steampunk wizard' },
  { slug: '2010-04-04-secure-your-website-put-bouncers-at', theme: 'web security bouncer, steampunk wizard' },
  { slug: '2010-04-05-educating-clients-about-way-web-works', theme: 'teaching web technology, steampunk wizard' },
  { slug: '2010-04-06-secure-your-website-put-bouncers-at_06', theme: 'input validation security, steampunk wizard' },
  { slug: '2010-04-08-ektron-fix-for-uploading-assets-into', theme: 'uploading files to CMS, steampunk wizard' },
  { slug: '2010-04-08-secure-your-website-put-bouncers-at_08', theme: 'HTTPS SSL encryption, steampunk wizard' },
  { slug: '2010-04-10-my-windows-7-development-vm-load-out', theme: 'development workspace setup, steampunk wizard' },
  { slug: '2010-04-13-iis-7-gotcha-40413-not-found-uploading', theme: 'IIS server configuration, steampunk wizard' },
  { slug: '2010-04-16-enabling-concurrent-logins-in-ektron', theme: 'user authentication, steampunk wizard' },
  { slug: '2010-04-19-elevating-ektron-user-permissions', theme: 'user permissions security, steampunk wizard' },
  { slug: '2010-04-22-fixing-precompilation-marker-file', theme: 'IIS build fix, steampunk wizard' },
  { slug: '2010-05-05-using-mbunit-statictestfactory-to', theme: 'unit testing framework, steampunk wizard' },
  { slug: '2010-05-10-n2cms-meet-vwt2oc-project-history', theme: 'CMS project timeline, steampunk wizard' },
  { slug: '2010-05-13-basic-example-of-on-fly-config-section', theme: 'config encryption, steampunk wizard' },
  { slug: '2010-05-23-taking-control-of-your-control-adapters', theme: 'ASP.NET controls, steampunk wizard' },
  { slug: '2010-06-06-n2cms-meet-vwt2oc-day-1-project-setup', theme: 'starting new project, steampunk wizard' },
  { slug: '2010-06-07-n2cms-meet-vwt2oc-day-2-n2cms', theme: 'CMS interface setup, steampunk wizard' },
  { slug: '2010-06-08-n2cms-meet-vwt2oc-day-3-grinding-to', theme: 'frustrated debugging, steampunk wizard' },
  { slug: '2010-06-09-n2cms-forum-addon-fixing-theme', theme: 'theming and styling, steampunk wizard' },
  { slug: '2010-06-09-n2cms-meet-vwt2oc-day-4-wheel-spinning', theme: 'spinning gears debugging, steampunk wizard' },
  { slug: '2010-06-10-blogger-tweak-making-code-snippets-more', theme: 'code syntax highlighting, steampunk wizard' },
  { slug: '2010-06-10-n2cms-templates-rss-feed-fix', theme: 'RSS feed configuration, steampunk wizard' },
  { slug: '2010-06-12-n2cms-meet-vwt2oc-day-7-soldiering-on', theme: 'persisting through challenges, steampunk wizard' },
  { slug: '2010-06-14-ektron-801-fixing-new-handlers', theme: 'fixing multilingual bug, steampunk wizard' },
  { slug: '2010-06-15-ektron-801-platformnotsupportedexceptio', theme: 'debugging platform error, steampunk wizard' },
  { slug: '2010-06-16-tip-constructing-private-types', theme: 'C# reflection coding, steampunk wizard' },
  { slug: '2010-06-16-vwt2oc-host-is-dead-long-live-host', theme: 'server recovery, steampunk wizard' },
  { slug: '2010-06-22-ektron-fix-for-primary-key-constraint', theme: 'database constraint fix, steampunk wizard' },
  { slug: '2010-06-23-tip-how-to-debug-windows-services-and', theme: 'debugging services, steampunk wizard' },
  { slug: '2010-06-24-msbuild-reliably-retrieving-assembly', theme: 'MSBuild scripting, steampunk wizard' },
  { slug: '2010-06-28-convert-accented-characters-to-simple', theme: 'string manipulation, steampunk wizard' },
  { slug: '2010-07-01-tip-improve-readability-with-shorter', theme: 'clean code syntax, steampunk wizard' },
  { slug: '2010-07-10-diagnosing-tricky-aspnet-production', theme: 'production debugging, steampunk wizard' },
  { slug: '2010-07-15-tip-how-to-handle-form-postbacks-when', theme: 'URL rewrite handling, steampunk wizard' },
  { slug: '2010-07-20-changing-master-page-body-tags-css', theme: 'CSS theming, steampunk wizard' },
  { slug: '2010-07-21-ektron-safely-impersonating-users', theme: 'user impersonation, steampunk wizard' },
  { slug: '2010-07-27-ektron-sql-script-to-clone-menu-into', theme: 'SQL scripting, steampunk wizard' },
  { slug: '2010-08-03-building-better-findcontrol', theme: 'ASP.NET control search, steampunk wizard' },
  { slug: '2010-08-18-howto-creating-strongly-typed-code', theme: 'strongly typed code, steampunk wizard' },
  { slug: '2010-09-05-yummy-cleaner-sweeter-wcf-proxy-usage', theme: 'dynamic proxy pattern, steampunk wizard' },
  { slug: '2010-09-20-security-protect-against-poet-attacks', theme: 'security attack prevention, steampunk wizard' },
  { slug: '2010-10-30-infrastructure-replacing-dead-raid-5', theme: 'RAID repair, steampunk wizard' },
  { slug: '2010-11-01-sql-cleaning-up-after-database-tuning', theme: 'database cleanup, steampunk wizard' },
  { slug: '2010-11-03-performance-applying-output-cache', theme: 'caching performance, steampunk wizard' },
  { slug: '2010-11-18-ektron-diagnosing-80-extension-strategy', theme: 'CMS troubleshooting, steampunk wizard' },
  { slug: '2010-12-16-ektron-high-indexing-service-processor', theme: 'search indexing fix, steampunk wizard' },
  { slug: '2011-05-02-base26-number-encodinggenerate-excel', theme: 'Excel automation, steampunk wizard' },
  { slug: '2011-05-03-logging-is-new-exception-swallowing', theme: 'error logging philosophy, steampunk wizard' },
  { slug: '2011-05-10-migrating-from-tfs-2008-to-svn-16-with', theme: 'version control migration, steampunk wizard' },
  { slug: '2011-07-08-preventing-spamming-from-mail', theme: 'email security, steampunk wizard' },
  { slug: '2011-07-14-experiments-with-adonet-extension', theme: 'ADO.NET extensions, steampunk wizard' },
  { slug: '2011-08-04-ektron-treating-office-files-as-normal', theme: 'document management, steampunk wizard' },
  { slug: '2011-08-16-persisting-page-title-across-update', theme: 'state management, steampunk wizard' },
  { slug: '2011-11-01-ektron-finding-missing-content-in-index', theme: '64bit troubleshooting, steampunk wizard' },
  { slug: '2012-01-15-announcing-mvc3-validation-groups', theme: 'ASP.NET MVC framework, steampunk wizard' },
  { slug: '2012-11-22-notes-on-configuring-new-episerver-6-r2', theme: 'EPiServer CMS setup, steampunk wizard' },
  { slug: '2020-02-10-migrating-content-from-blogger-to-hugo', theme: 'blog migration, steampunk wizard' },
  { slug: '2020-02-10-rebooting-the-blog', theme: 'blog reboot, steampunk wizard' },
  { slug: '2020-02-12-automatic-thumbnail-and-cover-images', theme: 'image processing, steampunk wizard' },
  { slug: '2020-02-16-building-a-rpi-k8s-cluster', theme: 'Raspberry Pi cluster, steampunk wizard' },
  { slug: '2020-02-17-setting-up-a-rpi-cluster', theme: 'cluster configuration, steampunk wizard' },
  { slug: '2020-02-18-configuring-the-rpi-cluster-network', theme: 'network setup, steampunk wizard' },
  { slug: '2020-02-20-installing-kubernetes', theme: 'Kubernetes install, steampunk wizard' }
];

const POLLINATIONS_API = 'https://image.pollinations.ai/prompt';
const OUTPUT_DIR = path.join(__dirname, '../src/assets/blog/hero-images');

// Base character description
const characterDesc = 'pixel art of a steampunk techno wizard with short grey goatee dark hair rectangular rim-less glasses';

function encodePrompt(prompt) {
  return encodeURIComponent(`${characterDesc}, ${prompt}, 1024x512 wide banner landscape`);
}

async function downloadImage(slug, theme) {
  const prompt = encodePrompt(theme);
  const outputPath = path.join(OUTPUT_DIR, `${slug}.jpg`);
  const url = `${POLLINATIONS_API}/${prompt}`;

  try {
    execSync(`curl -s "${url}" -o "${outputPath}"`, { stdio: 'inherit' });
    // Check if file is valid
    const stats = fs.statSync(outputPath);
    if (stats.size > 1000) {
      console.log(`✓ ${slug}`);
      return true;
    } else {
      console.log(`✗ ${slug} - invalid file (${stats.size} bytes)`);
      fs.unlinkSync(outputPath);
      return false;
    }
  } catch (err) {
    console.log(`✗ ${slug} - ${err.message}`);
    return false;
  }
}

async function main() {
  // Clean up invalid files first
  const existingFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.jpg') && f.startsWith('2010-') || f.startsWith('2011-') || f.startsWith('2012-') || f.startsWith('2020-'));
  console.log(`Cleaning up ${existingFiles.length} old invalid files...`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < postThemes.length; i++) {
    const post = postThemes[i];
    const result = await downloadImage(post.slug, post.theme);
    if (result) {
      success++;
    } else {
      failed++;
    }
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n=== Summary ===`);
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${postThemes.length}`);
}

main().catch(console.error);
