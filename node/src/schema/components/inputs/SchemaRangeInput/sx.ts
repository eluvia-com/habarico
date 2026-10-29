import {varAlpha} from '@design/theme';
import {Theme} from '@mui/material';

export const sx = (theme: Theme) => ({
  m: 0,
  minWidth: 150,
  width: '100%',
  border: 1,
  borderColor: theme.palette.divider,
  borderRadius: 1,
  py: 0,
  px: '1px',
  mt: '-6px',
  mb: '5px',

  '& .RangeInput-legend': {
    px: 0.75,
    marginLeft: '8px',
    fontSize: '0.75rem',
    lineHeight: 1,
    color: 'text.secondary',
  },
  '& .RangeInput-lower, & .RangeInput-upper': {
    width: '100%',
    mt: '-6px',
  },
  '& .RangeInput-separator': {
    pt: 0.25,
  },
  backgroundColor: varAlpha(theme.palette.background.paperChannel, 0.2),
  '&:hover': {borderColor: theme.palette.text.primary},
  '&:focus-within': {
    borderColor: 'primary.main',
    borderWidth: 2,
    m: 0,
    p: 0,
    mt: '-6px',
    '& .RangeInput-legend': {
      color: 'primary.main',
    },
  },
  '& .MuiOutlinedInput-root, & .MuiPickersOutlinedInput-root': {
    backgroundColor: 'transparent',
    border: 0,
    '& .MuiOutlinedInput-notchedOutline, & .MuiPickersOutlinedInput-notchedOutline': {
      border: 0,
    },
  },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline, & .MuiPickersInputBase-root.MuiPickersOutlinedInput-root.Mui-focused .MuiPickersOutlinedInput-notchedOutline':
    {
      border: 0,
    },
  '& .InputRoot': {p: 0},
  '& .MuiFormHelperText-root': {mx: 2, mt: 0.5},
});
