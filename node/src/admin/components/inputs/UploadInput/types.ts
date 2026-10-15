// React Admin form value shape for a file field. The `UploadInput` maps between this and the
// queue's `UploadEntry[]`. A backend-loaded value carries `filename` / `url` / `content`; a freshly
// picked file carries `rawFile` until it is uploaded.
export type FileData = {
  rawFile?: File;
  url?: string;
  filename?: string;
  content?: string;
};
