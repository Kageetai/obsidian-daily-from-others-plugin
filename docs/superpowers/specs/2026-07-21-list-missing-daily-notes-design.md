# List missing daily notes command design

## Goal

Replace the persisted **Dry run** setting with an on-demand command named **List all missing daily notes**. Users can preview missing daily notes whenever needed without changing plugin configuration.

## User-visible behavior

- The settings tab no longer shows **Dry run**.
- The calendar-plus ribbon action always creates all missing daily notes.
- The existing **Create all daily notes** command always creates all missing daily notes.
- A new command named **List all missing daily notes**, with the stable ID `list-all-missing-daily-notes`, scans the configured notes location and opens the existing results modal.
- Listing notes never creates or modifies a note.
- Existing saved `dryRun` data is ignored. No migration is needed because removing the typed setting and control makes the stale property behaviorally inert.

## Implementation design

Keep the existing `findAllMissingDailyNotes` query as the common source for both actions. Replace the conditional bulk handler with two explicit callbacks:

1. A create callback finds missing notes and passes them to `createDailyNotes`.
2. A list callback finds missing notes and opens `ResultsModal`.

Register the create callback for the ribbon and existing bulk-create command. Register the list callback only as the new command. Remove `dryRun` from `PluginSettings`, `DEFAULT_SETTINGS`, and `SettingsTab`.

This explicit split is preferred over a boolean or mode parameter because each command has one obvious effect and the creation path cannot depend on persisted preview state.

## Documentation

Update the README so the feature list, configuration, usage, and limitations describe the list command instead of the removed setting.

## Testing and verification

- Add regression coverage that distinguishes the list action from the create action and confirms the dry-run setting definition is gone.
- Run the complete test suite.
- Run ESLint.
- Run the production TypeScript/esbuild build.

## Out of scope

- Adding a second ribbon icon for listing.
- Changing the results modal's filtering or navigation behavior.
- Migrating or rewriting saved plugin data solely to delete the legacy `dryRun` key.
