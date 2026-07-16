import { App, SuggestModal, TFile } from 'obsidian';

export class ResultsModal extends SuggestModal<TFile> {
	files: TFile[] = [];

	constructor(app: App, files: TFile[]) {
		super(app);
		this.files = files;
	}

	getSuggestions(query: string): TFile[] | Promise<TFile[]> {
		return this.files.filter(
			(f) => f.basename.contains(query) || f.path.contains(query),
		);
	}

	renderSuggestion(file: TFile, el: HTMLElement) {
		el.createDiv({ text: file.basename });
		el.createEl('small', { text: file.path });
	}

	onChooseSuggestion(file: TFile, evt: MouseEvent | KeyboardEvent) {
		void this.app.workspace.getLeaf(false).openFile(file);
	}
}
