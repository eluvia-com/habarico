---
title: Complete Example
sidebar_position: 11
---

A full resource in one file: Pundit permissions, N+1 prevention, dynamic breadcrumbs, row tags,
a tabbed show view with nested boxes and embedded lists, a form-driven member action and a
confirm-dialog resource action.

The domain is the one used across this documentation — an e-shop, here seen from the order side.

```ruby
# config/initializers/habarico.rb
Habarico.setup do |config|
  config.resources = [
    { admin: [:categories, :orders, :order_items, :shipments] }
  ]
  config.routing_url_prefix = ENV.fetch('URL_PREFIX') { '' }
  config.routing_scope      = 'apps'
  config.currency           = 'CZK'
end
```

```ruby
# app/controllers/apps/admin/orders_controller.rb
class Apps::Admin::OrdersController < ApplicationController
  include Habarico::Controller

  # ── Model ───────────────────────────────────────────────────────────
  model Order
  includes [
             :customer,
             product: {
               category: [:brand]
             },
           ]

  prefetch do |records|
    OutstandingAmountService.instance.get_outstanding_amounts(records).each do |order_id, outstanding_amount|
      order = records.find { |r| r.id == order_id }
      order.outstanding_amount = outstanding_amount if order
    end
  end
  
  # ── Permissions ───────────────────────────────────────────────────────────
  can_read true   # skip per-record check — same answer for all records
  can_create do |c|; c.policy.create?; end
  can_update do |c|; c.policy.update?; end
  can_delete do |c|; c.policy.destroy?; end

  # ── Navigation ───────────────────────────────────────────────────────────
  label 'Orders'
  icon 'Receipt'
  breadcrumbs do |view, c|
    result = [Habarico::ViewMenuItem.new(label: 'Orders', view_name: 'list', reference: Order)]
    if view.name == 'show' && c.record.present?
      result << Habarico::ViewMenuItem.new(
        label: c.record.product.name,
        view_name: 'show',
        reference: c.record.product,
      )
      result << Habarico::TextMenuItem.new(label: c.record.customer.name)
    end
    result
  end

  # ── Fields ───────────────────────────────────────────────────────────────
  fields [
    :id, :product, :customer, :status,
    :placed_at, :delivered_at, :total_amount,
    :paid_amount, :outstanding_amount, :created_at, :updated_at,
  ]
  read_only_fields [:id, :outstanding_amount, :created_at, :updated_at]
  filters [:status, :category, :product, :placed_at, :delivered_at]
  sorting_fields [:placed_at, :delivered_at, :created_at]
  default_sorting 'placed_at:desc'
  
  # ── Tags ────────────────────────────────────────────────────────────

  tags do |c|
    c.record.occupancy_status ? ["color-#{c.record.occupancy_status_color}"] : []
  end

  # ── Views ─────────────────────────────────────────────────────────────────
  views [
    # List — filters separated: drawer vs toolbar
    Habarico::ListView.new(
      boxes: [
        Habarico::FieldReference.new(
          name: :product,
          label: 'Unit',
          sortable: true,
          sort_by: 'products.name',
        ),
        :customer,
        :status,
        Habarico::FieldReference.new(name: :outstanding_amount, label: 'Debt', text_align: 'right'),
        :placed_at,
        :delivered_at,
      ],
      filters: [],
      toolbar_filters: [:status, :category, :product],
      row_actions: [:show, :edit, :delete],
      toolbar_actions: [:create],
      default_sorting: 'placed_at:desc',
    ),

    # Show — tabbed layout with nested grid and embedded lists
    Habarico::ShowView.new(
      box: Habarico::TabBox.new(
        boxes: [
          Habarico::TabItemBox.new(
            label: 'Overview',
            boxes: [
              Habarico::GridBox.new(
                boxes: [
                  Habarico::GridItemBox.new(
                    md: 6,
                    boxes: [:product, :customer, :status],
                  ),
                  Habarico::GridItemBox.new(
                    md: 6,
                    boxes: [:placed_at, :delivered_at, :total_amount, :paid_amount, :outstanding_amount],
                  ),
                ]
              ),
            ]
          ),
          Habarico::TabItemBox.new(
            label: 'Installments',
            boxes: [
              Habarico::ListBox.new(
                name: 'order_items',
                label: 'Installments',
                reference: 'order_items',
                target: 'order',
                boxes: [:maturity_date, :amount_major, :status],
                row_actions: [:show, :edit],
                list_toolbar_actions: [:create],
                default_sorting: 'maturity_date:asc',
              ),
            ]
          ),
          Habarico::TabItemBox.new(
            label: 'Defects',
            boxes: [
              Habarico::ListBox.new(
                name: 'defects',
                label: 'Defects',
                reference: 'defects',
                target: 'order',
                boxes: [:title, :reported_at, :status],
                row_actions: [:show, :edit],
                list_toolbar_actions: [
                  Habarico::ActionReference.new(
                    name: 'create',
                    permission: :update,
                    if: ->(c) { c.record&.guarantee_usable? },
                  ),
                ],
                default_sorting: 'reported_at:desc',
              ),
            ]
          ),
        ]
      )
    ),

    # Create / Edit — shared tabbed form
    Habarico::CreateView.new(
      box: Habarico::TabBox.new(
        boxes: [
          Habarico::TabItemBox.new(
            label: 'Basic info',
            boxes: [:product, :customer, :status],
          ),
          Habarico::TabItemBox.new(
            label: 'Dates & Financials',
            boxes: [:placed_at, :delivered_at, :total_amount, :paid_amount],
          ),
        ]
      )
    ),
    Habarico::EditView.new(
      box: Habarico::TabBox.new(
        boxes: [
          Habarico::TabItemBox.new(
            label: 'Basic info',
            boxes: [:product, :customer, :status],
          ),
          Habarico::TabItemBox.new(
            label: 'Dates & Financials',
            boxes: [:placed_at, :delivered_at, :total_amount, :paid_amount],
          ),
        ]
      )
    ),

    # ActionView — schema for the guarantee payback form
    Habarico::ActionView.new(
      name: 'refund',
      is_detail: true,
      boxes: [:refund_to_customer],
      model: RefundRequest,
      endpoint_action_name: 'refund',
      endpoint_method: :put,
    ),
  ]

  # ── Actions ───────────────────────────────────────────────────────────────
  actions [
    :show,
    :edit,
    :delete,

    # Form-driven member action (opens a dialog with ActionView form)
    Habarico::ViewAction.new(
      name: 'refund',
      label: 'Pay back guarantee',
      icon: 'Payments',
      view_name: 'refund',
      view_mode: :dialog,
      is_detail: true,
      permission: :update,
      if: ->(c) {
        c.record && RefundService.instance.can_refund?(c.record, Date.today)
      },
    ),

    # Bare collection action with confirm dialog
    Habarico::ResourceAction.new(
      name: 'close_accounting_period',
      label: 'Close period',
      color: :primary,
      icon: 'Lock',
      confirm_dialog_title: 'Close the accounting period?',
      confirm_dialog_message: 'Orders in this period can no longer be edited.',
      is_detail: false,
      show_in_list: true,
      endpoint_method: :put,
      permission: :update,
    ),
  ]

  # ── Registered actions ────────────────────────────────────────────────────
  register_action :refund,
                  is_detail: true,
                  method: :put,
                  model: RefundRequest,
                  permission: :update do
    refund_to_customer = ActiveModel::Type::Boolean.new.cast(params[:refund_to_customer])
    RefundService.instance.refund(@record, Date.today, refund_to_customer)
    Habarico::Response.new(message: 'Guarantee paid back successfully.')
  end

  register_action :close_accounting_period, is_detail: false, method: :put, permission: :update do
    AccountingService.instance.lock_period(current_accounting_period)
    Habarico::Response.new(message: 'Accounting period closed.')
  end

  # ── Controller hooks ──────────────────────────────────────────────────────

  # Inject extra params when an order item is created from the embedded list
  def complement_record_params
    order_id = params[:order_id]
    return {} unless order_id.present?

    order = Order.find_by(id: order_id)
    order ? { product_id: order.product_id } : {}
  end

  # Block writes when the accounting period is locked
  def is_update_possible?(record)
    !record.accounting_period.closed? && !record.shipped?
  end

  def is_delete_possible?(record)
    !record.accounting_period.closed? && !record.shipped?
  end
end
```

## See also

- [Controller setup](./basic-usage/controller-setup.md) — the same resource, one concept at a time
- [Field types](./field-types.md) — what each declared field becomes in the schema
- [Custom actions](./schema-and-field-customization/custom-actions.md) — the two action styles used above
- [Create/edit view boxes](./schema-and-field-customization/create-edit-view-boxes.md) — the box layout
