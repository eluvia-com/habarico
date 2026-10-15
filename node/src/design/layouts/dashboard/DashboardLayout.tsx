import {useLocalStorage} from 'minimal-shared/hooks';
import React, {ReactNode, useEffect, useMemo, useRef, useState} from 'react';
import {usePathname} from '@foundation/hooks/usePathname';
import {Box, Breakpoint, SxProps, Theme, useMediaQuery, useTheme} from '@mui/material';
import {layoutClasses} from '../classes';
import {useLayoutDynamicContext} from '../contexts/LayoutDynamicContext';
import {AccountPopover} from '../shared/AccountPopover';
import {ColorModeToggle} from '../shared/ColorModeToggle';
import {ContrastModeWrapper} from '../shared/ContrastModeWrapper';
import {DataBreadcrumbs} from '../shared/DataBreadcrumbs';
import {
  HeaderActions,
  HeaderActionsDensityContext,
  useHeaderActionsCompaction,
} from '../shared/HeaderActions';
import {HeaderSection} from '../shared/HeaderSection';
import {LanguagePopover} from '../shared/LanguagePopover';
import {LayoutSection} from '../shared/LayoutSection';
import {NotificationsPanel, NotificationsToggle} from '../shared/NotificationsPanel';
import {PageWidthToggle} from '../shared/PageWidthToggle';
import {SearchOverlay, SearchToggle, getSearchShortcutLabel} from '../shared/Search';
import {SettingsPanel, SettingsToggle} from '../shared/SettingsPanel';
import {
  AccountSlot,
  AppearanceSlot,
  ArrangementSlot,
  BreadcrumbsSlot,
  LanguageSlot,
  LogoSlot,
  MarketingSlot,
  MenuSlot,
  NotificationsSlot,
  SearchSlot,
  SettingsSlot,
  StatusSlot,
  TableSlot,
  WorkspacesSlot,
} from '../types';
import {resolveSlot} from '../utils';
import {Main} from './Main';
import {NavDesktop} from './NavDesktop';
import {NavMobile} from './NavMobile';

export type DashboardLayoutProps = {
  sx?: SxProps<Theme>;
  children: ReactNode;
  logo?: LogoSlot;
  menu?: MenuSlot;
  account?: AccountSlot;
  workspaces?: WorkspacesSlot;
  language?: LanguageSlot;
  appearance?: AppearanceSlot;
  arrangement?: ArrangementSlot;
  table?: TableSlot;
  notifications?: NotificationsSlot;
  search?: SearchSlot;
  breadcrumbs?: BreadcrumbsSlot;
  settings?: SettingsSlot;
  marketing?: MarketingSlot;
  status?: StatusSlot;
};

