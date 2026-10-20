# Built from the repository root (see ../compose.yaml): the Gemfile takes habarico from
# ../../../ruby, which only resolves in a context holding the whole monorepo.
FROM ruby:3.2.10-slim

# build-essential and libpq-dev build the pg and bcrypt native extensions; curl backs the
# healthcheck in compose.yaml.
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential libpq-dev curl \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /repo/examples/eshop/rails

# The library first, so editing the example alone does not re-resolve the bundle.
COPY ruby /repo/ruby
COPY examples/eshop/rails/Gemfile ./
RUN bundle install

COPY examples/eshop/rails /repo/examples/eshop/rails

EXPOSE 8000
# db:prepare creates and migrates both databases; db:seed is idempotent, so a restart against an
# existing one is a no-op.
CMD ["sh", "-c", "bin/rails db:prepare db:seed && bin/rails server -b 0.0.0.0 -p 8000"]
