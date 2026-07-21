# Daily Notes from Others

Daily Notes from Others creates missing [Obsidian](https://obsidian.md) daily notes from dates found in the filenames of other notes.

It is useful when another app or workflow creates dated notes—voice notes, meeting notes, journal imports, or similar files—and you want each date to have a corresponding Obsidian daily note. The plugin reads the date from the source filename and asks Obsidian to create the normal daily note for that date. It does not copy or merge the source note's contents.

## Features

- Finds valid dates anywhere in Markdown filenames inside a configured source folder.
- Uses the filename portion of your existing **Daily notes** date format.
- Creates every missing daily note from a ribbon action or command.
- Creates the daily note associated with the active Markdown file.
- Optionally watches for newly created source notes and creates daily notes automatically.
- Lists one source note for each date missing a daily note, with filtering and quick access to the source note.
- Skips dates that already have daily notes and avoids duplicate work when several source notes share a date.
- Shows an Obsidian notice after each successful creation and continues a batch if one file fails.
- Runs locally without telemetry, accounts, or external services.
- Supports desktop and mobile Obsidian.

## How date matching works

The plugin uses the last path segment of the date format configured in Obsidian's **Daily notes** core plugin. For example, a nested daily-note format of:

```text
YYYY/MM/YYYY-MM-DD
```

uses `YYYY-MM-DD` when inspecting source filenames. All of these source notes therefore match July 16, 2026:

```text
2026-07-16 meeting.md
Voice note 2026-07-16T1234.md
Imported 999 2026-07-16 journal.md
```

Running the plugin creates the daily note for `2026-07-16` using Obsidian's Daily notes configuration. Impossible dates such as `2026-02-31` and filenames without a matching date are ignored.

## Requirements

- Obsidian 1.13.0 or newer.
- Obsidian's **Daily notes** core plugin configured with the folder, date format, and optional template you want to use.

## Installation

### Community plugins

After the plugin is available in Obsidian's community catalog:

1. Open **Settings → Community plugins**.
2. Select **Browse** and search for “Daily Notes from Others.”
3. Select **Install**, then **Enable**.

### Manual installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest GitHub release](https://github.com/Kageetai/obsidian-daily-from-others-plugin/releases/latest).
2. Create this folder inside your vault:

    ```text
    <Vault>/.obsidian/plugins/obsidian-daily-from-others-plugin/
    ```

3. Copy the three downloaded files into that folder.
4. Reload Obsidian.
5. Open **Settings → Community plugins** and enable **Daily Notes from Others**.

## Configuration

Open **Settings → Daily Notes from Others** and configure:

- **Notes location**: Select the folder containing the dated source notes. The bulk scan and file watcher consider Markdown files whose paths start with this location. If no folder is selected, the bulk scan covers the entire vault.
- **Watch file creation**: Automatically process new Markdown files created under **Notes location**. Reload the plugin after enabling or disabling this setting so the file watcher is registered correctly.

## Usage

### Create all missing daily notes

Select the calendar-plus ribbon icon or run **Daily Notes from Others: Create all daily notes** from the command palette.

The plugin scans **Notes location**, finds one source note for each date without an existing daily note, and creates the missing notes.

### List all missing daily notes

Run **Daily Notes from Others: List all missing daily notes** from the command palette.

The plugin scans **Notes location** and opens a filterable list with one source note for each date missing a daily note. Select a result to open its source note; this command does not create anything.

### Create a daily note for the active file

Open a Markdown source note and run **Daily Notes from Others: Create daily note for this file** from the command palette.

If the filename contains a valid date in the configured format and that day's note does not exist, the plugin creates it. Otherwise, no new note is created.

### Create daily notes automatically

Enable **Watch file creation** and reload the plugin. When a new Markdown file appears under **Notes location**, the plugin checks its filename and creates the corresponding daily note when needed.

## Behavior and limitations

- The date must appear in the source filename; note properties and contents are not inspected.
- At most one daily note is created per date, even if several source files contain that date.
- Existing daily notes are never overwritten.
- Source notes are not modified, linked, copied, or merged into the daily note.
- Individual creation failures are written to the developer console, and the remaining files in a batch are still processed.

## Privacy

Daily Notes from Others operates entirely inside your Obsidian vault. It makes no network requests, collects no analytics or telemetry, and sends no filenames, note contents, or settings to third parties.

## Development

This project uses TypeScript, npm, and esbuild.

```bash
npm ci
npm run dev
```

`npm run dev` watches the source and rebuilds `main.js`. Reload Obsidian after rebuilding the plugin.

Before submitting changes, run the complete validation suite:

```bash
npm test
npm run lint
npm run build
```

## Releasing

1. Update the version in `package.json` and `manifest.json`.
2. Add the version-to-minimum-Obsidian mapping to `versions.json`.
3. Create a Git tag matching the version exactly, without a leading `v`.
4. Attach `main.js`, `manifest.json`, and `styles.css` to the GitHub release.

## License

[0BSD](LICENSE)
