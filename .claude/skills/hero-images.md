---
name: generating-hero-images
description: Use when generating or validating blog hero images with Pollinations.ai nanobanana model, OCR validating text in pixel art for spelling errors, or regenerating images to fix typos like simemap/HTPS/PRIVILIGES
---

# Hero Images

Generate and OCR-validate blog hero images using Pollinations.ai nanobanana pixel art model.

## The Character

Steampunk techno wizard: grey goatee, dark hair, rectangular rim-less glasses. Action matches blog post content.

## Quick Reference

| Task           | Command                                                                                                                                                                                                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Generate**   | `curl -s "https://gen.pollinations.ai/image/steampunk%20pixelart%20wizard%20grey%20goatee%20glasses%20<<ACTION>>?model=nanobanana&width=1024&height=512&nologo=true&seed=<<SEED>>&image=https://mcj-coder.github.io/_astro/martin-jarvis.DLkCWo3V.jpg" -o "src/assets/blog/hero-images/[SLUG].jpg"` |
| **Validate**   | Read unique file → OCR with `mcp__4_5v_mcp__analyze_image` → Check spelling                                                                                                                                                                                                                         |
| **Regenerate** | Change seed, use unique filename, re-OCR                                                                                                                                                                                                                                                            |

## Known Hallucinations (use synonyms)

| Problem Term    | Appears As   | Use Instead                    |
| --------------- | ------------ | ------------------------------ |
| sitemap         | simemap      | "xml url list", "site links"   |
| troubleshooting | grouskboning | "diagnosing", "fixing"         |
| PRIVILEGES      | PRIVILIGES   | "permissions", "access rights" |
| HTTPS           | HTPS         | "SSL", "secure web"            |

## OCR Validation Workflow

Copy and track:

```
- [ ] Generate with unique filename (append timestamp/seed)
- [ ] Upload unique file to CDN via Read tool
- [ ] OCR with mcp__4_5v_mcp__analyze_image
- [ ] Validate spelling against blog content
- [ ] If typo: regenerate with new seed, repeat from step 1
- [ ] Copy valid image to final filename
- [ ] Delete temporary unique files
```

### Critical: CDN Cache Bypass

The Read tool's CDN caches by filename. Same filename = cached image = stale OCR results.

**Always use unique filenames during validation:**

```bash
TIMESTAMP=$(date +%s)
curl -s "..." -o "src/assets/blog/hero-images/[SLUG]_${TIMESTAMP}.jpg"
# Read the _${TIMESTAMP} file for fresh CDN upload
# OCR validates → then cp to original filename
```

### Example

```bash
# Generate with seed and reference image
curl -s "https://gen.pollinations.ai/image/steampunk%20pixelart%20wizard%20grey%20goatee%20glasses%20holding%20golden%20key?model=nanobanana&width=1024&height=512&nologo=true&seed=1234&image=https://mcj-coder.github.io/_astro/martin-jarvis.DLkCWo3V.jpg" \
  --header "Authorization: Bearer ${POLLINATIONS_API_KEY}" \
  -o "src/assets/blog/hero-images/my-post_1234.jpg"

# Read file → get CDN URL → OCR → verify text → copy to my-post.jpg
```
