import assert from 'node:assert/strict';
import test from 'node:test';
import {
	DEFAULT_SETTINGS,
	normalizeDebounceDelay,
	SETTING_DEFINITIONS,
} from '../src/settingsConfig.ts';

void test('settings contain only active options', () => {
	assert.deepEqual(DEFAULT_SETTINGS, {
		debounceDelay: 500,
		notesLocation: '',
		watchFileCreation: false,
		waitForSync: true,
	});
	assert.deepEqual(
		SETTING_DEFINITIONS.map(({ name, control }) => ({
			name,
			key: control.key,
		})),
		[
			{ name: 'Notes location', key: 'notesLocation' },
			{ name: 'Watch file creation', key: 'watchFileCreation' },
			{ name: 'Debounce delay (ms)', key: 'debounceDelay' },
			{ name: 'Wait for Obsidian Sync', key: 'waitForSync' },
		],
	);
	const debounceSetting = SETTING_DEFINITIONS.find(
		({ control }) => control.key === 'debounceDelay',
	);
	assert.deepEqual(debounceSetting?.control, {
		type: 'number',
		key: 'debounceDelay',
		min: 0,
	});
});

void test('normalizes persisted debounce delays', () => {
	assert.equal(normalizeDebounceDelay(250), 250);
	assert.equal(normalizeDebounceDelay(-1), 0);
	assert.equal(normalizeDebounceDelay(Number.NaN), 500);
	assert.equal(normalizeDebounceDelay('250'), 500);
});
