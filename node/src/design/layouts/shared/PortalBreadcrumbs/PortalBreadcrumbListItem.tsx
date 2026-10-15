import {styled} from '@mui/material';

/**
 * The `<li>` every portal breadcrumb is built on — a real crumb ({@link PortalBreadcrumbItem}) and
 * the collapsed `…` crumb ({@link PortalBreadcrumbsEllipsis}) alike. It carries its own separator: a
 * `divider`-coloured dot before every crumb except the first (adjacent-sibling rule). The portal
 * outlet ({@link PortalBreadcrumbsOutlet}) is a bare `<ol>` with no MUI wrapper to inject separators
 * between children, so the crumb brings its own — mirroring `DataBreadcrumbSeparator` in the
 * data-driven {@link DataBreadcrumbs}.
 *
 * Both crumb components share this one styled component so the `& + &` rule matches across them (it
 * keys off the generated class), keeping the dot between e.g. the `…` and the last crumb.
 *
 * The crumb can shrink below its text width: the label (the link / span — the `<li>`'s flex item)
 * clips and ellipsizes its own text, so a plain-text label ends in `…` rather than being cut
 * mid-glyph. It stays a block, not a flex container — in a flex container the text would be an
 * anonymous flex item, which `text-overflow` does not reach. A label wrapped in `EllipsisWithTitle`
 * ellipsizes itself (with its tooltip) to the label's width: the current crumb caps it at `100%`
 * ({@link PortalBreadcrumbItem}). It does not shrink by default — only the current crumb opts in, so
 * the parents and the `…` keep their width.
 */
export const PortalBreadcrumbListItem = styled('li')(({theme}) => ({
  display: 'inline-flex',
  alignItems: 'center',
  flexShrink: 0,
  minWidth: 0,
  '& > *': {
    display: 'block',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  '& + &::before': {
    content: '""',
    flexShrink: 0,
    width: 4,
    height: 4,
    margin: theme.spacing(0, 1),
    borderRadius: '50%',
    backgroundColor: theme.palette.divider,
  },
}));
