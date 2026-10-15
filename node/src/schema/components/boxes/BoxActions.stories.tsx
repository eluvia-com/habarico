import React from 'react';
import {
  CATEGORIES_RESOURCE,
  CATEGORY_METHOD,
  CATEGORY_RECORD,
  CATEGORY_RESOURCE_SCHEMA,
  INLINE_ACTION,
  PRODUCTS_RESOURCE,
  SUMMARY_FIELDS,
  box,
  fd,
  rootWrap,
} from '@schema/components/_data';
import {Showcase, ShowcaseStack, withSchemaBoxShell} from '@schema/components/_storyKit';
import {SchemaBox} from '@schema/components/boxes/SchemaBox';
import {SchemaImagesBox} from '@schema/components/boxes/SchemaImagesBox';
import type {ActionDescriptor, BoxSchema, ListBoxParameters} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';

// Every story mounts on a **category** — the parent side of the fixture's one-to-many. That matters
// for the whole file: a category's action schema declares only `show`, while `products` declares
// `show` / `edit` / `create` / `archive`. The asymmetry is what makes the resolution rule visible.
const CATEGORY_CONTEXT = {
  schemaStory: {
    resource: CATEGORIES_RESOURCE,
    record: CATEGORY_RECORD,
    schema: CATEGORY_RESOURCE_SCHEMA,
    methodSchema: CATEGORY_METHOD,
  },
};

type ListBoxOverrides = {
  /** Box-level header actions (`box.toolbarActions`). */
  toolbarActions?: ActionDescriptor[];
  /** List-level config (`list.*`); `reference` / `target` are always supplied by the builder. */
  list?: Partial<ListBoxParameters>;
};

// A list box bound to `products` (target `category_id`), wrapped in a bare card-less root so it
// renders nested, exactly as inside a real detail layout. Nothing else is injected: whatever a story
// box does not set is left to the library, so each box shows the library's own behaviour for exactly
// the slots it configures.
const productsListBox = (name: string, label: string, o: ListBoxOverrides = {}): BoxSchema =>
  rootWrap(
    name,
    box({
      name,
      type: 'list',
      label,
      card: true,
      readOnly: true,
      ...(o.toolbarActions ? {toolbarActions: o.toolbarActions} : {}),
      list: {reference: PRODUCTS_RESOURCE, target: 'category_id', ...o.list},
      boxes: SUMMARY_FIELDS,
    })
  );

// The same list configuration rendered as an image grid. Not wrapped in a root box and not routed
// through `SchemaBox`: there is no `images` `BoxType` in the free package, so `defaultBoxProvider`
// would never dispatch to `SchemaImagesBox` — the story mounts it directly.
const productsImagesBox = (name: string, label: string, o: ListBoxOverrides = {}): BoxSchema =>
  box({
    name,
    type: 'list',
    label,
    card: true,
    readOnly: true,
    ...(o.toolbarActions ? {toolbarActions: o.toolbarActions} : {}),
    list: {reference: PRODUCTS_RESOURCE, target: 'category_id', ...o.list},
    boxes: [fd('photo'), fd('name'), fd('price')],
  });

const categorySummaryBox = (
  name: string,
  label: string,
  toolbarActions?: ActionDescriptor[]
): BoxSchema =>
  rootWrap(
    name,
    box({
      name,
      type: 'simple',
      label,
      card: true,
      ...(toolbarActions ? {toolbarActions} : {}),
      boxes: [fd('name'), fd('parent_id')],
    })
  );

// Two steps of category fields, shared by the tab and wizard builders — the content is filler, the
// header placement is the point.
const STEPS: BoxSchema[] = [
  box({name: 'identity', label: 'Identity', type: 'simple', boxes: [fd('name')]}),
  box({name: 'placement', label: 'Placement', type: 'simple', boxes: [fd('parent_id')]}),
];

const navigationBox =
  (type: 'tab' | 'wizard') =>
  (name: string, overrides: Partial<BoxSchema> = {}): BoxSchema =>
    rootWrap(name, box({name, type, boxes: STEPS, ...overrides}));

const detailTabBox = navigationBox('tab');
const detailWizardBox = navigationBox('wizard');

