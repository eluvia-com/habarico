import React, {useState} from 'react';
import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../_storyKit';

const meta: Meta<typeof Table> = {
  title: 'design/atoms/Table',
  component: Table,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Data table composition — exercises the `TableRow` / `TableCell` / `TablePagination` ' +
          'overrides together (they are only meaningful inside a Table).',
      },
    },
    // A pure-composition atom (CLAUDE.md exception — no Playground); without this Storybook
    // auto-infers a full argTypes table from MUI `Table` that the showcases below never wire up.
    controls: {include: []},
  },
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof Table>;

const rows = Array.from({length: 23}, (_, i) => ({
  id: i + 1,
  name: `Item ${i + 1}`,
  status: (['active', 'pending', 'archived'] as const)[i % 3],
}));

const TableDemo = () => {
  const [page, setPage] = useState(0);
  const rowsPerPage = 5;
  const paged = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  return (
    <TableContainer component={Paper} sx={{maxWidth: 560}}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell align={'right'}>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paged.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>{row.id}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell align={'right'}>
                <Chip size={'small'} label={row.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        component={'div'}
        count={rows.length}
        page={page}
        onPageChange={(_event, next) => setPage(next)}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[rowsPerPage]}
      />
    </TableContainer>
  );
};

// `render` returns the local `TableDemo` helper (it owns the pagination state — see the "Hooks
// live in a top-level demo component" rule); this keeps "Show code" showing the real composition
// instead of that helper's name.
const DEFAULT_SOURCE = `<TableContainer component={Paper}>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>ID</TableCell>
        <TableCell>Name</TableCell>
        <TableCell align="right">Status</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {rows.map((row) => (
        <TableRow key={row.id} hover>
          <TableCell>{row.id}</TableCell>
          <TableCell>{row.name}</TableCell>
          <TableCell align="right">
            <Chip size="small" label={row.status} />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
  <TablePagination
    component="div"
    count={rows.length}
    page={page}
    onPageChange={(_event, next) => setPage(next)}
    rowsPerPage={rowsPerPage}
    rowsPerPageOptions={[rowsPerPage]}
  />
</TableContainer>`;

export const Default: Story = {
  render: () => <TableDemo />,
  parameters: {docs: {source: {code: DEFAULT_SOURCE}}},
};
