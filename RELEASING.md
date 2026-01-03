# Release Process

This document describes how to create a new release of HX One CLI.

## Prerequisites

1. All changes committed and pushed to `main`
2. All tests passing: `bun run check-all`
3. CHANGELOG.md updated with changes for this version
4. (Optional) NPM_TOKEN secret configured in GitHub repository settings

## Release Steps

### 1. Update Version

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
- ✅ Build executables for all platforms (macOS x64, macOS ARM64, Linux x64, Linux ARM64, Windows x64)
- ✅ Run all tests
- ✅ Create platform-specific archives (.tar.gz for Unix, .zip for Windows)
- ✅ Create a GitHub Release with all binaries attached
- ✅ Publish to npm (if NPM_TOKEN secret is set)

### 3. Monitor GitHub Actions

1. Go to https://github.com/shad/hx-one/actions
2. Watch the "Release" workflow
3. Ensure all jobs complete successfully

### 4. Verify Release

After the workflow completes:

1. **Check GitHub Release:**
   - Visit https://github.com/shad/hx-one/releases/latest
   - Verify all 5 platform binaries are attached
   - Verify release notes look good

2. **Test a Binary Download:**
   ```bash
   # Download and test one of the binaries
   curl -L https://github.com/shad/hx-one/releases/latest/download/hx1-macos-arm64.tar.gz | tar xz
   ./hx1 --version
   ```

3. **Check npm (if published):**
   ```bash
   npm view @shadr/hx1-cli
   npm install -g @shadr/hx1-cli
   hx1 --version
   ```

### 5. Announce

After verifying the release:

1. Post to Line 6 HX One forums
2. Share in relevant communities (Reddit, Discord, etc.)
3. Update any documentation sites

## Setting Up npm Publishing (Optional)

To enable automatic npm publishing on release:

1. Create an npm access token:
   - Go to https://www.npmjs.com/settings/[username]/tokens
   - Click "Generate New Token"
   - Choose "Automation"
   - Copy the token

2. Add to GitHub repository secrets:
   - Go to https://github.com/shad/hx-one/settings/secrets/actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: [paste your npm token]

## Manual npm Publishing

If you prefer to publish to npm manually:

```bash
# After creating the tag and GitHub release
npm login
bun run check-all
bun run build
npm publish --access public
```

**Note:** The `--access public` flag is required for scoped packages (@shadr/hx1-cli) to make them publicly available.

## Troubleshooting

### GitHub Actions fails to build executables

- Check the Actions log for specific errors
- Ensure Bun version is compatible
- Verify all dependencies are listed in package.json

### Release doesn't include all binaries

- Check that all build jobs completed successfully
- Verify artifact upload/download steps in workflow

### npm publish fails

- Verify NPM_TOKEN is set correctly
- Check that version doesn't already exist on npm
- Ensure you have permissions to publish the package

## Rollback

If you need to rollback a release:

```bash
# Delete the tag locally
git tag -d v1.0.1

# Delete the tag remotely
git push origin :refs/tags/v1.0.1

# Delete the GitHub release (via GitHub UI)

# Unpublish from npm (if published - only within 72 hours)
npm unpublish @shadr/hx1-cli@1.0.1
```

## Version Guidelines

Follow [Semantic Versioning](https://semver.org/):

- **Patch (1.0.x)**: Bug fixes, documentation updates, internal changes
- **Minor (1.x.0)**: New features, non-breaking changes
- **Major (x.0.0)**: Breaking changes, major rewrites

## Pre-release Versions

For testing before official release:

```bash
npm version prerelease --preid=beta
# Creates: 1.0.1-beta.0

git push origin main --tags
```

This creates a release but marks it as "pre-release" on GitHub.
