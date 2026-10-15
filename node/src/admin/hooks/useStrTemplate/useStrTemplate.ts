import {ReactElement} from 'react';
import {useRecordContext} from 'react-admin';
import {useTemplateFormData} from '@admin/hooks/useTemplateFormData';
import {templateToStr} from '@foundation/utils/template';

export const useStrTemplate = (
  text?: string | ReactElement | false,
  options?: {upperFirst?: boolean; truncate?: boolean}
) => {
  const sourceText = typeof text === 'string' ? text : '';
  const formData = useTemplateFormData(sourceText);
  const record = useRecordContext();

  if (!text || typeof text !== 'string') return text;

  const templateData = {
    formData,
    record,
    data: formData || record,
  };

  return templateToStr(text, templateData, options);
};
