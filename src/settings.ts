import { App, PluginSettingTab, type SettingDefinitionItem } from 'obsidian';
import DailyNotesFromOthersPlugin from './main';
import { SETTING_DEFINITIONS } from './settingsConfig';

export class SettingsTab extends PluginSettingTab {
	plugin: DailyNotesFromOthersPlugin;

	constructor(app: App, plugin: DailyNotesFromOthersPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return SETTING_DEFINITIONS;
	}
}
