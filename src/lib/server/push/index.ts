import { parseEmailList } from '#lib/access/access.ts';
import { getStore, type PushDevice } from '../db/index.ts';
import { appEnv, orchestra } from '../env.ts';
import { sendPush, type VapidKeys } from './webpush.ts';

/**
 * Notifications on members' devices (#157): reminders and admin notices, sent from the
 * jobs. A member allows them per device on /profil; the subscriptions are in the store
 * (D1), the keys are secrets. Without VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY nothing is sent.
 */

/** What the service worker shows. `url` opens on a tap; `tag` replaces an older notice of the same kind. */
export interface Notice {
	title: string;
	body: string;
	url: string;
	tag?: string;
}

export function vapidKeys(): VapidKeys | null {
	const env = appEnv();
	const publicKey = env.VAPID_PUBLIC_KEY?.trim();
	const privateKey = env.VAPID_PRIVATE_KEY?.trim();
	if (!publicKey || !privateKey) return null;
	// Push services want to know whom to contact about the app; the privacy contact, else the first admin.
	const email = env.LEGAL_EMAIL?.trim() || parseEmailList(env.BOOTSTRAP_ADMINS)[0];
	return { publicKey, privateKey, subject: email ? `mailto:${email}` : 'mailto:noreply@example.org' };
}

export const pushReady = () => !!vapidKeys();

/**
 * Sends a notice to every device of these people. Devices the push service says are gone
 * are forgotten. Returns who got it on at least one device.
 */
export async function notify(emails: Iterable<string>, notice: Notice, devices?: PushDevice[]): Promise<Set<string>> {
	const keys = vapidKeys();
	const reached = new Set<string>();
	if (!keys) return reached;
	const store = getStore();
	const wanted = new Set(emails);
	const targets = (devices ?? (await store.allPush())).filter((device) => wanted.has(device.email));
	// The orchestra's logo next to the text; notifications can't show SVG.
	const logo = orchestra().logo;
	const payload = JSON.stringify({ ...notice, icon: /\.svg($|\?)/i.test(logo) ? undefined : logo });
	await Promise.all(
		targets.map(async (device) => {
			const outcome = await sendPush(device, payload, keys);
			if (outcome === 'sent') reached.add(device.email);
			if (outcome === 'gone') await store.deletePush(device.endpoint);
		})
	);
	return reached;
}
