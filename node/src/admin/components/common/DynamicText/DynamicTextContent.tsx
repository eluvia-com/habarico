import {get} from 'lodash-es';
import React from 'react';
import {useRecordContext} from 'react-admin';
import {useIcons} from '@admin/contexts/AdminConfigContext';
import {useTemplateFormData} from '@admin/hooks/useTemplateFormData';
import {RichText} from '@design/molecules/RichText';
import {REGEX} from '@foundation/utils/template';

export type DynamicTextContentProps = {
  text: string;
  source?: string;
};

/**
 * Renders a template string. In a form the `%{formData.*}` / `%{data.*}` placeholders track the
 * form's live values; outside one (a show view, a plain page) they fall back to the record.
 */
export const DynamicTextContent = ({text, source}: DynamicTextContentProps) => {
  const formData = useTemplateFormData(text);
  const record = useRecordContext();
  const {iconsMap} = useIcons();

  const data = formData || record;

  const sourceForData = source && formData ? get(formData, source) : formData;
  const sourceRecord = source ? get(record, source) : record;
  const sourceData = source ? get(data, source) : data;

  const templateData = {
    formData: sourceForData,
    record: sourceRecord,
    data: sourceData,
    icons: iconsMap,
  };

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  let match: RegExpExecArray | null;

  while ((match = REGEX.exec(text)) !== null) {
    const [placeholder, path] = match;
    const index = match.index;

    // Push text before the placeholder
    if (lastIndex < index) {
      parts.push(text.slice(lastIndex, index));
    }

    const val = get(templateData, path) || '';

    parts.push(val);
    lastIndex = index + placeholder.length;
  }

  // Push the rest of the string
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return (
    <>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {typeof part === 'string' ? <RichText text={part} /> : part}
        </React.Fragment>
      ))}
    </>
  );
};
