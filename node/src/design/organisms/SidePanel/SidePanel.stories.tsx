import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Box, Card} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../_storyKit';
import {PanelContent} from '../../molecules/PanelContent';
import {PanelHeader} from '../../molecules/PanelHeader';
import {PropertyItem} from '../../molecules/PropertyItem';
import {PropertyList} from '../../molecules/PropertyList';
import {SidePanel} from './SidePanel';

// A dummy record the panel previews — mirrors the docked detail panel a list opens beside its grid.
const PROPERTY = {
  type: 'Flat',
  address: 'Kyjovská 578/13, Prague – Michle',
  layout: '2 + 1',
  area: '52 m²',
  owner: 'Jiří Daněk',
  involvement: 'let / manage',
  unitNumber: '578/13',
  floor: '3',
  floorCount: '6',
  heating: 'District',
  barrierFree: 'No',
  residential: 'Yes',
  status: 'Active',
  note: 'Long-term tenant since 2019; service charges settled quarterly. Balcony faces the courtyard.',
};

const meta: Meta<typeof SidePanel> = {
  title: 'design/organisms/SidePanel',
  component: SidePanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A docked side-panel shell rendered beside a datagrid (a list’s inline detail preview): a ' +
          'transparent, lightly-padded box wrapping a `nested` `Panel`, with an absolutely-positioned ' +
          'close button pinned to the top-right. Presentational only — compose `PanelHeader` / ' +
          '`PanelContent` inside and let the host own `onClose` and the width. Pass `onResizeStart` to ' +
          'show a left-edge drag handle (the host owns the resize behaviour and the resulting width). ' +
          'For a floating, backdrop-dimmed panel use `InspectorPanel` instead.',
      },
    },
    // Every prop is either required composition (`children`) or a callback with nothing visual to
    // toggle (`onClose`, `onResizeStart` — both need a real handler wired up below to do anything
    // at all; a Controls row for either would never reflect a change). Nothing here is sensibly
    // control-able, so the panel honestly shows an empty Controls table instead of one that lies.
    controls: {include: []},
  },
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof SidePanel>;

// Hooks-free-at-the-tag demo kept in a top-level component (not a render arrow) per the story
// standard. The fixed-height flex row stands in for the list surface: a placeholder datagrid on the
// left, the `SidePanel` beside it. A local pointer-drag stands in for the host resize hook so the
// left-edge handle actually resizes the panel; the panel stretches to the row's height and scrolls
// its content (the field list here is intentionally long) when it overflows the space next to the grid.
const SidePanelDemo = () => {
  const [width, setWidth] = useState(320);
  // Track the current width so a drag can start from it without re-creating the handler (synced in
  // an effect, not during render — it is only read when a drag starts, after commit).
  const widthRef = useRef(width);
  useEffect(() => {
    widthRef.current = width;
  }, [width]);

  const onResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = widthRef.current;
    const onMove = (ev: PointerEvent) => {
      // Docked on the right: dragging the handle left widens the panel. Clamp to a sane range.
      setWidth(Math.min(Math.max(startWidth + (startX - ev.clientX), 240), 640));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, []);

  return (
    <Card>
      <Box sx={{display: 'flex', alignItems: 'stretch', gap: 0, height: '80vh'}}>
        <Box
          sx={{
            flex: 1,
            color: 'text.disabled',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Datagrid
        </Box>
        <SidePanel
          onClose={() => {}}
          onResizeStart={onResizeStart}
          sx={{width: {xs: '100%', md: width}}}
        >
          <PanelHeader label={PROPERTY.address} />
          <PanelContent>
            <PropertyList>
              <PropertyItem label={'Type'}>{PROPERTY.type}</PropertyItem>
              <PropertyItem label={'Address'}>{PROPERTY.address}</PropertyItem>
              <PropertyItem label={'Layout'}>{PROPERTY.layout}</PropertyItem>
              <PropertyItem label={'Area'}>{PROPERTY.area}</PropertyItem>
              <PropertyItem label={'Owner'}>{PROPERTY.owner}</PropertyItem>
              <PropertyItem label={'Involvement'}>{PROPERTY.involvement}</PropertyItem>
              <PropertyItem label={'Unit number'}>{PROPERTY.unitNumber}</PropertyItem>
              <PropertyItem label={'Floor'}>{PROPERTY.floor}</PropertyItem>
              <PropertyItem label={'Floors'}>{PROPERTY.floorCount}</PropertyItem>
              <PropertyItem label={'Heating'}>{PROPERTY.heating}</PropertyItem>
              <PropertyItem label={'Barrier free'}>{PROPERTY.barrierFree}</PropertyItem>
              <PropertyItem label={'Residential'}>{PROPERTY.residential}</PropertyItem>
              <PropertyItem label={'Status'}>{PROPERTY.status}</PropertyItem>
              <PropertyItem label={'Note'}>{PROPERTY.note}</PropertyItem>
            </PropertyList>
          </PanelContent>
        </SidePanel>
      </Box>
    </Card>
  );
};

// `render` returns the local `SidePanelDemo` helper (it owns the resize-drag width state — see the
// "Hooks live in a top-level demo component" rule), so "Show code" would otherwise show that
// helper's tag instead of the real usage this stands in for.
const PLAYGROUND_SOURCE = `<SidePanel onClose={handleClose} onResizeStart={onResizeStart} sx={{width}}>
  <PanelHeader label="Kyjovská 578/13, Prague – Michle" />
  <PanelContent>
    <PropertyList>
      <PropertyItem label="Type">Flat</PropertyItem>
      <PropertyItem label="Address">Kyjovská 578/13, Prague – Michle</PropertyItem>
      <PropertyItem label="Layout">2 + 1</PropertyItem>
      <PropertyItem label="Area">52 m²</PropertyItem>
      {/* … more PropertyItems */}
    </PropertyList>
  </PanelContent>
</SidePanel>`;

/**
 * The docked detail panel beside a (placeholder) datagrid — a `PanelHeader` title over a
 * `PanelContent` `PropertyList`. Drag the left edge to resize; the panel fills the grid's height and
 * scrolls when its content is taller than the row.
 */
export const Default: Story = {
  // `(_args) =>`, not `() =>`: Storybook derives whether `controls.include` filtering runs at all
  // from the render function's declared arity, not from whether it reads `args` — a zero-arg
  // render silently bypasses the filter and falls back to the full, uncurated docgen table (every
  // prop, `children` included, each shown as an unusable dashed row). Nothing here actually reads
  // `args` — the parameter exists purely to opt back into `controls.include: []` above so the
  // table is genuinely empty instead of lying.
  render: (_args) => <SidePanelDemo />,
  parameters: {docs: {source: {code: PLAYGROUND_SOURCE}}},
};
