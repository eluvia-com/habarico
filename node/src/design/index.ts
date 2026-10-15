// Design layer — presentational, schema-agnostic UI primitives.
// See ./README.md for the layer's purpose, rules and structure.
//
// This is the only barrel in the layer: the sub-directories (atoms, molecules,
// organisms, hooks, contexts, utils) have no `index.ts` of their own — re-export
// their leaf modules directly from here as they are added, e.g.
//   export * from './organisms/Panel';
//   export * from './hooks/useDialog';

// Theme (tokens + MUI component overrides + ThemeProvider)
export * from './theme';

// Atoms (presentational primitives)
export * from './atoms/AvatarField';
export * from './atoms/Button';
export * from './atoms/ButtonLoader';
export * from './atoms/CloseButton';
export * from './atoms/EllipsisWithTitle';
export * from './atoms/EluviaLogo';
export * from './atoms/FileImagePreview';
export * from './atoms/FileTypePreview';
export * from './atoms/FlagIcon';
export * from './atoms/HabaricoLogo';
export * from './atoms/Icon';
export * from './atoms/Iconify';
export * from './atoms/LabelDivider';
export * from './atoms/LoadingButton';
export * from './atoms/NoLogo';
export * from './atoms/PasswordField';
export * from './atoms/RouterLink';
export * from './atoms/Scrollbar';
export * from './atoms/SearchField';
export * from './atoms/SocialIcon';
export * from './atoms/SvgColor';

// Molecules (a few atoms composed into one reusable unit)
export * from './molecules/ButtonsStack';
export * from './molecules/CustomDialog';
export * from './molecules/CustomDialogTitle';
export * from './molecules/DragHandle';
export * from './molecules/EnumChip';
export * from './molecules/GhostPanel';
export * from './molecules/ImagePanel';
export * from './molecules/InputLayout';
export * from './molecules/NavigationHeader';
export * from './molecules/OverflowToolbar';
export * from './molecules/Panel';
export * from './molecules/PanelHeader';
export * from './molecules/PanelContent';
export * from './molecules/PanelFooter';
export * from './molecules/PropertyItem';
export * from './molecules/PropertyList';
export * from './molecules/RichText';
export * from './molecules/Section';
export * from './molecules/SectionContent';
export * from './molecules/SectionFooter';
export * from './molecules/SectionHeader';
export * from './molecules/TreeSelect';

// Organisms (self-contained, complex sections)
export * from './organisms/ConfirmDialog';
export * from './organisms/DashboardGrid';
export * from './organisms/DataGrid';
export * from './organisms/DataTable';
export * from './organisms/FormTable';
export * from './organisms/Gallery';
export * from './organisms/InspectorPanel';
export * from './organisms/ObjectHero';
export * from './organisms/PanelGrid';
export * from './organisms/SidePanel';
export * from './organisms/UploadArea';

// Hooks (presentation-only)
export * from './hooks/useConfirm';
export * from './hooks/useDialog';
export * from './hooks/useMenu';
export * from './hooks/useOverflowCount';
export * from './hooks/usePopover';

// Contexts (presentation-only)
export * from './contexts/PanelGridContext';
export * from './contexts/ToolbarSlotContext';
export * from './contexts/IsLastPanelContext';
export * from './contexts/InsidePanelContext';
export * from './contexts/ValueLocationContext';

// Utils (presentation-only helpers)
export * from './utils/tableActions';
export {DENSITY_TABLE_PADDING_Y} from './constants';

// Layout contexts
export * from './layouts/contexts/SettingsContext';
export * from './layouts/contexts/LayoutDynamicContext';
export * from './layouts/contexts/LayoutProvider';

// Layout shells (auth / dashboard / simple app shells)
export * from './layouts/auth';
export * from './layouts/dashboard';
export * from './layouts/simple';
export * from './layouts/types';

// Layout shared components
export {
  PortalBreadcrumbItem,
  type PortalBreadcrumbItemProps,
} from './layouts/shared/PortalBreadcrumbs';
// The search overlay's presentational pieces. Schema-agnostic — they take results as a prop — so
// anything can fill them. Exported so a project building its own global search renders the same
// overlay the shell opens.
export {
  SearchContent,
  type SearchContentProps,
  SearchOverlay,
  type SearchOverlayProps,
  SearchToggle,
  type SearchToggleProps,
  getSearchShortcutLabel,
} from './layouts/shared/Search';

// Types
export * from './types';