/**
 * A **cross-cutting** story: it documents a rule, not a component. A box can declare actions in more
 * than one place, and the placement rules are subtle enough to look like a bug — so each story below
 * stacks **several boxes of one type**, each configured differently, with the effect of every
 * placement visible side by side.
 *
 * ## The three slots
 *
 * A list box has **three** independent action slots, resolved against **different** resources:
 *
 * | Schema key              | Rendered in          | Resolved against            | Component                       |
 * |-------------------------|----------------------|-----------------------------|---------------------------------|
 * | `box.toolbarActions`    | box **header**       | the **parent** record       | `SchemaButtons` (plain)         |
 * | `box.list.toolbarActions`| box **header**      | the **referenced** resource | `SchemaReferenceToolbarActions` |
 * | `box.list.listActions`  | **datagrid** toolbar | the **referenced** resource | `SchemaListBoxActions`          |
 *
 * See `buildBoxHeaderActions` (both header slots) and `SchemaListBoxActions` (the datagrid slot).
 *
 * ## Why a bare `{name: 'create'}` behaves "backwards"
 *
 * A descriptor renders only when it **resolves** — either it carries an inline `action`, or its
 * `name` is found in the action schema of the resource whose context it renders in
 * (`SchemaButtons` → `isValidDescriptor`). `create` is an action of the *referenced* resource
 * (`products`); it is **not** an action of the *parent* record (a category).
 *
 * - On `list.toolbarActions` it resolves against `products` → found → the header button shows.
 * - On `box.toolbarActions` it resolves against the parent category → not found → **dropped
 *   silently**, with no button and no error.
 *
 * One more thing muddies this in real projects: with `list.listActions` **unset** (or `[]`) the
 * datagrid toolbar **falls back** to the referenced resource's `showInList` actions — the *same* set
 * the per-row buttons come from. So the row buttons appear a second time above the grid. Setting
 * `listActions` to a non-empty array is what replaces that fallback.
 *
 * The same rules apply to `SchemaSimpleBox` (one header slot, resolved against the box's own record),
 * to the tab and wizard boxes, and to the images box — they all share `buildBoxHeaderActions`.
 */
const meta = {
  title: 'schema/boxes/BoxActions',
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}, ...CATEGORY_CONTEXT},
  decorators: [withSchemaBoxShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/**
 * `SchemaListBox` — the full slot matrix. Rows show **Detail / Edit** (the reference's `showInList`
 * actions); boxes 5–7 leave `listActions` alone or set it, so the datagrid toolbar shows first the
 * fallback and then the replacement. What varies above that is the header slot:
 *
 * 1. **`list.toolbarActions: [create]`** → renders in the header (resolved against `products`).
 * 2. **`box.toolbarActions: [create]`** → **dropped**, header empty — the *same* descriptor, but a box
 *    slot resolves against the parent category, which has no `create`. Boxes 1 vs 2 are the whole
 *    lesson.
 * 3. **`box.toolbarActions: [show]`** → renders **Detail** — a box action *does* show when it names a
 *    real parent (category) action.
 * 4. **`box.toolbarActions: [inline]`** → renders **Share** — an inline action always resolves.
 */
export const ListBox: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaListBox — action slots'}>
      <Showcase caption={'1) list.toolbarActions: [create] → renders in the header'}>
        <SchemaBox
          isRoot
          schema={productsListBox('list_toolbar', 'Products — list slot', {
            list: {toolbarActions: [{name: 'create'}], listActions: []},
          })}
        />
      </Showcase>
      <Showcase
        caption={
          '2) box.toolbarActions: [create] → dropped, the box slot resolves against the category'
        }
      >
        <SchemaBox
          isRoot
          schema={productsListBox('box_toolbar', 'Products — box slot', {
            toolbarActions: [{name: 'create'}],
            list: {listActions: []},
          })}
        />
      </Showcase>
      <Showcase caption={'3) box.toolbarActions: [show] → renders, show is a real category action'}>
        <SchemaBox
          isRoot
          schema={productsListBox('box_toolbar_parent', 'Products — box slot, parent action', {
            toolbarActions: [{name: 'show'}],
            list: {listActions: []},
          })}
        />
      </Showcase>
      <Showcase caption={'4) box.toolbarActions: an inline action → always renders'}>
        <SchemaBox
          isRoot
          schema={productsListBox('box_toolbar_inline', 'Products — box slot, inline action', {
            toolbarActions: [INLINE_ACTION],
            list: {listActions: []},
          })}
        />
      </Showcase>
      <Showcase caption={'5) listActions unset → the datagrid toolbar falls back to showInList'}>
        <SchemaBox
          isRoot
          schema={productsListBox('list_actions_default', 'Products — toolbar fallback')}
        />
      </Showcase>
      <Showcase
        caption={'6) listActions: [create] → replaces the fallback in the datagrid toolbar'}
      >
        <SchemaBox
          isRoot
          schema={productsListBox('list_actions_custom', 'Products — explicit listActions', {
            list: {listActions: [{name: 'create'}]},
          })}
        />
      </Showcase>
      <Showcase caption={'7) listActions: [inline] → an inline action in the datagrid toolbar'}>
        <SchemaBox
          isRoot
          schema={productsListBox('list_actions_inline', 'Products — inline listAction', {
            list: {listActions: [INLINE_ACTION]},
          })}
        />
      </Showcase>
    </ShowcaseStack>
  ),
};

