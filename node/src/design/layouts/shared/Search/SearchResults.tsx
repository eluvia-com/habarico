import React from 'react';
import {useNavigate} from 'react-router-dom';
import {RichText, hasRichText} from '@design/molecules/RichText';
import {
  Box,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListSubheader,
  alpha,
  useTheme,
} from '@mui/material';
import {bgBlur} from '../../../theme/mixins';
import {LayoutSearchResult} from '../../types';
import {SearchLoading} from './SearchLoading';
import {SearchNotFound} from './SearchNotFound';

export type SearchResultsProps = {
  isLoading?: boolean;
  searchResults?: LayoutSearchResult[];
  onClick?: (href: string) => void;
  notFoundTitle?: string;
};

export const SearchResults = ({
  isLoading,
  onClick,
  notFoundTitle,
  searchResults,
}: SearchResultsProps) => {
  const theme = useTheme();

  const showLoading = isLoading;
  const showNotFound = !isLoading && searchResults && searchResults?.length === 0;

  const navigate = useNavigate();

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  const handleClick = (url?: string) => {
    if (!url) return;
    navigate(url);
    if (onClick) onClick(url);
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
        width: 'auto',
        maxHeight: '60vh',
        overflow: 'auto',
        m: 1,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
      }}
    >
      {showNotFound && <SearchNotFound title={notFoundTitle} />}
      {showLoading && <SearchLoading />}
      {!showLoading && searchResults && searchResults.length > 0 && (
        <Grid container>
          {searchResults.map((item, index) => (
            <Grid size={{sm: 6, md: 6, xs: 12, lg: 3}} key={index}>
              <List
                subheader={
                  <ListSubheader
                    component="div"
                    sx={{
                      ...bgBlur({
                        color: alpha(theme.palette.background.paper, 0.95),
                      }),
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    {item.meta.icon} {item.meta.label}
                  </ListSubheader>
                }
              >
                {item.objects.map((object, objectIndex) => (
                  <ListItem alignItems="flex-start" key={objectIndex}>
                    <ListItemButton
                      onClick={() => handleClick(object.href)}
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                      }}
                    >
                      <ListItemText
                        primary={
                          hasRichText(object.title) ? (
                            <RichText text={object.title} />
                          ) : (
                            object.title
                          )
                        }
                        secondaryTypographyProps={{component: 'div'}}
                        secondary={
                          <>
                            {object.description &&
                              (hasRichText(object.description) ? (
                                <RichText text={object.description} />
                              ) : (
                                object.description
                              ))}
                            {object.highlights?.map((highlight, highlightIndex) => (
                              <Box key={highlightIndex} sx={{fontSize: '0.75rem'}}>
                                <Box
                                  component="span"
                                  sx={{
                                    fontWeight: 600,
                                    mr: 0.5,
                                    display: 'inline-block',
                                    '&::first-letter': {textTransform: 'uppercase'},
                                  }}
                                >
                                  {highlight.label}:
                                </Box>
                                <RichText text={highlight.value} />
                              </Box>
                            ))}
                          </>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
