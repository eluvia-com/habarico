import React, {useEffect, useState} from 'react';
import {useInfinitePaginationContext, useListContext, useTranslate} from 'react-admin';
import {Gallery, type GalleryImage} from '@design/organisms/Gallery';

type SchemaGalleryContentProps = {
  imageField: string;
};

type ImageFile = {url: string; filename?: string};

/**
 * Renders the box's image records through the design-layer `Gallery` organism (arrows, dots,
 * loading overlay and the click-to-open lightbox are all built in). Backend pages load lazily via
 * the React Admin infinite-list context: `total` lets the gallery navigate past the slides loaded so
 * far, and reaching an as-yet-unloaded slide fetches the next page.
 */
export const SchemaGalleryContent = ({imageField}: SchemaGalleryContentProps) => {
  const {data, isPending, total} = useListContext();
  const {fetchNextPage, hasNextPage, isFetchingNextPage} = useInfinitePaginationContext();
  const translate = useTranslate();
  const [index, setIndex] = useState(0);

  const images: GalleryImage[] = (data ?? [])
    .map((record) => record[imageField] as ImageFile | undefined)
    .filter((file): file is ImageFile => !!file?.url)
    .map((file) => ({url: file.url, alt: file.filename || ''}));

  const effectiveTotal = total ?? images.length;

  // Reaching a slide beyond the loaded page pulls the next page in.
  useEffect(() => {
    if (index >= images.length && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [index, images.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <Gallery
      images={images}
      total={effectiveTotal}
      index={index}
      onIndexChange={setIndex}
      loading={isPending}
      slideLoading={isFetchingNextPage}
      emptyMessage={translate('ra.gallery.no_photos')}
    />
  );
};
