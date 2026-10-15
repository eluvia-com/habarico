import {useEffect, useMemo, useReducer} from 'react';
import {useFormContext} from 'react-hook-form';
import {DataType} from '@typing';
import {getTemplateFormSources} from './utils';

/**
 * The form half of a template: the values its `%{formData.*}` / `%{data.*}` placeholders resolve
 * against, kept live as the user types. Returns `undefined` outside a form, so the caller can fall
 * back to the record.
 */
export const useTemplateFormData = (text: string): DataType | undefined => {
  // Memoized: it is the subscription's `name`, so a fresh array identity per render would tear the
  // subscription down and rebuild it on every render.
  const sources = useMemo(() => getTemplateFormSources(text), [text]);
  const form = useFormContext();
  // `subscribe` is a side-effect subscription - it never re-renders on its own.
  const [, rerender] = useReducer((count: number) => count + 1, 0);

  // `form.subscribe` and not `useWatch`: a templated label also renders outside a form (a list or
  // show row action), `useWatch` throws without a `FormProvider` above it, and a hook cannot guard
  // against that - hooks cannot be called conditionally. Subscribing imperatively is simply a no-op
  // when there is no form.
  //
  // Not `form.watch(names)` either. That one registers the names in the control's global watch set
  // (`_names.watch`, add-only - nothing ever removes a name, not even unmounting), which turns
  // every keystroke into a watched field into a re-render of the component that owns `useForm` -
  // ra-core's `<Form>` - and so of the whole form tree. One templated label is enough to defeat the
  // form's per-field render isolation, permanently.
  //
  // `subscribe` matches names exactly like `useWatch` does (by prefix in both directions, so a
  // change to `address.city` reaches a subscription on `address`) and wakes only this caller.
  useEffect(() => {
    if (!form || !sources.length) return;
    return form.subscribe({name: sources, formState: {values: true}, callback: rerender});
  }, [form, sources, rerender]);

  if (!form) return undefined;

  // Read at render time instead of held in state: react-hook-form mutates `_formValues` in place,
  // and anything that changes a value without this subscription seeing it (a `reset()` from another
  // component's mount effect, before the effect above has run) re-renders the form anyway - so a
  // fresh read is current where a stored snapshot would be stale.
  const values = form.getValues(sources);
  return Object.fromEntries(sources.map((source, index) => [source, values[index]]));
};
