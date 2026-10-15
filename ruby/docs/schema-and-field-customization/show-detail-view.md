---
title: Show / Detail View
sidebar_position: 3
---

Simple flat layout:

```ruby
Habarico::ShowView.new(
  boxes: [:id, :product, :customer, :status, :placed_at, :delivered_at, :created_at],
)
```

**Rich tabbed layout with nested boxes** — the most common production pattern:

```ruby
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
                boxes: [:placed_at, :delivered_at, :outstanding_amount],
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
)
```
