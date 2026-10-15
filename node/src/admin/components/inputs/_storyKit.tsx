/* eslint-disable react-refresh/only-export-components */
// Story-support harness for the admin-layer input stories (HAB-685). NOT exported from the
// `@admin` barrel and never shipped in the library — it wraps a single React Admin input in the
// minimal form context so `useInput` resolves. Schema-agnostic on purpose: no `@schema`, no
// `BaseAdmin` — the inputs stand up on `react-admin` alone, with the MUI theme coming from the
// global Storybook decorator (`.storybook/preview.ts`). It is the input-level analogue of
// `admin/pages/_shell.tsx`, one level down and *lighter* (no live app shell).
import React, {useEffect} from 'react';
import {CoreAdminContext, Form, testDataProvider} from 'react-admin';
import type {Validator} from 'react-admin';
import {useFormContext} from 'react-hook-form';
import {LocaleProvider} from '@design/theme';
import {Card} from '@mui/material';
import type {Decorator} from '@storybook/react-vite';
import {IconsMap} from '@typing';
import {i18nProvider} from '../../pages/_i18n';
import {StoryAdminConfigProvider} from '../../pages/_storyConfig';

// A no-op data provider — the simple inputs never fetch. Created once, shared across stories.
const dataProvider = testDataProvider();

/**
 * Story-only validator that always fails — lets the `error` control demo the error state regardless
 * of the field's current value (combine with the shell's `revalidateOn`).
 */
export const failingValidate: Validator = () => 'Invalid value';

// Top-level component (never an inline arrow) so Storybook's "Show code" serializer — which
// re-invokes render outside the providers — never trips over a hook read outside the form context.
// Re-runs validation whenever `dep` changes, so a `validate`-driven error state shows immediately
// when toggled on *and* clears when toggled back off (a plain mount-only trigger would leave the
// stale error behind, since Storybook re-renders the story on arg change without remounting it).
const RevalidateOnChange = ({dep}: {dep: unknown}) => {
  const {trigger} = useFormContext();
  useEffect(() => {
    void trigger();
  }, [trigger, dep]);
  return null;
};

export type InputStoryShellProps = {
  children: React.ReactNode;
  /** Seed the form so inputs mount with an initial value (keyed by `source`). */
  record?: Record<string, unknown>;
  /** Fixed width of the surrounding card — makes an input's `fullWidth` toggle visible. */
  width?: number;
  /** Re-run validation whenever this value changes (e.g. the `error` toggle) so stale errors clear. */
  revalidateOn?: unknown;
  /** App icon registry provided to the input (for the `choices` icon demo). */
  icons?: IconsMap;
};

/**
 * Boots the minimal React Admin form context around a single input, inside a fixed-width `Card`.
 *
 * We use `CoreAdminContext` (not `SchemaRootContext`) on purpose: `SchemaRootContext` injects React Admin's
 * *own* `ThemeProvider` with its default theme, which would override the design theme supplied by
 * the global Storybook decorator. `CoreAdminContext` provides only the data / i18n / store / query
 * layer, so our design theme (and the light/dark toolbar toggle) applies to the inputs.
 *
 * The `Card` gives the input a bounded container so `fullWidth` visibly stretches it to the card
 * width, and collapses to the input's natural width when off.
 */
export const InputStoryShell = ({
  children,
  record,
  width = 600,
  revalidateOn,
  icons,
}: InputStoryShellProps) => (
  <CoreAdminContext dataProvider={dataProvider} i18nProvider={i18nProvider}>
    <LocaleProvider>
      <StoryAdminConfigProvider iconsMap={icons}>
        <Form record={record} mode="onChange" onSubmit={() => undefined}>
          <Card variant="elevation" sx={{width, p: 4, m: 2}}>
            <RevalidateOnChange dep={revalidateOn} />
            {children}
          </Card>
        </Form>
      </StoryAdminConfigProvider>
    </LocaleProvider>
  </CoreAdminContext>
);

/**
 * Shared story decorator: wraps the story in `InputStoryShell`, seeding the form from
 * `parameters.record` and re-validating whenever the story's `error` arg changes (the Playgrounds
 * turn that arg into a failing `validate` on the input). `parameters.width` overrides the shell's
 * default card width — a multi-column input (`FormArrayInput`) needs it wider than the default 600
 * to actually demo its inline layout instead of always falling back to stacked.
 */
export const withInputShell: Decorator = (Story, {args, parameters}) => (
  <InputStoryShell
    record={parameters.record as Record<string, unknown>}
    width={parameters.width as number | undefined}
    revalidateOn={(args as {error?: boolean}).error}
    icons={parameters.icons as IconsMap}
  >
    <Story />
  </InputStoryShell>
);
