import React, {ReactNode} from 'react';

type SchemaTabPanelProps = {
  children: ReactNode;
  value: string;
  activeValue: string;
  index: number;
};

export const SchemaTabPanel = ({value, activeValue, children}: SchemaTabPanelProps) => {
  return <>{value === activeValue && children}</>;
};
