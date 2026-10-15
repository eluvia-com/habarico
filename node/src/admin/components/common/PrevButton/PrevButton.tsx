import React from 'react';
import {useTranslate} from 'react-admin';
import {Icon, IconType} from '@design/atoms/Icon';
import {Button} from '@mui/material';

export type PrevButtonProps = {
  onClick: () => void;
  disabled?: boolean;
};

// "Previous" step-navigation button shared by the tab and wizard step-nav bars (rendered in a
// `SectionFooter`). Drives step navigation — not box actions — so it lives with the shared admin
// building blocks rather than the box header/footer action buttons.
export const PrevButton = ({onClick, disabled}: PrevButtonProps) => {
  const translate = useTranslate();
  return (
    <Button
      variant="outlined"
      disabled={disabled}
      onClick={onClick}
      size="medium"
      startIcon={<Icon icon={IconType.NavigateBefore} />}
    >
      {translate('ra.action.prev')}
    </Button>
  );
};
