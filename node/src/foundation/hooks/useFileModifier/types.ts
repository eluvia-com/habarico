/**
 * Transforms an image Data URI (e.g. resize / crop) and resolves to the new Data URI. Applied when
 * the picked file is stored into the field - see `applyFileModifier` in `@foundation/utils/file` -
 * so validation and the upload path both see the transformed bytes.
 */
export type FileModifier = (dataUrl: string) => Promise<string>;

/**
 * Factory that receives the selected `File` and returns a `FileModifier` for it, or `undefined` when
 * no transform applies. The output type of `useFileModifier`.
 */
export type BuildFileModifier = (file: File) => FileModifier | undefined;
