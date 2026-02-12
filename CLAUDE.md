# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Astro-based blog hosted on GitHub Pages. The blog uses Markdown content collections with frontmatter schema validation. Build outputs to `./dist/` which gets deployed via GitHub Actions.

## Commands

### Development

```bash
npm run dev          # Start local dev server at localhost:4321
npm run build        # Build production site to ./dist/
npm run preview      # Preview build locally
```

### Quality Gates

```bash
npm run lint         # Run all linters (format, markdown, assets, secrets)
npm run lint:format  # Check code formatting with Prettier
npm run lint:md      # Lint markdown files
npm run lint:assets  # Validate assets (orphaned files, missing references)
npm run lint:secrets # Scan for API keys, credentials, secrets
npm run format       # Format all files (code + markdown)
npm run format:code  # Format code with Prettier
npm run format:md    # Fix markdown lint issues
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

**Direct curl (for single images)**

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

### Hero Image Quality Assurance

**Invoke the `hero-images` skill for generating and validating hero images.**

The skill handles:

- Pollinations.ai generation with nanobanana model
- OCR validation using `mcp__4_5v_mcp__analyze_image`
- CDN caching workaround using unique filenames
- Known model hallucinations and workarounds

Usage: `/hero-images` or invoke via Skill tool when generating or validating hero images.

## Repository Policies

**DO NOT commit the following to this repository:**

- Transient helper scripts, one-off utilities, or experimental tools
- API keys, credentials, secrets, or any sensitive configuration
- `.env` files containing sensitive data
- Personal development tools or configuration

Use environment variables for sensitive values and keep helper scripts local to your development environment only.

## Quality Standards

### Code Formatting

- **Prettier** configured for consistent formatting (100 char line width, single quotes, 2-space tabs)
- **EditorConfig** ensures consistent editor settings across team members
- Run `npm run format` before committing changes

### Markdown Standards

- **Markdownlint** enforces consistent markdown style
- ATX-style headings (`#` vs `=====` underlines)
- Fenced code blocks with backticks
- No trailing whitespace (except in markdown for line breaks)

### Commit Message Format

Follow **Conventional Commits** specification:

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`, `perf`, `ci`, `build`, `content`, `asset`

Examples:

- `feat(blog): add dark mode toggle`
- `fix(content): correct broken link in migration post`
- `asset(hero): regenerate wizard image for K8s post`

### Frontmatter Validation

Required fields for blog posts:

- `title` - Post title
- `description` - Short description/summary
- `pubDate` - ISO 8601 date format (`YYYY-MM-DD` or `YYYY-MM-DDTHH:MM:SS`)
- `source` - One of: `hugo`, `blogger`, `new`

Optional fields:

- `tags` - Array of tag strings
- `heroImage` - Relative path to hero image
- `originalUrl` - Original blog post URL
- `updatedDate` - Last modified date

### Asset Validation

The `scripts/validate-assets.sh` script checks:

1. **Missing hero images** - Blog posts reference non-existent hero images
2. **Orphaned hero images** - Images not referenced by any blog post
3. **Oversized images** - Images larger than 1MB (should be optimized)
4. **Duplicate images** - Same file in `src/assets/blog/` and `public/images/blog/`

### Secret Detection

**Secretlint** runs on every commit to prevent leaking credentials:

- Detects API keys, tokens, passwords, certificates
- Configured in `.secretlintrc.json`
- Automatically runs in pre-commit hook
- Manually: `npm run lint:secrets`
- Ignored directories: `node_modules`, `dist`, `.astro`

### Pre-commit Hooks

Husky git hooks run automatically:

- **pre-commit**: Checks for secrets, lints staged files via lint-staged
- **commit-msg**: Validates commit message format via commitlint
- **pre-push**: Runs full quality gate (secrets, format, markdown, assets, build)

### CI/CD Quality Gates

- **Quality Gate workflow** runs on all PRs before merge
- Checks: formatting, markdown lint, asset validation, secret detection, build success
- See `.github/workflows/quality-gate.yml`
