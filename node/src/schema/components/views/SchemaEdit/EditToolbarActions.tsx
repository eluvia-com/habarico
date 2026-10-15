import React from 'react';
import {useTranslate} from 'react-admin';
import {SaveButton} from '@admin/components/buttons/SaveButton';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {useViewPresentation} from '@admin/contexts/ViewPresentationContext';
import {Icon, IconType} from '@design/atoms/Icon';
import {OverflowToolbar} from '@design/molecules/OverflowToolbar';
import {SchemaShowButton} from '@schema/components/buttons/SchemaShowButton';
import {useViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';
import {useGlobalResourceSchemaContext} from '@schema/hooks/useGlobalResourceSchemaContext';
import {useHabRecordContext} from '@schema/hooks/useHabRecordContext';
import {generateDescriptorsFromSchema} from '@schema/utils/generateDescriptorsFromSchema';

/**
 * Default header form actions for an edit view that defines no toolbar actions of its own. When the
 * resource has a detail view, every presentation gets a "Cancel" action that returns to the detail
 * without saving (in a dialog/panel `SchemaShowButton` swaps the view in place; on a page it
 * navigates). A page additionally gets the primary `contained` Save beside it — a dialog and a panel
 * already carry their Save in the footer action bar (portaled `DialogActions` / the in-flow form
 * toolbar), so their header only needs the detail switch (HAB-956).
 *
 * Rendered *inside* the form subtree (by `EditContent`), so the buttons keep the react-hook-form +
 * save context, and portaled into the header via `setActions` — the same "render in the form tree,
 * portal only the DOM" trick the footer Save uses with `setBottomActions`. It only kicks in when the
 * resolved toolbar is empty: a non-empty toolbar keeps its own actions (which are portaled to the
 * same header slot by `ViewContent`).
 */
export const EditToolbarActions = () => {
  const {setActions, presentation} = useViewPresentation();
  const {viewSchema} = useViewSchemaContext();
  const resource = useResourceContext();
  const {hasShowView} = useGlobalResourceSchemaContext(resource);
  const record = useHabRecordContext();
  const translate = useTranslate();

  // Mirror how `SchemaViewToolbarActions` / `SchemaButtons` resolve the toolbar: explicit
  // `toolbarActions`, otherwise the record's detail actions. A non-empty result means the header
  // already shows real actions, so the fallback stays out of the way.
  const toolbarActions =
    viewSchema.detail?.toolbarActions ??
    generateDescriptorsFromSchema(record?.meta.schema.actions ?? [], false, 'all', viewSchema.name);

  if (toolbarActions.length > 0) return null;

  const isPage = presentation === 'page';
  const isPanel = presentation === 'panel';

  // The switch back to the detail view, present whenever the resource has one. Cancel is a secondary
  // action, so it renders `outlined` — the primary Save carries the fill — on every button surface: a
  // small outlined button in the dialog title bar and a medium outlined one beside the Save on the
  // page. The narrow panel header shows it as a small icon button instead, where the variant does not
  // apply.
  const cancelButton = hasShowView && (
    <SchemaShowButton
      label={translate('ra.action.cancel')}
      icon={<Icon icon={IconType.Visibility} />}
      surface={isPanel ? 'iconButton' : 'button'}
      variant={'outlined'}
      size={isPage ? 'medium' : 'small'}
    />
  );

  // A dialog and a panel already show the primary Save in their footer, so the header carries only
  // the detail switch — and nothing at all when there is no detail view to switch to.
  if (!isPage) return cancelButton ? (setActions(cancelButton) ?? null) : null;

  // On a page the header carries both the detail switch and the primary Save. Wrapped in
  // `OverflowToolbar` purely for its icon-only-below-`sm` behaviour (via `ToolbarSlotContext`, which
  // both buttons read through `ActionButton`). No `maxVisible` → Save / Cancel never collapse into
  // the `⋮` menu; they only drop their labels on narrow widths.
  return (
    setActions(
      <OverflowToolbar iconOnly={'sm'}>
        {cancelButton}
        <SaveButton size={'medium'} variant={'contained'} />
      </OverflowToolbar>
    ) ?? null
  );
};
