import {SortPayload} from 'react-admin';

export const DEFAULT_SORT: SortPayload = {field: 'id', order: 'ASC'};

// Row activation delay (ms) used both to treat a long press as a drag (not a click) and to
// disambiguate a single click from the first click of a double click when both slots are active.
export const DOUBLE_CLICK_DELAY = 200;

export const TOOLTIP_ENTER_DELAY = 600;
