#!/usr/bin/env python3
"""
Fix code blocks in migrated Blogger posts - merge consecutive fenced blocks.
"""

import re
from pathlib import Path

def fix_code_blocks(content):
    """Merge consecutive code fence blocks and clean up formatting."""

    # First, merge consecutive code fence blocks
    # Pattern: multiple ```csharp blocks with content in between
    lines = content.split('\n')
    result = []
    i = 0

    while i < len(lines):
        line = lines[i]

        # Check if this starts a code fence
        if line.strip().startswith('```'):
            fence = line.strip()
            lang = fence[3:] if len(fence) > 3 else ''

            # Collect all consecutive code blocks
            all_code_lines = []
            i += 1

            while i < len(lines):
                inner_line = lines[i]

                # If we hit another fence, check if it's the same type
                if inner_line.strip().startswith('```') and inner_line.strip() != fence:
                    # Different fence or closing fence
                    break

                # If it's content (not a fence line), collect it
                if not inner_line.strip().startswith('```'):
                    all_code_lines.append(inner_line)
                    i += 1
                else:
                    # Same fence type - empty line or similar
                    i += 1
                    continue

            # Skip trailing empty code lines
            while all_code_lines and not all_code_lines[-1].strip():
                all_code_lines.pop()

            # Output merged code block
            if all_code_lines:
                result.append('```csharp')
                result.extend(all_code_lines)
                result.append('```')
                result.append('')
            else:
                # Empty block, skip
                pass

            # Skip to next non-empty line
            while i < len(lines) and not lines[i].strip():
                i += 1
            continue

        result.append(line)
        i += 1

    return '\n'.join(result)

def process_file(file_path):
    """Process a single markdown file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check if file has consecutive code blocks
    if re.search(r'```\n```', content):
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
