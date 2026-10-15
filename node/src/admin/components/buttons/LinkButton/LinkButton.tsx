import React from 'react';
import {RaRecord, useRecordContext} from 'react-admin';
import {ActionButton, ActionButtonProps} from '@admin/components/buttons/ActionButton';
import {useStrTemplate} from '@admin/hooks/useStrTemplate';
import {Icon, IconType} from '@design/atoms/Icon';
import {LinkTarget, getNavigationMode, openByMode, openUrl} from '@foundation/utils/navigation';

export type LinkButtonProps = ActionButtonProps & {
  url: string | ((record?: RaRecord) => string);
  target?: LinkTarget;
};

export const LinkButton = ({
  url: inUrl,
  target = 'blank',
  icon = <Icon icon={IconType.Link} />,
  ...rest
}: LinkButtonProps) => {
  const record = useRecordContext();
  const stringUrl = typeof inUrl === 'function' ? inUrl(record) : inUrl;
  const url = useStrTemplate(stringUrl) as string;

  const handleClick = async (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.stopPropagation();
    const navigationMode = getNavigationMode(e);
    if (openByMode(url, navigationMode)) return;
    openUrl(url, target);
  };
  return <ActionButton onClick={handleClick} icon={icon} {...rest} />;
};
