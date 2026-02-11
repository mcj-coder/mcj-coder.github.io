#!/usr/bin/env python3
"""
Fix code blocks in migrated Blogger posts.
Converts numbered line format to proper markdown code fences.
"""

import re
from pathlib import Path

def fix_code_blocks(content):
    """Fix poorly formatted code blocks."""

    # Pattern 1: Code blocks with line numbers like "     1: code"
    # These span multiple lines and need to be converted to code fences
    lines = content.split('\n')
    i = 0
    result = []

    while i < len(lines):
        line = lines[i]

        # Check if this line starts a code block (has numbered lines with indentation)
        # Pattern: "      12: some code" or similar
        if re.match(r'^\s{5,}\d+:\s+', line):
            # Found start of a code block
            code_lines = []
            lang = ''  # Could try to detect language

            # Keep collecting lines while they match the code block pattern
            while i < len(lines) and re.match(r'^\s{5,}\d+:\s+', lines[i]):
                # Extract just the code part (after the colon)
                match = re.search(r'^\s{5,}\d+:\s+(.*)$', lines[i])
                if match:
                    code_lines.append(match.group(1))
                i += 1

            # Check if next line is empty or continues
            if i < len(lines) and lines[i].strip() == '':
                i += 1  # Skip empty line after code block

            # Add the code block with proper fencing
            if code_lines:
                result.append('```csharp')
                result.extend(code_lines)
                result.append('```')
                # Add a blank line after
                if i < len(lines) and lines[i].strip():
                    result.append('')
            continue

        result.append(line)
        i += 1

    return '\n'.join(result)

def process_file(file_path):
    """Process a single markdown file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check if file has the problematic code blocks
    if re.search(r'^\s{5,}\d+:\s+', content, re.MULTILINE):
        print(f"Fixing: {file_path.name}")
        fixed_content = fix_code_blocks(content)

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        return True
    return False

def main():
    blog_dir = Path('src/content/blog')
    count = 0

    for md_file in blog_dir.glob('*.md'):
        if process_file(md_file):
            count += 1

    print(f"\nFixed {count} files")

if __name__ == '__main__':
    main()
