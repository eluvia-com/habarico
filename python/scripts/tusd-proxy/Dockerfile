# JWT-validating reverse proxy for tusd (Habarico chunked uploads, TusUploadProvider).
#
# The official Caddy image ships only standard modules, so the JWT auth plugin must be
# compiled in. This is the only reason a custom image is needed; the secret handling is done
# at runtime by entrypoint.sh.
FROM caddy:2-builder AS builder
RUN xcaddy build --with github.com/ggicci/caddy-jwt

FROM caddy:2
COPY --from=builder /usr/bin/caddy /usr/bin/caddy
COPY Caddyfile /etc/caddy/Caddyfile
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
