export const listSx = {
  '& .RaList-main': {
    overflow: 'hidden', // to avoid scrollbars
    '.MuiTablePagination-root': {
      m: 0,
    },
    // The box body is full-bleed, so end the pagination on the panel's content gutter (16px), the
    // same right edge as the toolbar above (MUI's own toolbar padding is only 2px).
    '.MuiTablePagination-toolbar': {
      pr: 2,
    },
    // RA renders an empty actions container (with MUI's 20px left margin) on a single page, which
    // pushed the "1–1 of 1" label further in than the rows above it.
    '.MuiTablePagination-actions:empty': {
      display: 'none',
    },
    // Empty list message (RA `ListNoResults`: a `CardContent` wrapping a `Typography`). No padding
    // and no background of its own: inside a nested (grey) panel a paper-coloured, padded message
    // read as a white box sitting inside the panel. The text sits directly on the panel surface.
    '.MuiCardContent-root:has(> .MuiTypography-root)': {
      p: 0,
    },
    '.MuiCardContent-root > .MuiTypography-root': {
      textAlign: 'center',
      py: 2,
    },

    '& .mnl__scrollbar__root': {
      maxHeight: '70vh', // adjust based on your layout
    },
  },
  '& .RaList-actions': {
    alignItems: 'center', // filters and actions aligned to the center
    padding: '0.3rem 16px 0.3rem 0.3rem',
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
      // More breathing room between the filters and the actions.
      paddingLeft: '24px',
      // The right edge is set by `.RaList-actions` above; MUI's 24px toolbar gutter on top of it
      // pushed the buttons well inside the panel.
      paddingRight: 0,
      // RA's TopToolbar defaults to 8px bottom / 4px top, which pushes the buttons up; even it out.
      paddingBottom: '4px',
      gap: '4px',
      // MUI's page-toolbar min height (56–64px) left a tall empty band above the datagrid in a box
      // without filters; the row only needs to fit its buttons.
      minHeight: 0,
    },
  },
};
