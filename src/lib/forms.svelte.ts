import type { SubmitFunction } from '$app/forms';
import { t } from '#lib/i18n/index.ts';

/** One short message at the bottom of the screen, e.g. when saving failed. Shown by Toast.svelte. */
export const toast = $state<{ message: string | null }>({ message: null });

let hideTimer: ReturnType<typeof setTimeout> | undefined;

export function showToast(message: string, ms = 6000) {
	toast.message = message;
	clearTimeout(hideTimer);
	hideTimer = setTimeout(() => (toast.message = null), ms);
}

export interface SubmitOptions {
	/** Clear the form after a successful save, e.g. an "add" form. */
	reset?: boolean;
	/** Called after a successful save, with what the action returned. */
	onSuccess?: (data: Record<string, unknown> | undefined) => void;
}

/**
 * The saving state of a page's forms, for `use:enhance={form.submit()}` and
 * `disabled={form.busy}`. Buttons are enabled again whatever happens, and when the
 * server fails (Google slow or down) the page stays as it is, with what was typed,
 * and a message says to try again instead of the error page replacing everything.
 */
export class FormState {
	/** While a form is saving; pages disable their buttons meanwhile. */
	busy = $state(false);

	submit(options: SubmitOptions = {}): SubmitFunction {
		return () => {
			this.busy = true;
			return async ({ result, update }) => {
				try {
					if (result.type === 'error') {
						showToast(result.status === 503 ? t.common.saveUnavailable : t.common.saveFailed);
						return;
					}
					await update({ reset: !!options.reset && result.type === 'success' });
					if (result.type === 'success') options.onSuccess?.(result.data);
				} catch (error) {
					console.error(error);
					showToast(t.common.saveFailed);
				} finally {
					this.busy = false;
				}
			};
		};
	}
}
