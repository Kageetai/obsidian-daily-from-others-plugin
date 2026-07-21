import type { SettingDefinitionItem } from 'obsidian';

export interface PluginSettings {
	notesLocation: string;
	watchFileCreation: boolean;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	notesLocation: '',
	watchFileCreation: false,
};

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
];
