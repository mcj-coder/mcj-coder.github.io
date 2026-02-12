#!/bin/bash
# Validate assets: check for orphaned files, missing references, and oversized images

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

echo "Validating assets..."

# Function to check if a file exists in repo
file_exists_in_repo() {
    local file="$1"
    [[ -f "$PROJECT_ROOT/$file" ]]
}

# ============================================
# 1. Check hero image references in blog posts
# ============================================
echo ""
echo "Checking hero image references..."

BLOG_DIR="$PROJECT_ROOT/src/content/blog"
HERO_DIR="$PROJECT_ROOT/src/assets/blog/hero-images"

for md_file in "$BLOG_DIR"/*.md; do
    if [[ -f "$md_file" ]]; then
        # Extract heroImage from frontmatter
        hero_image=$(grep -m 1 'heroImage:' "$md_file" | sed 's/.*heroImage: *//; s/"//g; s/[^[:print:]]//g')

        if [[ -n "$hero_image" ]]; then
            # Convert the path to actual file location
            # Path format in frontmatter: ../../assets/blog/hero-images/[slug].jpg
            hero_basename=$(basename "$hero_image")
            hero_path="$HERO_DIR/$hero_basename"

            if [[ ! -f "$hero_path" ]]; then
                echo -e "${RED}X Missing hero image:${NC} $(basename "$md_file") -> $hero_basename"
                ((ERRORS++))
            fi
        fi
    fi
done

# ============================================
# 2. Check for orphaned hero images
# ============================================
echo ""
echo "Checking for orphaned hero images..."

if [[ -d "$HERO_DIR" ]]; then
    for img_file in "$HERO_DIR"/*.jpg "$HERO_DIR"/*.jpeg "$HERO_DIR"/*.png; do
        [[ -f "$img_file" ]] || continue

        img_basename=$(basename "$img_file")
        referenced=false

        # Check if any blog post references this image
        for md_file in "$BLOG_DIR"/*.md; do
            [[ -f "$md_file" ]] || continue
            if grep -q "$img_basename" "$md_file"; then
                referenced=true
                break
            fi
        done

        if [[ "$referenced" == false ]]; then
            echo -e "${YELLOW}! Orphaned hero image:${NC} $img_basename"
            ((WARNINGS++))
        fi
    done
fi

# ============================================
# 3. Check for duplicate images between src/assets/blog and public/images/blog
# ============================================
echo ""
echo "Checking for duplicate images..."

BLOG_ASSETS_DIR="$PROJECT_ROOT/src/assets/blog"
PUBLIC_BLOG_DIR="$PROJECT_ROOT/public/images/blog"

if [[ -d "$PUBLIC_BLOG_DIR" ]]; then
    for public_img in "$PUBLIC_BLOG_DIR"/*; do
        [[ -f "$public_img" ]] || continue
        basename=$(basename "$public_img")

        # Check if same file exists in src/assets/blog
        if [[ -f "$BLOG_ASSETS_DIR/$basename" ]]; then
            echo -e "${YELLOW}! Duplicate image:${NC} $basename exists in both src/assets/blog/ and public/images/blog/"
            ((WARNINGS++))
        fi
    done
fi

# ============================================
# Summary
# ============================================
echo ""
if [[ $ERRORS -gt 0 ]]; then
    echo -e "${RED}X Validation failed with $ERRORS error(s)${NC}"
    exit 1
elif [[ $WARNINGS -gt 0 ]]; then
    echo -e "${YELLOW}! Validation passed with $WARNINGS warning(s)${NC}"
    exit 0
else
    echo -e "${GREEN}OK All asset validations passed!${NC}"
    exit 0
fi
