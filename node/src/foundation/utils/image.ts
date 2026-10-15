// Pure client-side image helpers (canvas / Data URI). No API, no upload — see
// `@foundation/utils/upload` for upload orchestration.

/**
 * Resizes a Data URI image to `resizeWidth` (keeping aspect ratio) and re-encodes it.
 * @param dataUrl base64-encoded Data URI
 * @param fileType output mime type (e.g. `image/jpeg`)
 * @param resizeWidth target width in px
 * @param quality output quality, 0–1
 */
export const resizeImage = (
  dataUrl: string,
  fileType: string,
  resizeWidth: number = 400,
  quality: number = 1
): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    quality = Math.max(Math.min(quality, 1), 0); // 0 <= quality <= 1

    const img = new Image(); // create an image

    // `onerror` is mandatory, not defensive: an undecodable source fires neither handler otherwise
    // and the promise would never settle, stalling the whole upload entry. Both handlers are
    // assigned before `src` so a source that settles on assignment is not missed.
    img.onerror = () => reject(new Error(`Failed to decode image (${fileType})`));

    img.onload = () => {
      const canvas = document.createElement('canvas'); //create a canvas

      // scale the image to resizeWidth and keep aspect ratio
      const scaleFactor = resizeWidth / img.width;
      canvas.width = resizeWidth;
      canvas.height = img.height * scaleFactor;

      // draw in canvas
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

      // get the base64-encoded Data URI from the resize image
      resolve(canvas.toDataURL(fileType, quality));
    };

    img.src = dataUrl; // result is base64-encoded Data URI
  });
};

/**
 * Crops a Data URI image to the given aspect ratio (centered) and re-encodes it.
 * @param dataUrl base64-encoded Data URI
 * @param fileType output mime type
 * @param aspectRatio target ratio, e.g. 1/1, 16/9
 */
export const cropImage = (
  dataUrl: string,
  fileType: string,
  aspectRatio: number = 1.0
): Promise<string> => {
  // we return a Promise that gets resolved with our canvas element
  return new Promise<string>((resolve, reject) => {
    // this image will hold our source image data
    const inputImage = new Image();

    // see `resizeImage`: without this the promise never settles on an undecodable source
    inputImage.onerror = () => reject(new Error(`Failed to decode image (${fileType})`));

    // we want to wait for our image to load
    inputImage.onload = () => {
      // let's store the width and height of our image
      const inputWidth = inputImage.naturalWidth;
      const inputHeight = inputImage.naturalHeight;

      // get the aspect ratio of the input image
      const inputImageAspectRatio = inputWidth / inputHeight;

      // if it's bigger than our target aspect ratio
      let outputWidth = inputWidth;
      let outputHeight = inputHeight;
      if (inputImageAspectRatio > aspectRatio) {
        outputWidth = inputHeight * aspectRatio;
      } else if (inputImageAspectRatio < aspectRatio) {
        outputHeight = inputWidth / aspectRatio;
      }

      // calculate the position to draw the image at
      const outputX = (outputWidth - inputWidth) * 0.5;
      const outputY = (outputHeight - inputHeight) * 0.5;

      // create a canvas that will present the output image
      const outputImage = document.createElement('canvas');

      // set it to the same size as the image
      outputImage.width = outputWidth;
      outputImage.height = outputHeight;

      // draw our image at position 0, 0 on the canvas
      const ctx = outputImage.getContext('2d');
      ctx?.drawImage(inputImage, outputX, outputY);

      resolve(outputImage.toDataURL(fileType));
    };

    // start loading our image
    inputImage.src = dataUrl;
  });
};

// Splits a Data URI into its mime type, file extension and raw base64 payload.
export const parseImageDataUrl = (dataUrl: string) => {
  // Get file type and base64 from dataUrl
  const [prefix, base64] = dataUrl.split(';base64,');
  const fileType = prefix.split(':')[1];

  // Parse extension from file type
  let extension;
  switch (fileType) {
    case 'image/png':
      extension = 'png';
      break;
    case 'image/jpeg':
      extension = 'jpg';
      break;
    case 'image/webp':
      extension = 'webp';
      break;
  }

  return {fileType, extension, base64};
};
