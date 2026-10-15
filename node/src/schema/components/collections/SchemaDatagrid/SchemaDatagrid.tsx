import React, {FC, ReactElement, ReactNode, useCallback, useEffect, useMemo, useState} from 'react';
import {
  ListContextProvider,
  RaRecord,
  RecordContextProvider,
  useDataProvider,
  useListContext,
  useNotify,
} from 'react-admin';
import {AdminDatagrid} from '@admin/components/datagrid/AdminDatagrid';
import {DatagridLabel} from '@admin/components/datagrid/DatagridLabel';
import {FieldProps} from '@admin/components/fields/types';
import {useListConfigContext} from '@admin/contexts/ListConfigContext';
import {useSidePanelController} from '@admin/contexts/SidePanelContext';
import {useViewPresentation} from '@admin/contexts/ViewPresentationContext';
import {ValueLocationContextProvider} from '@design/contexts/ValueLocationContext';
import {NavMode} from '@foundation/utils/navigation';
import {Box, SxProps, alpha, useTheme} from '@mui/material';
import {SchemaFieldOrInput} from '@schema/components/boxes/SchemaFieldOrInput';
import {SchemaWrappedFields} from '@schema/components/boxes/SchemaWrappedFields';
import {SchemaFieldContent} from '@schema/components/fields/SchemaFieldContent';
import {useMethodSchemaContext} from '@schema/contexts/MethodSchemaContext/useMethodSchemaContext';
import {useGetField} from '@schema/contexts/ResourceFieldContext/useGetField';
import {useSchemaRootContext} from '@schema/contexts/SchemaRootContext/useSchemaRootContext';
import {useGlobalResourceSchemaContext} from '@schema/hooks/useGlobalResourceSchemaContext';
import {useTriggerAction} from '@schema/hooks/useTriggerAction';
import {
  ActionDescriptor,
  FieldDescriptor,
  Filters,
  HabRecord,
  IndexedHabRecord,
  SidePanelView,
} from '@schema/types';
import {generateFieldSchemaMap} from '@schema/utils/generateFieldSchemaMap';
import {resolveViewMode} from '@schema/utils/viewMode';
import {SchemaDatagridRowActions} from './SchemaDatagridRowActions';
import {createRowTooltip} from './createRowTooltip';
import {resolveRowActionSchema} from './resolveRowActionSchema';

export type SchemaDatagridProps = {
  fields?: FieldDescriptor[];
  expand?: ReactElement | FC;
  target?: string;
  indexField?: string;
  sortForFilters?: Filters;
  onRowClick?: (record: HabRecord) => void;
  rowActionButtons?: ReactNode | false;
  rowSx?: (record: HabRecord) => SxProps;
  singleClickAction?: ActionDescriptor;
  doubleClickAction?: ActionDescriptor;
  disableSort?: boolean;
};

