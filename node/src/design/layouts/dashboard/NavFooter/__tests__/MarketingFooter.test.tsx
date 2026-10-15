import React from 'react';
import {MemoryRouter} from 'react-router-dom';
import {describe, expect, it} from 'vitest';
import {ThemeProvider, createTheme} from '@mui/material';
import {render} from '@testing-library/react';
import {EluviaLogo} from '../../../../atoms/EluviaLogo';
import {MarketingFooter} from '../MarketingFooter';

const theme = createTheme();

describe('MarketingFooter', () => {
  it('does not nest an anchor from the logo inside the footer link', () => {
    const {container} = render(
      <MemoryRouter>
        <ThemeProvider theme={theme}>
          <MarketingFooter
            logo={EluviaLogo}
            label="Launched by Eluvians"
            href="https://eluvia.com"
            collapsed={false}
            inverted={false}
          />
        </ThemeProvider>
      </MemoryRouter>
    );

    const anchors = container.querySelectorAll('a');
    expect(anchors).toHaveLength(1);
    expect(anchors[0]).toHaveAttribute('href', 'https://eluvia.com');
  });
});
