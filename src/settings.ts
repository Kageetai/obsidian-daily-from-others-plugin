import { App, PluginSettingTab, type SettingDefinitionItem } from 'obsidian';
import DailyNotesFromOthersPlugin from './main';

export interface PluginSettings {
	notesLocation: string;
	watchFileCreation: boolean;
	dryRun: boolean;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	notesLocation: '',
	watchFileCreation: false,
	dryRun: false,
};

export class SettingsTab extends PluginSettingTab {
	plugin: DailyNotesFromOthersPlugin;

	constructor(app: App, plugin: DailyNotesFromOthersPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
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
				name: 'Dry run',
				desc: "Only check for missing daily notes, don't create them",
				control: { type: 'toggle', key: 'dryRun' },
			},
		];
	}
}
