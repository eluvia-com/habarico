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
import {Main} from './Main';

export type AuthLayoutProps = {
  sx?: SxProps<Theme>;
  children: ReactNode;
  logo?: LogoSlot;
  language?: LanguageSlot;
  appearance?: AppearanceSlot;
  help?: HelpSlot;
};

export function AuthLayout({sx, children, logo, language, appearance, help}: AuthLayoutProps) {
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
          sx={{
            position: {[layoutBreakpoint]: 'fixed'},
          }}
          slots={{
            // topArea: (
            //   <Alert severity="info" sx={{display: 'none', borderRadius: 0}}>
            //     This is an info Alert.
            //   </Alert>
            // ),
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
              <>
                {language && <LanguagePopover availableLanguages={language.availableLanguages} />}
                {appearance && <ColorModeToggle tooltip={resolveSlot(appearance)?.tooltip} />}
                {help && (
                  <Box ml={1}>
                    <HelpDialog {...(resolveSlot(help) ?? {})} />
                  </Box>
                )}
              </>
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
      <Main layoutBreakpoint={layoutBreakpoint}>{children}</Main>
    </LayoutSection>
  );
}
