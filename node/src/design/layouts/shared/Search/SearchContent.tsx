import React, {useCallback} from 'react';
import {LayoutSearchResult} from '../../types';
import {SearchForm} from './SearchForm';
import {SearchResults} from './SearchResults';

export type SearchContentProps = {
  searchQuery?: string;
  onSearch?: (query: string) => void;
  searchResults?: LayoutSearchResult[];
  isLoading?: boolean;
  searchTitle?: string;
  notFoundTitle?: string;
  /** Closes the search overlay — invoked after a result is clicked. */
  onClose?: () => void;
};

/**
 * The configurable content of the search overlay: the search form and its results.
 * This is what the layout's `search` slot renders inside the fixed `SearchOverlay`;
 * the wrapping toggle / backdrop / slide are hardcoded in the layout.
 */
export const SearchContent = ({
  searchQuery,
  onSearch,
  searchResults,
  isLoading,
  searchTitle = 'Search',
  notFoundTitle = 'No results found',
  onClose,
}: SearchContentProps) => {
  const handleSearch = useCallback(
    (value: string) => {
      if (onSearch) onSearch(value);
    },
    [onSearch]
  );

  return (
    <>
      <SearchForm searchQuery={searchQuery} searchTitle={searchTitle} onSearch={handleSearch} />
      <SearchResults
        searchResults={searchResults}
        isLoading={isLoading}
        onClick={onClose}
        notFoundTitle={notFoundTitle}
      />
    </>
  );
};
