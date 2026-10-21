import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';

// Obsidian is only available inside the app; keep the watcher and timers real.
const bundle = await build({
	stdin: {
		contents:
			'export { registerAutomaticNoteCreation } from "./src/automaticNoteCreation"; export { default as DailyNotesPlugin } from "./src/main"; export { TFile, TFolder, moment, notices } from "obsidian";',
		resolveDir: process.cwd(),
	},
	bundle: true,
	write: false,
	format: 'esm',
	plugins: [
		{
			name: 'obsidian-test-host',
			setup(builder) {
				builder.onResolve({ filter: /^obsidian$/ }, () => ({
					path: 'obsidian',
					namespace: 'test-host',
				}));
				builder.onLoad(
					{ filter: /.*/, namespace: 'test-host' },
					() => ({
						resolveDir: process.cwd(),
						contents: `
				import moment from 'moment';
				export { moment };
				export class Plugin {}
				export class PluginSettingTab {}
				export class SuggestModal {}
				export class MarkdownView {}
				export class TFolder { constructor(path) { this.path = path; this.children = []; } }
				export class Vault { static recurseChildren(folder, callback) { folder.children.forEach(callback); } }
				export function normalizePath(path) { return path || '/'; }
				export class TFile {
					constructor(path) { this.path = path; this.extension = path.split('.').pop(); }
					get basename() { return this.path.split('/').pop().slice(0, -3); }
				}
				export const notices = [];
				export class Notice { constructor(message) { notices.push(message); } }
			`,
					}),
				);
			},
		},
	],
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`;
// eslint-disable-next-line no-unsanitized/method -- Import only the locally bundled test source above.
const hostModule = await import(moduleUrl);
const {
	registerAutomaticNoteCreation,
	DailyNotesPlugin,
	TFile,
	TFolder,
	moment,
	notices,
} = hostModule;

function host(realCreation = false) {
	let now = 0;
	let nextId = 0;
	const timers = new Map();
	const intervals = [];
	const cleanups = [];
	const listeners = new Map();
	const files = new Map();
	const dailyFolder = new TFolder('Daily');
	files.set('Daily', dailyFolder);
	const created = [];
	let createListener;
	const sync = {
		status: 'syncing',
		syncStatus: 'Downloading file',
		getStatus() {
			return this.status;
		},
		on(name, callback) {
			listeners.set(name, callback);
			return { name };
		},
		offref(ref) {
			listeners.delete(ref.name);
		},
	};
	notices.length = 0;
	global.window = {
		setTimeout(task, delay) {
			const id = ++nextId;
			timers.set(id, { task, at: now + delay });
			return id;
		},
		clearTimeout(id) {
			timers.delete(id);
		},
		setInterval(task) {
			intervals.push(task);
			return intervals.length;
		},
	};
	const plugin = Object.assign(new DailyNotesPlugin(), {
		settings: {
			notesLocation: 'Sources/',
			debounceDelay: 500,
			waitForSync: true,
		},
		app: {
			plugins: { getPlugin: () => null },
			foldManager: { save() {} },
			internalPlugins: {
				plugins: { sync: { enabled: true, instance: sync } },
				getPluginById: () => ({
					instance: {
						options: { folder: 'Daily', format: 'YYYY-MM-DD' },
					},
				}),
			},
			vault: {
				on(name, callback) {
					assert.equal(name, 'create');
					createListener = callback;
					return {};
				},
				getAbstractFileByPath(path) {
					return files.get(path);
				},
				async create(path) {
					assert.equal(
						files.has(path),
						false,
						'never recreate an existing daily note',
					);
					const file = new TFile(path);
					files.set(path, file);
					dailyFolder.children.push(file);
					created.push(path);
					createListener(file);
					return file;
				},
			},
		},
		register(cleanup) {
			cleanups.push(cleanup);
		},
		registerEvent(ref) {
			cleanups.push(() => ref.e?.offref(ref));
		},
		registerInterval() {},
	});
	if (!realCreation)
		plugin.createDailyNotes = async (batch) => {
			created.push(...batch.map((file) => file.path));
		};
	global.window.app = plugin.app;
	global.window.moment = moment;
	return {
		plugin,
		sync,
		created,
		files,
		listeners,
		receiveDaily(path) {
			const file = new TFile(path);
			files.set(path, file);
			dailyFolder.children.push(file);
		},
		async start() {
			registerAutomaticNoteCreation(plugin);
		},
		async add(path) {
			const file = new TFile(path);
			files.set(path, file);
			createListener(file);
			return file;
		},
		async tick(ms) {
			now += ms;
			for (const [id, timer] of timers)
				if (timer.at <= now) {
					timers.delete(id);
					timer.task();
				}
			for (const poll of intervals) poll();
			await new Promise((resolve) => setImmediate(resolve));
		},
		async synced() {
			sync.status = 'synced';
			sync.syncStatus = 'Fully synced';
			listeners.get('status-change')?.();
			await new Promise((resolve) => setImmediate(resolve));
		},
		stop() {
			for (const cleanup of cleanups.reverse()) cleanup();
		},
	};
}

void test('queues source notes until local Sync finishes and retains the creation delay', async () => {
	const h = host();
	await h.start();
	await h.add('Sources/2026-10-19.md');
	await h.tick(499);
	assert.deepEqual(h.created, []);
	await h.synced();
	assert.deepEqual(h.created, []);
	await h.tick(1);
	assert.deepEqual(h.created, ['Sources/2026-10-19.md']);
	h.stop();
});

void test('holds queued notes through paused, disconnected, error, and unknown states', async () => {
	const h = host();
	await h.start();
	await h.add('Sources/2026-10-19.md');
	await h.tick(500);
	for (const status of [
		'paused',
		'disconnected',
		'error',
		'uninitialized',
		'future-status',
	]) {
		h.sync.status = status;
		await h.tick(1000);
		assert.deepEqual(h.created, []);
	}
	h.sync.status = 'synced';
	h.sync.syncStatus = 'Connecting to server';
	await h.tick(1000);
	assert.deepEqual(h.created, []);
	await h.synced();
	assert.deepEqual(h.created, ['Sources/2026-10-19.md']);
	h.stop();
});

void test('bypasses waiting when Sync or the setting is disabled', async () => {
	for (const disableSync of [true, false]) {
		const h = host();
		if (disableSync)
			h.plugin.app.internalPlugins.plugins.sync.enabled = false;
		else h.plugin.settings.waitForSync = false;
		await h.start();
		await h.add('Sources/2026-10-19.md');
		await h.tick(500);
		assert.deepEqual(h.created, ['Sources/2026-10-19.md']);
		h.stop();
	}
});

void test('polls when events are unavailable and recovers from an unreadable API', async () => {
	const h = host();
	h.sync.on = undefined;
	const readStatus = h.sync.getStatus;
	h.sync.getStatus = () => {
		throw new Error('API changed');
	};
	await h.start();
	await h.add('Sources/2026-10-19.md');
	await h.tick(500);
	await h.tick(1000);
	assert.deepEqual(h.created, []);
	assert.equal(notices.length, 1);
	h.sync.getStatus = readStatus;
	await h.synced();
	await h.tick(1000);
	assert.deepEqual(h.created, ['Sources/2026-10-19.md']);
	h.stop();
});

void test('serializes creation and waits again if Sync restarts between notes', async () => {
	const h = host();
	await h.start();
	await h.add('Sources/2026-10-18.md');
	await h.add('Sources/2026-10-19.md');
	await h.tick(500);
	let finishFirst;
	h.plugin.createDailyNotes = async (batch) => {
		h.created.push(batch[0].path);
		h.sync.status = 'syncing';
		await new Promise((resolve) => {
			finishFirst = resolve;
		});
	};
	await h.synced();
	await h.tick(1000);
	assert.deepEqual(h.created, ['Sources/2026-10-18.md']);
	finishFirst();
	await h.tick(1000);
	assert.deepEqual(h.created, ['Sources/2026-10-18.md']);
	h.plugin.createDailyNotes = async (batch) => {
		h.created.push(batch[0].path);
	};
	await h.synced();
	assert.deepEqual(h.created, [
		'Sources/2026-10-18.md',
		'Sources/2026-10-19.md',
	]);
	h.stop();
});

void test('ignores deleted sources and cancels pending work on unload', async () => {
	const h = host();
	await h.start();
	await h.add('Sources/2026-10-18.md');
	await h.tick(500);
	h.files.delete('Sources/2026-10-18.md');
	await h.synced();
	assert.deepEqual(h.created, []);
	await h.add('Sources/2026-10-19.md');
	h.stop();
	await h.tick(500);
	assert.deepEqual(h.created, []);
	assert.equal(h.listeners.size, 0);
});

void test('does not recreate a daily note received while waiting for Sync', async () => {
	const h = host(true);
	await h.start();
	await h.add('Sources/2026-10-19 meeting.md');
	await h.tick(500);
	h.receiveDaily('Daily/2026-10-19.md');
	await h.synced();
	assert.deepEqual(h.created, []);
	h.stop();
});

void test('creates one daily note when queued source notes share a date', async () => {
	const h = host(true);
	await h.start();
	await h.add('Sources/2026-10-19 meeting.md');
	await h.add('Sources/2026-10-19 voice.md');
	await h.tick(500);
	await h.synced();
	assert.deepEqual(h.created, ['Daily/2026-10-19.md']);
	h.stop();
});
