import clsx from 'clsx';
import {useExpandAll, useResourceContext, useTranslate} from 'ra-core';
import * as React from 'react';
import {memo} from 'react';
import {DatagridClasses} from 'react-admin';
import {Icon, IconType} from '@design/atoms/Icon';
import IconButton from '@mui/material/IconButton';

interface ExpandAllButtonProps {
  ids: string[] | number[];
  classes?: Record<string, string>;
}

const ExpandAllButton = ({ids, classes = DatagridClasses}: ExpandAllButtonProps) => {
  const translate = useTranslate();
  const resource = useResourceContext();
  const [expanded, toggleExpanded] = useExpandAll(resource || '', ids);

  if (!resource) return null;
  return (
    <IconButton
      className={clsx(classes.expandIcon, {
        [classes.expanded]: expanded,
      })}
      aria-label={translate(expanded ? 'ra.action.close' : 'ra.action.expand')}
      aria-expanded={expanded}
      tabIndex={-1}
      aria-hidden="true"
      onClick={toggleExpanded}
      size="small"
    >
      <Icon icon={IconType.ExpandMore} fontSize="inherit" />
    </IconButton>
  );
};

export default memo(ExpandAllButton);
