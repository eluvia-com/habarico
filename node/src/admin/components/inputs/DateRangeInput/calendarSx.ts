export const calendarSx = {
  '& .MuiPaper-root': {p: 1},
  '& .CalendarHeader': {
    px: 1,
    pb: 1,
  },

  '& .MuiDayCalendar-weekContainer': {gap: 0},
  '& .MuiPickerDay-root': {
    margin: 0,
    '&:focus, &:hover': {bgcolor: 'transparent'},
    borderRadius: 0,
  },
  '& .DateRangeInputValue-clearButton': {
    minWidth: 0,
    minHeight: 0,
    px: 0.5,
    py: 0.5,
    mb: 0.25,
    fontSize: '0.75rem',
    lineHeight: 1,
    '& .MuiSvgIcon-root': {
      fontSize: 'inherit',
    },
  },

  '& .DateRangeInputValue': {
    '&.selected': {
      fontWeight: 'bold',
      textDecoration: 'underline',
      cursor: 'default',
    },
    '&:not(.selected)': {
      cursor: 'pointer',
    },
  },

  '& .DateRangePickerDay-root': {
    '& .DateRangePickerDay-inside': {
      bgcolor: 'action.selected',
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
    },

    '& .DateRangePickerDay-hoverInside': {
      borderTop: '3px dashed',
      borderBottom: '3px dashed',
      borderColor: 'action.selected',
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
    },

    '&.start': {
      '& .DateRangePickerDay-inside': {
        borderTopLeftRadius: '999px',
        borderBottomLeftRadius: '999px',
      },
      '&.select-upper .DateRangePickerDay-hoverInside': {
        borderTopLeftRadius: '999px',
        borderBottomLeftRadius: '999px',
      },
    },
    '&.end': {
      '& .DateRangePickerDay-inside': {
        borderTopRightRadius: '999px',
        borderBottomRightRadius: '999px',
      },

      '&.select-lower .DateRangePickerDay-hoverInside': {
        borderTopRightRadius: '999px',
        borderBottomRightRadius: '999px',
      },
    },
    '&.start:not(.hover), &.end:not(.hover)': {
      '& .DateRangePickerDayLabel': {
        position: 'relative',
        bgcolor: 'primary.main',
        borderRadius: '999px',
        width: '36px',
        height: '36px',
        alignItems: 'center',
        justifyContent: 'center',
        display: 'flex',
        color: 'primary.contrastText',
      },
      '&.active .DateRangePickerDayLabel': {
        bgcolor: 'success.main',
      },
    },
    '&.hover': {
      '& .DateRangePickerDayLabel': {
        borderRadius: '999px',
        width: '36px',
        height: '36px',
        alignItems: 'center',
        justifyContent: 'center',
        display: 'flex',

        color: 'primary.contrastText',
        bgcolor: 'action.active',
      },
      '&.select-lower .DateRangePickerDay-hoverInside': {
        borderTopLeftRadius: '999px',
        borderBottomLeftRadius: '999px',
      },
      '&.select-upper .DateRangePickerDay-hoverInside': {
        borderTopRightRadius: '999px',
        borderBottomRightRadius: '999px',
      },
    },
  },
};
