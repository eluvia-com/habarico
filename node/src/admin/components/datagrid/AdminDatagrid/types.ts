import {RaRecord} from 'react-admin';

export type WidthMap = Record<string, number>;

export type IndexedRecord = RaRecord & {index?: number};
