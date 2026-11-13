# Tests with a real screen reader (pilot)

Tests that drive a real screen reader, Orca with Firefox, through [Guidepup](https://www.guidepup.dev/) and assert on
what it says: the name and the state of a control and how the state changes after Space. They cover the Switch and the
Checkbox on the e2e fixtures (`e2e/fixtures`). This folder has its own `package.json`; it is not part of `npm test`.

Orca runs on Linux only. Guidepup tests it with Firefox: in our attempt Chromium did not register with the accessibility
bus. The log is what Orca sends to speech, not what a person hears.

## Run

In the CI workflow `.github/workflows/screen-reader-pilot.yml`. Locally, in Docker (nothing is installed on the machine):

```sh
docker build -t guidepup-pilot -f screen-reader/Dockerfile screen-reader
npx vite build --config vite.e2e.config.ts --outDir "$PWD/tmp/screen-reader/site" --emptyOutDir
python3 -m http.server 4195 --bind 127.0.0.1 --directory tmp/screen-reader/site &
docker run --rm --network host --ipc=host -v "$PWD":/project -w /project/screen-reader \
  -e PLAYWRIGHT_BROWSERS_PATH=/project/tmp/screen-reader/browsers guidepup-pilot \
  bash -c "npm ci && npx playwright install firefox && xvfb-run -a dbus-run-session -- npx playwright test"
```

Not port 4190: Firefox blocks it. `@guidepup/playwright` 0.21.0 does not work with `@guidepup/guidepup` 0.40.0 for
`navigateToWebContent()`, so `helpers.ts` has its own `toWebContent()`.
