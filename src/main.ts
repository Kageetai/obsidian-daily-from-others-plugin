import { MarkdownView, moment, Plugin, TFile, Notice } from 'obsidian';
import { DEFAULT_SETTINGS, PluginSettings, SettingsTab } from './settings';
import {
	createDailyNote,
	DEFAULT_DAILY_NOTE_FORMAT,
	getAllDailyNotes,
	getDailyNoteSettings,
	getDateUID,
} from 'obsidian-daily-notes-interface';
import { ResultsModal } from './resultsModal';
import {
	findDateInFilename,
	getFilenameDateFormat,
} from './utils/findDateInFilename';

export default class DailyNotesFromOthersPlugin extends Plugin {
	settings!: PluginSettings;

	getFormat = () =>
		getFilenameDateFormat(
			getDailyNoteSettings().format,
			DEFAULT_DAILY_NOTE_FORMAT,
		);

	findAllMissingDailyNotes = () => {
		const existingOrSeenDates = new Set(Object.keys(getAllDailyNotes()));
		const format = this.getFormat();

		return this.app.vault
			.getMarkdownFiles()
			.filter((f) => f.path.startsWith(this.settings.notesLocation))
			.filter((f) => {
				const date = findDateInFilename(f.basename, format, moment);

				if (!date) {
					return false;
				}

				const dateUid = getDateUID(date);

				if (existingOrSeenDates.has(dateUid)) {
					return false;
				}

				existingOrSeenDates.add(dateUid);
				return true;
			});
	};

	createDailyNotes = async (files: TFile[]) => {
		const existingOrCreatedDates = new Set(Object.keys(getAllDailyNotes()));
		const format = this.getFormat();

		for (const file of files) {
			const date = findDateInFilename(file.basename, format, moment);

			if (!date) {
				continue;
			}

			const dateUid = getDateUID(date);
			if (existingOrCreatedDates.has(dateUid)) {
				continue;
			}

			try {
				const createdFile = await createDailyNote(date);
				if (createdFile) {
					existingOrCreatedDates.add(dateUid);
					new Notice(
						'New daily note created for note: ' + file.basename,
					);
				}
			} catch (error) {
				console.error(
					`Failed to create a daily note for "${file.path}".`,
					error,
				);
			}
		}
	};

	openModalOrCreateDailyNotes = () => {
		const files = this.findAllMissingDailyNotes();

		if (this.settings.dryRun) {
			new ResultsModal(this.app, files).open();
			return;
		}

		void this.createDailyNotes(files);
	};

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		this.addRibbonIcon(
			'calendar-plus',
			'Create all daily notes',
			this.openModalOrCreateDailyNotes,
		);

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-modal-simple',
			name: 'Create all daily notes',
			callback: this.openModalOrCreateDailyNotes,
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-modal-complex',
			name: 'Create daily note for this file',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				const activeFile = this.app.workspace.getActiveFile();
				if (markdownView && activeFile) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						void this.createDailyNotes([activeFile]);
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
				return false;
			},
		});

		if (this.settings.watchFileCreation) {
			this.app.workspace.onLayoutReady(() => {
				this.registerEvent(
					this.app.vault.on('create', (file) => {
						if (
							file instanceof TFile &&
							file.path.startsWith(this.settings.notesLocation)
						) {
							void this.createDailyNotes([file]);
						}
					}),
				);
			});
		}

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingsTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<PluginSettings>,
		);
	}
}
