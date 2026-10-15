import React, {ReactElement} from 'react';
import {Icon, IconType} from '@design/atoms/Icon';
import {ViewType} from '@schema/types';

// Keyed by the type of the view a button opens - never by an action type. `Record<ViewType, …>`
// is what keeps it that way: indexing it with anything else is a compile error, which is how this
// map was once read with an `ActionType` and silently returned `undefined` for every action.
export const DEFAULT_VIEW_ICONS: Record<ViewType, ReactElement> = {
  edit: <Icon icon={IconType.Edit} />,
  show: <Icon icon={IconType.Visibility} />,
  create: <Icon icon={IconType.Add} />,
  list: <Icon icon={IconType.List} />,
  action: <Icon icon={IconType.Task} />,
};
