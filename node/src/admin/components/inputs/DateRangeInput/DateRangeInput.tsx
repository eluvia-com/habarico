import clsx from 'clsx';
import {isAfter, isBefore, isSameDay} from 'date-fns';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useInput} from 'react-admin';
import {InputProps} from '@admin/components/inputs/types';
import {Icon, IconType} from '@design/atoms/Icon';
import {Box, IconButton, InputAdornment, Popover, Stack, TextField} from '@mui/material';
import {DateCalendar} from '@mui/x-date-pickers/DateCalendar';
import {PickerDay, PickerDayProps} from '@mui/x-date-pickers/PickerDay';
import {calendarSx} from './calendarSx';
import {InputRangeType, RangeType} from './types';
import {inRange, normalize} from './utils';

export type DateRangeInputProps = InputProps & {
  locales?: string;
};

export const DateRangeInput = ({
  source,
  locales = navigator.language,
  label,
  helperText,
  sx,
}: DateRangeInputProps) => {
  const calendarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [hoverDay, setHoverDay] = useState<Date | null>(null);
  const [isSelectedLower, setIsSelectedLower] = useState(true);

  const open = Boolean(anchorEl);

  const {
    field: {onChange, value},
    fieldState: {error, invalid},
  } = useInput<InputRangeType>({
    source: source,
  });

  // Convert input value to RangeType with Date objects
  const rangeValue: RangeType = useMemo(
    () => ({
      lower: value && value.lower ? new Date(value.lower) : null,
      upper: value && value.upper ? new Date(value.upper) : null,
    }),
    [value]
  );

  // Store the initial value when opening the picker
  const [calendarInitialValue, setCalendarInitialValue] = useState<RangeType>(rangeValue);

  // Format the display text for the input field
  const lowerTextValue = rangeValue.lower
    ? new Intl.DateTimeFormat(locales).format(rangeValue.lower)
    : '-∞';
  const upperTextValue = rangeValue.upper
    ? new Intl.DateTimeFormat(locales).format(rangeValue.upper)
    : '∞';
  const textValue = `${lowerTextValue} – ${upperTextValue}`;

  //----------------------------------------------------------------------------
  // Effects
  //----------------------------------------------------------------------------

  // Effect to track pointer movement and set hoverDay
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const root = calendarRef.current;
      if (!root) return;

      const el = document.elementFromPoint(e.clientX, e.clientY);
      const inside = el && root.contains(el);

      const target = e.target;
      const dayButton =
        target instanceof Element
          ? target.closest('button[data-timestamp], button[role="gridcell"]')
          : null;
      if (!inside || !dayButton) setHoverDay(null);
    };

    window.addEventListener('pointermove', onMove, {passive: true});
    window.addEventListener('blur', () => setHoverDay(null));
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('blur', () => setHoverDay(null));
    };
  }, []);

  //----------------------------------------------------------------------------
  // Handlers
  //----------------------------------------------------------------------------

  // Open the date range picker
  const handleOpenPicker = useCallback(() => {
    if (inputRef.current) {
      setAnchorEl(inputRef.current);
      setCalendarInitialValue(rangeValue);
    }
  }, [rangeValue, setAnchorEl, setCalendarInitialValue]);

  // Close the date range picker
  const handleClosePicker = useCallback(() => {
    setAnchorEl(null);
    setHoverDay(null);
  }, [setAnchorEl, setHoverDay]);

  // Handle changes to the date range, converting Date objects to ISO strings
  const handleChangeRange = useCallback(
    (value: RangeType) => {
      const lower = value.lower
        ? new Date(value.lower.getTime() - value.lower.getTimezoneOffset() * 60000)
        : null;
      const upper = value.upper
        ? new Date(value.upper.getTime() - value.upper.getTimezoneOffset() * 60000)
        : null;

      onChange({
        lower: lower ? lower.toISOString().split('T')[0] : null,
        upper: upper ? upper.toISOString().split('T')[0] : null,
      });
    },
    [onChange]
  );

  // Handle selecting a day in the calendar
  const handleSelectCalendarDay = useCallback(
    (day: Date) => {
      const normalizedDay = normalize(day);
      if (isSelectedLower) {
        if (rangeValue.upper && isAfter(normalizedDay, rangeValue.upper)) {
          handleChangeRange({lower: normalizedDay, upper: normalizedDay});
        } else if (rangeValue.lower && isSameDay(normalizedDay, rangeValue.lower)) {
          handleChangeRange({lower: null, upper: rangeValue.upper});
        } else {
          handleChangeRange({lower: normalizedDay, upper: rangeValue.upper});
        }
      } else {
        if (rangeValue.lower && isBefore(normalizedDay, rangeValue.lower)) {
          handleChangeRange({lower: normalizedDay, upper: normalizedDay});
        } else if (rangeValue.upper && isSameDay(normalizedDay, rangeValue.upper)) {
          handleChangeRange({lower: rangeValue.lower, upper: null});
        } else {
          handleChangeRange({lower: rangeValue.lower, upper: normalizedDay});
        }
      }
      setIsSelectedLower(!isSelectedLower);
    },
    [isSelectedLower, rangeValue, handleChangeRange, setIsSelectedLower]
  );

  // ----------------------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------------------

  // `undefined` (not a blank string) so MUI omits the helper row entirely when there is no message,
  // matching the dynamic input height used across the app.
  const inputHelperText = (invalid && error?.message) || helperText || undefined;

  return (
    <>
      <TextField
        ref={inputRef}
        fullWidth
        value={textValue}
        size="small"
        sx={sx}
        onClick={() => handleOpenPicker()}
        // `label={false}` / `label={''}` (bare mode — a PropertyItem owns the label) must reach MUI
        // as real `undefined`: MUI's notched outline decides whether to draw a legend from the
        // prop's truthiness, not its rendered output, so passing the literal `false`/`''` through
        // still opens an (empty) notch in the border. The field is always `readOnly` with a
        // non-empty formatted value, so it is always in the "filled"/notched state.
        label={label === false || label === '' ? undefined : label}
        slotProps={{
          input: {
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenPicker();
                  }}
                >
                  <Icon icon={IconType.CalendarMonth} />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        error={invalid}
        helperText={inputHelperText}
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClosePicker}
        anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
        sx={calendarSx}
      >
        <Stack className="CalendarHeader" direction="row" spacing={1} alignItems="center">
          <Box flex={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                className={clsx('DateRangeInputValue', isSelectedLower && 'selected')}
                onClick={!isSelectedLower ? () => setIsSelectedLower(true) : undefined}
              >
                {lowerTextValue}
                {rangeValue.lower && (
                  <IconButton
                    className="DateRangeInputValue-clearButton"
                    onClick={() => handleChangeRange({lower: null, upper: rangeValue.upper})}
                  >
                    <Icon icon={IconType.Close} />
                  </IconButton>
                )}
              </Box>
              <Box>-</Box>
              <Box
                className={clsx('DateRangeInputValue', !isSelectedLower && 'selected')}
                onClick={isSelectedLower ? () => setIsSelectedLower(false) : undefined}
              >
                {upperTextValue}
                {rangeValue.upper && (
                  <IconButton
                    className="DateRangeInputValue-clearButton"
                    onClick={() => handleChangeRange({lower: rangeValue.lower, upper: null})}
                  >
                    <Icon icon={IconType.Close} />
                  </IconButton>
                )}
              </Box>
            </Stack>
          </Box>

          <IconButton
            size="small"
            onClick={() => {
              handleChangeRange({lower: null, upper: null});
              setHoverDay(null);
            }}
          >
            <Icon icon={IconType.RestartAlt} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => {
              handleClosePicker();
            }}
          >
            <Icon icon={IconType.Close} />
          </IconButton>
        </Stack>

        <Box ref={calendarRef}>
          <DateCalendar
            value={calendarInitialValue.lower}
            slots={{
              day: (props: PickerDayProps) => {
                const {ref, ...dayProps} = props;
                const day = dayProps.day;

                const isStart = rangeValue.lower ? isSameDay(day, rangeValue.lower) : false;
                const isEnd = rangeValue.upper ? isSameDay(day, rangeValue.upper) : false;

                const isHover = hoverDay ? isSameDay(day, hoverDay) : false;

                const isInside = inRange(day, rangeValue.lower, rangeValue.upper);

                const isActive = (isSelectedLower && isStart) || (!isSelectedLower && isEnd);
                const isHoverInside =
                  hoverDay &&
                  (isSelectedLower
                    ? inRange(day, hoverDay, rangeValue.upper)
                    : inRange(day, rangeValue.lower, hoverDay));

                return (
                  <PickerDay
                    {...dayProps}
                    ref={ref}
                    selected={false}
                    onClick={() => {
                      handleSelectCalendarDay(day);
                    }}
                    onPointerEnter={() => {
                      setHoverDay(day);
                    }}
                  >
                    <Box
                      className={clsx(
                        'DateRangePickerDay-root',
                        isStart && 'start',
                        isEnd && 'end',
                        isActive && 'active',
                        isHover && 'hover',
                        isSelectedLower ? 'select-lower' : 'select-upper'
                      )}
                    >
                      {isHoverInside && <Box className="DateRangePickerDay-hoverInside" />}
                      {isInside && <Box className={'DateRangePickerDay-inside'} />}
                      <Box className={'DateRangePickerDayLabel'}>{day.getDate()}</Box>
                    </Box>
                  </PickerDay>
                );
              },
            }}
          />
        </Box>
      </Popover>
    </>
  );
};
