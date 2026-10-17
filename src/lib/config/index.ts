import { bachkreis } from './presets/bachkreis.ts';
import type { OrchestraConfig } from './types.ts';

export type * from './types.ts';

/** The active preset. To adapt the app for another orchestra, add a preset and select it here. */
export const config: OrchestraConfig = bachkreis;
