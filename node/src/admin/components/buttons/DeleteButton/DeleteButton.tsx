import React from 'react';
import {useDelete, useLocaleState, useNotify, useRecordContext, useUnselect} from 'react-admin';
import {ActionButton, ActionButtonProps} from '@admin/components/buttons/ActionButton';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {AdminRecord} from '@admin/types';
import {Icon, IconType} from '@design/atoms/Icon';

export type DeleteButtonProps = Omit<ActionButtonProps, 'confirm'> & {
  reference?: string;
  onSuccess?: () => void;
  record?: AdminRecord;
  // Translation keys for the built-in delete confirmation (assembled into the `ActionButton` confirm).
  confirmTitle?: string;
  confirmContent?: string;
};

export const DeleteButton = ({
  reference,
  label = 'ra.action.delete',
  icon = <Icon icon={IconType.Delete} />,
  confirmTitle = 'ra.message.delete_title',
  confirmContent = 'ra.message.delete_content',
  color = 'error',
  onSuccess,
  ...rest
}: DeleteButtonProps) => {
  const resource = useResourceContext(reference);
  const record = useRecordContext<AdminRecord>(rest);
  const notify = useNotify();
  const unselect = useUnselect(resource);

  const [deleteOne, {isLoading}] = useDelete();
  const [locale] = useLocaleState();

  if (!record) return null;

  const handleClick = async (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.stopPropagation();
    deleteOne(
      resource,
      {id: record.id, previousData: record, meta: {locale}},
      {
        onSuccess: () => {
          notify('ra.notification.deleted', {
            type: 'info',
            messageArgs: {smart_count: 1},
            undoable: false,
          });
          unselect([record.id]);
          if (onSuccess) onSuccess();
        },
        onError: (error: unknown) => {
          if (error instanceof Error || typeof error === 'string') {
            const errorMessage = typeof error === 'string' ? error : error?.message;
            notify(
              typeof error === 'string' ? error : error.message || 'ra.notification.http_error',
              {
                type: 'error',
                messageArgs: {_: errorMessage},
              }
            );
          }
        },
      }
    );
  };

  const translateOptions = {
    name: record?.meta?.repr,
    id: record?.id,
  };

  return (
    <ActionButton
      color={color}
      icon={icon}
      onClick={handleClick}
      loading={isLoading}
      label={label}
      confirm={{title: confirmTitle, content: confirmContent, options: translateOptions}}
      {...rest}
    />
  );
};
