import { App, PluginSettingTab, type SettingDefinitionItem } from 'obsidian';
import DailyNotesFromOthersPlugin from './main';

export interface PluginSettings {
	notesLocation: string;
	watchFileCreation: boolean;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	notesLocation: '',
	watchFileCreation: false,
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
			{ name: 'Watch file creation', control: { type: 'toggle', key: 'watchFileCreation' } },
		];
	}

	// display(): void {
	// 	const { containerEl } = this;
	//
	// 	containerEl.empty();
	//
	// 	new Setting(containerEl)
	// 		.setName('Notes location')
	// 		.setDesc("Folder to watch for other notes")
	// 		.addText((text) =>
	// 			text
	// 				.setPlaceholder('e.g. Voicenotes')
	// 				.setValue(this.plugin.settings.notesLocation)
	// 				.onChange(async (value) => {
	// 					this.plugin.settings.notesLocation = value;
	// 					await this.plugin.saveSettings();
	// 				}),
	// 		);
	// }
}
