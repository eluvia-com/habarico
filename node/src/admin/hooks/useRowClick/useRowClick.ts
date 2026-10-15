import React, {useCallback, useEffect, useRef} from 'react';
import {Identifier, RaRecord} from 'react-admin';
import {useNavigate} from 'react-router';
import {DOUBLE_CLICK_DELAY} from '@admin/constants';
import {NavMode, getNavigationMode, openByMode} from '@foundation/utils/navigation';

type RowActivation<T> = (record: T, navigationMode: NavMode) => void | string;

/**
 * Row click behaviour with two independent slots: a single-click and a double-click activation.
 * Either slot may be omitted. When both are set the single-click activation is deferred so a
 * following double click can cancel it; with a single slot the activation fires immediately on
 * its gesture (no added latency), preserving the previous single-gesture behaviour.
 */
export const useRowClick = <T extends RaRecord>(
  onSingleClick?: RowActivation<T>,
  onDoubleClick?: RowActivation<T>
) => {
  const clickStart = useRef<number>(null);
  const selectedRecord = useRef<T>(null);
  const selectedNavigationMode = useRef<NavMode>(null);
  const singleClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const singleRef = useRef(onSingleClick);
  const doubleRef = useRef(onDoubleClick);
  useEffect(() => {
    singleRef.current = onSingleClick;
    doubleRef.current = onDoubleClick;
  }, [onSingleClick, onDoubleClick]);

  const clearSingleClickTimer = () => {
    if (singleClickTimer.current) {
      clearTimeout(singleClickTimer.current);
      singleClickTimer.current = null;
    }
  };

  const runActivation = useCallback(
    (activation: RowActivation<T> | undefined, record: T) => {
      const navigationMode = selectedNavigationMode.current || 'same';
      const url = activation?.(record, navigationMode);
      if (typeof url === 'string') {
        if (selectedNavigationMode.current && openByMode(url, selectedNavigationMode.current))
          return;
        navigate(url);
      }
    },
    [navigate]
  );

  const handleClickStart = useCallback((e: React.MouseEvent) => {
    clickStart.current = +new Date();
    selectedNavigationMode.current = getNavigationMode(e);
  }, []);

  const getRowClickWithData = useCallback(
    (id: Identifier, record: T): false => {
      selectedRecord.current = record;
      // A long press is treated as a drag, not a click.
      const isLongPress =
        !!clickStart.current && +new Date() - clickStart.current > DOUBLE_CLICK_DELAY;
      if (!isLongPress && singleRef.current) {
        if (doubleRef.current) {
          // Both slots active: wait to see whether a double click follows before activating.
          clearSingleClickTimer();
          singleClickTimer.current = setTimeout(() => {
            singleClickTimer.current = null;
            runActivation(singleRef.current, record);
          }, DOUBLE_CLICK_DELAY);
        } else {
          runActivation(singleRef.current, record);
        }
      }
      // Always suppress react-admin's default row navigation; activation is handled here.
      return false;
    },
    [runActivation]
  );

  const handleDoubleClick = useCallback(() => {
    clearSingleClickTimer();
    if (selectedRecord.current) {
      runActivation(doubleRef.current, selectedRecord.current);
    }
  }, [runActivation]);

  useEffect(() => clearSingleClickTimer, []);

  return {handleClickStart, getRowClickWithData, handleDoubleClick};
};
