---
title: Authentication
sidebar_position: 4
---

Habarico is authentication-agnostic: it ships no auth gem and calls one hook, `authenticate_request`,
which the host application implements.

Every controller that includes `Habarico::Controller`, and every endpoint of the engine itself
(schema, global search, user preferences), runs a `before_action` that calls
`Habarico::Config.authenticate_method` — `:authenticate_request` by default. If the controller does
not respond to that method, the request fails with `NotImplementedError`.

## Implementing the hook

Implement it once in the `ApplicationController` your admin controllers already inherit from, and it
covers every resource:

```ruby
class ApplicationController < ActionController::API
  # e.g. using eluvia-auth
  include Eluvia::Auth::AuthHandler

  def authenticate_request
    authenticate(['public'])
  end
end
```

```ruby
class Apps::Admin::ProductsController < ApplicationController
  include Habarico::Controller

  model Product
  # …
end
```

`current_user` has to be available on the controller as well — Habarico reads it through
[`context.current_user`](./basic-usage/context-object.md), which is what `can_read`, `can_update`
and Pundit policies receive. It can return any object your policies understand; Habarico never
inspects its class.

## Reusing an existing auth method

If the application already has a no-argument authentication method — Devise's `authenticate_user!`,
for instance — point Habarico at it instead of writing a wrapper:

```ruby
Habarico.setup do |config|
  config.authenticate_method = :authenticate_user!
end
```

:::caution
`authenticate_method` holds a method name, not a call. A method that takes arguments (such as
`eluvia-auth`'s `authenticate(['public'])`) still needs the one-line `authenticate_request` wrapper
shown above.
:::

## The engine's own endpoints

Habarico's own controllers — the schema endpoints, global search and user preferences — do not
inherit from the application's `ApplicationController`; they inherit from
`Habarico::Config.base_controller_class`, `'ActionController::API'` by default. Set it to the host
application's controller so those endpoints authenticate the same way the resources do:

```ruby
Habarico.setup do |config|
  config.base_controller_class = 'ApplicationController'
end
```

The value is a string; it is resolved with `constantize` when the engine's controllers are loaded,
so it must be set in the initializer.

:::caution
If the class named here already declares its own `before_action :authenticate_request`, the hook
runs twice per request — Habarico adds its own. Keep the authentication method idempotent, or leave
`base_controller_class` at its default and let Habarico be the only caller.
:::

## Custom authentication

With no auth gem at all, `authenticate_request` is the whole integration point. Raise
`Eluvia::Errors::Unauthorized` (from `eluvia-base`, which Habarico depends on) on failure so the
error is rendered through the same pipeline as the rest of the API:

```ruby
class ApplicationController < ActionController::API
  include Eluvia::ErrorHandler

  def authenticate_request
    token = request.headers['Authorization']&.split(' ')&.last
    raise Eluvia::Errors::Unauthorized.new('Missing token.') if token.blank?

    payload = JWT.decode(token, Rails.application.credentials.jwt_secret, true, algorithm: 'HS256').first
    @current_user = User.find(payload['sub'])
  rescue JWT::DecodeError
    raise Eluvia::Errors::Unauthorized.new('Invalid or expired token.')
  end

  def current_user
    @current_user
  end
end
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `authenticate_method` | `Symbol` | `:authenticate_request` | Method Habarico calls (via `send`) as its authentication `before_action`, on resource controllers and engine controllers alike |
| `base_controller_class` | `String` | `'ActionController::API'` | Parent class of Habarico's own engine controllers (schema, global search, user preferences) |

## See also

- [Configuration](./configuration.md) — the initializer and its other options
- [Context object](./basic-usage/context-object.md) — where `current_user` is read from
- [Permissions](./basic-usage/permissions.md) — what the authenticated user is then allowed to do
- [Auth provider](/node/providers/auth-provider) — the frontend side of authentication
