import React, {ReactNode} from 'react';
import {Box, Breakpoint, SxProps, Theme, useTheme} from '@mui/material';
import {stylesMode} from '../../theme/utils';
import {ColorModeToggle} from '../shared/ColorModeToggle';
import {HeaderSection} from '../shared/HeaderSection';
import {HelpDialog} from '../shared/HelpDialog';
import {LanguagePopover} from '../shared/LanguagePopover';
import {LayoutSection} from '../shared/LayoutSection';
import {AppearanceSlot, HelpSlot, LanguageSlot, LogoSlot} from '../types';
import {resolveSlot} from '../utils';
import {CompactContent} from './CompactContent';
import {Main} from './Main';

export type SimpleLayoutProps = {
  sx?: SxProps<Theme>;
  children: ReactNode;
  compact?: boolean;
  logo?: LogoSlot;
  language?: LanguageSlot;
  appearance?: AppearanceSlot;
  help?: HelpSlot;
};

export function SimpleLayout({
  sx,
  children,
  compact,
  logo,
  language,
  appearance,
  help,
}: SimpleLayoutProps) {
  const layoutBreakpoint: Breakpoint = 'md';
  const theme = useTheme();
  const LogoComponent = logo?.Component;
  return (
    <LayoutSection
      /** **************************************
       * Header
       *************************************** */
      headerSection={
        <HeaderSection
          layoutBreakpoint={layoutBreakpoint}
          slotProps={{
            container: {maxWidth: false},
            toolbar: {sx: {backgroundColor: 'transparent', backdropFilter: 'unset'}},
          }}
          slots={{
            leftArea: LogoComponent && (
              <Box alignSelf="flex-start" pt={2}>
                <LogoComponent
                  maxWidth={80}
                  inverted={theme.palette.mode === 'dark'}
                  icon
                  href="/"
                />
              </Box>
            ),
            rightArea: (
              <Box display="flex" alignItems="center">
                {language && <LanguagePopover availableLanguages={language.availableLanguages} />}
                {appearance && <ColorModeToggle tooltip={resolveSlot(appearance)?.tooltip} />}
                {help && (
                  <Box ml={1}>
                    <HelpDialog {...(resolveSlot(help) ?? {})} />
                  </Box>
                )}
              </Box>
            ),
          }}
        />
      }
      /** **************************************
       * Footer
       *************************************** */
      footerSection={null}
      /** **************************************
       * Style
       *************************************** */
      sx={{
        '&::before': {
          width: 1,
          height: 1,
          zIndex: -1,
          content: "''",
          position: 'fixed',
          background: (theme) => theme.palette.background.gradient?.vivid,
          [stylesMode.dark]: {opacity: 0.08},
        },
        ...sx,
      }}
    >
      <Main>
        {compact ? (
          <CompactContent layoutBreakpoint={layoutBreakpoint}>{children}</CompactContent>
        ) : (
          children
        )}
      </Main>
    </LayoutSection>
  );
}
