# Verification — 2026-09-05

- Production build passed with Next.js 16.3.4 and TypeScript; the standalone production server was started and tested on port 3000.
- 15 backend tests passed: normalization, publication validation, duplicates, concurrent capacity approval, waitlist behavior, payment/cancellation separation, free-event payment rules, ownership scoping, deletion, closed/private/past events, unlimited capacity, persistent rate limits, salted passwords, Israeli summer/winter time, and data persistence across process connections.
- 3 Playwright scenarios passed: public responsive pages; protected routes and origin validation; full manager/visitor workflow including uploaded flyer preview, publication, approval, payment, waitlist, manual entry, archive, persistent login and actual-image-type validation.
- Viewports checked: 360, 390, 430 and 1440 pixels. No horizontal overflow in the tested pages. Inputs use 16px text on mobile to avoid automatic iOS focus zoom.
- Automated axe checks passed on the homepage, management dashboard and event registration page. Keyboard skip-link navigation and modal focus restoration are implemented. This is not a certification or a physical-device Safari test.
- Uploaded flyer rendering was verified with `object-fit: contain` and its original portrait aspect ratio. The WhatsApp target was verified without sending a message.
- SQLite backup API completed successfully; the copied database passed `PRAGMA integrity_check`. Database and upload directories are excluded from build artifacts.
- `npm audit --omit=dev`: zero reported vulnerabilities at verification time.
- Demo test events were removed after testing. Three fictional demonstration events remain in `data/demo.sqlite`, separate from the production database path.

Docker Compose, Caddy HTTPS and remote deployment have **not** been executed: Docker is not installed on this machine, and server/domain details were not provided. The Dockerfile, Compose configuration and backup/restore instructions are included for deployment.

Visual screenshots from the run are under `test-results/` (ignored by Git).
