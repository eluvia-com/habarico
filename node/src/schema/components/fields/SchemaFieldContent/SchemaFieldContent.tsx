import React, {ReactElement} from 'react';
import {Labeled} from 'react-admin';
import {DynamicText} from '@admin/components/common/DynamicText';
import {FieldProps} from '@admin/components/fields/types';
import {useFieldHighlight} from '@admin/hooks/useFieldHighlight';
import {isSelfHighlightingField} from '@admin/utils/highlight';
import {useValueLocationContext} from '@design/contexts/ValueLocationContext';
import {HIGHLIGHT_SX} from '@design/molecules/RichText';
import {Box, styled} from '@mui/material';
import {FieldSchemaProvider} from '@schema/contexts/FieldSchemaContext';
import {FieldSchema} from '@schema/types';

const ListRoot = styled('div')(({theme}) => ({
  '& del': {
    color: theme.palette.error.main,
  },

  '& ins': {
    color: theme.palette.success.main,
  },
}));

const DetailRoot = styled(ListRoot)(() => ({
  display: 'block',
  paddingTop: '8px',
  paddingBottom: '8px',
}));

export type SchemaFieldContentProps = FieldProps & {
  schema: FieldSchema;
  showLabel?: boolean;
  children: ReactElement<FieldProps>;
};

export const SchemaFieldContent = ({
  schema,
  children,
  showLabel = true,
  source,
}: SchemaFieldContentProps) => {
  const {isInCollection, isNested} = useValueLocationContext();
  const highlight = useFieldHighlight(source);
  // Bare mode (`showLabel={false}`, e.g. a value slot in a PropertyItem) drops the tall
  // detail chrome (block padding + the input-matching min-height) so a read value sits
  // compactly next to its label, exactly like a collection/nested value.
  const compact = isInCollection || isNested || !showLabel;
  const Root = compact ? ListRoot : DetailRoot;

  const {textAlign = 'left', label} = children.props;

  // Fields tagged `selfHighlights` render the match inline themselves (TextField via <mark>,
  // NumberField via offset-mapped digit markers). Everything else is flagged at the whole-cell
  // level here, since the FE reformats its value so the raw match position is moot.
  const highlighted = !!highlight && !isSelfHighlightingField(children.type);

  const sx = {
    textAlign: textAlign,
    ...(compact
      ? {}
      : {
          minHeight: '78px', // Keep the same height like input fields
        }),
  };

  // Inline mark hugging the rendered value, so the highlight does not stretch across the whole
  // cell (short values, e.g. emails) nor cover field decorations that live outside the value.
  const content = highlighted ? (
    <Box component="mark" sx={HIGHLIGHT_SX}>
      {children}
    </Box>
  ) : (
    children
  );

  return (
    <Root sx={sx}>
      <FieldSchemaProvider schema={schema}>
        {showLabel && label && !schema.targetSource ? (
          <Labeled label={<DynamicText>{label}</DynamicText>} fullWidth>
            {content}
          </Labeled>
        ) : (
          content
        )}
      </FieldSchemaProvider>
    </Root>
  );
};
