# Maintainers

Papermerge OSS (Open Source) is a self-hosted document management system for scanned documents.
This document lists the current maintainers, what they are responsible for, and how decisions are made.

> Papermerge Cloud (SaaS) ([papermerge.com](https://papermerge.com)) is managed, GoBD-compliant document management
> with professional support and is not governed by this document.

## Current Maintainers

| Maintainer | GitHub ID                                 |
|------------|-------------------------------------------|
| Nossama    | [delasio](https://github.com/delasio)     |
| Thomas     | [Jalst](https://github.com/Jalst)         |
| martinf    | [marfoerst](https://github.com/marfoerst) |

## Responsibilities

Maintainers are expected to:

- Triage issues and pull requests (label, ask for details, close duplicates or stale items)
- Review and merge pull requests that meet the [contribution guidelines](CONTRIBUTING.md)
- Cut releases and publish artifacts (such as container images) where applicable
- Keep documentation and the README accurate
- Keep discussions respectful and moderate them when needed
- Handle security reports privately and coordinate fixes

## Decision making

- **Everyday changes** (bug fixes, small improvements, docs): one maintainer approval is enough.
- **Significant changes** (new features, breaking changes, dependency or architecture changes, license or governance changes): open an issue or Discussion first and allow at least 7 days for feedback. Aim for consensus among maintainers; if there is none, a majority vote of the maintainers decides.
- **Authors don't self-merge non-trivial PRs** when another maintainer is available to review.
- Security fixes may be merged with expedited review and disclosed after release.

## Becoming a maintainer

Maintainers are invited from among contributors who have shown sustained, quality involvement, such as:

1. Several contributions (merged code, docs, or translations, or sustained triage work)
2. Constructive, respectful communication in issues, PRs, and Discussions
3. Familiarity with the project's codebase and conventions

Any current maintainer can nominate a contributor by opening a private discussion among maintainers.
A nomination is accepted if a majority of maintainers approve and no maintainer objects on
substantive grounds. New maintainers are announced in the repository.

## Stepping down and inactivity

Maintainers may step down at any time by notifying the team; they are thanked and listed
under "Emeritus" below. Maintainers who are inactive for 6 months may be moved to emeritus
status, and their write access removed, after an attempt to contact them. They are welcome to return.

## Emeritus maintainers

| Maintainer | GitHub ID                             |
|------------|---------------------------------------|
| Eugen Ciur | [ciur](https://github.com/ciur)       |

## Access and secrets

The maintainer team keeps an up-to-date record (kept outside this public repository) of who
has access to: GitHub repository and organization settings, Docker Hub, and any CI secrets.
Access is granted on a least-privilege basis and reviewed when maintainers join or leave.

## Contact

- General questions: [Discussions](https://github.com/papermerge/papermerge-core/discussions)
- Bugs and feature requests: [Issues](https://github.com/papermerge/papermerge-core/issues)
- Security issues: use the repository's **Security** tab ("Report a vulnerability"), not public issues