# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Astro-based blog hosted on GitHub Pages. The blog uses Markdown content collections with frontmatter schema validation. Build outputs to `./dist/` which gets deployed via GitHub Actions.

## Commands

### Development
```bash
npm run dev          # Start local dev server at localhost:4321
npm run build        # Build production site to ./dist/
npm run preview       # Preview build locally
```

### Content Management
- Blog posts: `src/content/blog/*.md` - 68 posts with hero images in `src/assets/blog/hero-images/`
- Hero images generated via Pollinations.ai using nanobanana model
- Frontmatter includes: `title`, `description`, `pubDate`, `tags`, `heroImage`, `source`, `originalUrl`

### Key Files
- `astro.config.mjs` - Astro configuration
- `src/content/config.ts` - Content collection schema with blog post types
- `src/pages/blog/[...slug].astro` - Blog post page template
- `src/layouts/BlogPost.astro` - Blog post layout

## Architecture Notes

- Uses Astro Content Collections with TypeScript schema validation
- MDX support via `@astrojs/mdx` integration
- Sharp for image optimization during build
- Sitemap and RSS feed generation via Astro plugins
- Blog posts sorted by pubDate (newest first)

## Image Assets

Hero images are stored in `src/assets/blog/hero-images/` and referenced via `../../assets/blog/hero-images/[slug].jpg` in blog post frontmatter.

**Generating Hero Images:**

The hero images use a consistent steampunk techno wizard character (grey goatee, dark hair, rectangular rim-less glasses) performing actions relevant to each blog post.

**Method 1: Pollinations.ai API (Recommended)**

```bash
# Using the download script in scripts/
bash scripts/download-wizard-hero-images.cjs
```

Each image is 1024x512px JPEG. The prompt format:
```
steampunk pixelart wizard grey goatee glasses <<ACTION>> to the subject of <<SUBJECT>>
```

**Method 2: Direct curl (for single images)**

```bash
# Prompt must be URL-encoded
curl -s "https://gen.pollinations.ai/image/steampunk%20pixelart%20wizard%20grey%20goatee%20glasses%20<<ACTION>>%20to%20subject%20of%20<<SUBJECT>>?model=nanobanana&width=1024&height=512&nologo=true" \
  --header "Accept: */*" \
  --header "Authorization: Bearer ${POLLINATIONS_API_KEY}" \
  -o "src/assets/blog/hero-images/[SLUG].jpg"
```

Replace:
- `<<ACTION>>` - The wizard's action (e.g., "casting SEO spell", "crafting proxy construct")
- `<<SUBJECT>>` - The blog post subject (e.g., "ASP.NET error pages", "WCF services")
- `[SLUG]` - The blog post's slug/filename (e.g., `2010-03-20-aspnet-and-custom-error-pages-seo`)
