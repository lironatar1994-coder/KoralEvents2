#!/usr/bin/env bash
set -Eeuo pipefail
umask 027
revision=${1:?Exact Git revision required}
[[ "$revision" =~ ^[0-9a-f]{40}$ ]] || exit 1
root=/opt/koralevents
mkdir -p "$root"/{releases,shared/data,shared/uploads,backups,incoming}
exec 9>"$root/deploy.lock"
flock -n 9 || { echo 'Another deployment is running.' >&2; exit 1; }
test -f "$root/shared/app.env" || { echo 'Provision shared/app.env first.' >&2; exit 1; }
test "$(df --output=avail -k "$root" | tail -1)" -gt 1300000 || { echo 'Need at least 1.3 GB free for build.' >&2; exit 1; }
id koralevents >/dev/null 2>&1 || useradd --system --home "$root/shared" --shell /usr/sbin/nologin koralevents
chgrp koralevents "$root" "$root/releases" "$root/shared"
chmod 750 "$root" "$root/releases" "$root/shared"
chown -R koralevents:koralevents "$root/shared/data" "$root/shared/uploads" "$root/backups"
chmod 700 "$root/shared/data" "$root/shared/uploads" "$root/backups"
build=$(mktemp -d "$root/build.XXXXXXXX")
trap 'rm -rf -- "$build"' EXIT
tar -xzf "$root/incoming/$revision.tar.gz" -C "$build"
cd "$build"
export NEXT_PUBLIC_BASE_PATH=/koralevents NEXT_TELEMETRY_DISABLED=1
export APP_ORIGIN=https://lawebs.co.il NODE_OPTIONS=--max-old-space-size=640
nice -n 10 npm ci --no-audit --no-fund
nice -n 10 npm run build
release="$root/releases/$revision-$(date +%s)"
mkdir "$release"
cp -a .next/standalone/. "$release/"
cp -a .next/static "$release/.next/static"
mkdir -p "$release/public"
cp -a public/. "$release/public/"
mkdir -p "$release/scripts"
cp scripts/backup.mjs scripts/rotate-password.mjs "$release/scripts/"
printf 'RELEASE_REVISION=%s\n' "$revision" > "$release/release.env"
chmod -R a+rX "$release"
previous=$(readlink -f "$root/current" || true)
if [[ -n "$previous" && -f "$root/shared/data/koral.sqlite" ]]; then
    DATABASE_PATH="$root/shared/data/koral.sqlite" node "$previous/scripts/backup.mjs" "$root/backups/pre-$revision-$(date +%s).sqlite"
fi
cat > /etc/systemd/system/koralevents.service <<'UNIT'
[Unit]
Description=Koral Events
After=network.target
[Service]
Type=simple
User=koralevents
Group=koralevents
WorkingDirectory=/opt/koralevents/current
EnvironmentFile=/opt/koralevents/shared/app.env
EnvironmentFile=/opt/koralevents/current/release.env
Environment=NODE_ENV=production HOSTNAME=127.0.0.1 PORT=3110 NEXT_TELEMETRY_DISABLED=1
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/opt/koralevents/shared /opt/koralevents/current/.next/cache
UMask=0077
[Install]
WantedBy=multi-user.target
UNIT
mkdir -p "$release/.next/cache"
chown -R koralevents:koralevents "$release/.next/cache"
ln -sfn "$release" "$root/current.new"
mv -Tf "$root/current.new" "$root/current"
systemctl daemon-reload
systemctl enable koralevents >/dev/null
rollback() {
    echo 'New release failed. Restoring previous application version.' >&2
    if [[ -n "$previous" && -d "$previous" ]]; then
        ln -sfn "$previous" "$root/current.new"
        mv -Tf "$root/current.new" "$root/current"
        systemctl restart koralevents
    else
        systemctl stop koralevents
    fi
    echo 'Database was not rolled back; consistent pre-update backup is preserved.' >&2
    exit 1
}
systemctl restart koralevents || rollback
healthy=0
for attempt in {1..30}; do
    if curl -fsS http://127.0.0.1:3110/koralevents/api/health | grep -q "$revision"; then healthy=1; break; fi
    sleep 2
done
[[ "$healthy" = 1 ]] || rollback
if ! curl -fsS https://lawebs.co.il/koralevents/api/health | grep -q "$revision"; then rollback; fi
for asset in icon.svg apple-touch-icon.png icon-512.png; do
    if ! curl -fsS "https://lawebs.co.il/koralevents/$asset" | cmp -s "$release/public/$asset" -; then rollback; fi
done
printf '%s\n' "$previous" > "$root/previous-release"
echo "Healthy release: $revision"
