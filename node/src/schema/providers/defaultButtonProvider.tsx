import React from 'react';
import {LinkButton} from '@admin/components/buttons/LinkButton';
import {SaveButton} from '@admin/components/buttons/SaveButton';
import {ExportButton} from '@schema/components/buttons/ExportButton';
import {ResourceButton} from '@schema/components/buttons/ResourceButton';
import {SchemaUploadFilesButton} from '@schema/components/buttons/SchemaUploadFilesButton';
import {SchemaViewButton} from '@schema/components/buttons/SchemaViewButton';
import {AdminButtonProviderProps} from '@schema/providers/types';

export const defaultButtonProvider = ({
  schema,
  viewSchema,
  reference,
  target,
  recordPk,
  props,
}: AdminButtonProviderProps) => {
  switch (schema.type) {
    case 'view':
      if (viewSchema && schema.view)
        return (
          <SchemaViewButton
            viewType={viewSchema.type}
            viewName={viewSchema.name}
            choices={schema.view.choices}
            target={target}
            keepLinkedParent={schema.view.keepLinkedParent}
            recordPk={schema.view.reference?.recordPk || recordPk}
            mode={schema.view.mode}
            dialogWidth={schema.view.dialogWidth}
            reference={reference}
            actionName={schema.view.reference?.actionName}
            params={schema.view.parameters}
            {...props}
          />
        );

      return;
    case 'resource':
      if (schema.resource)
        return (
          <ResourceButton
            isBackground={schema.resource.isBackground}
            endpoint={schema.resource.endpoint}
            data={schema.resource.data}
            recordPk={recordPk}
            reference={reference}
            {...props}
          />
        );
      return;
    case 'link':
      if (schema.link)
        return <LinkButton url={schema.link.url} target={schema.link.target} {...props} />;
      return;
    case 'save':
      return <SaveButton data={schema.save?.data} {...props} />;
    case 'upload-files':
      return <SchemaUploadFilesButton uploadFiles={schema.uploadFiles} {...props} />;
    case 'export':
      return (
        <ExportButton format={schema.export?.format} fields={schema.export?.fields} {...props} />
      );
  }
};