/**
 * `SchemaSimpleBox` — one header slot, resolved against the box's own (parent) record. No datagrid to
 * muddy the picture, so the resolution rule shows plainly:
 *
 * 1. **`{name: 'show'}`** → renders (`show` *is* a category action).
 * 2. **`{name: 'create'}`** → dropped (`create` is not).
 * 3. **an inline action** → always renders.
 * 4. **no `toolbarActions`** → the header is just the title.
 */
export const SimpleBox: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaSimpleBox — action slots'}>
      <Showcase caption={'1) box.toolbarActions: [show] → renders'}>
        <SchemaBox
          isRoot
          schema={categorySummaryBox('simple_show', 'Category — parent action', [{name: 'show'}])}
        />
      </Showcase>
      <Showcase caption={'2) box.toolbarActions: [create] → dropped, not a category action'}>
        <SchemaBox
          isRoot
          schema={categorySummaryBox('simple_create', 'Category — unresolvable action', [
            {name: 'create'},
          ])}
        />
      </Showcase>
      <Showcase caption={'3) box.toolbarActions: an inline action → always renders'}>
        <SchemaBox
          isRoot
          schema={categorySummaryBox('simple_inline', 'Category — inline action', [INLINE_ACTION])}
        />
      </Showcase>
      <Showcase caption={'4) no toolbarActions → the header is just the title'}>
        <SchemaBox isRoot schema={categorySummaryBox('simple_none', 'Category — no actions')} />
      </Showcase>
    </ShowcaseStack>
  ),
};

/**
 * `SchemaTabBox` — the toolbar actions of a tab box land in one of two places, and the difference is
 * the whole lesson:
 *
 * - **Card-less** (no `label`, or `card: false`): there is no card header, so the toolbar sits in the
 *   tab strip's **own header** (`NavigationHeader`) — to the right of the tabs, flush to the edge.
 * - **With a `label`**: the box draws a card and the toolbar moves into the **card header**, like on
 *   every other box, with the tabs below it.
 *
 * Either way the buttons are **small**, consistent with every box header. Resolution is the simple
 * box's rule: `toolbarActions` resolve against the **parent** category.
 */
export const TabBox: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaTabBox — action slots'}>
      <Showcase caption={'1) card-less + [show] → buttons flush right in the tab strip'}>
        <SchemaBox
          isRoot
          schema={detailTabBox('tab_show', {card: false, toolbarActions: [{name: 'show'}]})}
        />
      </Showcase>
      <Showcase caption={'2) card-less + an inline action → always renders, same placement'}>
        <SchemaBox
          isRoot
          schema={detailTabBox('tab_inline', {card: false, toolbarActions: [INLINE_ACTION]})}
        />
      </Showcase>
      <Showcase caption={'3) with a label → a card; the toolbar moves into the card header'}>
        <SchemaBox
          isRoot
          schema={detailTabBox('tab_card', {
            label: 'Category detail',
            toolbarActions: [INLINE_ACTION],
          })}
        />
      </Showcase>
      <Showcase caption={'4) card-less, no toolbarActions → just the tab strip'}>
        <SchemaBox isRoot schema={detailTabBox('tab_plain', {card: false})} />
      </Showcase>
      <Showcase
        caption={'5) tab.showToolbarNavigation: true → Prev/Next in a footer (opt-in on a tab box)'}
      >
        <SchemaBox
          isRoot
          schema={detailTabBox('tab_nav', {card: false, tab: {showToolbarNavigation: true}})}
        />
      </Showcase>
    </ShowcaseStack>
  ),
};