export const SchemaDatagrid = ({
  fields,
  target,
  expand,
  indexField,
  sortForFilters = {},
  onRowClick,
  rowActionButtons = <SchemaDatagridRowActions target={target} />,
  rowSx,
  singleClickAction,
  doubleClickAction,
  disableSort = false,
}: SchemaDatagridProps) => {
  const {preferenceKey} = useListConfigContext();
  const {defaultRowAction = 'click', rowTooltip: rowTooltipEnabled = true} = useSchemaRootContext();

  const notify = useNotify();
  const methodSchema = useMethodSchemaContext();
  const fieldSchemaMap = useMemo(
    () => generateFieldSchemaMap(methodSchema.fields, fields),
    [methodSchema.fields, fields]
  );

  const defaultFields: FieldDescriptor[] =
    fields ||
    methodSchema.fields.map((fieldSchema) => ({
      type: 'field' as const,
      name: fieldSchema.name,
    }));

  const fieldsToRender = defaultFields.filter(
    (field) => fieldSchemaMap[field.name] || field.action || field.wrapper
  );

  const getFieldEl = useGetField();
  const dataProvider = useDataProvider();
  const listContext = useListContext();
  const {resource, data, filterValues, sort, isLoading, refetch, setSort} = listContext;
  const {schema: resourceSchema, getGlobalViewSchema} = useGlobalResourceSchemaContext(resource);
  const {triggerActionElement, triggerAction} = useTriggerAction();
  const sidePanel = useSidePanelController<SidePanelView>();
  // A datagrid rendered inside an overlay (its own view is shown in a sidepanel or modal) must not
  // dock row activations into a sidepanel - only the top-level list owns one.
  const {presentation} = useViewPresentation();
  const isInOverlay = presentation !== 'page';
  const theme = useTheme();
  // The record currently open in this list's side panel (if any) - used to highlight its row and
  // to toggle the panel closed when the same row is activated again.
  const activeSidePanelRecordId =
    sidePanel?.active?.resource === resource && sidePanel?.active?.target === target
      ? sidePanel.active.id
      : undefined;
  // Holds the row that triggered a post-action so its modal renders inside the row's record
  // context; the nonce re-mounts the post-action so re-activating the same row re-fires it.
  const [activation, setActivation] = useState<{record: HabRecord; nonce: number} | undefined>(
    undefined
  );

  // Show the row actions column if the reference has any record-scoped list action.
  // Mirrors the row-action default (generateDescriptorsFromSchema, isList + scope 'detail'):
  // only `showInList && isDetail` actions become per-row buttons.
  const showRowActions =
    rowActionButtons &&
    resourceSchema?.actions &&
    resourceSchema?.actions.filter((action) => action.showInList && action.isDetail).length > 0;

  // --------------------------------------------------------------------------
  // Drag & drop, record position
  // --------------------------------------------------------------------------

  // DND is enabled only if column sort is not allowed and filters are not applied
  const canUseDndWithFilters =
    indexField !== undefined &&
    JSON.stringify(sortForFilters, Object.keys(sortForFilters).sort()) ===
      JSON.stringify(filterValues, Object.keys(filterValues).sort());
  const enableDnd = canUseDndWithFilters && sort.field === indexField && sort.order === 'ASC';

  // Set the sort to the index field if the user can use DND with filters
  useEffect(() => {
    if (!enableDnd && canUseDndWithFilters) {
      setSort({field: indexField, order: 'ASC'});
    }
  }, [canUseDndWithFilters, enableDnd, setSort, indexField]);

  const sortedData = useMemo<IndexedHabRecord[]>(
    () =>
      data?.map((record: HabRecord, index: number) => ({
        ...record,
        index: index + 1,
      })) ?? [],
    [data]
  );

  const [isUpdating, setUpdating] = useState<boolean>(false);

  // Save the record order when the user drops the item
  const handleDropRow = useCallback(
    async (record: RaRecord, index: number) => {
      if (!indexField) return;
      setUpdating(true);
      try {
        await dataProvider.update(resource, {
          id: record.id,
          data: {
            ...record,
            [indexField]: index,
          },
          previousData: record,
        });
        await refetch();
      } catch {
        notify('ra.notification.http_error', {type: 'error'});
      } finally {
        setUpdating(false);
      }
    },
    [dataProvider, indexField, notify, refetch, resource]
  );

  // Resolve which action a row-click slot activates purely from the record's action schema (no
  // rendered button required) and run it through the declarative post-action: a view action opens
  // by its resolved mode (redirect with navMode / dialog / sidepanel), link and resource actions
  // dispatch by type - all in the activated row's record context. No-op when nothing resolves.
  const activate = useCallback(
    (record: RaRecord, navMode: NavMode, descriptor?: ActionDescriptor) => {
      const habRecord = record as HabRecord;
      const schema = resolveRowActionSchema(habRecord.meta?.schema?.actions, descriptor);
      if (!schema) return;

      // Resolve the effective presentation mode for a view (action mode > target view's mode) to
      // decide about the side panel here. `keepLinkedParent` keeps its default (true) in
      // SchemaViewActionTrigger, so it is not injected here either.
      let actionSchema = schema;
      if (schema.type === 'view' && schema.view) {
        const resolvedMode = resolveViewMode(
          schema.view.mode,
          getGlobalViewSchema(schema.view.name)?.mode
        );
        // A nested datagrid (its list shown inside a sidepanel/dialog) never docks into a sidepanel;
        // such a row activation falls back to a dialog so it does not hijack the surrounding panel.
        const mode = isInOverlay && resolvedMode === 'sidepanel' ? 'dialog' : resolvedMode;
        // Toggle: activating the row already open in the side panel closes it instead of re-opening.
        // Only the top-level list owns the panel, so this never fires from a nested datagrid.
        if (mode === 'sidepanel' && sidePanel && record.id === activeSidePanelRecordId) {
          sidePanel.close();
          return;
        }
        // Inject the mode only when the action itself declared one: the post-action resolves an
        // unset mode to the very same value (`resolveEffectiveMode`), but it can only honour an
        // explicit `redirect` out of an overlay while keeping a plain row click swapping in place
        // if the two stay distinguishable - materialising the resolved mode here erased that.
        if (schema.view.mode) {
          actionSchema = {
            ...schema,
            view: {...schema.view, mode},
          };
        }
      }

      setActivation((prev) => ({record: habRecord, nonce: (prev?.nonce ?? 0) + 1}));
      triggerAction({schema: actionSchema, navMode, target});
    },
    [getGlobalViewSchema, triggerAction, target, sidePanel, activeSidePanelRecordId, isInOverlay]
  );

  // Two independent slots. A slot is active when the backend configured an action for it, or -
  // as a fallback - when the FE default gesture (defaultRowAction) maps to it. The backend action
  // name overrides the default show -> edit target.
  const singleSlotActive = !!singleClickAction || defaultRowAction === 'click';
  const doubleSlotActive = !!doubleClickAction || defaultRowAction === 'double-click';

  const handleRowSingleClick = useCallback(
    (record: RaRecord, navMode: NavMode) => activate(record, navMode, singleClickAction),
    [activate, singleClickAction]
  );
  const handleRowDoubleClick = useCallback(
    (record: RaRecord, navMode: NavMode) => activate(record, navMode, doubleClickAction),
    [activate, doubleClickAction]
  );

  // Highlight the row whose record is currently open in the side panel, so the source of the
  // preview is visible in the list. Wraps the caller's rowSx and adds the active style on top.
  const highlightedRowSx = useCallback(
    (record: HabRecord): SxProps => {
      const base = rowSx?.(record);
      if (activeSidePanelRecordId === undefined || record.id !== activeSidePanelRecordId)
        return base ?? {};
      // The datagrid paints every body cell (including the sticky action column) with an opaque
      // background so content scrolls invisibly behind the sticky buttons; that would cover a
      // row-level highlight. So tint the cells themselves - the whole row, sticky column included,
      // stays highlighted consistently. The `&&&` repeats the row class to out-specify the
      // datagrid's own cell backgrounds (which are scoped under the datagrid root + `tr`, so they
      // otherwise win). The tint is an opaque `paper + primary` layer (colours resolved here via
      // useTheme, so the sx holds plain strings) so the sticky column keeps hiding content behind
      // it. A left accent bar is drawn on the first cell.
      const tint = alpha(theme.palette.primary.main, 0.1);
      const activeSx: SxProps = {
        '&&& td.MuiTableCell-body, &&& td.RaDatagrid-rowCell.column-__row_action_buttons__': {
          backgroundColor: theme.palette.background.paper,
          backgroundImage: `linear-gradient(${tint}, ${tint})`,
        },
        '& td.MuiTableCell-body:first-of-type': {
          boxShadow: `inset 3px 0 0 ${theme.palette.primary.main}`,
        },
      };
      return base ? ([base, activeSx] as SxProps) : activeSx;
    },
    [rowSx, activeSidePanelRecordId, theme]
  );

  // Builds a per-record tooltip shown on row hover. The label for each active
  // click slot is resolved from the record's own action schema at render time,
  // so it reflects per-record overrides (e.g. a record that exposes a different
  // action label than the resource default). Turned off app-wide by `rowTooltip={false}` on
  // SchemaAdmin, which leaves the click slots themselves untouched.
  const rowTooltip = useMemo(
    () =>
      rowTooltipEnabled
        ? createRowTooltip(singleSlotActive, doubleSlotActive, singleClickAction, doubleClickAction)
        : undefined,
    [rowTooltipEnabled, singleSlotActive, doubleSlotActive, singleClickAction, doubleClickAction]
  );

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <Box>
      <ListContextProvider
        value={
          listContext.isPending || listContext.data === undefined
            ? {...listContext, isLoading: isLoading || enableDnd !== canUseDndWithFilters}
            : {
                ...listContext,
                data: sortedData,
                isLoading: isLoading || enableDnd !== canUseDndWithFilters,
              }
        }
      >
        <ValueLocationContextProvider value={{isInCollection: true}}>
          <AdminDatagrid
            target={target}
            expand={expand}
            bulkActionButtons={false}
            rowActionButtons={showRowActions && rowActionButtons}
            onDropRow={handleDropRow}
            enableDnd={enableDnd}
            loadingDnd={isUpdating}
            onRowClick={onRowClick}
            onRowSingleClick={singleSlotActive ? handleRowSingleClick : undefined}
            onRowDoubleClick={doubleSlotActive ? handleRowDoubleClick : undefined}
            rowSx={highlightedRowSx}
            rowTooltip={rowTooltip}
            preferenceKey={preferenceKey}
            resizableColumns
            configurableColumns
          >
            {fieldsToRender.map((fieldDescriptor) => {
              const fieldSchema = fieldSchemaMap[fieldDescriptor.name];

              if (fieldDescriptor.wrapper)
                return (
                  <SchemaWrappedFields
                    key={fieldDescriptor.name}
                    fields={fieldDescriptor.wrapper.fields}
                    divider={fieldDescriptor.wrapper.divider}
                    label={fieldDescriptor.label}
                  />
                );

              if (fieldDescriptor.action)
                return (
                  <SchemaFieldOrInput
                    key={fieldDescriptor.name}
                    field={fieldDescriptor}
                    source={fieldDescriptor.name}
                    sortable={false}
                    label={fieldDescriptor.label}
                  />
                );

              if (!fieldSchema) return;

              // Get the field component and render it
              const fieldProps: FieldProps = {
                source: fieldSchema.name,
                label: (
                  <DatagridLabel label={fieldSchema.label} shortLabel={fieldSchema.shortLabel} />
                ),
                sortable: fieldSchema.sortable && !enableDnd && !disableSort,
                sortBy: fieldSchema.sortBy,
                emptyText: '--',
                textAlign: fieldSchema.options?.textAlign,
              };
              const fieldEl = getFieldEl({
                resource,
                source: fieldSchema.name,
                type: fieldSchema.type,
                isInList: true,
                format: fieldSchema.format,
                schema: fieldSchema,
                props: fieldProps,
              });
              if (!fieldEl) return;
              return (
                <SchemaFieldContent
                  schema={fieldSchema}
                  key={`${fieldSchema.name}-${fieldSchema.targetSource}`}
                  label={fieldProps.label}
                  textLabel={fieldSchema.label}
                  showLabel={false}
                  source={
                    fieldSchema.targetSource
                      ? `${fieldSchema.name}.${fieldSchema.targetSource}`
                      : fieldSchema.name
                  }
                  sortable={fieldProps.sortable}
                  sortBy={fieldProps.sortBy || fieldProps.source}
                  textAlign={fieldEl.props.textAlign}
                >
                  {fieldEl}
                </SchemaFieldContent>
              );
            })}
          </AdminDatagrid>
        </ValueLocationContextProvider>
      </ListContextProvider>
      {triggerActionElement && activation && (
        <RecordContextProvider key={activation.nonce} value={activation.record}>
          {triggerActionElement}
        </RecordContextProvider>
      )}
    </Box>
  );
};
