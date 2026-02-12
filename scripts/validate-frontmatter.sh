#!/bin/bash
# Validate frontmatter consistency across blog posts

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

ERRORS=0

echo "Validating frontmatter..."

BLOG_DIR="$PROJECT_ROOT/src/content/blog"

# Check required fields and date formats
for md_file in "$BLOG_DIR"/*.md; do
    [[ -f "$md_file" ]] || continue

    filename=$(basename "$md_file")

    # Check for required fields
    if ! grep -q '^title:' "$md_file"; then
        echo -e "${RED}X Missing required field 'title' in:${NC} $filename"
        ((ERRORS++))
    fi

    if ! grep -q '^description:' "$md_file"; then
        echo -e "${RED}X Missing recommended field 'description' in:${NC} $filename"
    fi

    if ! grep -q '^pubDate:' "$md_file"; then
        echo -e "${RED}X Missing required field 'pubDate' in:${NC} $filename"
        ((ERRORS++))
    fi

    # Check for valid source value
    if grep -q '^source:' "$md_file"; then
        source=$(grep '^source:' "$md_file" | sed 's/source: *//; s/"//g' | tr -d '[:space:]')
        if [[ "$source" != "hugo" && "$source" != "blogger" && "$source" != "new" ]]; then
            echo -e "${RED}X Invalid 'source' value in:${NC} $filename (must be: hugo, blogger, or new)"
            ((ERRORS++))
        fi
    fi

    # Check date format (should be ISO 8601: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
    pub_date=$(grep '^pubDate:' "$md_file" | sed 's/pubDate: *//; s/"//g' | tr -d '[:space:]')
    if [[ -n "$pub_date" ]]; then
        if ! [[ "$pub_date" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}(T[0-9]{2}:[0-9]{2}(:[0-9]{2}(\.[0-9]+)?(Z|[+-][0-9]{2}:[0-9]{2})?)?$ ]]; then
            echo -e "${RED}X Invalid date format in:${NC} $filename (pubDate: $pub_date)"
            ((ERRORS++))
        fi
    fi
done

echo ""
if [[ $ERRORS -gt 0 ]]; then
    echo -e "${RED}X Frontmatter validation failed with $ERRORS error(s)${NC}"
    exit 1
else
    echo -e "${GREEN}OK All frontmatter validations passed!${NC}"
    exit 0
fi
