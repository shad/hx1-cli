# Release Process

This document describes how to create a new release of HX One CLI.

## Prerequisites

1. All changes committed and pushed to `main`
2. All tests passing: `bun run check-all`
3. CHANGELOG.md updated with changes for this version
4. npm account with publish access to `@shadr/hx1-cli`

## Release Steps

### 1. Update Version

Choose the appropriate version bump based on the changes:

```bash
# Choose one:
npm version patch  # 1.0.0 -> 1.0.1 (bug fixes)
npm version minor  # 1.0.0 -> 1.1.0 (new features)
npm version major  # 1.0.0 -> 2.0.0 (breaking changes)

# Example for patch release:
npm version patch
```

This will:
- Update version in `package.json`
- Create a git commit with the version change
- Create a git tag (e.g., `v1.0.1`)

### 2. Push Tag to GitHub

```bash
git push origin main --tags
```

This triggers the GitHub Actions workflow that will:
- ✅ Run all tests
- ✅ Run type checking
- ✅ Run linting
- ✅ Build the package
- ✅ Validate the release is ready

### 3. Monitor GitHub Actions

1. Go to https://github.com/shad/hx1-cli/actions
2. Watch the "Release Validation" workflow
3. Ensure all checks pass successfully

### 4. Publish to npm

After the GitHub Actions validation passes:

```bash
# Make sure you're on the tagged version
git checkout v1.0.1  # or whatever version you just created

# Login to npm (if not already logged in)
npm login

# Run all checks locally one final time
bun run check-all

# Build the package
bun run build

# Publish (--access public required for scoped packages)
npm publish --access public
```

### 5. Verify npm Package

After publishing, verify the package is available:

```bash
# View package info
npm view @shadr/hx1-cli

# Test installation in a clean environment
npm install -g @shadr/hx1-cli

# Verify it works
hx1 --version
```

### 6. Announce

After verifying the release:

1. Post to Line 6 HX One forums
2. Share in relevant communities (Reddit, Discord, etc.)
3. Update any documentation sites

## npm Publishing Notes

**Why manual npm publishing?**
- Manual publishing keeps npm tokens secure and under tight control
- Allows final verification before release
- Gives opportunity to test the built package locally

**The `--access public` flag:**
- Required for scoped packages (`@shadr/hx1-cli`)
- Makes the package publicly available on npm
- Without it, scoped packages default to private (requires paid npm account)

**Never commit your npm token to the repository.**

## Troubleshooting

### GitHub Actions validation fails

- Check the Actions log for specific errors
- Ensure all tests pass locally: `bun run check-all`
- Fix issues and push again (no need to re-tag unless you want to)

### npm publish fails

**Version already exists:**
```
npm ERR! 403 You cannot publish over the previously published versions
```
Solution: Bump version again with `npm version patch` (or minor/major)

**Not logged in:**
```
npm ERR! need auth This command requires you to be logged in
```
Solution: Run `npm login` first

**No publish permissions:**
```
npm ERR! 403 You do not have permission to publish "@shadr/hx1-cli"
```
Solution: Verify you're logged in with the correct npm account that owns the `@shadr` scope

**Package not found after publishing:**
Wait a few minutes - npm CDN can take time to propagate. Check https://www.npmjs.com/package/@shadr/hx1-cli

## Rollback

If you need to rollback a release:

```bash
# Delete the tag locally
git tag -d v1.0.1

# Delete the tag remotely
git push origin :refs/tags/v1.0.1

# Unpublish from npm (only within 72 hours of publishing)
npm unpublish @shadr/hx1-cli@1.0.1
```

**Important:** npm has restrictions on unpublishing:
- Can only unpublish within 72 hours of publishing
- After 72 hours, you can only deprecate: `npm deprecate @shadr/hx1-cli@1.0.1 "This version has issues, please upgrade"`

## Version Guidelines

Follow [Semantic Versioning](https://semver.org/):

- **Patch (1.0.x)**: Bug fixes, documentation updates, internal changes
- **Minor (1.x.0)**: New features, non-breaking changes
- **Major (x.0.0)**: Breaking changes, major rewrites

## Pre-release Versions

For testing before official release:

```bash
# Create a pre-release version
npm version prerelease --preid=beta
# Creates: 1.0.1-beta.0

# Push tag
git push origin main --tags

# Publish with beta tag (doesn't affect "latest" tag)
npm publish --access public --tag beta

# Users can install with:
# npm install -g @shadr/hx1-cli@beta
```

This creates a release but marks it as pre-release, allowing testing without affecting the stable release.

## Quick Reference

```bash
# Full release workflow
npm version patch                    # Bump version, create tag
git push origin main --tags          # Push to GitHub, trigger validation
npm login                            # Login to npm (if needed)
bun run check-all                    # Final local verification
bun run build                        # Build package
npm publish --access public          # Publish to npm
npm view @shadr/hx1-cli             # Verify publication
```
