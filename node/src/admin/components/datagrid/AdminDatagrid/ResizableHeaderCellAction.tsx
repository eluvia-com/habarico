import {useTranslate} from 'ra-core';
import React, {useRef} from 'react';
import {DatagridHeaderActionElementProps} from '@admin/overrides/ra-iu-materialui';
import {Box} from '@mui/material';

export type ResizableHeaderCellAction = DatagridHeaderActionElementProps & {
  setColumnWidthLive: (key: string, width: number) => void;
  setColumnWidth: (key: string, width: number) => void;
};

export const ResizableHeaderCellAction = (props: ResizableHeaderCellAction) => {
  const ref = useRef<HTMLElement>(null);
  const translate = useTranslate();
  const {setColumnWidth, setColumnWidthLive, field} = props;

  const source = field?.props?.source;
  const fixed = field?.props?.fixed;

  const onMouseDown = (e: React.MouseEvent) => {
    if (!source) return;

    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;

    const th = (ref.current as HTMLElement).closest('th') as HTMLElement | null;
    const startWidth = th ? th.getBoundingClientRect().width : 0;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      setColumnWidthLive(source, startWidth + dx);

      const resizableEl = ref.current;

      if (!resizableEl) return;

      const tableEl = resizableEl.closest('.MuiTable-root');
      const scrollbarEl = tableEl?.closest('.simplebar-content-wrapper');
      const actionsColumnEl = tableEl?.querySelector('th.column-__row_action_buttons__');

      if (!tableEl || !scrollbarEl) return;

      const resizableElRightOffset =
        resizableEl.getBoundingClientRect().left -
        scrollbarEl.getBoundingClientRect().left +
        Math.ceil(resizableEl.getBoundingClientRect().width);
      const tableVisibleWidth =
        scrollbarEl.getBoundingClientRect().width -
        (actionsColumnEl?.getBoundingClientRect().width || 0);

      if (resizableElRightOffset > tableVisibleWidth) {
        scrollbarEl.scrollTo({
          left: scrollbarEl.scrollLeft + resizableElRightOffset - tableVisibleWidth,
          behavior: 'auto',
        });
      }
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);

      const th = (ref.current as HTMLElement).closest('th') as HTMLElement | null;
      setColumnWidth(source, th ? th.getBoundingClientRect().width : 0);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  if (fixed) {
    return null;
  }

  return (
    <Box
      onMouseDown={onMouseDown}
      ref={ref}
      sx={{
        position: 'relative',
        height: '100%',
        width: 9,
        cursor: 'col-resize',
        // Mirrors the side panel resize handle: an invisible hit area with a thin bar that
        // tints to primary on hover and while dragging.
        '&::after': {
          content: '""',
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '2px',
          height: '1.2em',
          transform: 'translate(-50%, -50%)',
          backgroundColor: (theme) => theme.palette.divider,
          transition: (theme) => theme.transitions.create('background-color'),
        },
        '&:hover::after, &:active::after': {
          backgroundColor: (theme) => theme.palette.primary.main,
        },
      }}
      title={translate('ra.action.resize_column')}
    />
  );
};
