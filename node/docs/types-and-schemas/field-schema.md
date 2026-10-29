---
title: FieldSchema
sidebar_position: 3
---

Describes a single field in a view. `type` is the JSON type, `format` specializes the rendering —
together they pick the field and input component (see
[FieldProvider](../providers/field-provider.md) and [InputProvider](../providers/input-provider.md)).

```typescript
type FieldType = 'integer' | 'number' | 'boolean' | 'string' | 'object' | 'array';

type FieldFormatType =
  | 'date' | 'date-time' | 'time' | 'text' | 'rich-text' | 'email' | 'url' | 'password'
  | 'base64-image' | 'base64-file' | 'uuid'
  | 'relation' | 'tree-relation' | 'choices'
  | 'ai' | 'ai-text' | 'search' | 'decimal' | 'phone' | 'range'
  | 'czech-birth-number' | 'czech-id-card-number' | 'czech-ico' | 'czech-dic' | 'czech-bank-account';

type FieldSchema = {
  name: string;
  type: FieldType;
  format?: FieldFormatType;
  label?: string;
  shortLabel?: string;
  helpText?: string;
  readOnly?: boolean;
  writeOnly?: boolean;
  nullable?: boolean;
  required?: boolean;
  defaultValue?: string | boolean | number;
  reference?: string;        // Target resource for relation fields, e.g. "eshop/category"
  sortable?: boolean;
  sortBy?: string;
  aggregations?: AggregateFunctionType[];     // Functions offered on the /aggregate endpoint
  groupBy?: FieldGroupByOption[];             // How the field may be grouped in aggregations
  enum?: EnumType;
  properties?: FieldSchema[];   // Nested fields for object types
  items?: ItemFieldSchema | FieldSchema;      // Item schema for array types
  targetSource?: string;
  options?: FieldOptions;
};

// The item schema of an array field — a FieldSchema without the list-level keys
// (no `name`, `sortable`, `sortBy`, `aggregations`, `groupBy`, `items`, `targetSource`).
type ItemFieldSchema = {
  type: FieldType;
  format?: FieldFormatType;
  label?: string;
  shortLabel?: string;
  helpText?: string;
  readOnly?: boolean;
  writeOnly?: boolean;
  nullable?: boolean;
  required?: boolean;
  defaultValue?: string | boolean | number;
  reference?: string;
  enum?: EnumType;
  options?: FieldOptions;
  properties?: FieldSchema[];
};

type ColorType = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';
type ColorWithInherit = ColorType | 'inherit';

type EnumType = {
  value: string | number;
  label: string;
  color?: ColorWithInherit;
  icon?: string;
}[];

type AggregateFunctionType = 'count' | 'sum' | 'avg' | 'min' | 'max';

type TruncGranularity =
  | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

type FieldGroupByOption = 'exact' | 'width' | `trunc:${TruncGranularity}`;

type DynamicRenderOptions = {
  showQuery?: string;     // condition expression; field is visible when truthy
  requiredQuery?: string; // condition expression; field is required when truthy
};

type NumberFieldOptions = {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  style?: 'currency' | 'unit';
  currency?: string;
  unit?: string;
};

type PhoneFieldOptions = {
  defaultRegion?: string;
  allowedRegions?: string[];
};

type UploadProviderName = 's3-multipart' | 'tus';

type UploadFieldOptions = {
  provider: UploadProviderName;    // 's3-multipart' (presigned PUT/multipart) or 'tus' (resumable)
  threshold: number;               // File size (bytes) at/above which the chunked provider is used
  chunkSize: number;               // Chunk / part size in bytes
  minChunkSize?: number;           // s3-multipart only — S3 min part size (5 MiB); PUT vs. multipart split
  initiateUrl?: string;            // s3-multipart only — presign endpoint; already carries ?model=…&field=…
  endpoint?: string;               // tus only — tus server URL
};
```

## FieldOptions

`options` is grouped by concern — the sub-objects are what the backend emits and what the
components read.

```typescript
type ChoicesFieldOptions = {
  iconsKey?: string;               // Key into the `iconsMap` passed to SchemaAdmin
};

type ImageFieldOptions = {
  resizeWidth?: number;            // Client-side resize width in px (base64 path only)
  cropAspectRatio?: number;        // Client-side crop ratio, e.g. 1.0 = square (base64 path only)
};

type AiFieldOptions = {
  sourceFields?: string[];         // Fields the AI assistant reads to generate this one
};

type RelationFieldOptions = {
  filters?: {name: string; value: string | number | boolean}[];
  sort?: SortDescriptor;           // {fieldName; direction: 'asc' | 'desc'}
  showLink?: boolean;
  linkMode?: ViewModeType;         // 'dialog' | 'redirect' | 'sidepanel'
  dialogWidth?: string;            // linkMode: 'dialog' only — MUI breakpoint ("md") or CSS width ("800px")
  keepLinked_parent?: boolean;
  showEditButton?: boolean;
  showCreateButton?: boolean;
  preserveOrder?: boolean;
  parent?: string;
};

type LinkTarget = 'self' | 'blank';

// `type` matches the wire value verbatim: the snake_case-to-camelCase conversion the backend
// applies renames object keys, not string values — so "max_length", never "maxLength".
type ValidatorRuleType = 'max_length' | 'min_length' | 'max_value' | 'min_value' | 'regex';

type ValidatorRule = {
  type: ValidatorRuleType;
  value: number | string;          // The bound, or the pattern for `regex`
  message?: string;                // Error text; falls back to a generic translation
};

type FieldOptions = {
  choices?: ChoicesFieldOptions;
  image?: ImageFieldOptions;
  ai?: AiFieldOptions;
  upload?: UploadFieldOptions;     // Chunked-upload config (auto-injected by the backend)
  maxSize?: number;                // Max file size in bytes — rejected client-side and server-side
  maxFiles?: number;               // Max selectable files; > 1 enables multi-file mode
  accept?: string[];               // Allowed extensions, e.g. [".jpg", ".png"]
  dynamicRender?: DynamicRenderOptions;
  textAlign?: 'left' | 'right' | 'center';
  target?: LinkTarget;             // Link target for url / file fields
  number?: NumberFieldOptions;
  phone?: PhoneFieldOptions;
  prefix?: string;
  postfix?: string;
  relation?: RelationFieldOptions;
  validators?: ValidatorRule[];    // Validation rules the backend declared — see below
};
```

