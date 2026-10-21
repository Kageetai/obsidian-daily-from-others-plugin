import type { SettingDefinitionItem } from 'obsidian';

export interface PluginSettings {
	debounceDelay: number;
	notesLocation: string;
	watchFileCreation: boolean;
	waitForSync: boolean;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	debounceDelay: 500,
	notesLocation: '',
	watchFileCreation: false,
	waitForSync: true,
};

export function normalizeDebounceDelay(value: unknown): number {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		return DEFAULT_SETTINGS.debounceDelay;
	}

	return Math.max(0, value);
}

export const SETTING_DEFINITIONS: SettingDefinitionItem[] = [
	{
		name: 'Notes location',
		control: {
			type: 'folder',
			key: 'notesLocation',
			includeRoot: false,
		},
	},
	{
		name: 'Watch file creation',
		control: { type: 'toggle', key: 'watchFileCreation' },
	},
	{
		name: 'Debounce delay (ms)',
		desc: 'Wait before creating a daily note after detecting a watched note.',
		control: {
			type: 'number',
			key: 'debounceDelay',
			min: 0,
		},
	},
	{
		name: 'Wait for Obsidian Sync',
		desc: 'Wait for Sync on this device before automatic creation. Uses an undocumented API; manual commands remain available.',
		control: { type: 'toggle', key: 'waitForSync' },
	},
];
