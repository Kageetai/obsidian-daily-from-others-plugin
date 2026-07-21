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
