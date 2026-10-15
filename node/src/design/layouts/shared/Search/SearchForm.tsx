import React, {useRef, useState} from 'react';
import {Box, Button, Input, InputAdornment, alpha, debounce, useTheme} from '@mui/material';
import {Icon, IconType} from '../../../atoms/Icon';
import {bgBlur} from '../../../theme/mixins';

const DEBOUNCE_TIMEOUT = 300;

export type SearchFormProps = {
  searchTitle?: string;
  onSearch: (value: string) => void;
  searchQuery?: string;
};
export const SearchForm = ({
  searchTitle = 'Search',
  searchQuery = '',
  onSearch,
}: SearchFormProps) => {
  const theme = useTheme();

  // --------------------------------------------------------------------------
  // Fulltext search value used for debounced search
  // --------------------------------------------------------------------------

  const [value, setValue] = useState<string>(searchQuery);

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  const debouncedHandlerRef = useRef(
    debounce((value: string) => {
      onSearch(value);
    }, DEBOUNCE_TIMEOUT)
  );

  const handleChangeInput = (value: string) => {
    setValue(value);
    debouncedHandlerRef.current(value);
  };

  const handleSubmit = () => {
    onSearch(searchQuery);
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <Box
      sx={{
        ...bgBlur({
          color: alpha(theme.palette.background.paper, 0.95),
        }),
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        boxShadow: theme.customShadows.z8,
        height: {
          xs: theme.layout?.headerMobileHeight,
          md: theme.layout?.headerDesktopHeight,
        },
        px: {xs: 3, md: 5},
      }}
    >
      <Input
        autoFocus
        fullWidth
        disableUnderline
        placeholder={`${searchTitle}…`}
        startAdornment={
          <InputAdornment position="start">
            <Icon icon={IconType.Search} width={20} sx={{color: 'text.disabled'}} />
          </InputAdornment>
        }
        sx={{fontWeight: 'fontWeightBold'}}
        onChange={(e) => handleChangeInput(e.target.value)}
        value={value}
      />
      <Button variant="contained" onClick={handleSubmit}>
        {searchTitle}
      </Button>
    </Box>
  );
};
