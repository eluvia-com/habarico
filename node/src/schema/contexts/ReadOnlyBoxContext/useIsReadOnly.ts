import {useContext} from 'react';
import {useViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';
import {ReadOnlyBoxContext} from './ReadOnlyBoxContext';

/**
 * Whether what is being rendered here is a value rather than an input: the view is read-only
 * (`list` / `show`, or an `action` view whose box is), **or** an enclosing box declared
 * `read_only: true`.
 *
 * Use this — not `useViewSchemaContext().readOnly` — wherever the choice is "field or input". The
 * view's own flag is still the right one for a question about the *view*: the dynamic wrappers ask
 * it to find out whether a `<Form>` is in scope at all, and a read-only box inside an edit view
 * does not remove the form its queries read from.
 */
export const useIsReadOnly = (): boolean => {
  const {readOnly: readOnlyView} = useViewSchemaContext();
  const readOnlyBox = useContext(ReadOnlyBoxContext);

  return readOnlyView || readOnlyBox;
};
