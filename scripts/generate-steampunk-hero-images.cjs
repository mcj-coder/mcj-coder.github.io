const fs = require('fs');
const path = require('path');

// Blog post topics and themes for steampunk wizard character
const postThemes = [
  { slug: '2010-03-20-aspnet-and-custom-error-pages-seo', theme: 'steampunk techno wizard with grey goatee and glasses examining glowing error scrolls in a tower of brass gears, ASP.NET error pages, SEO analytics floating in air' },
  { slug: '2010-03-20-mmmmm-clean-sweet-wcf-proxy-usage', theme: 'steampunk techno wizard with grey goatee and glasses crafting a clean mechanical proxy construct from brass pipes and glowing data streams, WCF service architecture' },
  { slug: '2010-03-22-working-with-ektron-using-web', theme: 'steampunk techno wizard with grey goatee and glasses configuring a brass CMS interface with Ektron controls, web application project blueprint' },
  { slug: '2010-03-23-ektron-esync-error-servicechannel', theme: 'steampunk techno wizard with grey goatee and glasses diagnosing broken brass sync pipes and service channels, eSync error debugging' },
  { slug: '2010-03-24-ektron-and-web-application-projects', theme: 'steampunk techno wizard with grey goatee and glasses building a brass web application framework, Ektron CMS construction' },
  { slug: '2010-03-27-ektron-compiled-workarea-workaround', theme: 'steampunk techno wizard with grey goatee and glasses repairing a brass compiled workarea mechanism, Ektron workaround spellcasting' },
  { slug: '2010-04-04-secure-your-website-put-bouncers-at', theme: 'steampunk techno wizard with grey goatee and glasses as magical bouncer at castle gates, protecting website fortress from invaders, security measures' },
  { slug: '2010-04-05-educating-clients-about-way-web-works', theme: 'steampunk techno wizard with grey goatee and glasses teaching apprentices how web mechanisms work, client education with illuminated brass charts' },
  { slug: '2010-04-06-secure-your-website-put-bouncers-at_06', theme: 'steampunk techno wizard with grey goatee and glasses implementing additional security layers, cross-site scripting protection wards, input validation' },
  { slug: '2010-04-08-ektron-fix-for-uploading-assets-into', theme: 'steampunk techno wizard with grey goatee and glasses organizing brass asset folders, uploading treasures into Ektron chest, file management' },
  { slug: '2010-04-08-secure-your-website-put-bouncers-at_08', theme: 'steampunk techno wizard with grey goatee and glasses casting HTTPS protection spell, SSL certificate mechanism, encryption magic' },
  { slug: '2010-04-10-my-windows-7-development-vm-load-out', theme: 'steampunk techno wizard with grey goatee and glasses at brass workbench with multiple glowing monitors, Windows 7 development environment' },
  { slug: '2010-04-13-iis-7-gotcha-40413-not-found-uploading', theme: 'steampunk techno wizard with grey goatee and glasses frustrated by large file stuck in brass upload pipe, IIS 7 configuration troubleshooting' },
  { slug: '2010-04-16-enabling-concurrent-logins-in-ektron', theme: 'steampunk techno wizard with grey goatee and glasses enabling multiple user sessions in Ektron brass login system, concurrent authentication' },
  { slug: '2010-04-19-elevating-ektron-user-permissions', theme: 'steampunk techno wizard with grey goatee and glasses safely elevating user privileges with brass permission keys, Ektron security rights' },
  { slug: '2010-04-22-fixing-precompilation-marker-file', theme: 'steampunk techno wizard with grey goatee and glasses repairing precompilation brass markers on IIS 7, Ektron build artifact fix' },
  { slug: '2010-05-05-using-mbunit-statictestfactory-to', theme: 'steampunk techno wizard with grey goatee and glasses testing sitemap with brass testing apparatus, MbUnit validation framework' },
  { slug: '2010-05-10-n2cms-meet-vwt2oc-project-history', theme: 'steampunk techno wizard with grey goatee and glasses reviewing N2CMS project history brass chronicles, content management journey' },
  { slug: '2010-05-13-basic-example-of-on-fly-config-section', theme: 'steampunk techno wizard with grey goatee and glasses encrypting config section with magic spell, on-the-fly configuration encryption' },
  { slug: '2010-05-23-taking-control-of-your-control-adapters', theme: 'steampunk techno wizard with grey goatee and glasses mastering control adapters brass mechanism, ASP.NET control modification' },
  { slug: '2010-06-06-n2cms-meet-vwt2oc-day-1-project-setup', theme: 'steampunk techno wizard with grey goatee and glasses setting up N2CMS brass foundation, project initialization day one' },
  { slug: '2010-06-07-n2cms-meet-vwt2oc-day-2-n2cms', theme: 'steampunk techno wizard with grey goatee and glasses configuring N2CMS brass interface, content management setup day two' },
  { slug: '2010-06-08-n2cms-meet-vwt2oc-day-3-grinding-to', theme: 'steampunk techno wizard with grey goatee and glasses frustrated by grinding brass gears, development halted day three' },
  { slug: '2010-06-09-n2cms-forum-addon-fixing-theme', theme: 'steampunk techno wizard with grey goatee and glasses customizing N2CMS forum theme brass plates, addon styling' },
  { slug: '2010-06-09-n2cms-meet-vwt2oc-day-4-wheel-spinning', theme: 'steampunk techno wizard with grey goatee and glasses watching spinning brass wheels without progress, day four deadlock' },
  { slug: '2010-06-10-blogger-tweak-making-code-snippets-more', theme: 'steampunk techno wizard with grey goatee and glasses improving code snippet display brass mechanisms, Blogger formatting enhancement' },
  { slug: '2010-06-10-n2cms-templates-rss-feed-fix', theme: 'steampunk techno wizard with grey goatee and glasses fixing N2CMS RSS feed brass pipe, template configuration' },
  { slug: '2010-06-12-n2cms-meet-vwt2oc-day-7-soldiering-on', theme: 'steampunk techno wizard with grey goatee and glasses persisting through challenges brass determination, soldiering on development' },
  { slug: '2010-06-14-ektron-801-fixing-new-handlers', theme: 'steampunk techno wizard with grey goatee and glasses fixing multilingual handler bug in Ektron brass mechanism, localization bug' },
  { slug: '2010-06-15-ektron-801-platformnotsupportedexceptio', theme: 'steampunk techno wizard with grey goatee and glasses hunting down platform exception, Ektron multilingual gotcha debugging' },
  { slug: '2010-06-16-tip-constructing-private-types', theme: 'steampunk techno wizard with grey goatee and glasses constructing private types in brass reflection chamber, C# tip' },
  { slug: '2010-06-16-vwt2oc-host-is-dead-long-live-host', theme: 'steampunk techno wizard with grey goatee and glasses resurrecting dead host brass machine, infrastructure recovery' },
  { slug: '2010-06-22-ektron-fix-for-primary-key-constraint', theme: 'steampunk techno wizard with grey goatee and glasses resolving primary key constraint brass lock, Ektron user creation fix' },
  { slug: '2010-06-23-tip-how-to-debug-windows-services-and', theme: 'steampunk techno wizard with grey goatee and glasses attaching debug spell to Windows service brass daemon, plugin debugging' },
  { slug: '2010-06-24-msbuild-reliably-retrieving-assembly', theme: 'steampunk techno wizard with grey goatee and glasses retrieving assembly version without file lock brass contention, MSBuild technique' },
  { slug: '2010-06-28-convert-accented-characters-to-simple', theme: 'steampunk techno wizard with grey goatee and glasses converting accented characters to simple brass stamps, string normalization' },
  { slug: '2010-07-01-tip-improve-readability-with-shorter', theme: 'steampunk techno wizard with grey goatee and glasses crafting cleaner String.Format brass syntax, code readability tip' },
  { slug: '2010-07-10-diagnosing-tricky-aspnet-production', theme: 'steampunk techno wizard with grey goatee and glasses using DebugDiag and windbg brass tools, ASP.NET production debugging' },
  { slug: '2010-07-15-tip-how-to-handle-form-postbacks-when', theme: 'steampunk techno wizard with grey goatee and glasses handling form postbacks during URL rewrite brass routing, ASP.NET tip' },
  { slug: '2010-07-20-changing-master-page-body-tags-css', theme: 'steampunk techno wizard with grey goatee and glasses modifying master page body tag CSS class brass attribute, theming technique' },
  { slug: '2010-07-21-ektron-safely-impersonating-users', theme: 'steampunk techno wizard with grey goatee and glasses safely impersonating users with brass identity token, Ektron security' },
  { slug: '2010-07-27-ektron-sql-script-to-clone-menu-into', theme: 'steampunk techno wizard with grey goatee and glasses cloning menu structure into multiple languages, SQL script automation' },
  { slug: '2010-08-03-building-better-findcontrol', theme: 'steampunk techno wizard with grey goatee and glasses building better FindControl brass mechanism, ASP.NET control search' },
  { slug: '2010-08-18-howto-creating-strongly-typed-code', theme: 'steampunk techno wizard with grey goatee and glasses creating strongly typed code with VB Collection brass tools, type safety' },
  { slug: '2010-09-05-yummy-cleaner-sweeter-wcf-proxy-usage', theme: 'steampunk techno wizard with grey goatee and glasses crafting DynamicTidyProxy brass construct, improved WCF proxy usage' },
  { slug: '2010-09-20-security-protect-against-poet-attacks', theme: 'steampunk techno wizard with grey goatee and glasses casting custom error protection wards, POET attack prevention spell, security magic' },
  { slug: '2010-10-30-infrastructure-replacing-dead-raid-5', theme: 'steampunk techno wizard with grey goatee and glasses replacing dead RAID 5 drive in QNAP brass NAS, infrastructure repair' },
  { slug: '2010-11-01-sql-cleaning-up-after-database-tuning', theme: 'steampunk techno wizard with grey goatee and glasses cleaning up after database tuning advisor brass mess, SQL maintenance' },
  { slug: '2010-11-03-performance-applying-output-cache', theme: 'steampunk techno wizard with grey goatee and glasses applying output cache policies brass stamps, user control performance' },
  { slug: '2010-11-18-ektron-diagnosing-80-extension-strategy', theme: 'steampunk techno wizard with grey goatee and glasses diagnosing 8.0 extension strategy loading brass failures, Ektron troubleshooting' },
  { slug: '2010-12-16-ektron-high-indexing-service-processor', theme: 'steampunk techno wizard with grey goatee and glasses fixing high indexing service processor brass usage, Ektron search fix' },
  { slug: '2011-05-02-base26-number-encodinggenerate-excel', theme: 'steampunk techno wizard with grey goatee and glasses generating Base26 encoded Excel columns brass spreadsheet, number encoding algorithm' },
  { slug: '2011-05-03-logging-is-new-exception-swallowing', theme: 'steampunk techno wizard with grey goatee and glasses advocating logging over exception swallowing brass practice, error handling philosophy' },
  { slug: '2011-05-10-migrating-from-tfs-2008-to-svn-16-with', theme: 'steampunk techno wizard with grey goatee and glasses migrating from TFS brass castle to SVN wilderness with tfs2svn, version control transition' },
  { slug: '2011-07-08-preventing-spamming-from-mail', theme: 'steampunk techno wizard with grey goatee and glasses preventing mail forwarding spam brass deluge, email security configuration' },
  { slug: '2011-07-14-experiments-with-adonet-extension', theme: 'steampunk techno wizard with grey goatee and glasses experimenting with ADO.Net extension methods brass magic, anonymous methods' },
  { slug: '2011-08-04-ektron-treating-office-files-as-normal', theme: 'steampunk techno wizard with grey goatee and glasses treating Office files as normal DMS brass assets, Ektron document management' },
  { slug: '2011-08-16-persisting-page-title-across-update', theme: 'steampunk techno wizard with grey goatee and glasses persisting page title across update panel brass postback, ASP.NET state management' },
  { slug: '2011-11-01-ektron-finding-missing-content-in-index', theme: 'steampunk techno wizard with grey goatee and glasses finding missing content on 64bit brass windows, Ektron index troubleshooting' },
  { slug: '2012-01-15-announcing-mvc3-validation-groups', theme: 'steampunk techno wizard with grey goatee and glasses announcing MVC3 validation groups brass framework, ASP.NET MVC feature' },
  { slug: '2012-11-22-notes-on-configuring-new-episerver-6-r2', theme: 'steampunk techno wizard with grey goatee and glasses configuring EPiServer 6 R2 brass castle for continuous integration, CMS setup' },
  { slug: '2020-02-10-migrating-content-from-blogger-to-hugo', theme: 'steampunk techno wizard with grey goatee and glasses migrating content from Blogger brass ruins to Hugo static site, content migration' },
  { slug: '2020-02-10-rebooting-the-blog', theme: 'steampunk techno wizard with grey goatee and glasses rebooting blog brass machinery with new static site generator, fresh start' },
  { slug: '2020-02-12-automatic-thumbnail-and-cover-images', theme: 'steampunk techno wizard with grey goatee and glasses implementing automatic thumbnail and cover image brass mechanism, Hugo image processing' },
  { slug: '2020-02-16-building-a-rpi-k8s-cluster', theme: 'steampunk techno wizard with grey goatee and glasses assembling Raspberry Pi cluster brass nodes, Kubernetes preparation part 1' },
  { slug: '2020-02-17-setting-up-a-rpi-cluster', theme: 'steampunk techno wizard with grey goatee and glasses configuring Raspberry Pi brass cluster basics, Kubernetes setup part 2' },
  { slug: '2020-02-18-configuring-the-rpi-cluster-network', theme: 'steampunk techno wizard with grey goatee and glasses configuring cluster network brass cabling, Raspberry Pi networking part 3' },
  { slug: '2020-02-20-installing-kubernetes', theme: 'steampunk techno wizard with grey goatee and glasses installing Kubernetes brass orchestration on Raspberry Pi, cluster setup part 4' }
];

