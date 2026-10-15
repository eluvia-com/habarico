import {varAlpha} from '@design/theme';
import {Theme} from '@mui/material';

// `bare` = the group has no legend (a box's `PropertyItem` owns the label beside it). The negative
// top / bottom margins only exist to seat the legend on the top border, so a bare group drops them
// and sits flush like a plain text input.
export const schemaWrappedFieldSx = (bare: boolean) => (theme: Theme) => ({
  m: 0,
  minWidth: 150,
  width: '100%',
  border: 1,
  borderColor: varAlpha(theme.palette.grey['500Channel'], 0.45),
  borderRadius: 1,
  py: 0,
  px: '1px',
  mt: bare ? 0 : '-6px',
  mb: bare ? 0 : '5px',
  '& .SchemaWrappedField-legend': {
    px: 0.75,
    marginLeft: '8px',
    fontSize: '0.75rem',
    lineHeight: 1,
    color: 'text.secondary',
  },
  '& .SchemaWrappedField-item': {
    width: '100%',
    maxWidth: '250px',
    mt: bare ? 0 : '-6px',
  },
  '& .SchemaWrappedField-separator': {
    mt: bare ? 0 : '-6px',
  },
  '&:hover': {borderColor: theme.palette.text.primary},
  '&.SchemaWrappedField-error': {
    borderColor: theme.palette.error.main,
    '& .SchemaWrappedField-legend': {
      color: theme.palette.error.main,
    },
    '& input::placeholder': {
      color: theme.palette.error.main,
      opacity: 1,
    },
  },
  '&.SchemaWrappedField-error:hover': {borderColor: theme.palette.error.dark},
  '&:focus-within': {
    borderColor: 'primary.main',
    borderWidth: 2,
    m: 0,
    p: 0,
    mt: bare ? 0 : '-6px',
    mb: bare ? 0 : '4px',
    '& .SchemaWrappedField-legend': {
      color: 'primary.main',
    },
  },
  '&.SchemaWrappedField-error:focus-within': {
    borderColor: theme.palette.error.main,
    '& .SchemaWrappedField-legend': {
      color: theme.palette.error.main,
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
  '& .MuiFormHelperText-root': {display: 'none'},
});
