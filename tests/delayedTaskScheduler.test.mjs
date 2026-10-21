import assert from 'node:assert/strict';
import test from 'node:test';
import { DelayedTaskScheduler } from '../src/utils/delayedTaskScheduler.ts';

class FakeTimer {
	now = 0;
	nextId = 1;
	tasks = new Map();

	setTimeout(task, delayMs) {
		const timeoutId = this.nextId++;
		this.tasks.set(timeoutId, { task, runAt: this.now + delayMs });
		return timeoutId;
	}

	clearTimeout(timeoutId) {
		this.tasks.delete(timeoutId);
	}

	tick(durationMs) {
		this.now += durationMs;
		for (const [timeoutId, scheduledTask] of this.tasks) {
			if (scheduledTask.runAt <= this.now) {
				this.tasks.delete(timeoutId);
				scheduledTask.task();
			}
		}
	}
}

void test('waits for the configured delay before running a task', () => {
	const timer = new FakeTimer();
	const scheduler = new DelayedTaskScheduler(timer);
	let calls = 0;

	scheduler.schedule(() => calls++, 500);
	timer.tick(499);
	assert.equal(calls, 0);

	timer.tick(1);
	assert.equal(calls, 1);
});

void test('cancels pending tasks', () => {
	const timer = new FakeTimer();
	const scheduler = new DelayedTaskScheduler(timer);
	let calls = 0;

	scheduler.schedule(() => calls++, 500);
	scheduler.cancelAll();
	timer.tick(500);

	assert.equal(calls, 0);
});
