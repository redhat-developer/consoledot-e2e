# E2E tests for console.redhat.com
[![Playwright Tests](https://github.com/redhat-developer/consoledot-e2e/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/redhat-developer/consoledot-e2e/actions/workflows/playwright.yml)

E2E tests for RedHat Console.

## Build & Run

Tools:

 - [Typescript](https://www.typescriptlang.org/): close to the UI developers ecosystem
 - [NPM](https://www.npmjs.com/): build tool
 - [Node](https://nodejs.org/en/): runtime
 - [Playwright](https://playwright.dev/): framework for UI testing
 - [GH Action](https://docs.github.com/en/actions): infrastructure

Local requirements:

- `npm`: `8.X`
- `node`: `16.X`

Before running the tests you would need to provide a valid username and password to be used in the form of environment variables.

```bash
export TEST_USERNAME=...
export TEST_PASSWORD=...
export TEST_ADMIN_USERNAME=...
export TEST_ADMIN_PASSWORD=...
export TEST_2_USERNAME=...
export TEST_2_PASSWORD=...
export STARTING_PAGE=...
```

or drop a `.env` file in the root folder with a similar content:

```
TEST_USERNAME=...
TEST_PASSWORD=...
TEST_ADMIN_USERNAME=...
TEST_ADMIN_PASSWORD=...
TEST_2_USERNAME=...
TEST_2_PASSWORD=...
STARTING_PAGE=...
```

Now you can run the tests:

```bash
npm install # Install all the needed Node dependencies
npx playwright install # Install all the Playwright dependencies and needed browsers
npx playwright test --project chromium # Executes the tests on a selected browser (`chromium` in this case)
npm test-chrome # package.json has prepared scripts so you don't need to call whole npx command
npm test-firefox
```

if you need to debug you can use the Playwright console and have a Playwright helper available in console by executing:

```bash
PWDEBUG=1 npx playwright test --project chromium --debug
```

### Setup

This repository uses GitHub Actions as infrastructure to run the tests agains publicly accessible services.
The CI only runs on the `main` branch to avoid sharing secrets on branches and forks.

### Security

The only sensitive data in this project is the username and password used to login.
Those are stored in [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets).
