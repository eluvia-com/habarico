import {trim, truncate, upperFirst} from 'lodash-es';
import React, {ReactNode} from 'react';
import {RichText} from '@design/molecules/RichText';
import {hasRichText} from '@design/molecules/RichText';
import {REGEX} from '@foundation/utils/template';
import {DynamicTextContent} from './DynamicTextContent';

export type DynamicTextProps = {
  children: ReactNode;
  source?: string;
  options?: {upperFirst?: boolean; truncate?: boolean; trim?: boolean};
};

export const DynamicText = ({children, source, options}: DynamicTextProps) => {
  const sourceText = typeof children === 'string' ? children : '';

  if (!children || typeof children !== 'string') return children;

  const {
    truncate: shouldTruncate = false,
    upperFirst: shouldUpperFirst = true,
    trim: shouldTrim = true,
  } = options || {};

  const trimmedText = shouldTrim ? trim(sourceText) : sourceText;
  const truncatedText = shouldTruncate ? truncate(trimmedText) : trimmedText;

  const upperText = shouldUpperFirst ? upperFirst(truncatedText) : truncatedText;

  if (!sourceText.match(REGEX)) {
    if (hasRichText(upperText)) return <RichText text={upperText} />;
    return upperText;
  }
  return <DynamicTextContent source={source} text={upperText} />;
};
