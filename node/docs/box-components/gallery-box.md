---
title: SchemaGalleryBox
sidebar_position: 10
---

Shows the images of a related resource as a carousel, with a full-size dialog behind a click.

Use it where a list of image records would be shown as rows but reads better as pictures — the
photos of a product, the attachments of an order.

## Example

```python
ShowViewSchemaGenerator(box=Box(boxes=[
    Box(label="Product", boxes=["name", "sku"]),
    GalleryBox(
        label="Photos",
        reference="eshop/product-image",
        target="product",
        image_field="image",
        toolbar_actions=["upload-files"],
    ),
]))
```

## Schema fields

Under `schema.gallery` (`GalleryBoxParameters`):

| Field | Type | Default | Description |
|---|---|---|---|
| `reference` (required) | `ResourceReference` | — | Resource holding the images; its `params` are sent when fetching that resource's schema |
| `imageField` (required) | `string` | — | Field of that resource carrying the file |
| `target` | `string` | — | Foreign key pointing back at the parent record |
| `filters` | `FilterDescriptor[]` | — | Currently ignored by the frontend — the gallery's filter bar is switched off |
| `defaultSorting` | `SortDescriptor` | — | Initial sort |
| `extraFilters` | `Filters` | — | Filters applied on top, not shown in the UI |

The box's own `toolbarActions` render in the header, bound to the `target` — that is where an
upload or manage button goes. `bottomActions` render right-aligned underneath.

## Behaviour

- The gallery reads an infinite list: paging is triggered by navigating past the last loaded image,
  not by a pagination bar. The filter bar and list actions are switched off entirely.
- Only records whose `imageField` resolves to a file with a `url` are shown; the rest are skipped.
- Without a `record` in context nothing renders — like the list box, this is a detail-view container.
- The image strip carries at most ten position dots, however many images there are.

:::caution
`SchemaImagesBox` is a different component with a similar name. It renders a **list box** of images
(it reads `schema.list`, not `schema.gallery`) with a filter bar, pagination and an export — the
`gallery` box type never resolves to it. Mount it through a
[box provider](../providers/box-provider.md) override when you want the list-style variant.
:::

## See also

- [UploadInput](../input-components/upload-input.mdx) — how the images get in
- [SchemaListBox](./list-box.md) — the same relation as a table
- [File uploads](/concepts/guides/file-uploads) — the upload flow end to end
