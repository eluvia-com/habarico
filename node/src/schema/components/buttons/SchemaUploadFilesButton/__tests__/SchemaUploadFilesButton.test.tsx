import React from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {FieldOptions, FieldSchema, UploadFilesActionParameters} from '@schema/types';
import {render} from '@testing-library/react';
import {SchemaUploadFilesButton} from '../SchemaUploadFilesButton';

const h = vi.hoisted(() => ({
  fileFieldOptions: undefined as FieldOptions | undefined,
  useFileModifier: vi.fn(),
  useUploadQueue: vi.fn(),
}));

vi.mock('react-admin', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-admin')>()),
  useDataProvider: () => ({}),
  useNotify: () => vi.fn(),
  useRecordContext: () => undefined,
  useRefresh: () => vi.fn(),
  useTranslate: () => (key: string) => key,
}));

vi.mock('@schema/hooks/useGetLocalResourceSchema', () => ({
  useGetLocalResourceSchema: () => ({
    getMethodSchema: () => ({
      fields: [{name: 'image', options: h.fileFieldOptions} as FieldSchema],
    }),
  }),
}));

vi.mock('@foundation/hooks/useFileModifier', () => ({useFileModifier: h.useFileModifier}));

vi.mock('@admin/hooks/useUploadQueue', () => ({useUploadQueue: h.useUploadQueue}));

vi.mock('@admin/contexts/ResourceContext', () => ({useResourceContext: () => 'shop/image'}));
vi.mock('@admin/hooks/useUploadAreaLabels', () => ({useUploadAreaLabels: () => ({})}));
vi.mock('@schema/hooks/useGetTargetValues', () => ({useGetTargetValues: () => ({})}));
vi.mock('@admin/components/buttons/ActionButton', () => ({ActionButton: () => null}));
vi.mock('@design/hooks/useDialog', () => ({
  useDialog: () => ({Dialog: () => null, openDialog: vi.fn(), closeDialog: vi.fn()}),
}));

const renderButton = (params: Partial<UploadFilesActionParameters> = {}) =>
  render(
    <SchemaUploadFilesButton
      uploadFiles={{reference: {service: 'shop', resource: 'image'}, fileField: 'image', ...params}}
    />
  );

const fileModifierArgs = () => h.useFileModifier.mock.lastCall;
const maxFileSize = () => h.useUploadQueue.mock.lastCall?.[0].maxFileSize;

describe('SchemaUploadFilesButton file rules', () => {
  beforeEach(() => {
    h.fileFieldOptions = undefined;
    h.useFileModifier.mockReset();
    h.useUploadQueue.mockReset().mockReturnValue({entries: []});
  });

  it('takes resize, crop and max size from the target field', () => {
    h.fileFieldOptions = {image: {resizeWidth: 800, cropAspectRatio: 1.5}, maxSize: 2_000_000};
    renderButton();
    expect(fileModifierArgs()).toEqual([800, 1.5]);
    expect(maxFileSize()).toBe(2_000_000);
  });

  it('lets the action parameters override the target field', () => {
    h.fileFieldOptions = {image: {resizeWidth: 800, cropAspectRatio: 1.5}, maxSize: 2_000_000};
    renderButton({resizeWidth: 400, cropAspectRatio: 1, maxSize: 500_000});
    expect(fileModifierArgs()).toEqual([400, 1]);
    expect(maxFileSize()).toBe(500_000);
  });

  it('applies no rule when neither the field nor the action sets one', () => {
    renderButton();
    expect(fileModifierArgs()).toEqual([undefined, undefined]);
    expect(maxFileSize()).toBeUndefined();
  });
});
