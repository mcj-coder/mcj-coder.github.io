#!/usr/bin/env python3
"""
Convert Blogger Atom export to Markdown files for Astro blog.
"""

import xml.etree.ElementTree as ET
import html
import re
from datetime import datetime
from pathlib import Path

# Namespaces
NS = {'atom': 'http://www.w3.org/2005/Atom',
       'blogger': 'http://schemas.google.com/blogger/2018'}

def clean_html_content(content):
    """Convert Blogger HTML to cleaner Markdown format."""
    # Remove Blogger-specific comments
    content = re.sub(r'<!--CRLF-->', '', content)
    content = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)

    # Convert HTML entities
    content = html.unescape(content)

    # Convert <p> tags to newlines
    content = re.sub(r'<p>(.*?)</p>', r'\1\n\n', content, flags=re.DOTALL)

    # Convert <h4> to ##
    content = re.sub(r'<h4>(.*?)</h4>', r'\n## \1\n', content, flags=re.DOTALL)

    # Convert <pre><code> blocks
    content = re.sub(r'<pre[^>]*>.*?<code[^>]*>(.*?)</code>.*?</pre>', r'```\n\1\n```\n', content, flags=re.DOTALL)

    # Convert <code> inline
    content = re.sub(r'<code>(.*?)</code>', r'`\1`', content, flags=re.DOTALL)

    # Convert <a> tags
    content = re.sub(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', r'[\2](\1)', content, flags=re.DOTALL)

    # Convert <strong> and <b>
    content = re.sub(r'<(strong|b)>(.*?)</\1>', r'**\2**', content, flags=re.DOTALL)

    # Convert <em> and <i>
    content = re.sub(r'<(em|i)>(.*?)</\1>', r'*\2*', content, flags=re.DOTALL)

    # Convert <ul> and <li>
    content = re.sub(r'<li>(.*?)</li>', r'* \1', content, flags=re.DOTALL)
    content = re.sub(r'</?ul>', '', content)

    # Convert <ol> and <li> (simplified - doesn't handle renumbering)
    content = re.sub(r'<ol>', '', content)
    content = re.sub(r'</ol>', '', content)

    # Remove remaining HTML tags
    content = re.sub(r'<[^>]+>', '', content)

    # Clean up whitespace
    content = re.sub(r'\n{3,}', '\n\n', content)
    content = content.strip()

    return content

def slugify(title):
    """Convert title to URL-safe slug."""
    title = title.lower()
    title = re.sub(r'[^\w\s-]', '', title)
    title = re.sub(r'[\s_]+', '-', title)
    title = re.sub(r'-{2,}', '-', title)
    title = title.strip('-')
    return title

def parse_blogger_atom(atom_file, output_dir):
    """Parse Blogger Atom export and create Markdown files."""
    tree = ET.parse(atom_file)
    root = tree.getroot()

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Find all entries
    for entry in root.findall('atom:entry', NS):
        # Get entry type
        entry_type = entry.find('blogger:type', NS)
        if entry_type is None or entry_type.text != 'POST':
            continue  # Skip comments and non-posts

        # Get status
        status = entry.find('blogger:status', NS)
        if status is not None and status.text != 'LIVE':
            continue  # Skip non-live posts

        # Get title
        title_elem = entry.find('atom:title', NS)
        title = title_elem.text if title_elem is not None else 'Untitled'

        # Get content
        content_elem = entry.find('atom:content', NS)
        content = content_elem.text if content_elem is not None else ''

        # Get published date
        published_elem = entry.find('atom:published', NS)
        published = published_elem.text if published_elem is not None else ''

        # Parse date
        try:
            pub_date = datetime.fromisoformat(published.replace('Z', '+00:00'))
            date_str = pub_date.strftime('%Y-%m-%d')
        except:
            date_str = '2020-01-01'

        # Create slug
        slug = slugify(title)

        # Convert content to Markdown
        markdown_content = clean_html_content(content)

        # Create frontmatter
        frontmatter = f"""---
title: "{title}"
description: "Technical blog post from {date_str}"
pubDate: {date_str}
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

{markdown_content}
"""

        # Write file
        filename = f"{date_str}-{slug}.md"
        file_path = output_path / filename

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(frontmatter)

        print(f"Created: {filename}")

if __name__ == '__main__':
    import sys

    if len(sys.argv) < 3:
        print("Usage: python blogger_to_markdown.py <atom_file> <output_dir>")
        sys.exit(1)

    atom_file = sys.argv[1]
    output_dir = sys.argv[2]

    parse_blogger_atom(atom_file, output_dir)
    print("\nConversion complete!")
