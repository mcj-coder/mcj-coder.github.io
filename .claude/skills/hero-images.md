---
name: hero-images
description: Generate and validate blog hero images using Pollinations.ai
---

# Hero Image Generation & Quality Assurance

This skill handles generating and validating hero images for blog posts using Pollinations.ai with the nanobanana pixel art model.

## Image Generation

All hero images use a consistent steampunk techno wizard character (grey goatee, dark hair, rectangular rim-less glasses) performing actions relevant to each blog post.

### Generation Command

```bash
curl -s "https://gen.pollinations.ai/image/steampunk%20pixelart%20wizard%20grey%20goatee%20glasses%20<<ACTION>>%20to%20subject%20of%20<<SUBJECT>>?model=nanobanana&width=1024&height=512&nologo=true&seed=<<SEED>>" \
  --header "Accept: */*" \
  --header "Authorization: Bearer ${POLLINATIONS_API_KEY}" \
  -o "src/assets/blog/hero-images/[SLUG].jpg"
```

Parameters:

- `<<ACTION>>` - The wizard's action (e.g., "casting SEO spell", "crafting proxy construct")
- `<<SUBJECT>>` - The blog post subject (e.g., "ASP.NET error pages", "WCF services")
- `<<SEED>>` - Optional integer for reproducible results (omit for random)
- `[SLUG]` - The blog post's slug/filename (e.g., `2010-03-20-aspnet-and-custom-error-pages-seo`)

## Quality Assurance (OCR Validation)

### Critical: CDN Caching Issue

The Read tool's CDN caches by filename. When regenerating images with the same filename, the CDN returns stale cached versions instead of fresh uploads, causing OCR to always see the old image even after regeneration.

**Solution: Use Unique Filenames During Regeneration**

Always append a unique identifier (timestamp, seed, or hash) when regenerating images that need OCR validation:

```bash
# Step 1: Generate with unique filename
TIMESTAMP=$(date +%s)
curl -s "..." -o "src/assets/blog/hero-images/[SLUG]_${TIMESTAMP}.jpg"

# Step 2: Upload to CDN via Read tool
Read tool: "src/assets/blog/hero-images/[SLUG]_${TIMESTAMP}.jpg"
# Returns fresh CDN URL (not cached)

# Step 3: OCR the fresh CDN URL
mcp__4_5v_mcp__analyze_image with prompt: "Extract all text visible in this image. List each line exactly as it appears."

# Step 4: If correct, copy to original filename
cp "src/assets/blog/hero-images/[SLUG]_${TIMESTAMP}.jpg" "src/assets/blog/hero-images/[SLUG].jpg"

# Step 5: Clean up
rm "src/assets/blog/hero-images/[SLUG]_${TIMESTAMP}.jpg"
```

### OCR Process

1. **Upload unique-named file to CDN** - Use Read tool to get temporary CDN URL
2. **Run OCR analysis** - Use `mcp__4_5v_mcp__analyze_image` to extract visible text
3. **Validate spelling** - Compare extracted text against blog post content for correct terminology
4. **Regenerate if typos found** - Use different seed value
5. **Copy to final filename** - Only after verifying correct spelling

### Known Model Hallucinations

The `nanobanana` model has persistent spelling hallucinations for certain technical terms. Work around by using alternative terminology:

| Problem Term    | Appears As               | Use Instead                                           |
| --------------- | ------------------------ | ----------------------------------------------------- |
| sitemap         | simemap                  | "xml url list", "site links", "navigation links"      |
| troubleshooting | trousersot, grouskboning | "diagnosing", "fixing", or retry with different seeds |
| PRIVILEGES      | PRIVILIGES               | "access rights", "permissions", "user rights"         |
| HTTPS           | HTPS                     | "SSL", "secure socket layer", "secure web"            |

### Regeneration Strategy

- Vary the `seed` parameter for different results
- Use synonyms for terms the model consistently misspells
- As a last resort, prompt to exclude text entirely and rely on visual metaphors
- Always re-OCR regenerated images before considering them complete
- Try up to 5-10 seed variations before giving up on a particular term

### Batch Processing

When scanning multiple images for typos:

- Process in groups of 10 to manage context limits
- Use unique filenames for each candidate to avoid CDN cache collisions
- Present findings after each batch for confirmation before regenerating
