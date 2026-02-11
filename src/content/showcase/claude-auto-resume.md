---
title: "Claude Auto Resume"
published: 2025-01-09
description: "A cross-platform dotnet tool to trigger the automatic resumption of headless and interactive claude sessions when session limits are hit"
repo: "https://github.com/mcj-coder-org/claude-auto-resume"
technologies: ["C#", ".NET 10", "Claude API", "Cross-platform", "CLI"]
featured: true
---

A command-line tool that monitors Claude AI sessions and automatically resumes them when token limits are reached. This enables long-running automation workflows to continue without manual intervention.

## Features

- Cross-platform support (Linux, macOS, Windows)
- Works with both headless and interactive Claude sessions
- Automatic session resumption when limits are hit
- Configurable monitoring intervals
- Minimal resource footprint

## Use Cases

- Long-running code generation tasks
- Automated refactoring workflows
- Batch processing with AI assistance
- Unattended AI-powered automation

## Getting Started

```bash
dotnet tool install --global mcj-coder-org.ClaudeAutoResume
claude-auto-resume --session-id <your-session-id>
```
