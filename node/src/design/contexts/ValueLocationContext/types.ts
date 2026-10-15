export type ValueLocationContextType = {
  /** The value is rendered as a compact cell within a collection (datagrid, gallery, array). */
  isInCollection: boolean;
  /** The value is rendered nested inside another value. */
  isNested: boolean;
};
