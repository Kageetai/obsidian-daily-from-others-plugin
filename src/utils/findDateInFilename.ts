import type { moment } from 'obsidian';

type Moment = moment.Moment;

export function getFilenameDateFormat(
	format: string | undefined,
	fallbackFormat: string,
): string {
	return format?.split('/').pop() || fallbackFormat;
}

export function findDateInFilename(
	filename: string,
	format: string,
	parseMoment: typeof moment,
): Moment | null {
	for (let start = 0; start < filename.length; start++) {
		const remainingFilename = filename.slice(start);
		const date = parseMoment(remainingFilename, format, false);

		if (
			date.isValid() &&
			remainingFilename.startsWith(date.format(format))
		) {
			return date;
		}
	}

	return null;
}
