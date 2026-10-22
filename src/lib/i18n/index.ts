import { de } from './de.ts';
import { en } from './en.ts';
import type { Texts } from './types.ts';

export type { Texts } from './types.ts';

/** The app's language, chosen when building (APP_LANGUAGE=en); one per deployment, not per visitor (#124). */
export const LANGUAGE = __LANGUAGE__;

/** Active language. */
export const t: Texts = LANGUAGE === 'en' ? en : de;
