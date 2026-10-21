import { Notice, TFile } from 'obsidian';
import type { App, EventRef } from 'obsidian';
import type DailyNotesFromOthersPlugin from './main';
import { DelayedTaskScheduler } from './utils/delayedTaskScheduler';

interface SyncInstance {
	getStatus?: () => unknown;
	syncStatus?: unknown;
	on?: (name: string, callback: () => void) => EventRef;
	offref?: (ref: EventRef) => void;
}

type SyncState = 'disabled' | 'synced' | 'waiting' | 'unavailable';

function readLocalSync(app: App): {
	state: SyncState;
	instance?: SyncInstance;
} {
	// shortcut: Sync has no public API; recheck these fields after Obsidian updates.
	const internalApp = app as App & {
		internalPlugins?: {
			plugins?: { sync?: { enabled?: boolean; instance?: SyncInstance } };
		};
	};
	const plugins = internalApp.internalPlugins?.plugins;
	if (!plugins) return { state: 'unavailable' };
	const sync = plugins.sync;
	if (!sync || sync.enabled === false) return { state: 'disabled' };
	const instance = sync.instance;
	if (sync.enabled !== true || typeof instance?.getStatus !== 'function') {
		return { state: 'unavailable', instance };
	}
	try {
		const status = instance.getStatus();
		if (status === 'synced' && instance.syncStatus === 'Fully synced') {
			return { state: 'synced', instance };
		}
		const knownStatus = [
			'synced',
			'syncing',
			'paused',
			'disconnected',
			'uninitialized',
			'error',
		].includes(String(status));
		return { state: knownStatus ? 'waiting' : 'unavailable', instance };
	} catch {
		return { state: 'unavailable', instance };
	}
}

export function registerAutomaticNoteCreation(
	plugin: DailyNotesFromOthersPlugin,
): void {
	const scheduler = new DelayedTaskScheduler();
	const pending = new Set<TFile>();
	let disposed = false;
	let running = false;
	let warned = false;
	let subscribed: SyncInstance | undefined;
	let unsubscribe: (() => void) | undefined;

	const flush = async () => {
		if (disposed || running || pending.size === 0) return;
		running = true;
		try {
			for (const file of pending) {
				if (disposed) break;
				if (plugin.settings.waitForSync) {
					const { state } = readLocalSync(plugin.app);
					if (state === 'unavailable' && !warned) {
						warned = true;
						new Notice(
							'Cannot read Obsidian Sync status. Automatic daily notes are waiting. Use a manual command or disable the sync wait setting to continue.',
						);
					}
					if (state !== 'synced' && state !== 'disabled') break;
				}
				pending.delete(file);
				if (
					plugin.app.vault.getAbstractFileByPath(file.path) ===
						file &&
					file.extension === 'md' &&
					file.path.startsWith(plugin.settings.notesLocation)
				) {
					// Re-read daily notes after waiting, and serialize work for duplicate dates.
					await plugin.createDailyNotes([file]);
				}
			}
		} catch (error) {
			console.error('Failed to process automatic daily notes.', error);
		} finally {
			running = false;
		}
	};

	const refresh = () => {
		if (disposed) return;
		const { instance } = readLocalSync(plugin.app);
		if (instance !== subscribed) {
			unsubscribe?.();
			unsubscribe = undefined;
			subscribed = instance;
			if (
				typeof instance?.on === 'function' &&
				typeof instance.offref === 'function'
			) {
				try {
					const ref = instance.on(
						'status-change',
						() => void flush(),
					);
					unsubscribe = () => instance.offref?.(ref);
				} catch {
					// Polling below also covers versions without compatible Sync events.
				}
			}
		}
		void flush();
	};

	plugin.register(() => {
		disposed = true;
		scheduler.cancelAll();
		pending.clear();
		unsubscribe?.();
	});
	plugin.registerEvent(
		plugin.app.vault.on('create', (file) => {
			if (
				file instanceof TFile &&
				file.extension === 'md' &&
				file.path.startsWith(plugin.settings.notesLocation)
			) {
				scheduler.schedule(() => {
					pending.add(file);
					void flush();
				}, plugin.settings.debounceDelay);
			}
		}),
	);
	refresh();
	plugin.registerInterval(window.setInterval(refresh, 1000));
}
