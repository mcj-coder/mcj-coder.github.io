const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Blog post themes - wizard actions + blog post subjects
const postThemes = [
  { slug: '2010-03-20-aspnet-and-custom-error-pages-seo', action: 'casting SEO spell', subject: 'ASP.NET error pages' },
  { slug: '2010-03-20-mmmmm-clean-sweet-wcf-proxy-usage', action: 'crafting proxy construct', subject: 'WCF services' },
  { slug: '2010-03-22-working-with-ektron-using-web', action: 'configuring CMS', subject: 'Ektron web application' },
  { slug: '2010-03-23-ektron-esync-error-servicechannel', action: 'diagnosing sync pipes', subject: 'eSync troubleshooting' },
  { slug: '2010-03-24-ektron-and-web-application-projects', action: 'building framework', subject: 'web application project' },
  { slug: '2010-03-27-ektron-compiled-workarea-workaround', action: 'repairing mechanism', subject: 'compiled workarea' },
  { slug: '2010-04-04-secure-your-website-put-bouncers-at', action: 'guarding gates', subject: 'website security' },
  { slug: '2010-04-05-educating-clients-about-way-web-works', action: 'teaching web ways', subject: 'client education' },
  { slug: '2010-04-06-secure-your-website-put-bouncers-at_06', action: 'casting protection wards', subject: 'input validation' },
  { slug: '2010-04-08-ektron-fix-for-uploading-assets-into', action: 'organizing assets', subject: 'file upload' },
  { slug: '2010-04-08-secure-your-website-put-bouncers-at_08', action: 'casting HTTPS spell', subject: 'SSL encryption' },
  { slug: '2010-04-10-my-windows-7-development-vm-load-out', action: 'at workbench', subject: 'development environment' },
  { slug: '2010-04-13-iis-7-gotcha-40413-not-found-uploading', action: 'unclogging pipe', subject: 'large file upload' },
  { slug: '2010-04-16-enabling-concurrent-logins-in-ektron', action: 'enabling sessions', subject: 'authentication' },
  { slug: '2010-04-19-elevating-ektron-user-permissions', action: 'elevating privileges', subject: 'user permissions' },
  { slug: '2010-04-22-fixing-precompilation-marker-file', action: 'repairing marker', subject: 'IIS precompilation' },
  { slug: '2010-05-05-using-mbunit-statictestfactory-to', action: 'testing sitemap', subject: 'validation framework' },
  { slug: '2010-05-10-n2cms-meet-vwt2oc-project-history', action: 'reading chronicles', subject: 'project history' },
  { slug: '2010-05-13-basic-example-of-on-fly-config-section', action: 'encrypting config', subject: 'configuration' },
  { slug: '2010-05-23-taking-control-of-your-control-adapters', action: 'mastering controls', subject: 'control adapters' },
  { slug: '2010-06-06-n2cms-meet-vwt2oc-day-1-project-setup', action: 'laying foundation', subject: 'project setup' },
  { slug: '2010-06-07-n2cms-meet-vwt2oc-day-2-n2cms', action: 'configuring interface', subject: 'CMS setup' },
  { slug: '2010-06-08-n2cms-meet-vwt2oc-day-3-grinding-to', action: 'frustrated by gears', subject: 'debugging halt' },
  { slug: '2010-06-09-n2cms-forum-addon-fixing-theme', action: 'styling theme', subject: 'forum addon' },
  { slug: '2010-06-09-n2cms-meet-vwt2oc-day-4-wheel-spinning', action: 'watching wheels spin', subject: 'deadlock' },
  { slug: '2010-06-10-blogger-tweak-making-code-snippets-more', action: 'improving display', subject: 'code formatting' },
  { slug: '2010-06-10-n2cms-templates-rss-feed-fix', action: 'fixing feed pipe', subject: 'RSS configuration' },
  { slug: '2010-06-12-n2cms-meet-vwt2oc-day-7-soldiering-on', action: 'persisting on', subject: 'determination' },
  { slug: '2010-06-14-ektron-801-fixing-new-handlers', action: 'fixing handler bug', subject: 'multilingual' },
  { slug: '2010-06-15-ektron-801-platformnotsupportedexceptio', action: 'hunting bug', subject: 'platform exception' },
  { slug: '2010-06-16-tip-constructing-private-types', action: 'constructing types', subject: 'private reflection' },
  { slug: '2010-06-16-vwt2oc-host-is-dead-long-live-host', action: 'resurrecting server', subject: 'host recovery' },
  { slug: '2010-06-22-ektron-fix-for-primary-key-constraint', action: 'unlocking constraint', subject: 'primary key' },
  { slug: '2010-06-23-tip-how-to-debug-windows-services-and', action: 'attaching debugger', subject: 'service debugging' },
  { slug: '2010-06-24-msbuild-reliably-retrieving-assembly', action: 'retrieving version', subject: 'assembly locking' },
  { slug: '2010-06-28-convert-accented-characters-to-simple', action: 'converting chars', subject: 'normalization' },
  { slug: '2010-07-01-tip-improve-readability-with-shorter', action: 'crafting syntax', subject: 'code readability' },
  { slug: '2010-07-10-diagnosing-tricky-aspnet-production', action: 'using debugger tools', subject: 'production issues' },
  { slug: '2010-07-15-tip-how-to-handle-form-postbacks-when', action: 'routing postback', subject: 'URL rewriting' },
  { slug: '2010-07-20-changing-master-page-body-tags-css', action: 'theming body', subject: 'master page CSS' },
  { slug: '2010-07-21-ektron-safely-impersonating-users', action: 'impersonating user', subject: 'identity token' },
  { slug: '2010-07-27-ektron-sql-script-to-clone-menu-into', action: 'cloning menu', subject: 'SQL automation' },
  { slug: '2010-08-03-building-better-findcontrol', action: 'building search', subject: 'control finding' },
  { slug: '2010-08-18-howto-creating-strongly-typed-code', action: 'creating types', subject: 'strong typing' },
  { slug: '2010-09-05-yummy-cleaner-sweeter-wcf-proxy-usage', action: 'crafting proxy', subject: 'dynamic pattern' },
  { slug: '2010-09-20-security-protect-against-poet-attacks', action: 'casting error wards', subject: 'attack prevention' },
  { slug: '2010-10-30-infrastructure-replacing-dead-raid-5', action: 'swapping drive', subject: 'RAID repair' },
  { slug: '2010-11-01-sql-cleaning-up-after-database-tuning', action: 'cleaning database', subject: 'tuning cleanup' },
  { slug: '2010-11-03-performance-applying-output-cache', action: 'applying cache', subject: 'performance policy' },
  { slug: '2010-11-18-ektron-diagnosing-80-extension-strategy', action: 'diagnosing failure', subject: 'extension loading' },
  { slug: '2010-12-16-ektron-high-indexing-service-processor', action: 'fixing indexer', subject: 'search service' },
  { slug: '2011-05-02-base26-number-encodinggenerate-excel', action: 'generating columns', subject: 'Excel encoding' },
  { slug: '2011-05-03-logging-is-new-exception-swallowing', action: 'writing logs', subject: 'error handling' },
  { slug: '2011-05-10-migrating-from-tfs-2008-to-svn-16-with', action: 'migrating repos', subject: 'version control' },
  { slug: '2011-07-08-preventing-spamming-from-mail', action: 'blocking spam', subject: 'email security' },
  { slug: '2011-07-14-experiments-with-adonet-extension', action: 'experimenting magic', subject: 'extension methods' },
  { slug: '2011-08-04-ektron-treating-office-files-as-normal', action: 'managing docs', subject: 'DMS assets' },
  { slug: '2011-08-16-persisting-page-title-across-update', action: 'persisting title', subject: 'state management' },
  { slug: '2011-11-01-ektron-finding-missing-content-in-index', action: 'finding content', subject: '64bit issue' },
  { slug: '2012-01-15-announcing-mvc3-validation-groups', action: 'announcing feature', subject: 'MVC validation' },
  { slug: '2012-11-22-notes-on-configuring-new-episerver-6-r2', action: 'configuring CMS', subject: 'EPiServer setup' },
  { slug: '2020-02-10-migrating-content-from-blogger-to-hugo', action: 'migrating content', subject: 'static site' },
  { slug: '2020-02-10-rebooting-the-blog', action: 'rebooting machinery', subject: 'blog restart' },
  { slug: '2020-02-12-automatic-thumbnail-and-cover-images', action: 'generating thumbnails', subject: 'image automation' },
  { slug: '2020-02-16-building-a-rpi-k8s-cluster', action: 'assembling cluster', subject: 'Raspberry Pi' },
  { slug: '2020-02-17-setting-up-a-rpi-cluster', action: 'configuring cluster', subject: 'cluster basics' },
  { slug: '2020-02-18-configuring-the-rpi-cluster-network', action: 'cabling network', subject: 'cluster networking' },
  { slug: '2020-02-20-installing-kubernetes', action: 'installing K8s', subject: 'orchestration' }
];