:::caution
The grouped keys are nested, not flat: `options.choices.iconsKey`, `options.image.resizeWidth`,
`options.ai.sourceFields`, `options.number.currency`, `options.phone.defaultRegion` and
`options.relation.showLink`. A flat `iconsKey`, `resizeWidth` or `numberFormat` is silently
ignored — `numberFormat` is the *prop* of the `NumberField` / `NumberInput` components, the schema
key is `options.number`.
:::

:::caution
`options.target` is stored **without** the leading underscore (`"blank"`, not `"_blank"`) — the
client prepends it before handing the value to the DOM.
:::

## Validation rules

`options.validators` carries the constraints the backend declared on the field, so the same rule
that rejects a value on the server also stops the form before it is submitted. The generated
inputs apply them without any configuration; a rule the frontend cannot enforce is simply left to
the backend.

```json
{
  "name": "sku",
  "type": "string",
  "options": {
    "validators": [
      {"type": "max_length", "value": 16},
      {"type": "regex", "value": "^[A-Z]{3}-\\d{4}$", "message": "Format: ABC-1234"}
    ]
  }
}
```

Which validator each `type` maps to — and how to add or replace one — is on the
[validator provider](../providers/validator-provider.md) page. `required` is **not** a rule here:
it is the field's own `required` flag.

## FieldDescriptor

A view does not repeat the whole `FieldSchema`; it references a field by name and overrides only
what differs for that screen. `FieldDescriptor` is what `ListViewParameters.boxes` and a box's
`boxes` array carry.

```typescript
type FieldDescriptor = {
  type: 'field';
  name: string;
  label?: string;
  shortLabel?: string;
  helpText?: string;
  sortable?: boolean;
  sortBy?: string;
  readOnly?: boolean;
  writeOnly?: boolean;
  defaultValue?: string | number | boolean;
  action?: ActionDescriptor | ActionSchema;   // Renders the field as a trigger
  wrapper?: FieldWrapperProperties;           // Groups several fields into one cell
  options?: FieldOptions;
  aggregations?: AggregateFunctionType[];
  groupBy?: FieldGroupByOption[];
  // carried through for aggregate widgets so the chart can render readable labels
  format?: FieldFormatType;
  reference?: string;
  enum?: EnumType;
};

type FieldWrapperProperties = {
  divider?: string;                // Separator rendered between the wrapped fields
  fields: FieldDescriptor[];
};
```

## FilterSchema and FilterDescriptor

```typescript
type FilterSchema = {
  name: string;
  type: FieldType;
  format?: FieldFormatType;
  label: string;
  helpText?: string;
  defaultValue?: string | boolean | number;
  reference?: string;
  enum?: EnumType;
  options?: FieldOptions;
  properties?: FieldSchema[];
  items?: ItemFieldSchema | FieldSchema;
  isAlwaysOn?: boolean;            // Rendered outside the filter drawer
};

type FilterDescriptor = {
  name: string;
  label?: string;
  helpText?: string;
  isAlwaysOn?: boolean;
  defaultValue?: string | number | boolean;
  options?: FieldOptions;
};
```

## UploadFilesActionParameters

Parameters of the `upload-files` action button (`SchemaUploadFilesButton`) — see
[Action schema](./view-schema-and-action-schema.md). The button bulk-uploads files, images and
documents alike, and creates one record per file.

```typescript
type UploadFilesActionParameters = {
  reference?: string;              // Resource where a record is created for each file
  target?: string;                 // FK field on the file model linking to the parent record
  fileField: string;               // Field on the created record that holds the file
  accept?: string[];               // Allowed file types e.g. [".pdf", ".docx"]; defaults to common image types
  resizeWidth?: number;            // Client-side resize width in px before upload (images only)
  cropAspectRatio?: number;        // Client-side crop ratio before upload (images only)
  maxSize?: number;                // Max file size in bytes — rejected client-side
  maxFiles?: number;               // Max selectable files
  upload?: UploadFieldOptions;     // Chunked-upload config (auto-injected when a chunked provider is configured)
  data?: Record<string, string | number | boolean>;   // Extra fields sent with every created record
};
```

When `accept` or `upload` is not set, the button takes it from the options of `fileField` in the
schema of the resource the records are created in. Without either, `accept` falls back to `.png`,
`.jpg`, `.jpeg`, `.bmp` and `.gif`, and every other file is rejected.

:::caution
An action that uploads documents (PDF, DOCX, XLSX, ZIP, …) must set `accept`, here or on the
options of `fileField` — the default admits images only. An action without `fileField` saves
nothing.
:::

## See also

- [ChoicesField](../field-components/choices-field.mdx) — renders `format: "choices"`
- [UploadInput](../input-components/upload-input) — reads `options.upload`, `accept`, `maxSize`
- [Service and resource schema](./service-schema-and-resource-schema.md)
- [REST API reference](/api) — the wire format these types describe
