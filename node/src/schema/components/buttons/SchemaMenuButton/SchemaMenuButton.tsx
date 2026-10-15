import React, {useState} from 'react';
import {ActionButton, ActionButtonProps} from '@admin/components/buttons/ActionButton';
import {Icon, IconType} from '@design/atoms/Icon';
import {Menu} from '@mui/material';
import {useLocalResourceSchemaContext} from '@schema/contexts/LocalResourceSchemaContext/useLocalResourceSchemaContext';
import {useHabRecordContext} from '@schema/hooks/useHabRecordContext';
import {ActionDescriptor, HabRecord} from '@schema/types';
import {generateActionSchema, generateActionSchemaMap} from '@schema/utils/api';
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

// Whether a descriptor resolves to a real action (directly, or via any of its nested menu items).
const isValidDescriptor = (
  descriptor: ActionDescriptor,
  schemaMap: ReturnType<typeof generateActionSchemaMap>
): boolean => {
  if (descriptor.menuItems) {
    return descriptor.menuItems.some((item) => isValidDescriptor(item, schemaMap));
  }
  return !!(descriptor.action || schemaMap[descriptor.name]);
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
  const contextRecord = useHabRecordContext();
  const {schema} = useLocalResourceSchemaContext();
  const record = propRecord || contextRecord;

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const variantFn = asResolver(variant);
  const showLabelFn = asResolver(showLabel);
  const actions = record ? record.meta.schema.actions : schema.actions;

  if (!actions || !descriptor.menuItems) return;

  // --------------------------------------------------------------------------
  // Get valid action descriptors
  // --------------------------------------------------------------------------
  const schemaMap = generateActionSchemaMap(actions);
  const actionDescriptors = descriptor.menuItems;

  if (!actionDescriptors.length) return;

  const validDescriptors = actionDescriptors.filter((descriptor) =>
    isValidDescriptor(descriptor, schemaMap)
  );

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

  const renderButton = (descriptor: ActionDescriptor, index: number) => {
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

    const schema = descriptor.action || schemaMap[descriptor.name];
    if (!schema) return;

    return (
      <SchemaButton
        {...rest}
        variant={variantFn(descriptor.name)}
        showLabel={showLabelFn(descriptor.name)}
        schema={generateActionSchema(schema, descriptor)}
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
        {validDescriptors.map((descriptor, index) => renderButton(descriptor, index))}
      </Menu>
    </>
  );
};
