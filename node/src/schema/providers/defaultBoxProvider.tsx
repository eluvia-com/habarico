import React from 'react';
import {SchemaArrayBox} from '@schema/components/boxes/SchemaArrayBox';
import {SchemaChoicesArrayBox} from '@schema/components/boxes/SchemaChoicesArrayBox';
import {SchemaGalleryBox} from '@schema/components/boxes/SchemaGalleryBox';
import {SchemaGridBox} from '@schema/components/boxes/SchemaGridBox';
import {SchemaListBox} from '@schema/components/boxes/SchemaListBox';
import {SchemaObjectBox} from '@schema/components/boxes/SchemaObjectBox';
import {SchemaSimpleBox} from '@schema/components/boxes/SchemaSimpleBox';
import {SchemaTabBox} from '@schema/components/boxes/SchemaTabBox';
import {SchemaWizardBox} from '@schema/components/boxes/SchemaWizardBox';
import {AdminBoxProviderProps} from '@schema/providers/types';

export const defaultBoxProvider = ({schema, excludeFields, props}: AdminBoxProviderProps) => {
  switch (schema.type) {
    case 'list':
      return <SchemaListBox {...props} />;
    case 'gallery':
      return <SchemaGalleryBox {...props} />;
    case 'object':
      return <SchemaObjectBox {...props} />;
    case 'array':
      if (schema.array?.listed) {
        return <SchemaChoicesArrayBox {...props} />;
      }
      return <SchemaArrayBox {...props} />;
    case 'grid':
      return <SchemaGridBox excludeFields={excludeFields} {...props} />;
    case 'tab':
      return <SchemaTabBox excludeFields={excludeFields} {...props} />;
    case 'wizard':
      return <SchemaWizardBox excludeFields={excludeFields} {...props} />;
    default:
      return <SchemaSimpleBox excludeFields={excludeFields} {...props} />;
  }
};
