#!/bin/sh
#
# Entrypoint for the JWT-validating Caddy proxy that sits in front of tusd.
#
# Single source of truth for the secret is PRIVATE_API_KEY - the same shared HMAC secret
# the auth service uses to sign the access JWT (HS256). caddy-jwt expects `sign_key` to be
# base64-encoded, so we derive that form here at startup instead of having to configure the
# same key twice (once raw for the app, once base64 for the proxy).
set -eu

: "${PRIVATE_API_KEY:?PRIVATE_API_KEY must be set (shared HS256 secret used by the auth service)}"

TUS_SIGN_KEY="$(printf '%s' "$PRIVATE_API_KEY" | base64 | tr -d '\n')"
export TUS_SIGN_KEY

exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
