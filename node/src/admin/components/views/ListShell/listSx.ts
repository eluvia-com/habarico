import {Theme} from '@mui/material';

export const listSx = (theme: Theme) => ({
  '& .RaList-main': {
    overflow: 'hidden', // to avoid scrollbars
    // empty list message
    '.MuiCardContent-root > .MuiTypography-root': {
      textAlign: 'center',
      py: 2,
      backgroundColor: theme.palette.background.paper,
    },
  },
  '& .mnl__scrollbar__root': {
    maxHeight: 'calc(100vh - 285px)', // adjust based on your layout
  },
  '& .RaList-actions': {
    alignItems: 'center', // filters and actions aligned to the center
    p: '0.3rem 0.5rem', // padding for the header area
    flexWrap: 'nowrap', // no wrapping of the action buttons
    'form, .filter-form': {
      display: 'flex',
      gap: 1,
      minHeight: 0, // to avoid extra space in the form
      flex: '0 1 100%',
      width: '100%',
      p: 0,
      '& .RaFilterForm-filterFormInput .MuiFormControl-root': {
        marginTop: 0, // to avoid extra space above the form input
      },
      '& .RaFilterForm-filterFormInput .MuiFormGroup-root': {
        marginLeft: 2,
      },
      '& div.filter-field': {
        flex: '1 1 auto',
        '.MuiFormHelperText-root': {
          display: 'none', // hide helper text
        },
        minWidth: '150px',
        '& .RaFilterFormInput-hideButton': {
          marginBottom: '3px',
        },
      },
      // Boolean and tri-state boolean filters size to their content instead of
      // stretching across the toolbar like text/relation filters.
      '& div.filter-field:has(.MuiToggleButtonGroup-root), & div.filter-field:has(.MuiSwitch-root)':
        {
          flex: '0 0 auto',
          minWidth: 'auto',
        },
      '& .RaFilterFormInput-spacer': {
        display: 'none',
      },
      '& .RaFilterForm-clearFix': {
        display: 'none',
      },
    },
    '& div.MuiToolbar-root': {
      flex: 'none',
      // More breathing room between the filters and the actions.
      paddingLeft: '24px',
      // RA's TopToolbar defaults to 8px bottom / 4px top, which pushes the buttons up; even it out.
      paddingBottom: '4px',
      gap: '4px',
    },
  },
});
