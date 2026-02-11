#!/usr/bin/env python3
"""
Fix code blocks in migrated Blogger posts.
Merge consecutive code blocks with same language.
"""

import re
from pathlib import Path

def fix_blog_post(content):
    """Fix formatting in a blog post."""

    # Find all code fence patterns and merge consecutive ones with same language
    # Pattern: ```csharp\nsingle line\n```\ncsharp\n```\n becomes one block

    # Replace: ```csharp\n...\n...\n```\n```csharp\n...\n...\n```
    # With: ```csharp\n...\n...\n```

    # First, merge consecutive fences of same type
    def replace_consecutive_fences(content):
        pattern = r'```(\w+)\n(.*?)\n```(?:\n```(\w+)\n(.*?)\n```)*\n)*'
        matches = list(re.finditer(pattern, content, re.MULTILINE | re.DOTALL))

        if not matches:
            return content

        # Process from end to beginning (to handle overlapping correctly)
        result = content
        for match in reversed(matches):
            # Get the full match
            full_match = match.group(0)

            # What to replace with: just the first and second occurrence combined
            replacement = f"```{full_match.group(1)}\n{full_match.group(2)}\n"

            # Only replace if there's another block of same type after
            # The pattern handles this by matching from the next occurrence
            result = result[:match.start()] + replacement + result[match.end():]

        return result

    # Apply the fix
    fixed_content = replace_consecutive_fences(content)

    return fixed_content

def process_file(file_path):
    """Process a single markdown file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check if file has consecutive code blocks
    if '```' in content:
            # Check if it would be affected by our fix
            if re.search(r'```\w+\n.*?\n```', content):
                print(f"Fixing: {file_path.name}")
                fixed_content = fix_blog_post(content)

                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(fixed_content)
                return True
    return False

def main():
    blog_dir = Path('src/content/blog')
    count = 0

    for md_file in sorted(blog_dir.glob('*.md')):
        if process_file(md_file):
            count += 1

    print(f"\nFixed {count} files")

if __name__ == '__main__':
    main()
