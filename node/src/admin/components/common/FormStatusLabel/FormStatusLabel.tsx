import {get} from 'lodash-es';
import React, {useEffect, useState} from 'react';
import {useFormGroups, useTranslate} from 'react-admin';
import {useFormState} from 'react-hook-form';
import {Box, Tooltip} from '@mui/material';

export type FormStatusLabelProps = {
  groupName: string;
  children: React.ReactNode;
};

/**
 * A label with a form-group status dot: renders `children` and, when the named React Admin form
 * group has errors (`error`) or unsaved-but-valid changes (`warning`), appends a small coloured dot
 * with an explanatory tooltip. The dot alone signals the status — the label text keeps its normal
 * colour. A group that both has errors and is dirty gets the error (red) dot: errors take priority.
 *
 * Not ra-core's `useFormGroup`: it reads four `formState` keys and scopes to none, so once a form
 * revalidates on change every label re-renders on every keystroke in any field. The dot needs
 * `dirtyFields` and `errors` for its own group only, off the same `useFormGroups` registry.
 */
export const FormStatusLabel = ({groupName, children}: FormStatusLabelProps) => {
  const formGroups = useFormGroups();
  // In state because it is `useFormState`'s `name`: inputs register after this first render, and
  // membership can change later - both arrive through `formGroups.subscribe`.
  const [fields, setFields] = useState<string[]>(() => formGroups?.getGroupFields(groupName) || []);
  useEffect(() => {
    if (!formGroups) return;
    const update = () => setFields(formGroups.getGroupFields(groupName) || []);
    update();
    return formGroups.subscribe(groupName, update);
  }, [formGroups, groupName]);

  // Exactly these two keys, scoped to this group's fields - nothing else wakes the label. An
  // emission with no `name` (a `reset()`) still passes, which is what keeps the dirty map correct.
  const {dirtyFields, errors} = useFormState({name: fields});
  const translate = useTranslate();

  const isDirty = fields.some((field) => get(dirtyFields, field));
  const isValid = !fields.some((field) => get(errors, field));

  const hasError = !isValid;
  const hasUnsaved = isDirty && isValid;

  let tooltipTitle = '';
  let dotColor = '';
  if (hasError) {
    tooltipTitle = translate('ra.form.tab_errors');
    dotColor = 'error.main';
  } else if (hasUnsaved) {
    tooltipTitle = translate('ra.form.tab_unsaved');
    dotColor = 'warning.main';
  }

  const dot = dotColor ? (
    <Box
      component="span"
      sx={{
        ml: 0.75,
        width: 8,
        height: 8,
        borderRadius: '50%',
        flexShrink: 0,
        backgroundColor: dotColor,
      }}
    />
  ) : null;

  return (
    <Tooltip title={tooltipTitle}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {children}
        {dot}
      </Box>
    </Tooltip>
  );
};
