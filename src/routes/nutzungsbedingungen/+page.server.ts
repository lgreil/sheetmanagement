import { legalContact } from '#lib/server/legal.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ contact: legalContact() });