const BASE_IMAGE = 'https://images.unsplash.com/photo-1558618666-fab65590cfa?w=1024&h=512&fit=crop';
const OUTPUT_DIR = path.join(__dirname, '../src/assets/blog/hero-images');

const BASE_WIZARD_DESC = 'steampunk pixelart image of a techno wizard with a short grey GOATEE and dark hair with rectangular rim-less glasses';

function encodeComponent(str) {
  return encodeURIComponent(str);
}

function downloadImage(post) {
  const prompt = `${BASE_WIZARD_DESC} <<${post.action}>> to the subject of <<${post.subject}>>`;
  const url = `https://gen.pollinations.ai/image/${encodeComponent(prompt)}?model=nanobanana&width=1024&height=512&image=${encodeComponent(BASE_IMAGE)}`;
  const outputPath = path.join(OUTPUT_DIR, `${post.slug}.jpg`);

  try {
    execSync(
      `curl -s "${url}" -o "${outputPath}" \
        --header "Accept: */*" \
        --header "Authorization: Bearer ${process.env.ANTHROPIC_API_KEY}"`,
      { stdio: 'pipe', timeout: 60000 }
    );

    const stats = fs.statSync(outputPath);
    if (stats.size > 5000) {
      console.log(`✓ ${post.slug}`);
      return true;
    } else {
      console.log(`✗ ${post.slug} - small file (${stats.size} bytes)`);
      fs.unlinkSync(outputPath);
      return false;
    }
  } catch (err) {
    console.log(`✗ ${post.slug} - ${err.message.slice(0, 50)}`);
    return false;
  }
}

