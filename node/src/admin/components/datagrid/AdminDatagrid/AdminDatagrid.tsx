import React, {ReactNode, useCallback, useEffect, useMemo, useRef} from 'react';
import {
  Identifier,
  DatagridProps as RaDatagridProps,
  RaRecord,
  useListContext,
  useStore,
} from 'react-admin';
import {DatagridTooltipFn} from '@admin/components/datagrid/DatagridRowTooltip';
import {StyledDatagrid} from '@admin/components/datagrid/StyledDatagrid';
import {WrapperField} from '@admin/components/fields/WrapperField';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {useRowClick} from '@admin/hooks/useRowClick';
import {DatagridHeader} from '@admin/overrides/ra-iu-materialui';
import {NavMode} from '@foundation/utils/navigation';
import {Box, SxProps, Theme} from '@mui/material';
import LinearProgress from '@mui/material/LinearProgress';
import {useQueryClient} from '@tanstack/react-query';
import {DatagridBody} from './DatagridBody';
import {ResizableHeaderCellAction} from './ResizableHeaderCellAction';
import {WidthMap} from './types';

export type AdminDatagridProps<T extends RaRecord> = RaDatagridProps & {
  name?: string;
  target?: string;
  enableDnd?: boolean;
  loadingDnd?: boolean;
  onDropRow?: (record: RaRecord, index: number) => void;
  rowActionButtons?: ReactNode;
  onRowSingleClick?: (record: T, navigationMode: NavMode) => void | string;
  onRowDoubleClick?: (record: T, navigationMode: NavMode) => void | string;
  onRowClick?: (record: T) => void;
  preferenceKey?: string;
  minColumnWidth?: number;
  resizableColumns?: boolean;
  configurableColumns?: boolean;
  rowTooltip?: DatagridTooltipFn;
};

const getColumnKey = (child: React.ReactNode): string | null => {
  if (!React.isValidElement<{source?: string}>(child)) return null;
  return child.props.source ?? null;
};

