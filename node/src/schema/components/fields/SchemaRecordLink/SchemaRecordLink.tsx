import React from 'react';
import {recordLinkResetSx} from '@admin/components/fields/recordLinkSx';
import {ViewPresentation} from '@admin/contexts/ViewPresentationContext';
import {useRecordLink} from '@admin/hooks/useRecordLink';
import {Button} from '@mui/material';
import {useSchemaRecordLinkOptions} from '@schema/hooks/useSchemaRecordLinkOptions';

export type SchemaRecordLinkProps = {
  link?: boolean | 'show' | 'edit';
  keepLinkedParent?: boolean;
  linkMode?: ViewPresentation;
  dialogWidth?: string;
  children?: React.ReactNode;
};

export const SchemaRecordLink = ({
  link = true,
  keepLinkedParent = false,
  linkMode,
  dialogWidth,
  children,
}: SchemaRecordLinkProps) => {
  const {handleClick, dialog} = useRecordLink({
    ...useSchemaRecordLinkOptions({link, linkMode}),
    keepLinkedParent,
    dialogWidth,
  });

  if (!handleClick) {
    return children;
  }
  return (
    <>
      {dialog}
      <Button variant="text" onClick={handleClick} sx={recordLinkResetSx} disableRipple>
        {children}
      </Button>
    </>
  );
};
