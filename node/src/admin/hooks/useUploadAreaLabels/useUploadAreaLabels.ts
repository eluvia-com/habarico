import {useTranslate} from 'react-admin';
import type {UploadAreaLabels} from '@design/organisms/UploadArea';

/**
 * Builds the design `UploadArea` i18n contract from React Admin's `ra.upload_files.*` translations.
 * The single admin-layer bridge between the RA locale and the schema-free design labels — shared by
 * `UploadInput` and `SchemaUploadFilesButton` so the mapping lives in one place.
 */
export const useUploadAreaLabels = (): UploadAreaLabels => {
  const translate = useTranslate();
  return {
    clickToUpload: translate('ra.upload_files.click_to_upload'),
    orDragAndDrop: translate('ra.upload_files.or_drag_and_drop'),
    removeAll: translate('ra.upload_files.remove_all'),
    filesRemainingHint: (count) => translate('ra.upload_files.files_remaining_hint', {count}),
    maxFileSizeHint: (size) => `max. ${size}`,
    uploading: translate('ra.upload_files.uploading'),
    processing: translate('ra.upload_files.processing'),
    uploadComplete: translate('ra.upload_files.upload_complete'),
    tryAgain: translate('ra.upload_files.try_again'),
  };
};
