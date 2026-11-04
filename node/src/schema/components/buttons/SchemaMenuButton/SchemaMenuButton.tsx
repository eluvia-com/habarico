import React, {useState} from 'react';
import {ActionButton, ActionButtonProps} from '@admin/components/buttons/ActionButton';
import {Icon, IconType} from '@design/atoms/Icon';
import {Menu} from '@mui/material';
import {ResolvedDescriptor, useResolvedDescriptors} from '@schema/hooks/useResolvedDescriptors';
import {ActionDescriptor, HabRecord} from '@schema/types';
import {SchemaButton} from '../SchemaButton';

type ButtonVariant = ActionButtonProps['variant'];

export type SchemaMenuButtonProps = Omit<ActionButtonProps, 'variant' | 'showLabel'> & {
  record?: HabRecord;
  variant?: ButtonVariant | ((name: string) => ButtonVariant);
  showLabel?: boolean | ((name: string) => boolean);
  descriptor: ActionDescriptor;
  target?: string;
  // Whether this menu-button trigger is itself rendered inside a parent menu (then it is a menu item).
  isMenu?: boolean;
};

// Normalize a value-or-resolver prop (`variant` / `showLabel`) into a per-action resolver function.
const asResolver = <T,>(value: T | ((name: string) => T)): ((name: string) => T) =>
  typeof value === 'function' ? (value as (name: string) => T) : () => value;

export const SchemaMenuButton = (props: SchemaMenuButtonProps) => {
  const {
    record: propRecord,
    descriptor,
    variant,
    showLabel,
    target,
    label,
    isMenu,
    surface,
    ...rest
  } = props;
  const {record, actions, resolvedDescriptors} = useResolvedDescriptors({
    descriptors: descriptor.menuItems,
    record: propRecord,
  });

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const variantFn = asResolver(variant);
  const showLabelFn = asResolver(showLabel);
  // a menu item still loading its referenced schema is left out until it resolves
  if (!actions || !resolvedDescriptors.length) return;

  // -------------------------------------------------------------------------
  // Menu actions
  // -------------------------------------------------------------------------

  const handleClickButton = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const isOpen = Boolean(anchorEl);

  // --------------------------------------------------------------------------
  // Render buttons
  // --------------------------------------------------------------------------

  const renderButton = ({descriptor, schema, actionContext}: ResolvedDescriptor, index: number) => {
    if (descriptor.menuItems) {
      return (
        <SchemaMenuButton
          {...rest}
          key={index}
          label={descriptor.label}
          target={target}
          descriptor={descriptor}
          showLabel={showLabel}
          variant={variant}
          isMenu={true}
          record={record}
        />
      );
    }

    return (
      <SchemaButton
        {...rest}
        variant={variantFn(descriptor.name)}
        showLabel={showLabelFn(descriptor.name)}
        schema={schema}
        actionContext={actionContext}
        key={index}
        target={target}
        isMenu={true}
      />
    );
  };

  const icon = descriptor.icon ? (
    <Icon icon={descriptor.icon as IconType} />
  ) : (
    <Icon icon={IconType.MoreVert} />
  );

  return (
    <>
      <ActionButton
        {...rest}
        label={label}
        onClick={handleClickButton}
        variant={variantFn(descriptor.name)}
        showLabel={showLabelFn(descriptor.name)}
        color={descriptor.color || 'inherit'}
        icon={icon}
        // Nested inside a parent menu → a `menuItem`; otherwise honour an explicit `surface`
        // override (datagrid row actions render the split-menu trigger as `iconButton`).
        surface={isMenu ? 'menuItem' : (surface ?? 'button')}
      />
      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
        anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
        transformOrigin={{vertical: 'top', horizontal: 'left'}}
      >
        {resolvedDescriptors.map((resolvedDescriptor, index) =>
          renderButton(resolvedDescriptor, index)
        )}
      </Menu>
    </>
  );
};