/**
 * `SchemaWizardBox` — the wizard walks the same steps one at a time with a `Stepper` and Prev/Next
 * navigation. It shares the tab box's header treatment, so its slots land the same way:
 *
 * - **`box.toolbarActions`** resolve against the **parent** category and render in the stepper's own
 *   header — card-less → flush right next to the stepper; with a `label` → the card header.
 * - **`box.bottomActions`** and the Prev/Next navigation (`showToolbarNavigation`, on by default
 *   here) render in the footer below the steps. A Save typically lives in one of those two slots.
 *
 * The showcase mounts a record, so the wizard reads as an **edit** view: every step is reachable and
 * a bottom action shows on every step (in a create view it would appear only on the last).
 */
export const WizardBox: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaWizardBox — action slots'}>
      <Showcase caption={'1) card-less + [show] → flush right in the stepper header'}>
        <SchemaBox
          isRoot
          schema={detailWizardBox('wizard_show', {card: false, toolbarActions: [{name: 'show'}]})}
        />
      </Showcase>
      <Showcase caption={'2) card-less + an inline action → always renders, same placement'}>
        <SchemaBox
          isRoot
          schema={detailWizardBox('wizard_inline', {card: false, toolbarActions: [INLINE_ACTION]})}
        />
      </Showcase>
      <Showcase caption={'3) with a label → a card; the toolbar moves into the card header'}>
        <SchemaBox
          isRoot
          schema={detailWizardBox('wizard_card', {
            label: 'Category wizard',
            toolbarActions: [INLINE_ACTION],
          })}
        />
      </Showcase>
      <Showcase caption={'4) card-less + bottomActions: [inline] → in the footer beside Prev/Next'}>
        <SchemaBox
          isRoot
          schema={detailWizardBox('wizard_bottom', {card: false, bottomActions: [INLINE_ACTION]})}
        />
      </Showcase>
    </ShowcaseStack>
  ),
};

/**
 * `SchemaImagesBox` — a mirror of the `ListBox` story: the same slots and the same resolution rules,
 * with an image grid instead of a datagrid and `SchemaImagesBoxActions` as the toolbar above it.
 * Mounted directly, since there is no `images` `BoxType` for `defaultBoxProvider` to dispatch on.
 */
export const ImagesBox: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaImagesBox — action slots'}>
      <Showcase caption={'1) list.toolbarActions: [create] → renders in the header'}>
        <SchemaImagesBox
          isRoot
          schema={productsImagesBox('img_list_toolbar', 'Products — list slot', {
            list: {toolbarActions: [{name: 'create'}], listActions: []},
          })}
        />
      </Showcase>
      <Showcase
        caption={'2) box.toolbarActions: [create] → dropped, resolves against the category'}
      >
        <SchemaImagesBox
          isRoot
          schema={productsImagesBox('img_box_toolbar', 'Products — box slot', {
            toolbarActions: [{name: 'create'}],
            list: {listActions: []},
          })}
        />
      </Showcase>
      <Showcase caption={'3) box.toolbarActions: [show] → renders, a real category action'}>
        <SchemaImagesBox
          isRoot
          schema={productsImagesBox(
            'img_box_toolbar_parent',
            'Products — box slot, parent action',
            {
              toolbarActions: [{name: 'show'}],
              list: {listActions: []},
            }
          )}
        />
      </Showcase>
      <Showcase caption={'4) listActions: [inline] → renders in the images toolbar'}>
        <SchemaImagesBox
          isRoot
          schema={productsImagesBox('img_list_actions_inline', 'Products — inline listAction', {
            list: {listActions: [INLINE_ACTION]},
          })}
        />
      </Showcase>
    </ShowcaseStack>
  ),
};
