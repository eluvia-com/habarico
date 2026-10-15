import React, {useState} from 'react';
import {MemoryRouter} from 'react-router-dom';
import {Icon, IconType} from '@design/atoms/Icon';
import {Meta, StoryObj} from '@storybook/react-vite';
import {LayoutSearchResult} from '../../types';
import {SearchContent} from './SearchContent';
import {SearchOverlay} from './SearchOverlay';
import {SearchToggle} from './SearchToggle';
import {getSearchShortcutLabel} from './shortcut';

const meta: Meta<typeof SearchToggle> = {
  title: 'design/layouts/shared/Search',
  component: SearchToggle,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The header search: a rounded pill trigger (`SearchToggle`, with the search icon and a ' +
          'platform-aware `⌘K` / `Ctrl+K` shortcut chip) that opens a full-width `SearchOverlay` ' +
          '(backdrop + slide) holding the `SearchContent` (form + results). The toggle, backdrop and ' +
          'slide are hardcoded in the layout — only the content is configured through the `search` ' +
          'slot, and the layout owns the open state (like the notifications / settings toggles). ' +
          '`⌘/Ctrl+K` opens it; `Esc` or a backdrop click closes it. Presentational only — the app ' +
          'wires the content to a backend query. Click the pill (or press the shortcut) to open.',
      },
    },
    controls: {include: ['tooltip']},
  },
  argTypes: {
    tooltip: {control: 'text'},
  },
  args: {tooltip: 'Search'},
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof SearchToggle>;

// Static results so the overlay content can be shown in isolation; the real app feeds these
// from a backend fulltext query.
const _searchResults: LayoutSearchResult[] = [
  {
    meta: {label: 'Users', icon: <Icon size={20} icon={IconType.Groups} />},
    objects: [
      {href: '/user/1', title: 'Jane Cooper', description: 'jane.cooper@example.com'},
      {href: '/user/2', title: 'Cody Fisher', description: 'cody.fisher@example.com'},
    ],
  },
  {
    meta: {label: 'Products', icon: <Icon size={20} icon={IconType.ShoppingCart} />},
    objects: [{href: '/product/42', title: 'Wireless headphones', description: 'SKU-42'}],
  },
];

// Compose the trigger + overlay + content the way the layout does, with a local open state
// and static results so the whole search flow can be exercised in isolation.
const Demo = ({tooltip}: {tooltip?: string}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  return (
    <>
      <SearchToggle
        open={open}
        onClick={() => setOpen(true)}
        tooltip={tooltip}
        shortcutLabel={getSearchShortcutLabel()}
      />
      <SearchOverlay open={open} onClose={() => setOpen(false)}>
        <SearchContent
          searchQuery={query}
          onSearch={setQuery}
          searchResults={_searchResults}
          onClose={() => setOpen(false)}
        />
      </SearchOverlay>
    </>
  );
};

// `render` returns the local `Demo` helper (it owns the `open` / `query` state — see the "Hooks
// live in a top-level demo component" rule), so "Show code" would otherwise show that helper's
// tag. `docs.source.transform` rebuilds the real composed usage from the story's current args
// instead — reactive, unlike a static `docs.source.code` override.
const buildPlaygroundSource = (args: {tooltip?: string}) => `<SearchToggle
  open={open}
  onClick={() => setOpen(true)}
  tooltip=${JSON.stringify(args.tooltip)}
  shortcutLabel={getSearchShortcutLabel()}
/>
<SearchOverlay open={open} onClose={() => setOpen(false)}>
  <SearchContent
    searchQuery={query}
    onSearch={setQuery}
    searchResults={searchResults}
    onClose={() => setOpen(false)}
  />
</SearchOverlay>`;

/** Interactive instance — click the pill (or press the shortcut) to open the search overlay. */
export const Playground: Story = {
  render: (args) => <Demo tooltip={args.tooltip} />,
  parameters: {
    docs: {
      source: {
        transform: (_code: string, {args}: {args: {tooltip?: string}}) =>
          buildPlaygroundSource(args),
      },
    },
  },
};
