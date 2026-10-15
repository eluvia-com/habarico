import {createContext, useContext} from 'react';

export type UploadingContextValue = {
  registerUploading: (id: string, count: number) => void;
  isUploading: boolean;
};

export const UploadingContext = createContext<UploadingContextValue | null>(null);

export const useUploadingContext = () => useContext(UploadingContext);
