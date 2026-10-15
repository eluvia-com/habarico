import React, {useState} from 'react';
import {useTranslate} from 'react-admin';
import {useConfirm} from '@design/hooks/useConfirm';
import {Menu, MenuItem} from '@mui/material';
import {ActionButton, ActionButtonConfirm, ActionButtonProps} from './ActionButton';

/** A single choice offered by {@link ActionButtonWithChoices}; schema-free (replaces `ActionViewChoice`). */
export type ActionChoice = {
  label: string;
  value?: unknown;
};

export type ActionButtonWithChoicesProps = Omit<ActionButtonProps, 'onClick' | 'to' | 'confirm'> & {
  /** Choices rendered in the dropdown menu. Renders nothing when empty. */
  choices: ActionChoice[];
  /** Invoked with the picked choice (after confirmation when `confirm` is set). */
  onSelect: (event: React.MouseEvent<HTMLElement>, choice: ActionChoice) => void;
  /** Optional per-choice confirmation dialog. */
  confirm?: ActionButtonConfirm;
};

/**
 * A trigger button that opens a menu of {@link ActionChoice}s. Replaces `BaseButtonWithChoices`:
 * schema-free (its own `ActionChoice` instead of `@schema` `ActionViewChoice`) and using the design
 * `useConfirm` for the optional per-choice confirmation.
 */
export const ActionButtonWithChoices = ({
  choices,
  onSelect,
  confirm,
  icon,
  ...rest
}: ActionButtonWithChoicesProps) => {
  const translate = useTranslate();
  const {confirm: openConfirm, dialog} = useConfirm();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const isOpen = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);

  const handleSelect = (event: React.MouseEvent<HTMLElement>, choice: ActionChoice) => {
    setAnchorEl(null);
    if (confirm) {
      openConfirm({
        title: translate(confirm.title, {...confirm.options, _: confirm.title}),
        content: translate(confirm.content, {...confirm.options, _: confirm.content}),
        confirmLabel: translate('ra.action.confirm', {_: 'Confirm'}),
        cancelLabel: translate('ra.action.cancel', {_: 'Cancel'}),
        onConfirm: () => onSelect(event, choice),
      });
    } else {
      onSelect(event, choice);
    }
  };

  if (choices.length === 0) return null;

  return (
    <>
      <ActionButton {...rest} icon={icon} onClick={handleOpen} />
      <Menu anchorEl={anchorEl} open={isOpen} onClose={handleClose}>
        {choices.map((choice, index) => (
          <MenuItem key={index} disableRipple onClick={(event) => handleSelect(event, choice)}>
            {choice.label}
          </MenuItem>
        ))}
      </Menu>
      {dialog}
    </>
  );
};
