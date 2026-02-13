---
name: blog-migration
description: Use when migrating or fixing blog posts from martinondotnet.blogspot.com, re-transcribing poorly migrated hugo-sourced posts, or when the user says to migrate a blog post
---

# Blog Post Migration from Blogger

Re-transcribe poorly migrated blog posts from the original Blogger source at martinondotnet.blogspot.com into clean markdown.

## Overview

The blog was originally on Blogger, migrated to Hugo (losing code blocks, mangling formatting), then to Astro. Posts with `source: hugo` need re-transcription from the original Blogger source. Posts with `source: blogger` are already done.

## Known Issues in Hugo-Sourced Posts

- **Empty code blocks** - Code lost during Blogger-to-Hugo migration (just whitespace between fences)
- **Old Hugo frontmatter** embedded in the content body below the Astro frontmatter
- **Mangled lists** - 5-space indent + `*` instead of standard `-` or `1.`
- **Missing descriptions** - `description: ''`
- **Wrong originalUrl** - Points to `codifice.dev` instead of blogspot
- **Unresolved shortened URLs** - `bit.ly`, `goo.gl`, `t.co` links still present
- **HTML artifacts** - `&amp;`, stray `<a>` tags, encoded entities

## Sitemap

All source posts: `https://martinondotnet.blogspot.com/sitemap.xml` (62 URLs)

## Slug Matching

Blogspot URL path slug matches the repo filename slug after the date prefix:

```
Blogspot: /2010/03/aspnet-and-custom-error-pages-seo.html
Repo:     2010-03-20-aspnet-and-custom-error-pages-seo.md
```

## Migration Workflow Per Post

### 1. Read the Existing Repo File

```bash
# Identify issues: empty code blocks, mangled formatting, embedded Hugo frontmatter
Read src/content/blog/{slug}.md
```

Note what content exists, what's broken, and what images are already referenced.

### 2. Fetch the Blogger Source

```bash
WebFetch https://martinondotnet.blogspot.com/{year}/{month}/{slug}.html
```

Request the FULL content including all code blocks, images, and links. The Blogger markup is complex with nested `<div>`, `<span>` with inline styles, and Blogger-specific classes. **Do not attempt to regex/script the conversion** - manually transcribe to clean markdown.

### 3. Transcribe to Clean Markdown

**Rules:**

- Transcribe content faithfully from the Blogger source
- Correct spelling errors only (not grammar or style)
- Use proper markdown: `#` headings, `-` lists, ` ``` ` fenced code blocks with language tags
- Code blocks MUST include the language identifier (e.g., ` ```csharp `, ` ```xml `, ` ```sql `)
- Preserve the author's voice, emphasis (`**bold**`, `_italic_`), and structure
- Remove any embedded old Hugo frontmatter from the content body
- Convert HTML entities to actual characters

### 4. Resolve Shortened Links

For every `bit.ly`, `goo.gl`, `t.co`, or other shortened URL:

```bash
# Follow redirects to get the final destination
curl -sI -L "https://bit.ly/xxxxx" 2>&1 | grep -i "^location:"
```

Replace with the final destination URL. If the destination is dead, keep the original with a comment: `[link text](https://original-url "Link may be broken")`.

### 5. Migrate Images

**Inline images** from Blogger CDN (e.g., `blogger.googleusercontent.com`, `bp.blogspot.com`):

```bash
# Download to src/assets/blog/ with slug-prefixed descriptive name
curl -sL "https://blogger.googleusercontent.com/img/..." \
  -o "src/assets/blog/{slug}-{descriptive-name}.png"
```

**Naming convention:** `{post-slug}-{descriptive-name}.{ext}`

Example: `diagnosing-tricky-aspnet-production-image_thumb.png`

**Reference in markdown:**

```markdown
![Description](../../assets/blog/{slug}-{descriptive-name}.png)
```

Check if images already exist in `src/assets/blog/` before downloading - many were migrated during the Hugo phase.

### 6. Migrate Downloadable Assets

Check the OneDrive folder for attachments referenced in the post:

```bash
ls "/mnt/c/Users/mcj/OneDrive/Public/MartinOnDotNet/"
```

Available files:

- `AdvancedControlAdapter.zip`
- `CodeBehindRemover.zip`
- `IIS7Web.zip`
- `MasterPageBodyClass.zip`
- `QLXFilters.zip`
- `TypeConversion.zip`
- `Verification Tests.zip`

Copy matched assets to `public/downloads/{slug}/`:

```bash
mkdir -p public/downloads/{slug}
cp "/mnt/c/Users/mcj/OneDrive/Public/MartinOnDotNet/{file}" public/downloads/{slug}/
```

Reference in markdown:

```markdown
[Download the source code](/downloads/{slug}/{file})
```

### 7. Update Frontmatter

```yaml
---
title: 'Exact title from Blogger source'
description: 'Write a meaningful 1-2 sentence description from the post content'
pubDate: YYYY-MM-DD # Keep existing date
updatedDate: YYYY-MM-DD # Keep if exists, add from Blogger if visible
tags: ['tag1', 'tag2'] # Keep existing or improve from Blogger labels
source: blogger # Change from 'hugo' to 'blogger'
originalUrl: 'http://martinondotnet.blogspot.com/{year}/{month}/{slug}.html'
heroImage: ../../assets/blog/hero-images/{slug}.jpg # Keep existing
---
```

**Key changes:**

- `source`: `hugo` -> `blogger`
- `originalUrl`: `codifice.dev` URL -> blogspot URL
- `description`: Fill in if empty
- `title`: Verify matches Blogger source (may have been truncated)

### 8. Review the Migration

After writing the file, verify:

```
- [ ] Content matches Blogger source faithfully
- [ ] All code blocks have content (no empty blocks) and language identifiers
- [ ] All images are present in src/assets/blog/ and render correctly
- [ ] All links are functional (no shortened URLs remain)
- [ ] No HTML artifacts or entities remain
- [ ] No embedded Hugo frontmatter in content body
- [ ] Frontmatter is complete and correct
- [ ] Description field is filled in
- [ ] source is 'blogger' and originalUrl points to blogspot
- [ ] Markdown passes lint: npm run lint:md
- [ ] Post builds without errors: npm run build
```

## Quick Reference: Post Status

| Status          | Count | Criteria                                                       |
| --------------- | ----- | -------------------------------------------------------------- |
| Done (blogger)  | 4     | `source: blogger` - already re-transcribed                     |
| Needs migration | 57    | `source: hugo` with matching blogspot URL                      |
| No repo file    | 1     | `martin-on-net-is-changing-to` (migration announcement - skip) |

To find posts still needing migration:

```bash
grep -l "source: hugo" src/content/blog/*.md
```

## Common Pitfalls

- **WebFetch may summarize** - If code blocks are truncated, request specific sections
- **Blogger code uses SyntaxHighlighter** - Look for `<pre class="brush:">` blocks
- **Images may be thumbnails** - Blogger often wraps thumbnails in links to full-size images; use the full-size URL
- **Download links may point to dead services** - Check OneDrive folder as fallback
- **Some posts reference other posts** - Update internal links to the new Astro blog URL format: `/blog/{slug}`
