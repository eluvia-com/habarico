import React, {useEffect, useRef} from 'react';
import {BaseActionTriggerProps} from '@admin/components/buttons/types';
import {LinkTarget, openUrl} from '@foundation/utils/navigation';

export type LinkActionTriggerProps = {
  url: string;
  target?: LinkTarget;
} & BaseActionTriggerProps;

export const LinkActionTrigger = ({url, target = 'blank', onDone}: LinkActionTriggerProps) => {
  // Kept in a ref because the parent rebuilds its callback on every render: as an effect
  // dependency it would re-open the link each time.
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    // This runs on mount, with no click of its own — an unvalidated URL from the schema (or from
    // an action response, via SchemaResourceActionTrigger) would navigate unattended.
    openUrl(url, target);
    onDoneRef.current?.();
  }, [url, target]);

  return <></>;
};
