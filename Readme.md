# E2E tests for console.redhat.com

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

```bash
npm install # Install all the needed Node dependencies
npx playwright install # Install all the Playwright dependencies and needed browsers
npx playwright test --project chromium # Executes the tests on a selected browser (`chromium` in this case)
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
