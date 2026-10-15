import React from 'react';
import {RaRecord, SimpleForm, SimpleFormProps, useRecordContext, useSaveContext} from 'react-admin';
import {FieldValues, SubmitHandler} from 'react-hook-form';
import {SubmitButton} from '@admin/components/buttons/SubmitButton';
import {ViewToolbar} from '@admin/components/views/ViewToolbar';
import {useFormExtensions} from '@admin/contexts/FormExtensionsContext';
import {FormInputSourcesProvider} from '@admin/contexts/FormInputSourcesContext';
import {RootRecordContextProvider} from '@admin/contexts/RootRecordContext';
import {UploadingProvider} from '@admin/contexts/UploadingContext';
import {useViewPresentation} from '@admin/contexts/ViewPresentationContext';
import {FORM_WIDTH_REFERENCE_CLASS} from '@design/organisms/FormTable/constants';
import {omitDeepByValues} from '@foundation/utils/form';
import {Box} from '@mui/material';
import {DraftController} from './DraftController';
import {FormNavigationGuard} from './FormNavigationGuard';

// The form's action bar, routed through the presentation like `ViewContent`'s `bottomActions`: in a
// dialog it portals into the surface's footer (`DialogActions`); on a page `setBottomActions` returns
// `undefined`, so it falls back to the in-flow `ViewToolbar`. Rendered as the `SimpleForm` toolbar, so
// it stays in the react-admin form subtree — the portal only moves the DOM, the save context is kept.
const FormToolbar = ({children}: {children: React.ReactNode}) => {
  const {setBottomActions} = useViewPresentation();
  return setBottomActions(children) ?? <ViewToolbar>{children}</ViewToolbar>;
};

export type FormShellProps = {
  onSubmit?: SubmitHandler<FieldValues>;
  onPostSubmit?: () => void;
  children?: React.ReactNode;
  validate?: SimpleFormProps['validate'];
  record?: RaRecord;
  formActions?: React.ReactNode;
  defaultValues?: Record<string, unknown>;
  mode?: SimpleFormProps['mode'];
};

export const FormShell = ({
  onSubmit,
  onPostSubmit,
  children,
  validate,
  record: propsRecord,
  formActions,
  defaultValues,
  mode = 'onBlur',
}: FormShellProps) => {
  const {save} = useSaveContext();
  const contextRecord = useRecordContext();
  const {formExtensions} = useFormExtensions();

  const record = propsRecord || contextRecord;

  // Post submit callback support
  const handleSubmit = async (data: FieldValues) => {
    let errors;
    if (onSubmit) {
      errors = await onSubmit(data);
    } else if (save) {
      errors = await save(data);
    }
    if (onPostSubmit) onPostSubmit();
    return errors;
  };

  const finalDefaultValues =
    defaultValues && record ? omitDeepByValues(defaultValues, record) : defaultValues;

  // Propagate full height through react-admin's SimpleForm internals so the content
  // can "take the rest": the <form>, the RaSimpleForm content (CardContent) and its
  // inner Stack become flex columns that fill, leaving the save toolbar its own height.
  // Without this the content's height:100% collapses to auto and pushes the toolbar out.
  return (
    <UploadingProvider>
      <FormInputSourcesProvider>
        <RootRecordContextProvider value={record}>
          <Box
            // The width every input inside this form lays itself out by, and the only element above
            // a hidden tab panel that still reports a resize while one is hidden — see
            // `FORM_WIDTH_REFERENCE_CLASS`.
            className={FORM_WIDTH_REFERENCE_CLASS}
            sx={{
              height: '100%',
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              '& > form': {flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column'},
              '& .RaSimpleForm-root': {
                flexGrow: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
              },
              '& .RaSimpleForm-root > .MuiStack-root': {flexGrow: 1, minHeight: 0, width: '100%'},
            }}
          >
            <SimpleForm
              toolbar={
                <FormToolbar>
                  {formActions ?? <SubmitButton size="medium" variant="contained" />}
                </FormToolbar>
              }
              onSubmit={handleSubmit}
              validate={validate}
              defaultValues={finalDefaultValues}
              mode={mode}
              // The `RaSimpleForm-root` is a MUI `CardContent`, whose `:last-child` rule forces a 24px
              // bottom padding that `p: 0` (lower specificity) can't beat — the `:last-child` selector
              // here matches it and zeroes the gap, so the form sits flush inside the box `Panel`.
              sx={{p: 0, '&:last-child': {pb: 0}}}
            >
              <Box sx={{width: '100%'}}>
                {children}
                {formExtensions &&
                  Object.entries(formExtensions).map(([id, node]) =>
                    React.cloneElement(node as React.ReactElement, {key: id})
                  )}
              </Box>
              <FormNavigationGuard />
              <DraftController />
            </SimpleForm>
          </Box>
        </RootRecordContextProvider>
      </FormInputSourcesProvider>
    </UploadingProvider>
  );
};
