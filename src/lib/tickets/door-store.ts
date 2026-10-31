import type { DoorTicket } from './tickets.ts';

/**
 * What a phone at the door keeps in IndexedDB (docs/tickets-plan.md §4.4): the concert's list,
 * loaded while there's reception, and the check-ins not sent yet. Both survive a reload and
 * airplane mode; the check-ins go once the server has them.
 */

export interface DoorState {
	tickets: DoorTicket[];
	/** When the list was loaded, ISO. */
	loadedAt: string;
}

export interface PendingCheckIn {
	code: string;
	at: string;
}

const DB = 'einlass';
const STORE = 'state';

function open(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB, 1);
		request.onupgradeneeded = () => request.result.createObjectStore(STORE);
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

async function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest): Promise<T> {
	const db = await open();
	return new Promise<T>((resolve, reject) => {
		const request = work(db.transaction(STORE, mode).objectStore(STORE));
		request.onsuccess = () => resolve(request.result as T);
		request.onerror = () => reject(request.error);
	}).finally(() => db.close());
}

export const loadList = (concertId: string) => run<DoorState | undefined>('readonly', (store) => store.get(`list:${concertId}`));
export const saveList = (concertId: string, state: DoorState) => run('readwrite', (store) => store.put(state, `list:${concertId}`));
export const loadPending = async (concertId: string) => (await run<PendingCheckIn[] | undefined>('readonly', (store) => store.get(`pending:${concertId}`))) ?? [];
export const savePending = (concertId: string, pending: PendingCheckIn[]) => run('readwrite', (store) => store.put(pending, `pending:${concertId}`));
