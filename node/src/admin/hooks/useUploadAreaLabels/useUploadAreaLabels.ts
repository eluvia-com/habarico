import {useTranslate} from 'react-admin';
import type {UploadAreaLabels} from '@design/organisms/UploadArea';

/**
 * Builds the design `UploadArea` i18n contract from React Admin's `ra.upload_images.*` translations.
 * The single admin-layer bridge between the RA locale and the schema-free design labels — shared by
 * `UploadInput` and `SchemaUploadImagesButton` so the mapping lives in one place.
 */
export const useUploadAreaLabels = (): UploadAreaLabels => {
  const translate = useTranslate();
  return {
    clickToUpload: translate('ra.upload_images.click_to_upload'),
    orDragAndDrop: translate('ra.upload_images.or_drag_and_drop'),
    removeAll: translate('ra.upload_images.remove_all'),
    filesRemainingHint: (count) => translate('ra.upload_images.files_remaining_hint', {count}),
    maxFileSizeHint: (size) => `max. ${size}`,
    uploading: translate('ra.upload_images.uploading'),
    processing: translate('ra.upload_images.processing'),
    uploadComplete: translate('ra.upload_images.upload_complete'),
    tryAgain: translate('ra.upload_images.try_again'),
  };
};
