import React from 'react';
import {useTranslate} from 'react-admin';
import {Icon, IconType} from '@design/atoms/Icon';
import {Button} from '@mui/material';

export type NextButtonProps = {
  onClick: () => void;
  disabled?: boolean;
};

// "Next" step-navigation button shared by the tab and wizard step-nav bars (rendered in a
// `SectionFooter`). Drives step navigation — not box actions — so it lives with the shared admin
// building blocks rather than the box header/footer action buttons.
export const NextButton = ({onClick, disabled}: NextButtonProps) => {
  const translate = useTranslate();
  return (
    <Button
      variant="contained"
      color="primary"
      disabled={disabled}
      onClick={onClick}
      size="medium"
      endIcon={<Icon icon={IconType.NavigateNext} />}
    >
      {translate('ra.action.next')}
    </Button>
  );
};
