import React, {useState} from 'react';
import {RaRecord, RecordContextProvider} from 'react-admin';
import {Grid, Typography} from '@mui/material';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {DraggableImagePanel} from './DraggableImagePanel';

/** Stable placeholder images, one per demo record. */
const SAMPLE_SRC = (seed: string) => `https://picsum.photos/seed/habarico-${seed}/400/400`;

type DemoRecord = RaRecord & {name: string};

const INITIAL_RECORDS: DemoRecord[] = [
  {id: 1, name: 'Alpha'},
  {id: 2, name: 'Bravo'},
  {id: 3, name: 'Charlie'},
  {id: 4, name: 'Delta'},
];

// The ancestor class handleDrag walks up to on both ends of a drag — mirrors SchemaImages'
// `SchemaImages-item`, the class it passes as `itemClassName`.
const ITEM_CLASS = 'DraggableImagePanelStory-item';

/**
 * Reorderable grid of image panels, composed the same way `SchemaImages` composes
 * `DraggableImagePanel`: a MUI `Grid container` (drag lookup walks up to `.MuiGrid-container`), one
 * `itemClassName`-tagged `Grid` item per record, each wrapping a `RecordContextProvider`. Reordering
 * updates local state so the story is a real drop target, not a static render.
 */
const DraggableImagePanelStory = () => {
  const [records, setRecords] = useState(INITIAL_RECORDS);

  const handleDropRow = (record: RaRecord, index: number) => {
    setRecords((current) => {
      const from = current.findIndex((r) => r.id === record.id);
      if (from === -1) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      return next;
    });
  };

  return (
    <Grid container spacing={2} sx={{width: 560}}>
      {records.map((record, index) => (
        <Grid size={6} key={record.id} className={ITEM_CLASS}>
          <RecordContextProvider value={record}>
            <DraggableImagePanel
              src={SAMPLE_SRC(String(record.id))}
              draggable
              onDropRow={handleDropRow}
              itemClassName={ITEM_CLASS}
              index={index}
              variant="outlined"
            >
              <Typography variant="body2" sx={{p: 1}}>
                {record.name}
              </Typography>
            </DraggableImagePanel>
          </RecordContextProvider>
        </Grid>
      ))}
    </Grid>
  );
};

const meta = {
  title: 'admin/common/DraggableImagePanel',
  component: DraggableImagePanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Drag-reorder wrapper around the design-layer `ImagePanel`, used by `SchemaImages` to let ' +
          'a user reorder image tiles by drag-and-drop: drag one tile onto another to swap its ' +
          'position, calling `onDropRow` with the moved record and its new index. Only reads the ' +
          'ambient `RecordContext` — no data provider or i18n context required, unlike the schema ' +
          'components that compose it.',
      },
      // `render` returns the local `DraggableImagePanelStory` helper (the grid of tiles + reorder
      // state) — "Show code" would otherwise show that helper's tag. It's rendered once per record
      // (four tiles in this story), so the override shows the actual `.map()` composition rather
      // than a single instance — a lone `<DraggableImagePanel>` in the snippet next to four
      // rendered tiles would read as though it multiplies itself.
      source: {
        code: `<Grid container>
  {records.map((record, index) => (
    <Grid key={record.id} className="SchemaImages-item">
      <RecordContextProvider value={record}>
        <DraggableImagePanel
          src={record.imageUrl}
          draggable
          onDropRow={handleDropRow}
          itemClassName="SchemaImages-item"
          index={index}
        />
      </RecordContextProvider>
    </Grid>
  ))}
</Grid>`,
      },
    },
    controls: {include: []},
  },
} satisfies Meta<typeof DraggableImagePanel>;

export default meta;
type Story = StoryObj<typeof DraggableImagePanel>;

/** Drag any tile onto another (mouse or touch) to reorder the grid. */
export const Default: Story = {
  // `_args`: a zero-arity `render` makes Storybook skip `controls.include` filtering entirely
  // (falls back to the full inferred table) — here that table is meant to stay empty.
  render: (_args) => <DraggableImagePanelStory />,
};
