// Schema/image preset: the accepted extensions for `base64-image` fields when the schema does not
// override them. A schema-driven default (not a UI concern). Kept in its own module so component
// files can import it without tripping the react-refresh "only export components" rule.
export const DEFAULT_IMAGE_ACCEPT = ['.png', '.jpg', '.jpeg', '.bmp', '.gif'];