const POLLINATIONS_API = 'https://gen.pollinations.ai/image';
const OUTPUT_DIR = path.join(__dirname, '../src/assets/blog/hero-images');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function encodePrompt(prompt) {
  return encodeURIComponent(prompt);
}

function generateImageUrl(theme) {
  const prompt = `steampunk pixelart image of a techno wizard with a short grey GOATEE and dark hair with rectangular rim-less glasses doing something wizardly - ${theme}, 1024x512px`;
  return `${POLLINATIONS_API}/?prompt=${encodePrompt(prompt)}&width=1024&height=512&model=flux&nologo=true`;
}

// Generate download commands
const commands = postThemes.map(post => {
  const imageUrl = generateImageUrl(post.theme);
  const outputPath = path.join(OUTPUT_DIR, `${post.slug}.jpg`);
  return `curl -s "${imageUrl}" -o "${outputPath}"`;
});

console.log('# Commands to download hero images:');
console.log('');
commands.forEach(cmd => console.log(cmd));
console.log('');
console.log(`Total: ${commands.length} images`);

// Also generate a shell script
const scriptContent = `#!/bin/bash
# Auto-generated hero image download script
# Steampunk techno wizard character for blog posts

mkdir -p src/assets/blog/hero-images

${commands.join('\n')}

echo "Downloaded ${commands.length} hero images"
`;

fs.writeFileSync(path.join(__dirname, 'download-hero-images.sh'), scriptContent, { mode: 0o755 });
console.log('\nScript created: scripts/download-hero-images.sh');
