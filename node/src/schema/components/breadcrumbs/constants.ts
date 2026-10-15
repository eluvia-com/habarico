// Caps the parent crumbs of a portal trail. The current crumb ignores it (`PortalBreadcrumbItem`
// lifts the cap): it truncates to the room the header actually leaves it instead.
//
// `xs` is deliberately closer to `sm` than a plain breakpoint ladder would suggest: below `sm`,
// `DashboardLayout` wraps the whole trail onto its own full-width row (see `PortalBreadcrumbsOutlet`),
// so a crumb there typically has much more room than a same-tier crumb used to when it shared the
// row with the header's nav trigger and action icons — a tight 100px cap left even a 2-crumb trail
// looking needlessly truncated. The row's own horizontal scroll (see `PortalBreadcrumbsOutlet`) is
// the fallback once a longer trail exceeds this per-crumb cap.
export const MAX_BREADCRUMB_WIDTH = {
  xs: 160,
  sm: 200,
  md: 350,
  lg: 450,
  xl: 600,
};
