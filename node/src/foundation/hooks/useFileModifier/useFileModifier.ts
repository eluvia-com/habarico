import {useCallback} from 'react';
import {cropImage, resizeImage} from '@foundation/utils/image';
import {BuildFileModifier} from './types';

/**
 * Builds a `BuildFileModifier` that resizes and/or crops a selected image as it is stored into the
 * field, before it is validated or uploaded. Returns a no-op factory (yielding `undefined`) when
 * neither `resizeWidth` nor `cropAspectRatio` is set. Pure foundation hook — no React Admin, no
 * schema.
 */
export const useFileModifier = (
  resizeWidth: number | undefined,
  cropAspectRatio: number | undefined
): BuildFileModifier => {
  return useCallback<BuildFileModifier>(
    (file) => {
      if (!resizeWidth && !cropAspectRatio) return undefined;
      // Resize/crop is a canvas operation, so a non-image file has nothing to transform. Bailing
      // out here also keeps the error honest: the file falls through to the `accept` validation,
      // which names the real problem (wrong type) instead of reporting a decode failure.
      if (!file.type.startsWith('image/')) return undefined;
      return async (dataUrl) => {
        let result = dataUrl;
        if (resizeWidth) result = await resizeImage(result, file.type, resizeWidth);
        if (cropAspectRatio) result = await cropImage(result, file.type, cropAspectRatio);
        return result;
      };
    },
    [resizeWidth, cropAspectRatio]
  );
};
