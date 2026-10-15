import {REGEX} from '@foundation/utils/template';

// The top-level form field names a template's `%{formData.*}` / `%{data.*}` placeholders read —
// what the subscription has to cover for the template to stay live as the user types. `record.` /
// `viewData.` roots are left out on purpose: they come from the record or the view, not from form
// state, so nothing about them changes on a keystroke. Only the first path segment is kept, because
// `%{formData.address.city}` needs the whole `address` object handed back to the template — so
// `address` is the name to watch.
export const getTemplateFormSources = (text: string): string[] => [
  ...new Set(
    [...text.matchAll(REGEX)]
      .map((match) => match[1])
      .filter((path) => path.startsWith('formData.') || path.startsWith('data.'))
      .map((path) => path.split('.')[1])
  ),
];
