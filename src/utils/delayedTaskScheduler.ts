interface Timer {
	setTimeout(task: () => void, delayMs: number): number;
	clearTimeout(timeoutId: number): void;
}

export class DelayedTaskScheduler {
	private pendingTasks = new Set<number>();
	private readonly timer: Timer;

	constructor(timer: Timer = window) {
		this.timer = timer;
	}

	schedule(task: () => void, delayMs: number): void {
		const timeoutId = this.timer.setTimeout(() => {
			this.pendingTasks.delete(timeoutId);
			task();
		}, delayMs);
		this.pendingTasks.add(timeoutId);
	}

	cancelAll(): void {
		for (const timeoutId of this.pendingTasks) {
			this.timer.clearTimeout(timeoutId);
		}
		this.pendingTasks.clear();
	}
}
