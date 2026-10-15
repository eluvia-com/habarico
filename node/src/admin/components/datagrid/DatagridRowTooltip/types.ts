import {ReactNode} from 'react';
import {RaRecord} from 'react-admin';

export type DatagridTooltipFn = (record: RaRecord) => ReactNode;
