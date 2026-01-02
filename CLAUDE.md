# Line 6 HX One CLI Tool - Development Guide

**Project Goal:** Build a high-quality, professional CLI tool for musicians and developers to control and manage their Line 6 HX One guitar effects pedal.

**Target Audience:** Musicians with technical skills who want scriptable, automatable control over their HX One device.

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Architecture](#architecture)
3. [Code Standards](#code-standards)
4. [Testing Strategy](#testing-strategy)
5. [Project Structure](#project-structure)
6. [Development Workflow](#development-workflow)
7. [Scripts & Commands](#scripts--commands)
8. [Configuration](#configuration)

---

## Core Principles

### Quality First

This is **not a prototype**. Every line of code should be production-ready:

- **Clean, readable code** - Code is read far more than it's written
- **Well-typed** - TypeScript types are documentation and safety
- **Tested** - 100% test coverage is the goal, not a suggestion
- **Documented** - Every public API has clear documentation
- **Maintainable** - Future developers (including you) should understand the code

### Design Philosophy

**YAGNI (You Aren't Gonna Need It)**
- Don't build features speculatively
- Implement what the spec requires, nothing more
- Refactor when patterns emerge, not before

**DRY (Don't Repeat Yourself)**
- Extract common logic to shared utilities
- Use composition over duplication
- Centralize configuration and constants

**Functional Over Object-Oriented**
- Pure functions are easier to test and reason about
- Immutable data structures by default
- Side effects isolated to boundaries (I/O, MIDI, filesystem)

**Unix Philosophy**
- Do one thing well
- Compose small tools into larger workflows
- Text-based output (human and JSON)
- Non-zero exit codes for errors

---

## Architecture

### High-Level Structure

```
src/
├── cli/               # CLI entry point and command routing
│   ├── index.ts       # Main CLI entry point
│   ├── commands/      # Command implementations
│   └── middleware/    # CLI middleware (validation, logging)
│
├── core/              # Core business logic (pure functions)
│   ├── preset/        # Preset file parsing/generation
│   ├── midi/          # MIDI protocol logic
│   └── config/        # Configuration management
│
├── services/          # External interactions (I/O boundaries)
│   ├── MidiService.ts      # MIDI device communication
│   ├── FileService.ts      # File system operations
│   └── DeviceService.ts    # HX One device queries
│
├── types/             # TypeScript type definitions
│   ├── preset.ts      # Preset file types
│   ├── midi.ts        # MIDI message types
│   └── config.ts      # Configuration types
│
└── utils/             # Shared utilities
    ├── logger.ts      # Logging utilities
    ├── validation.ts  # Input validation
    └── formatting.ts  # Output formatting
```

### Layered Architecture

**Layer 1: CLI (Commands)**
- Parse arguments
- Validate inputs
- Call services
- Format outputs
- Handle errors gracefully

**Layer 2: Services (I/O Boundaries)**
- Dependency injection for testability
- Interact with external systems (MIDI, files)
- Throw domain-specific errors
- No business logic

**Layer 3: Core (Pure Logic)**
- Pure functions only
- No I/O or side effects
- All business logic lives here
- Highly testable

### Dependency Injection Pattern

```typescript
// Services are injected, not imported
class MidiService {
  constructor(private deviceName: string = 'HX One') {}

  async sendProgramChange(preset: number): Promise<void> {
    // Implementation
  }
}

// Commands receive services
async function loadPresetCommand(
  preset: number,
  midiService: MidiService
): Promise<void> {
  // Use service
  await midiService.sendProgramChange(preset);
}

// Tests inject mocks
test('loadPresetCommand', async () => {
  const mockMidi = new MockMidiService();
  await loadPresetCommand(42, mockMidi);
  expect(mockMidi.sentMessages).toContainEqual({ type: 'pc', number: 42 });
});
```

---

## Code Standards

### TypeScript

**Strict Mode Always**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**Type Everything**
```typescript
// ✅ Good
function parsePreset(data: Uint8Array): Preset {
  const effectId = readUInt32LE(data, 0x10);
  return { effectId, /* ... */ };
}

// ❌ Bad
function parsePreset(data: any) {
  const effectId = data[0x10];
  return { effectId };
}
```

**Prefer Interfaces for Data, Types for Unions**
```typescript
// Data structures
interface Preset {
  effectId: number;
  name: string;
  parameters: Parameter[];
}

// Discriminated unions
type MidiMessage =
  | { type: 'program_change'; program: number }
  | { type: 'control_change'; controller: number; value: number }
  | { type: 'sysex'; data: Uint8Array };
```

**No `any` or `as` Unless Absolutely Necessary**
```typescript
// ✅ Good - properly typed
function readUInt32LE(buffer: Uint8Array, offset: number): number {
  return new DataView(buffer.buffer).getUint32(offset, true);
}

// ❌ Bad - type assertions hide errors
function readUInt32LE(buffer: any, offset: any): any {
  return (buffer as any)[offset] as number;
}
```

### Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `midi-service.ts`)
- **Classes**: `PascalCase` (e.g., `MidiService`)
- **Functions**: `camelCase` (e.g., `parsePreset`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `PRESET_SIZE`)
- **Types/Interfaces**: `PascalCase` (e.g., `PresetFile`)
- **Private members**: `_prefix` or private keyword

### File Organization

**Each file should be < 300 lines**
- If longer, split into logical modules
- One primary export per file
- Related functions grouped together

**Imports organized**
```typescript
// 1. External dependencies
import { Command } from 'commander';
import chalk from 'chalk';

// 2. Internal services
import { MidiService } from '../services/MidiService';

// 3. Internal types
import type { Preset } from '../types/preset';

// 4. Internal utilities
import { logger } from '../utils/logger';
```

### Error Handling

**Custom Error Classes**
```typescript
class DeviceNotFoundError extends Error {
  constructor(deviceName: string) {
    super(`MIDI device not found: ${deviceName}`);
    this.name = 'DeviceNotFoundError';
  }
}

class InvalidPresetError extends Error {
  constructor(preset: number) {
    super(`Invalid preset number: ${preset} (must be 0-127)`);
    this.name = 'InvalidPresetError';
  }
}
```

**Handle Errors at Boundaries**
```typescript
// CLI layer catches and formats errors
try {
  await loadPreset(preset);
} catch (error) {
  if (error instanceof DeviceNotFoundError) {
    console.error(chalk.red('✗'), error.message);
    console.log('\n💡 Try: hx1 status --check-connection');
    process.exit(2);
  }
  throw error; // Unknown errors bubble up
}
```

---

## Testing Strategy

### Test Coverage Goals

- **Unit tests**: 100% coverage of core logic
- **Integration tests**: All service interactions
- **E2E tests**: Critical user workflows
- **Property-based tests**: File parsing/generation

### Testing Framework

**Vitest** - Fast, modern, TypeScript-native

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('parsePreset', () => {
  it('should parse a valid preset file', () => {
    const data = new Uint8Array([/* ... */]);
    const preset = parsePreset(data);

    expect(preset.effectId).toBe(500);
    expect(preset.name).toBe('70s Chorus');
    expect(preset.parameters).toHaveLength(62);
  });

  it('should throw on invalid file size', () => {
    const data = new Uint8Array(100); // Too small

    expect(() => parsePreset(data)).toThrow(InvalidPresetError);
  });
});
```

### Test Organization

```
tests/
├── unit/              # Pure function tests
│   ├── core/
│   │   ├── preset.test.ts
│   │   └── midi.test.ts
│   └── utils/
│       └── validation.test.ts
│
├── integration/       # Service tests with mocks
│   ├── MidiService.test.ts
│   └── FileService.test.ts
│
├── e2e/              # End-to-end CLI tests
│   ├── load-preset.test.ts
│   └── pull-presets.test.ts
│
└── fixtures/         # Test data
    ├── presets/
    │   └── 70s-chorus.hx1p
    └── midi/
        └── captured-messages.json
```

### Mocking Strategy

**Dependency Injection for Easy Mocking**
```typescript
// Mock MIDI service for testing
class MockMidiService implements MidiServiceInterface {
  sentMessages: MidiMessage[] = [];

  async sendProgramChange(preset: number): Promise<void> {
    this.sentMessages.push({ type: 'program_change', program: preset });
  }
}

// Test with mock
test('loadPreset sends correct MIDI', async () => {
  const mockMidi = new MockMidiService();
  await loadPreset(10, mockMidi);

  expect(mockMidi.sentMessages).toEqual([
    { type: 'program_change', program: 10 }
  ]);
});
```

### Test Data

**Use Real Preset Files**
- Store actual `.hx1p` files in `tests/fixtures/`
- Generate edge cases programmatically
- Document what each fixture tests

---

## Project Structure

### Directory Layout

```
hx-one/
├── src/                      # Source code
│   ├── cli/                  # CLI layer
│   ├── core/                 # Business logic
│   ├── services/             # I/O services
│   ├── types/                # Type definitions
│   └── utils/                # Utilities
│
├── tests/                    # Test files
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
│
├── docs/                     # Documentation
│   ├── hx1-spec.md          # CLI specification
│   ├── file-format.md       # Binary format docs
│   ├── midi-tools.md        # MIDI implementation
│   └── ...
│
├── scripts/                  # Development scripts
│   └── (legacy research scripts moved to src/scripts/)
│
├── .hx1config               # User configuration
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

### Configuration Files

**tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**vitest.config.ts**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['tests/**', 'dist/**', '**/*.test.ts']
    },
    globals: true,
    environment: 'node'
  }
});
```

---

## Development Workflow

### 1. Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/next-preset-command

# 2. Write failing test first (TDD)
# tests/e2e/next-preset.test.ts

# 3. Implement feature
# src/cli/commands/next.ts

# 4. Run tests
bun run test

# 5. Check types and lint
bun run check-all

# 6. Commit
git commit -m "feat: add next preset command"
```

### 2. Code Review Checklist

Before committing:
- ✅ All tests pass
- ✅ 100% test coverage for new code
- ✅ TypeScript compiles with no errors
- ✅ Linter passes
- ✅ Documentation updated
- ✅ CHANGELOG.md updated

### 3. Git Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add next preset command
fix: handle MIDI device disconnection gracefully
docs: update hx1-spec with pull command details
test: add integration tests for MidiService
refactor: extract preset parsing to core module
```

---

## Scripts & Commands

### Development Scripts

```json
{
  "scripts": {
    "dev": "bun run src/cli/index.ts",
    "build": "bun build src/cli/index.ts --outdir dist --target bun",
    "test": "vitest run --coverage",
    "test:watch": "vitest watch",
    "test:ui": "vitest --ui",
    "check-types": "tsc --noEmit",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "check-all": "bun run check-types && bun run lint && bun run test",
    "complexity": "eslint src/**/*.ts --plugin complexity --rule 'complexity: [error, 10]'"
  }
}
```

### Usage

```bash
# Run tests with coverage
bun run test

# Watch mode during development
bun run test:watch

# Type check
bun run check-types

# Lint and fix
bun run lint:fix

# Full check before commit
bun run check-all

# Run CLI tool
bun run dev status
bun run dev load 10
bun run dev pull --all

# Or with alias
alias hx1="bun run dev"
hx1 status
```

---

## Configuration

### User Configuration (`.hx1config`)

TOML format for human readability:

```toml
[directories]
presets = "./presets/"
backups = "./backups/"

[midi]
channel = 1
device = "auto"  # or "HX One"

[behavior]
confirm-overwrites = true
auto-backup = false

[output]
color = true
format = "human"  # or "json"
```

### Environment Variables

- `HX1_PRESET_DIR` - Override preset directory
- `HX1_BACKUP_DIR` - Override backup directory
- `HX1_MIDI_DEVICE` - MIDI device name
- `HX1_NO_COLOR` - Disable colored output
- `HX1_LOG_LEVEL` - Logging level (debug, info, warn, error)

---

## Code Complexity Guidelines

### Cyclomatic Complexity

**Maximum complexity per function: 10**

```typescript
// ✅ Good - complexity = 3
function validatePreset(preset: number): boolean {
  if (preset < 0) return false;
  if (preset > 127) return false;
  return true;
}

// ❌ Bad - complexity = 15 (too high)
function processPreset(data: any) {
  if (data.type === 'a') {
    if (data.value > 10) {
      // ...
      if (data.flag) {
        // ... many more nested conditions
      }
    }
  }
  // Refactor into smaller functions!
}
```

**Solution: Extract to smaller functions**
```typescript
function processPreset(data: PresetData): ProcessedPreset {
  const validated = validatePresetData(data);
  const parsed = parsePresetParameters(validated);
  const normalized = normalizePresetValues(parsed);
  return normalized;
}
```

### File Length

- **Maximum 300 lines per file**
- If exceeded, split into logical modules
- Each file should have a single, clear purpose

### Function Length

- **Maximum 50 lines per function**
- Ideal: 10-20 lines
- If longer, extract helper functions

---

## Quality Metrics

### CI/CD Checks

Every commit must pass:

1. **Type checking** - `tsc --noEmit`
2. **Linting** - `eslint`
3. **Tests** - `vitest` with 100% coverage
4. **Complexity** - Max cyclomatic complexity 10
5. **Build** - Successful compilation

### Code Review Standards

- Readable by junior developers
- Clear function and variable names
- Comprehensive test coverage
- Documentation for public APIs
- No magic numbers or strings

---

## Reference Documentation

### Related Docs

- **CLI Specification**: `docs/hx1-spec.md` - Complete command reference
- **File Format**: `docs/file-format.md` - Binary format documentation
- **MIDI Protocol**: `docs/hx1-midi-overview.md` - MIDI implementation
- **Quick Start**: `docs/quickstart.md` - Getting started guide

### External References

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Vitest Documentation](https://vitest.dev/)
- [Bun Documentation](https://bun.sh/docs)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## Issue Tracking

**Project management is handled via GitHub Issues.**

- All feature requests, bugs, and enhancements are tracked as GitHub issues
- Use the `gh` CLI tool to create, view, and manage issues
- Issues should have clear descriptions and acceptance criteria
- Reference issue numbers in commits (e.g., `feat: add list command (#3)`)
- Close issues automatically with commit messages (e.g., `fixes #3`, `closes #3`)

### Creating Issues

```bash
# View all issues
gh issue list

# Create a new issue
gh issue create --title "Feature: Add xyz" --body "Description..."

# View an issue
gh issue view 5

# Close an issue
gh issue close 5
```

### Active Issues

Current feature roadmap and bugs are tracked at:
https://github.com/shad/hx1-cli/issues

---

**Remember:** This is a professional-grade tool. Every line of code reflects on the quality of the project. Take pride in the craftsmanship



