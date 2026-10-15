import React from 'react';
import {Box, Button, Typography} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../_storyKit';
import {IconType} from '../../atoms/Icon';
import {Panel} from '../Panel';
import {PanelContent} from '../PanelContent';
import {PanelHeader} from '../PanelHeader';
import {PanelFooter} from './PanelFooter';

/** Placeholder body used so the footer reads in its real context. */
const SampleBody = () => (
  <Typography variant={'body2'} color={'text.secondary'}>
    Panel body. Compose any content here via <code>PanelContent</code>.
  </Typography>
);

type FooterArgs = {
  left: boolean;
  right: boolean;
};

/** Footer wired from the Controls args, shown inside a full `Panel` (it needs the body above it to
 * read in context). */
const FooterDemo = ({left, right}: FooterArgs) => (
  <Box sx={{width: 460}}>
    <Panel>
      <PanelHeader label={'New owner'} icon={IconType.PersonAdd} />
      <PanelContent>
        <SampleBody />
      </PanelContent>
      <PanelFooter
        left={
          left ? (
            <Button variant={'text'} color={'inherit'}>
              Back
            </Button>
          ) : undefined
        }
        right={right ? <Button variant={'contained'}>Save</Button> : undefined}
      />
    </Panel>
  </Box>
);

const meta: Meta<typeof FooterDemo> = {
  title: 'design/molecules/PanelFooter',
  component: FooterDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The footer slot of a `Panel` — an action bar separated from the body by a dashed divider, ' +
          'with a `left` and a `right` slot (`space-between`; a right-only footer collapses to the ' +
          'right, like `DialogActions`). Rendered as the last slot inside a `Panel`. Built on MUI ' +
          '`CardActions`.',
      },
    },
    controls: {include: ['left', 'right']},
  },
  argTypes: {
    left: {control: 'boolean'},
    right: {control: 'boolean'},
  },
  args: {left: true, right: true},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof FooterDemo>;

// `render` returns the local `FooterDemo` helper (the footer needs the surrounding `Panel` to read
// in context), so "Show code" would otherwise show that helper's tag instead of the real usage.
// `docs.source.transform` rebuilds that real usage from the story's current args instead —
// reactive, unlike a static override.
const buildPlaygroundSource = ({left, right}: FooterArgs) => {
  const props = [
    left ? 'left={<Button variant="text" color="inherit">Back</Button>}' : null,
    right ? 'right={<Button variant="contained">Save</Button>}' : null,
  ].filter(Boolean);
  const footer =
    props.length === 0 ? '<PanelFooter />' : `<PanelFooter\n    ${props.join('\n    ')}\n  />`;
  return `<Panel>
  <PanelHeader label="New owner" icon="PersonAdd" />
  <PanelContent>…</PanelContent>
  ${footer}
</Panel>`;
};

/** Interactive instance — toggle the `left`/`right` slots from the Controls panel. */
export const Playground: Story = {
  render: (args) => <FooterDemo {...args} />,
  parameters: {
    docs: {
      source: {
        transform: (_code: string, {args}: {args: FooterArgs}) => buildPlaygroundSource(args),
      },
    },
  },
};
