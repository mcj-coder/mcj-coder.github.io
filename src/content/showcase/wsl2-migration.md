---
title: "WSL2 Migration"
published: 2026-02-05
description: "Automated, idempotent WSL2 bootstrap system for complete development environment setup"
repo: "https://github.com/mcj-coder/wsl2-migration"
technologies: ["Bash", "WSL2", "DevOps", "Automation", "Bootstrap"]
featured: false
---

An automated bootstrap system for WSL2 that creates a complete, reproducible development environment on fresh WSL2 installations.

## Features

- Idempotent installation (safe to run multiple times)
- Complete development toolchain setup
- Dotfiles management
- SSH key configuration
- Docker and development tools installation
- Custom shell configuration

## What It Sets Up

- Git with proper configuration
- Node.js and npm
- Docker and Docker Compose
- VS Code server integration
- Custom shell aliases and functions
- SSH keys for GitHub access

## Usage

```bash
curl -fsSL https://raw.githubusercontent.com/mcj-coder/wsl2-migration/main/bootstrap.sh | bash
```

Perfect for quickly setting up a new development machine or recovering from a corrupted WSL2 instance.