async function main() {
  console.log(`Downloading ${postThemes.length} hero images...\n`);

  // Clean up old invalid files
  if (fs.existsSync(OUTPUT_DIR)) {
    const files = fs.readdirSync(OUTPUT_DIR).filter(f =>
      (f.startsWith('2010-') || f.startsWith('2011-') || f.startsWith('2012-') || f.startsWith('2020-')) &&
      f.endsWith('.jpg') &&
      f !== '2020-02-16-building-a-rpi-k8s-cluster.jpg' &&
      f !== '2020-02-17-setting-up-a-rpi-cluster.jpg' &&
      f !== '2020-02-18-configuring-the-rpi-cluster-network.jpg' &&
      f !== '2020-02-20-installing-kubernetes.jpg'
    );

    console.log(`Cleaning up ${files.length} old files...`);
    files.forEach(f => {
      const filePath = path.join(OUTPUT_DIR, f);
      try { fs.unlinkSync(filePath); } catch {}
    });
  }

  let success = 0;
  let failed = 0;

  for (let i = 0; i < postThemes.length; i++) {
    const result = downloadImage(postThemes[i]);
    if (result) success++;
    else failed++;

    // Delay between requests
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n=== Summary ===`);
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${postThemes.length}`);
}

main().catch(console.error);
