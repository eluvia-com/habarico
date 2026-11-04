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
covers every resource. Raise `Eluvia::Errors::Unauthorized` (from `eluvia-base`, which Habarico
depends on) on failure, so the error is rendered through the same pipeline as the rest of the API:

```ruby
class ApplicationController < ActionController::API
  include ActionController::Cookies
  include Eluvia::ErrorHandler

  def authenticate_request
    raise Eluvia::Errors::Unauthorized.new('Sign in first.') if current_user.nil?
  end

  def current_user
    @current_user ||= User.find_by(id: session[:user_id])
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

That is the whole integration — a session here, but nothing in Habarico knows or cares which
mechanism fills `current_user`. The
[e-shop example](https://github.com/eluvia-com/habarico/tree/master/examples/eshop) is a working
Rails backend built on exactly this, down to the login and password-reset endpoints.

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
`authenticate_method` holds a method name, not a call. A method that takes arguments still needs
the one-line `authenticate_request` wrapper shown above.
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

## A bearer token instead of a session

Nothing above depends on the session — the hook only has to leave a user behind. The same
controller against a JWT, for an admin whose frontend is served from another origin:

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
