export const listSx = {
  '& .RaList-main': {
    overflow: 'hidden', // to avoid scrollbars
    '.MuiTablePagination-root': {
      m: 0,
    },
  },
  '& .RaList-actions': {
    alignItems: 'center', // filters and actions aligned to the center
    padding: '0.3rem 0.5rem', // padding for the header area
    flexWrap: 'nowrap', // no wrapping of the action buttons
    '.filter-form': {
      display: 'flex',
      gap: 1,
      flexWrap: 'wrap',
      minHeight: 0, // to avoid extra space in the form
      flex: '0 1 100%',
      width: '100%',
      padding: 0,
      '& .RaFilterForm-filterFormInput .MuiFormControl-root': {
        marginTop: 0, // to avoid extra space above the form input
      },
      '& .RaFilterForm-filterFormInput .MuiFormGroup-root': {
        marginLeft: 2,
      },
      '& .filter-field': {
        flex: '1 1 auto',
        '.MuiFormHelperText-root': {
          display: 'none', // hide helper text
        },
        minWidth: '150px',
        '& .RaFilterFormInput-hideButton': {
          marginBottom: '3px',
        },
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
      paddingLeft: '16px',
    },
  },
};
