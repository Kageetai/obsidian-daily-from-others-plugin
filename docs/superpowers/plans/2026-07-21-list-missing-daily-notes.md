# List Missing Daily Notes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the persisted dry-run toggle and add an on-demand **List all missing daily notes** command while keeping all creation actions immediate.

**Architecture:** Keep command registration in `main.ts`, using explicit create/list callbacks so each action has one effect. Extract only the settings configuration so Node's built-in test runner can verify the active settings without loading Obsidian's runtime.

**Tech Stack:** TypeScript 5.8, Obsidian 1.13 API, Node.js built-in test runner, esbuild, ESLint.

## Global Constraints

- The new command name is exactly **List all missing daily notes** and its stable ID is `list-all-missing-daily-notes`.
- The new list action is command-palette-only; do not add a ribbon icon.
- The existing ribbon and **Create all daily notes** command always create notes immediately.
- Listing notes must not create or modify notes.
- Ignore legacy saved `dryRun` data; do not add a migration.
- Keep the plugin local/offline and compatible with desktop and mobile Obsidian.
- Do not commit generated `main.js` or dependencies.

---

### Task 1: Separate bulk command behaviors in the plugin lifecycle

**Files:**
- Modify: `src/main.ts:1-91`

**Interfaces:**
- Consumes: the existing `findAllMissingDailyNotes`, `createDailyNotes`, and `ResultsModal` behavior.
- Produces: two zero-argument callbacks, `createAllDailyNotes` and `listAllMissingDailyNotes`, registered directly in `main.ts`.

- [ ] **Step 1: Replace the setting-dependent callback with explicit actions**

Replace `openModalOrCreateDailyNotes` in `src/main.ts` with:

```ts
	createAllDailyNotes = () => {
		void this.createDailyNotes(this.findAllMissingDailyNotes());
	};

	listAllMissingDailyNotes = () => {
		new ResultsModal(this.app, this.findAllMissingDailyNotes()).open();
	};
```

- [ ] **Step 2: Register both commands directly in `main.ts`**

Register the ribbon with `this.createAllDailyNotes`. Keep the existing creation command and add the listing command directly:

```ts
		this.addCommand({
			id: 'open-modal-simple',
			name: 'Create all daily notes',
			callback: this.createAllDailyNotes,
		});
		this.addCommand({
			id: 'list-all-missing-daily-notes',
			name: 'List all missing daily notes',
			callback: this.listAllMissingDailyNotes,
		});
```

- [ ] **Step 3: Run existing tests and the production build**

Run: `npm test`

Expected: all existing tests pass.

Run: `npm run build`

Expected: TypeScript type-checking and the production esbuild bundle both exit 0.

- [ ] **Step 4: Commit the command split**

```bash
git add src/main.ts
git commit -m "feat: add list missing daily notes command"
```

### Task 2: Remove dry run from settings configuration

**Files:**
- Create: `src/settingsConfig.ts`
- Modify: `src/settings.ts:1-42`
- Modify: `src/main.ts:1-4`
- Test: `tests/settingsConfig.test.mjs`

**Interfaces:**
- Consumes: Obsidian's `SettingDefinitionItem` as a type-only dependency.
- Produces: `PluginSettings`, `DEFAULT_SETTINGS`, and `SETTING_DEFINITIONS` for the lifecycle and settings tab.

- [ ] **Step 1: Write the failing settings regression test**

Create `tests/settingsConfig.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import {
	DEFAULT_SETTINGS,
	SETTING_DEFINITIONS,
} from '../src/settingsConfig.ts';

void test('settings contain only active options', () => {
	assert.deepEqual(DEFAULT_SETTINGS, {
		notesLocation: '',
		watchFileCreation: false,
	});
	assert.deepEqual(
		SETTING_DEFINITIONS.map(({ name, control }) => ({
			name,
			key: control.key,
		})),
		[
			{ name: 'Notes location', key: 'notesLocation' },
			{ name: 'Watch file creation', key: 'watchFileCreation' },
		],
	);
});
```

- [ ] **Step 2: Run the settings test and verify RED**

Run: `node --test tests/settingsConfig.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/settingsConfig.ts`.

- [ ] **Step 3: Extract the pure settings configuration without dry run**

Create `src/settingsConfig.ts`:

```ts
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
```

Update `src/settings.ts` to import `SETTING_DEFINITIONS`, remove the interface/default constants, and return `SETTING_DEFINITIONS` from `getSettingDefinitions()`. Update `src/main.ts` to import `DEFAULT_SETTINGS` and `PluginSettings` from `./settingsConfig`, while importing only `SettingsTab` from `./settings`.

- [ ] **Step 4: Run the settings and complete unit suites**

Run: `node --test tests/settingsConfig.test.mjs`

Expected: 1 test passes, 0 fail.

Run: `npm test`

Expected: all command, settings, and filename tests pass.

- [ ] **Step 5: Commit the settings removal**

```bash
git add src/settingsConfig.ts src/settings.ts src/main.ts tests/settingsConfig.test.mjs
git commit -m "refactor: remove dry run setting"
```

### Task 3: Update user documentation and verify the release build

**Files:**
- Modify: `README.md:10-108`

**Interfaces:**
- Consumes: the finalized command name **List all missing daily notes**.
- Produces: user documentation matching the plugin behavior.

- [ ] **Step 1: Update the README references**

Make these exact content changes:

- Replace the feature bullet about a dry-run preview with: `Lists one source note for each date missing a daily note, with filtering and quick access to the source note.`
- Remove the **Dry run** bullet from **Configuration**.
- In **Create all missing daily notes**, remove the sentence about enabling **Dry run**.
- Add a **List all missing daily notes** usage section explaining that the command scans **Notes location**, opens the filterable results list, and lets users open a source note without creating anything.
- Remove the dry-run limitation bullet from **Behavior and limitations**.

- [ ] **Step 2: Check documentation and source consistency**

Run: `rg -n -i 'dry.?run|list all missing daily notes' README.md src tests`

Expected: no dry-run matches; the new command name appears in the README, source, and command test.

- [ ] **Step 3: Run complete verification**

Run: `npm test`

Expected: all tests pass.

Run: `npm run lint`

Expected: ESLint exits 0 with no errors.

Run: `npm run build`

Expected: TypeScript type-checking and the production esbuild bundle both exit 0.

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 4: Commit documentation and final verification state**

```bash
git add README.md
git commit -m "docs: document list missing daily notes command"
```
