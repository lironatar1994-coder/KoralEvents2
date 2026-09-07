#!/usr/bin/env bash
# One-time setup on the existing lawebs.co.il Nginx host. No demo data is copied.
set -Eeuo pipefail
umask 077
root=/opt/koralevents
mkdir -p "$root/shared" "$root/backups"
if [[ ! -f "$root/shared/app.env" ]]; then
    password=$(openssl rand -hex 24)
    printf 'APP_ORIGIN=https://lawebs.co.il\nDATABASE_PATH=/opt/koralevents/shared/data/koral.sqlite\nUPLOAD_DIR=/opt/koralevents/shared/uploads\nADMIN_PASSWORD=%s\n' "$password" > "$root/shared/app.env"
fi
config=/etc/nginx/sites-available/lawebs.co.il.conf
test -f "$config"
cp -a "$config" "$root/backups/nginx-$(date +%s).conf"
cat > /etc/nginx/snippets/koralevents.conf <<'NGINX'
location = /koralevents {
    proxy_pass http://127.0.0.1:3110;
    include /etc/nginx/snippets/koralevents-proxy.conf;
}
location ^~ /koralevents/ {
    proxy_pass http://127.0.0.1:3110;
    include /etc/nginx/snippets/koralevents-proxy.conf;
}
NGINX
cat > /etc/nginx/snippets/koralevents-proxy.conf <<'NGINX'
client_max_body_size 12m;
proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
proxy_buffering off;
proxy_read_timeout 60s;
NGINX
python3 - "$config" <<'PY'
import pathlib, sys
p = pathlib.Path(sys.argv[1])
s = p.read_text()
include = '    include /etc/nginx/snippets/koralevents.conf;'
anchor = '    server_name lawebs.co.il;'
if include not in s:
    assert s.count(anchor) == 1, 'Cannot identify HTTPS server block'
    p.write_text(s.replace(anchor, anchor + '\n' + include))
PY
nginx -t
systemctl reload nginx
echo 'Provisioned. Bootstrap password is stored only in /opt/koralevents/shared/app.env.'
