# Built from the repository root (see ../compose.yaml): package.json links habarico from
# ../../../node, and what npm links is that package's *build output* - so the library is built
# here too. That is the step the native route in README.md asks you to run by hand.
FROM node:24-slim

# The library's dev dependencies pull in Playwright, whose browsers are only needed by its own
# test suite - several hundred megabytes this image never runs.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

WORKDIR /repo/node
COPY node/package.json node/package-lock.json ./
RUN npm ci
COPY node /repo/node
RUN npm run build

WORKDIR /repo/examples/eshop/frontend
COPY examples/eshop/frontend/package.json examples/eshop/frontend/package-lock.json ./
RUN npm ci
COPY examples/eshop/frontend /repo/examples/eshop/frontend

EXPOSE 5173
# --host so the dev server answers from outside the container; the /api proxy target comes from
# API_URL, which compose.yaml points at the backend of the chosen profile (see vite.config.ts).
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
