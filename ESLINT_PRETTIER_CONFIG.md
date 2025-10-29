# PDF Service - ESLint and Prettier Configuration

## Overview

This document describes the ESLint and Prettier configuration used in the PDF Service project to ensure code quality, consistency, and maintainability.

## ESLint Configuration

### Configuration File: `.eslintrc.json`

The ESLint configuration enforces JavaScript coding standards and best practices across the project.

#### Key Rules

**Code Style:**
- Double quotes for strings (`"quotes": ["error", "double"]`)
- Semicolons required (`"semi": ["error", "always"]`)
- Prefer `const` over `let` (`"prefer-const": "error"`)
- No `var` declarations (`"no-var": "error"`)

**Error Prevention:**
- No unused variables (`"no-unused-vars": "error"`)
- No unreachable code (`"no-unreachable": "error"`)
- No duplicate cases (`"no-duplicate-case": "error"`)
- No empty blocks (`"no-empty": "error"`)

**Best Practices:**
- Use strict equality (`"eqeqeq": "error"`)
- No `eval()` usage (`"no-eval": "error"`)
- Camel case for variables (`"camelcase": "error"`)
- Consistent return statements (`"consistent-return": "error"`)

**Code Complexity:**
- Maximum nesting depth: 4 levels (`"max-depth": ["warn", 4]`)
- Maximum line length: 120 characters (`"max-len": ["warn", 120]`)
- Maximum file length: 300 lines (`"max-lines": ["warn", 300]`)
- Maximum parameters: 5 (`"max-params": ["warn", 5]`)
- Maximum statements: 20 (`"max-statements": ["warn", 20]`)

**ES6+ Features:**
- Arrow function spacing (`"arrow-spacing": "error"`)
- Object shorthand (`"object-shorthand": "error"`)
- Template literals preferred (`"prefer-template": "error"`)
- Destructuring preferred (`"prefer-destructuring": "error"`)

#### Environment-Specific Rules

**Node.js Environment:**
- Global variables: `process`, `require`, `module`, `exports`
- Built-in modules: `Buffer`, `global`, `console`
- Timers: `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval`

**Browser Environment (public/**/*.js):**
- Global variables: `window`, `document`, `navigator`, `location`
- Storage APIs: `localStorage`, `sessionStorage`
- Fetch API: `fetch`, `FormData`, `URLSearchParams`, `URL`

**Test Environment (tests/**/*.js):**
- Jest globals: `describe`, `it`, `test`, `expect`
- Test lifecycle: `beforeEach`, `afterEach`, `beforeAll`, `afterAll`

## Prettier Configuration

### Configuration File: `.prettierrc.json`

Prettier handles code formatting to ensure consistent style across the project.

#### Key Settings

**General Formatting:**
- Semicolons: Always (`"semi": true`)
- Quotes: Double quotes (`"singleQuote": false`)
- Print width: 120 characters (`"printWidth": 120`)
- Tab width: 2 spaces (`"tabWidth": 2`)
- Use spaces, not tabs (`"useTabs": false`)

**Code Style:**
- Trailing commas: ES5 compatible (`"trailingComma": "es5"`)
- Bracket spacing: Always (`"bracketSpacing": true`)
- Arrow function parentheses: Avoid when possible (`"arrowParens": "avoid"`)
- End of line: LF (`"endOfLine": "lf"`)

**File-Specific Overrides:**

**JSON Files:**
- Print width: 80 characters
- Tab width: 2 spaces

**Markdown Files:**
- Print width: 80 characters
- Prose wrap: Always
- Tab width: 2 spaces

**HTML Files:**
- Print width: 120 characters
- Tab width: 2 spaces
- HTML whitespace sensitivity: Ignore

## Usage

### Running ESLint

```bash
# Check all files
npm run lint

# Check specific file
npx eslint app.js

# Fix auto-fixable issues
npx eslint --fix app.js

# Check with detailed output
npx eslint --format=stylish app.js
```

### Running Prettier

```bash
# Format all files
npm run format

# Format specific file
npx prettier --write app.js

# Check formatting without changing files
npx prettier --check app.js

# Format specific file types
npx prettier --write "**/*.{js,json,md,html}"
```

### VS Code Integration

Add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact"
  ],
  "prettier.requireConfig": true
}
```

### Git Hooks

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
# Run ESLint
npm run lint

# Run Prettier check
npm run format:check

# Run tests
npm test
```

## Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "lint": "eslint . --ext .js",
    "lint:fix": "eslint . --ext .js --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "lint:format": "npm run lint:fix && npm run format"
  }
}
```

## Dependencies

Install required packages:

```bash
# ESLint
npm install --save-dev eslint

# Prettier
npm install --save-dev prettier

# ESLint-Prettier integration
npm install --save-dev eslint-config-prettier eslint-plugin-prettier

# Husky for git hooks
npm install --save-dev husky
```

## Custom Rules

### Project-Specific Rules

You can add custom rules for the PDF Service project:

```json
{
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "max-len": ["error", { "code": 120, "ignoreUrls": true }],
    "camelcase": ["error", { "properties": "never" }]
  }
}
```

### Disabling Rules

For specific cases where rules need to be disabled:

```javascript
// eslint-disable-next-line no-console
console.log("Debug information");

// eslint-disable-line no-unused-vars
const unusedVariable = "value";

/* eslint-disable no-var */
var oldStyle = "deprecated";
/* eslint-enable no-var */
```

## Best Practices

### ESLint Best Practices

1. **Fix Issues Early**: Run ESLint frequently during development
2. **Use Auto-fix**: Let ESLint fix formatting issues automatically
3. **Custom Rules**: Add project-specific rules as needed
4. **Ignore Files**: Use `.eslintignore` for files that shouldn't be linted

### Prettier Best Practices

1. **Format on Save**: Enable automatic formatting in your editor
2. **Consistent Configuration**: Use the same Prettier config across the team
3. **File Overrides**: Use overrides for different file types
4. **Git Integration**: Use Prettier in pre-commit hooks

### Integration Best Practices

1. **ESLint + Prettier**: Use ESLint for code quality, Prettier for formatting
2. **Editor Integration**: Configure your editor to use both tools
3. **CI/CD Integration**: Run both tools in your CI/CD pipeline
4. **Team Consistency**: Ensure all team members use the same configuration

## Troubleshooting

### Common Issues

1. **Conflicting Rules**: ESLint and Prettier rules may conflict
   - Solution: Use `eslint-config-prettier` to disable conflicting rules

2. **Performance Issues**: ESLint may be slow on large projects
   - Solution: Use `.eslintignore` to exclude unnecessary files

3. **Formatting Conflicts**: Prettier may format code differently than ESLint
   - Solution: Use `eslint-plugin-prettier` to integrate Prettier with ESLint

### Configuration Validation

```bash
# Validate ESLint configuration
npx eslint --print-config app.js

# Validate Prettier configuration
npx prettier --check --debug-check app.js
```

## Conclusion

The ESLint and Prettier configuration ensures consistent, high-quality code across the PDF Service project. Regular use of these tools helps maintain code standards and improves team productivity.

### Key Benefits

1. **Consistency**: Uniform code style across the project
2. **Quality**: Early detection of code issues
3. **Productivity**: Automated formatting and fixing
4. **Maintainability**: Easier to read and maintain code
5. **Team Collaboration**: Shared standards for all developers
