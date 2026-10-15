import React, {useCallback, useMemo, useState} from 'react';
import {ConfirmDialog, ConfirmDialogProps} from '../../organisms/ConfirmDialog';

/**
 * Per-invocation configuration passed to `confirm(...)`. Mirrors {@link ConfirmDialogProps} minus the
 * bits the hook controls (`open` / `onCancel` / `loading`). `onConfirm` may return a promise — the
 * hook then keeps the dialog open with a spinner until it settles.
 */
export type ConfirmOptions = Omit<
  ConfirmDialogProps,
  'open' | 'onConfirm' | 'onCancel' | 'loading'
> & {
  /** Action to run on confirm. If it returns a promise, the dialog stays open (loading) until it resolves. */
  onConfirm: () => void | Promise<void>;
  /** Optional hook invoked when the user cancels / dismisses the dialog. */
  onCancel?: () => void;
};

/**
 * A React-Admin-free confirmation-dialog controller built on {@link ConfirmDialog}. Call `confirm(...)`
 * to open a dialog for a specific action; render the returned `dialog` element once in the tree. The
 * hook owns the open/loading state and — when `onConfirm` returns a promise — replicates React Admin's
 * `Confirm` async behaviour (spinner + locked dialog until the promise settles).
 */
export const useConfirm = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | undefined>(undefined);

  const confirm = useCallback((next: ConfirmOptions) => {
    setOptions(next);
    setLoading(false);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setLoading(false);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!options) return;
    const result = options.onConfirm();
    if (result && typeof (result as Promise<void>).then === 'function') {
      setLoading(true);
      // Close on both fulfilment and rejection (a rejection handler keeps the promise non-floating).
      (result as Promise<void>).then(close, close);
    } else {
      close();
    }
  }, [options, close]);

  const handleCancel = useCallback(() => {
    options?.onCancel?.();
    close();
  }, [options, close]);

  const dialog = useMemo(
    () => (
      <ConfirmDialog
        open={open}
        title={options?.title ?? ''}
        content={options?.content ?? ''}
        confirmLabel={options?.confirmLabel}
        cancelLabel={options?.cancelLabel}
        confirmColor={options?.confirmColor}
        loading={loading}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    ),
    [open, loading, options, handleConfirm, handleCancel]
  );

  return {confirm, dialog};
};