export function DashboardLayout({
  sx,
  children,
  logo,
  menu,
  account,
  workspaces,
  language,
  appearance,
  arrangement,
  table,
  notifications,
  search,
  breadcrumbs,
  settings,
  marketing,
  status,
}: DashboardLayoutProps) {
  const theme = useTheme();
  const {currentUser} = useLayoutDynamicContext();

  const [navOpen, setNavOpen] = useState<boolean>(false);
  // Close the mobile nav drawer whenever the route changes — whatever triggered it: the logo, a
  // parent menu item (it links to its first child), an app-supplied menu component or a redirect.
  // Adjusted during render rather than in an effect, so the drawer never paints open on the new page.
  const pathname = usePathname();
  const [navPathname, setNavPathname] = useState(pathname);
  if (navPathname !== pathname) {
    setNavPathname(pathname);
    setNavOpen(false);
  }
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const userId = String(currentUser?.id ?? 'anonymous');
  const {state: navCollapsed, setState: setNavCollapsed} = useLocalStorage<boolean>(
    `${userId}.navCollapsed`,
    false
  );

  const layoutBreakpoint: Breakpoint = 'lg';

  // The breadcrumb trail and the right-hand cluster share the header row; when a long trail would be
  // squeezed out, the view's actions compact (icon-only, then the `⋮` menu) rather than the trail
  // vanishing. Below `sm` the trail has a row of its own (see below), so nothing competes there.
  const trailRef = useRef<HTMLDivElement>(null);
  const rightAreaRef = useRef<HTMLDivElement>(null);
  const upSm = useMediaQuery(theme.breakpoints.up('sm'));
  const headerActionsDensity = useHeaderActionsCompaction({
    trailRef,
    actionsRef: rightAreaRef,
    enabled: !!breadcrumbs && upSm,
  });

  const searchConfig = resolveSlot(search);
  const settingsConfig = resolveSlot(settings);
  const appearanceConfig = resolveSlot(appearance);
  const arrangementConfig = resolveSlot(arrangement);
  const notificationsConfig = resolveSlot(notifications);
  const breadcrumbsConfig = resolveSlot(breadcrumbs);

  // Individual appearance / arrangement toggles are shown in the header either as the
  // fallback when there is no settings panel, or when the slot explicitly forces them.
  const showColorModeToggle = (!!appearance && !settings) || appearanceConfig?.header === true;
  const showPageWidthToggle = (!!arrangement && !settings) || arrangementConfig?.header === true;

  const SearchComponent = searchConfig?.Component;
  const SettingsComponent = settingsConfig?.Component ?? SettingsPanel;
  const BreadcrumbsComponent = breadcrumbsConfig?.Component ?? DataBreadcrumbs;

  const searchShortcutLabel = useMemo(() => getSearchShortcutLabel(), []);

  // Open the search overlay on ⌘/Ctrl+K (closing is handled by the Modal's Esc /
  // backdrop). Only bound while the search slot is enabled.
  useEffect(() => {
    if (!search) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [search]);

  return (
    <ContrastModeWrapper>
      <LayoutSection
        /** **************************************
         * Header
         *************************************** */
        headerSection={
          <HeaderSection
            layoutBreakpoint={layoutBreakpoint}
            slotProps={{
              container: {
                maxWidth: false,
                sx: {
                  px: {[layoutBreakpoint]: theme.layout?.contentPx},
                  // Below `sm` there isn't room for a route trail alongside the nav trigger and
                  // the action icons (see the breadcrumbs item's own `order`/`flexBasis` below) —
                  // let that item wrap onto a trailing row instead of squeezing everything into
                  // one. Above `sm` the row stays exactly as it was: no wrap ever triggers there.
                  [theme.breakpoints.down('sm')]: {flexWrap: 'wrap', rowGap: 0.5},
                },
              },
            }}
            slots={{
              leftArea: (
                <>
                  <NavMobile
                    logo={logo}
                    menu={menu}
                    workspaces={workspaces?.items}
                    marketing={marketing}
                    status={status}
                    layoutBreakpoint={layoutBreakpoint}
                    open={navOpen}
                    onOpen={() => setNavOpen(true)}
                    onClose={() => setNavOpen(false)}
                  />
                  {breadcrumbs && (
                    <Box
                      ref={trailRef}
                      sx={{
                        minWidth: 0,
                        // `order` set past every other header item so — combined with
                        // `flexBasis: 100%` forcing it wider than the remaining space on the
                        // first line — it always wraps to a trailing row of its own, rather than
                        // splitting the nav trigger and action icons across two lines.
                        [theme.breakpoints.down('sm')]: {order: 9999, flexBasis: '100%'},
                      }}
                    >
                      <BreadcrumbsComponent icon={breadcrumbsConfig?.icon} />
                    </Box>
                  )}
                </>
              ),
              rightArea: (
                // Never shrinks: a squeezed label would wrap and grow the header. The trail gives way
                // instead, and `useHeaderActionsCompaction` compacts the actions when it has to.
                <Box
                  ref={rightAreaRef}
                  display="flex"
                  alignItems="center"
                  flexShrink={0}
                  whiteSpace="nowrap"
                >
                  <HeaderActions />
                  {search && (
                    <Box mr={1}>
                      <SearchToggle
                        open={searchOpen}
                        onClick={() => setSearchOpen(true)}
                        tooltip={searchConfig?.tooltip}
                        shortcutLabel={searchShortcutLabel}
                      />
                    </Box>
                  )}
                  {language && <LanguagePopover availableLanguages={language.availableLanguages} />}
                  {notifications && (
                    <NotificationsToggle
                      open={notificationsOpen}
                      onClick={() => setNotificationsOpen(true)}
                      tooltip={notificationsConfig?.tooltip}
                    />
                  )}
                  {showColorModeToggle && <ColorModeToggle tooltip={appearanceConfig?.tooltip} />}
                  {showPageWidthToggle && <PageWidthToggle tooltip={arrangementConfig?.tooltip} />}
                  {settings && (
                    <SettingsToggle
                      open={settingsOpen}
                      onClick={() => setSettingsOpen(true)}
                      tooltip={settingsConfig?.tooltip}
                    />
                  )}
                  {account && (
                    <Box ml={1}>
                      <AccountPopover menuItems={account.menuItems} />
                    </Box>
                  )}
                </Box>
              ),
            }}
          />
        }
        /** **************************************
         * Sidebar
         *************************************** */
        sidebarSection={
          <NavDesktop
            logo={logo}
            menu={menu}
            workspaces={workspaces?.items}
            marketing={marketing}
            status={status}
            layoutBreakpoint={layoutBreakpoint}
            collapsed={navCollapsed}
            onToggle={() => setNavCollapsed(!navCollapsed)}
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
          [`& .${layoutClasses.hasSidebar}`]: {
            [theme.breakpoints.up(layoutBreakpoint)]: {
              pl: navCollapsed
                ? theme.layout?.navVerticalCollapsedWidth
                : theme.layout?.navVerticalWidth,
              transition: 'padding-left 120ms ease-in-out',
            },
          },
          '&::before': {
            width: 1,
            height: 1,
            zIndex: -1,
            content: "''",
            position: 'fixed',
            // Dashboard uses the toned-down "neutral" gradient (Auth & Simple keep
            // the strong "vivid" variant). The neutral variant is already muted,
            // so it renders at full strength in both modes.
            background: (theme) => theme.palette.background.gradient?.neutral,
          },
          ...sx,
        }}
      >
        <HeaderActionsDensityContext.Provider value={headerActionsDensity}>
          <Main>{children}</Main>
        </HeaderActionsDensityContext.Provider>
      </LayoutSection>
      {search && SearchComponent && (
        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)}>
          <SearchComponent open={searchOpen} onClose={() => setSearchOpen(false)} />
        </SearchOverlay>
      )}
      {notifications && (
        <NotificationsPanel
          open={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          labels={notificationsConfig?.labels}
          onViewAll={notificationsConfig?.onViewAll}
        />
      )}
      {settings && (
        <SettingsComponent
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          labels={settingsConfig?.labels}
          appearance={appearance}
          arrangement={arrangement}
          table={table}
        />
      )}
    </ContrastModeWrapper>
  );
}
