import assert from 'node:assert/strict';
import test from 'node:test';
import moment from 'moment';
import {
	findDateInFilename,
	getFilenameDateFormat,
} from '../src/utils/findDateInFilename.ts';

void test('uses the filename segment of a nested daily-note format', () => {
	assert.equal(
		getFilenameDateFormat('YYYY/MM/YYYY-MM-DD', 'YYYY-MM-DD'),
		'YYYY-MM-DD',
	);
});

void test('finds a date at the start of a filename', () => {
	const date = findDateInFilename(
		'2026-07-16T1234 foo bar',
		'YYYY-MM-DD',
		moment,
	);

	assert.equal(date?.format('YYYY-MM-DD'), '2026-07-16');
});

void test('finds a date after ordinary filename text', () => {
	const date = findDateInFilename(
		'Voicenote 2026-07-16T1234 foo bar',
		'YYYY-MM-DD',
		moment,
	);

	assert.equal(date?.format('YYYY-MM-DD'), '2026-07-16');
});

void test('ignores unrelated digits before the formatted date', () => {
	const date = findDateInFilename(
		'Voicenote 999 2026-07-16T1234 foo bar',
		'YYYY-MM-DD',
		moment,
	);

	assert.equal(date?.format('YYYY-MM-DD'), '2026-07-16');
});

void test('rejects an impossible formatted date', () => {
	const date = findDateInFilename(
		'Voicenote 2026-02-31 foo bar',
		'YYYY-MM-DD',
		moment,
	);

	assert.equal(date, null);
});

void test('returns null when the filename has no formatted date', () => {
	const date = findDateInFilename(
		'Voicenote without a date',
		'YYYY-MM-DD',
		moment,
	);

	assert.equal(date, null);
});
