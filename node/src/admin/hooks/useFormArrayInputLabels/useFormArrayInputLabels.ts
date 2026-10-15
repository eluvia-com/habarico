import React from 'react';
import {useTranslate} from 'react-admin';

/** The design `FormTable` labels that `FormArrayInput` fills from the React Admin locale. */
export type FormArrayInputLabels = {
  addLabel: React.ReactNode;
  clearAllLabel: React.ReactNode;
  removeRowLabel: string;
  moreActionsLabel: string;
  emptyMessage: React.ReactNode;
  countLabel: (count: number) => React.ReactNode;
};

/**
 * Bridges the schema-free design `FormTable` labels to the React Admin locale — the single place
 * `FormArrayInput` turns `ra.*` translations into the presentational labels. Mirrors
 * `useUploadAreaLabels`: the design layer ships English defaults, the admin layer injects the
 * translations. Each key passes an English `_` default so a locale that omits the custom
 * `ra.array_input.*` keys still renders a sensible string.
 */
export const useFormArrayInputLabels = (): FormArrayInputLabels => {
  const translate = useTranslate();
  return {
    addLabel: translate('ra.action.add'),
    clearAllLabel: translate('ra.action.clear_array_input'),
    removeRowLabel: translate('ra.action.remove'),
    moreActionsLabel: translate('ra.array_input.more_actions', {_: 'More actions'}),
    emptyMessage: translate('ra.array_input.empty', {_: 'No items yet'}),
    countLabel: (count) => translate('ra.array_input.count', {count, _: '%{count} items'}),
  };
};
