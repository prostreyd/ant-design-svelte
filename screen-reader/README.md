# Tests with a real screen reader

Tests that drive a real screen reader, Orca with Firefox, through [Guidepup](https://www.guidepup.dev/) and assert on
what it says: the name and the state of a control and how the state changes after Space. They cover the Switch and the
Checkbox on the e2e fixtures (`e2e/fixtures`), the Radio on its lab (`/#radio`): one test, because Orca keeps its state
from one test to the next, the Modal on its lab (`/#modal`), the Form on its lab (`/#form`), the Message (`/#message`), the Notification (`/#notification`), the Icon (`/#icon`) and the Typography (`/#typography`): one test each. The Button, the Input, the Select, the Tooltip, the Menu and the Spin have tests of their own too. Orca says nothing for a one-letter name, so the lab uses words. This folder has its own `package.json`; it is not part of `npm test`.

A change of a live region (`role="status"`) was spoken in this setup only right after a key press: 4 s after it, even a plain status on a bare page stays
silent (checked 2026-11-25), so such a silence says nothing about a component.

Orca runs on Linux only. Guidepup tests it with Firefox: in our attempt Chromium did not register with the accessibility
bus. The log is what Orca sends to speech, not what a person hears.

## Run

In the CI workflow `.github/workflows/screen-reader.yml`, apart from the CI of the library. It starts on a push to `main` and on a pull request that changes what the speech depends on (`src/lib`, `e2e/fixtures`, this folder, the build of the fixtures or the packages), and by hand. It has no run by schedule. A push that only touches documentation, specifications or rules does not start it, A release waits for it (since 2026-11-20): `publish.yml` publishes only when this workflow was green for the commit of the tag, either the run it made on `main`, or, when the commit has none, a run that `publish.yml` makes itself. Locally, in Docker (nothing is installed on the machine):

```sh
docker build -t guidepup-pilot -f screen-reader/Dockerfile screen-reader
npx vite build --config vite.e2e.config.ts --outDir "$PWD/tmp/screen-reader/site" --emptyOutDir
python3 -m http.server 4195 --bind 127.0.0.1 --directory tmp/screen-reader/site &
docker run --rm --network host --ipc=host -v "$PWD":/project -w /project/screen-reader \
  -e PLAYWRIGHT_BROWSERS_PATH=/project/tmp/screen-reader/browsers guidepup-pilot \
  bash -c "npm ci && npx playwright install firefox && xvfb-run -a dbus-run-session -- npx playwright test"
```

If `xvfb-run` waits for ever inside the container (it did once, with the test never starting), start the display by hand instead:
`bash -c "(Xvfb :99 -screen 0 1280x1024x24 -nolisten tcp &) ; sleep 3; export DISPLAY=:99; dbus-run-session -- npx playwright test"`.

Not port 4190: Firefox blocks it. `@guidepup/playwright` 0.21.0 does not work with `@guidepup/guidepup` 0.40.0 for
`navigateToWebContent()`, so `helpers.ts` has its own `toWebContent()`.