export const AdminDatagrid = <T extends RaRecord>({
  target,
  enableDnd,
  loadingDnd,
  onDropRow,
  rowActionButtons,
  children,
  onRowSingleClick,
  onRowDoubleClick,
  onRowClick,
  rowTooltip,
  minColumnWidth = 20,
  resizableColumns = false,
  configurableColumns = false,
  ...props
}: AdminDatagridProps<T>) => {
  const {handleClickStart, getRowClickWithData, handleDoubleClick} = useRowClick(
    onRowSingleClick,
    onRowDoubleClick
  );
  const {isPending, isFetching, isLoading} = useListContext();
  const queryClient = useQueryClient();
  const datagridWrapperRef = useRef<HTMLDivElement>(null);
  const resource = useResourceContext(props.resource);
  const preferenceKeyBase = !target ? resource : `${target}.${resource}`;
  const {preferenceKey = `${preferenceKeyBase}.datagrid`, ...rest} = props;
  const preferenceKeyColumnWidths = preferenceKey + '.columnWidths';
  const [widths, setWidths] = useStore<WidthMap>(`preferences.${preferenceKeyColumnWidths}`, {});

  // Get column keys from fields and configure column styles
  const columnKeys: string[] = useMemo(() => {
    if (!resizableColumns) return [];
    return React.Children.toArray(children)
      .map(getColumnKey)
      .filter((k): k is string => !!k);
  }, [children, resizableColumns]);

  // --------------------------------------------------------------------------
  // Effect to initialize column widths
  // --------------------------------------------------------------------------

  useEffect(() => {
    const datagridWrapper = datagridWrapperRef.current;

    if (
      isPending ||
      isFetching ||
      isLoading ||
      !datagridWrapper ||
      Object.keys(widths).length !== 0
    ) {
      return;
    }

    // Poll via rAF until every TanStack Query has settled, then defer one macrotask
    // (setTimeout 0) before measuring.  We need both halves because:
    //
    //  1. Closure staleness — Datagrid renders before its children, so any
    //     isFetchingQueries value captured at effect-creation time may be stale (0)
    //     even though ReferenceField queries are already in-flight.  Polling each
    //     animation frame via queryClient.isFetching() reads the live counter and
    //     avoids that problem.
    //
    //  2. React commit ordering — when the last query's network response arrives
    //     (macrotask A), React schedules its DOM commit via MessageChannel (macrotask B).
    //     The rAF fires in the *rendering step* of the same event-loop iteration as
    //     macrotask A, i.e. BEFORE macrotask B runs.  So at rAF time the counter is
    //     already 0, but the last cell hasn't been painted yet.  Deferring to
    //     setTimeout(0) puts our measurement callback into the macrotask queue AFTER
    //     macrotask B (FIFO), so React's commit always wins the race.
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const measure = () => {
      timeoutId = null;
      if (cancelled) return;

      // Re-check: a new query may have started while we were waiting in setTimeout.
      if (queryClient.isFetching() > 0) {
        requestAnimationFrame(tryMeasure);
        return;
      }

      // Remove CSS vars so the table uses natural auto-layout for measurement.
      for (const key of columnKeys) {
        const varName = key.replace(/\./g, '__');
        datagridWrapper.style.removeProperty(`--field-${varName}`);
      }

      // Measure each column header and store the width.
      const initialWidth: WidthMap = {};
      for (const key of columnKeys) {
        const className = key.replace(/\./g, '\\.');
        const columnWidth = datagridWrapper
          ?.querySelector(`th.column-${className}`)
          ?.getBoundingClientRect().width;
        if (columnWidth) {
          initialWidth[key] = Math.max(minColumnWidth, columnWidth);
        }
      }

      if (Object.keys(initialWidth).length !== 0) {
        setWidths(initialWidth);
      }
    };

    const tryMeasure = () => {
      if (cancelled) return;
      if (queryClient.isFetching() > 0) {
        // Queries still in-flight — try again next frame.
        requestAnimationFrame(tryMeasure);
        return;
      }

      // All queries are settled, but React may still have a pending commit queued
      // via MessageChannel (a macrotask).  The rAF fires in the rendering step of
      // the current event-loop iteration, while that MessageChannel task was
      // enqueued during the same iteration's microtask checkpoint — meaning it will
      // run at the START of the NEXT iteration, before our setTimeout callback.
      // Deferring via setTimeout(0) therefore guarantees React has flushed all
      // pending commits before we read the DOM.
      timeoutId = setTimeout(measure, 0);
    };

    requestAnimationFrame(tryMeasure);
    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
  }, [
    columnKeys,
    isPending,
    isFetching,
    isLoading,
    queryClient,
    datagridWrapperRef,
    widths,
    minColumnWidth,
    setWidths,
  ]);

  useEffect(() => {
    const datagridWrapper = datagridWrapperRef.current;
    if (datagridWrapper && resizableColumns) {
      for (const key of columnKeys) {
        const varName = key.replace(/\./g, '__');
        const width = widths[key];
        if (width) {
          datagridWrapper.style.setProperty(`--field-${varName}`, `${width}px`);
        } else {
          datagridWrapper.style.removeProperty(`--field-${varName}`);
        }
      }
    }
  }, [widths, datagridWrapperRef, columnKeys, resizableColumns]);

  // --------------------------------------------------------------------------
  // Column resizing handlers
  // --------------------------------------------------------------------------

  // Set column width from column action
  const setColumnWidthLive = useCallback(
    (key: string, width: number) => {
      const root = datagridWrapperRef.current;
      const varName = key.replace(/\./g, '__');
      const columnWidth = Math.max(minColumnWidth, width);
      root?.style.setProperty(`--field-${varName}`, `${columnWidth}px`);
    },
    [minColumnWidth, datagridWrapperRef]
  );

  const setColumnWidth = useCallback(
    (key: string, width: number) => {
      const columnWidth = Math.max(minColumnWidth, width);
      setWidths((prev) => ({
        ...prev,
        [key]: columnWidth,
      }));
    },
    [minColumnWidth, setWidths]
  );

  const rowClick = useCallback(
    (id: Identifier, resource: string, record: RaRecord) => {
      if (onRowClick) onRowClick(record as T);
      return getRowClickWithData(id, record as T);
    },
    [onRowClick, getRowClickWithData]
  );

  const columnSx = useMemo(() => {
    const out: Record<string, SxProps<Theme>> = {};
    for (const key of columnKeys) {
      const varName = key.replace(/\./g, '__');
      const className = key.replace(/\./g, '\\.');

      out[`& .column-${className}`] = {
        width: `var(--field-${varName})`,
        maxWidth: `var(--field-${varName})`,
        minWidth: `var(--field-${varName})`,
      } as SxProps;
    }
    return out;
  }, [columnKeys]);

  const datagridBody = useMemo(
    () => (
      <DatagridBody
        onDropRow={onDropRow}
        enableDnd={enableDnd}
        loadingDnd={loadingDnd}
        rowTooltip={rowTooltip}
      />
    ),
    [onDropRow, enableDnd, loadingDnd, rowTooltip]
  );

  // Add resizable action to header
  const header = useMemo(
    () => (
      <DatagridHeader
        action={
          resizableColumns ? (
            <ResizableHeaderCellAction
              setColumnWidth={setColumnWidth}
              setColumnWidthLive={setColumnWidthLive}
            />
          ) : undefined
        }
      />
    ),
    [resizableColumns, setColumnWidth, setColumnWidthLive]
  );

  const fields: ReactNode[] = useMemo(
    () => [
      ...(enableDnd
        ? [
            <WrapperField
              source="__drag_and_drop__"
              label=""
              sortable={false}
              fixed={true}
              key="__drag_and_drop__"
            >
              <Box />
            </WrapperField>,
          ]
        : []),
      children,
      [
        <WrapperField
          source="__spacer__"
          label=""
          sortable={false}
          fixed={true}
          key="__spacer__"
        />,
      ],
      ...(rowActionButtons
        ? [
            <WrapperField
              source="__row_action_buttons__"
              label=""
              sortable={false}
              fixed={true}
              key="__row_action_buttons__"
            >
              <Box
                // A row action's dialog (e.g. edit/show) is a React descendant of this cell, but MUI
                // portals its DOM to `document.body` — React still bubbles synthetic events along the
                // JSX tree, not the DOM tree, so a click anywhere inside that dialog would otherwise
                // reach the row's onClick / the table's onDoubleClick and re-trigger row activation.
                // Stopping propagation here, at the row-actions cell boundary, contains it. `onMouseDown`
                // is deliberately left alone: `DatagridRow`'s row-hint Tooltip closes itself via a
                // `mousedown` on the `<TableRow>` (an ancestor of this cell), and stopping it here would
                // swallow that before it ever got there. `handleClickStart` (bound to `onMouseDown` on
                // the table root) only records a timestamp/nav-mode ref for the *next* real row click —
                // a stray bubbled mousedown from inside an open dialog doesn't trigger any activation.
                onClick={(event) => event.stopPropagation()}
                onDoubleClick={(event) => event.stopPropagation()}
                sx={{
                  width: '100%',
                  height: '100%',
                  padding: '0 5px',
                  display: 'flex',
                  alignItems: 'center',
                  '&:empty': {
                    p: 0,
                  },
                }}
              >
                {rowActionButtons}
              </Box>
            </WrapperField>,
          ]
        : []),
    ],
    [children, enableDnd, rowActionButtons]
  );

  const loadingEl = (
    <LinearProgress
      sx={{
        opacity: isFetching || isLoading ? 1 : 0,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        pointerEvents: 'none',
        transition: 'opacity 150ms linear',
      }}
    />
  );

  // The shared `StyledDatagrid` core owns the skin (header band, sort caret, row highlight, sticky
  // actions column) and the RA `Datagrid` vs. `DatagridConfigurable` choice; this component layers on
  // the resource-aware wiring — column-width measurement/persistence, row-click navigation, drag-and-
  // drop and the injected spacer/actions/drag columns.
  return (
    <Box ref={datagridWrapperRef} sx={columnSx}>
      {loadingEl}
      <StyledDatagrid
        {...rest}
        configurable={configurableColumns}
        preferenceKey={preferenceKey}
        body={datagridBody}
        onMouseDown={handleClickStart}
        rowClick={rowClick}
        onDoubleClick={handleDoubleClick}
        header={header}
      >
        {fields}
      </StyledDatagrid>
    </Box>
  );
};
