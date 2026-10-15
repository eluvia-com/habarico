import React, {useCallback, useMemo, useRef, useState} from 'react';
import {UploadingContext} from './useUploadingContext';

export const UploadingProvider = ({children}: {children: React.ReactNode}) => {
  const [isUploading, setIsUploading] = useState(false);
  const countsRef = useRef(new Map<string, number>());

  const registerUploading = useCallback((id: string, count: number) => {
    if (count === 0) {
      countsRef.current.delete(id);
    } else {
      countsRef.current.set(id, count);
    }
    setIsUploading(countsRef.current.size > 0);
  }, []);

  // Memoized: a fresh value object per render invalidates the context for every upload input in
  // the form whenever this provider's parent re-renders, regardless of whether anything changed.
  const value = useMemo(() => ({registerUploading, isUploading}), [registerUploading, isUploading]);

  return <UploadingContext.Provider value={value}>{children}</UploadingContext.Provider>;
};
