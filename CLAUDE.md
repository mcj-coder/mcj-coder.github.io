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

Hero images are stored in `src/assets/blog/hero-images/` and referenced via `../../assets/blog/hero-images/[slug].jpg` in blog post frontmatter. Images are generated using Pollinations.ai with a consistent steampunk techno wizard character theme.
