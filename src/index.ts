type VGSOptionType = 'category' | 'line';

export interface VGSOption {
	type: VGSOptionType;
	name?: string;
	file?: string;
	phrase?: string;
}

export interface VGSMatch {
	type: VGSOptionType;
	command: string;
	key: string;
	name?: string;
	file?: string;
	phrase?: string;
}

/**
 * VGS configuration.
 */
export interface VGSConfig {
	/**
	 * The VGS options.
	 */
	options: Record<string, VGSOption>;
	/**
	 * The duration (in ms) to wait for further keypresses before timing out.\
	 * Set this to `0` to disable the timeout.
	 * 
	 * _Optional, default: `3000`_
	 */
	timeout?: number;
	/**
	 * The key (or keys) used to trigger VGS.
	 * Set this to an array to allow any of the provided keys to trigger VGS.
	 * 
	 * _Optional, default: `"V"`_
	 */
	trigger?: string | string[];
	/**
	 * The key (or keys) used to cancel the current VGS sequence.
	 * Set this to an array to allow any of the provided keys to cancel the sequence.
	 * 
	 * _Optional, default: `"Escape"`_
	 */
	cancel?: string | string[];
}

type VGSEvent = 'cancel' | 'options' | 'match' | 'timeout' | 'trigger';
type VGSCallback<T extends VGSEvent> =
	T extends 'cancel'  ? () => void:
	T extends 'options' ? (options: VGSMatch[]) => void:
	T extends 'match'   ? (match: VGSMatch) => void:
	T extends 'timeout' ? () => void:
	T extends 'trigger' ? () => void:
	never;

/**
 * A Voice Game System (VGS) command processor.
 * 
 * @param config The VGS configuration.
 */
export class VGS {
	private config: Required<VGSConfig>;
	private callbacks = {
		cancel:  <VGSCallback<'cancel'>[]>  [],
		options: <VGSCallback<'options'>[]> [],
		match:   <VGSCallback<'match'>[]>   [],
		timeout: <VGSCallback<'timeout'>[]> [],
		trigger: <VGSCallback<'trigger'>[]> []
	};
	private options: { command: string, option: VGSOption }[];
	private sequence: string[] = [];
	private timer: number | undefined;

	constructor(config: VGSConfig) {
		this.config = {
			options: config.options,
			timeout: config.timeout ?? 3000,
			trigger: this.allToUpperCase(config.trigger || '') || 'V',
			cancel: this.allToUpperCase(config.cancel || '') || 'ESCAPE'
		};
		this.options = Object
			.entries(this.config.options)
			.map(([ command, option ]) => ({ command, option }));
	}

	private allToUpperCase(value: string | string[]): string | string[] {
		if (typeof value === 'string') {
			return value.toUpperCase();
		}
		return value.map(key => key.toUpperCase());
	}

	private isCancelKey(key: string): boolean {
		if (typeof this.config.cancel === 'string') {
			return this.config.cancel === key;
		}
		return this.config.cancel.includes(key);
	}

	private isTriggerKey(key: string): boolean {
		if (typeof this.config.trigger === 'string') {
			return this.config.trigger === key;
		}
		return this.config.trigger.includes(key);
	}

	private reset(): void {
		this.sequence = [];
		globalThis.clearTimeout(this.timer);
	}

	private timeout(): void {
		this.reset();
		for (const callback of this.callbacks.timeout) {
			callback();
		}
	}

	private processSequence(): void {
		// Get the available options from the current sequence.
		const command = this.sequence.join('');
		const match = this.options.find(option => option.command === command);
		const options = this.options
			.filter(option => option.command.length === command.length + 1)
			.filter(option => option.command.startsWith(command));

		// A match was found.
		if (match && match.option.type === 'line') {
			for (const callback of this.callbacks.match) {
				callback({
					...match.option,
					key: match.command.at(-1)!,
					command: match.command
				});
			}
			this.reset();
		}

		// Some options were found.
		if (options.length) {
			for (const callback of this.callbacks.options) {
				callback(options.map(option => ({
					...option.option,
					key: option.command.at(-1)!,
					command: option.command
				})));
			}
		}

		// No matches or options were found.
		if (!match && !options.length) {
			this.cancel();
		}
	}

	/**
	 * Send a keypress to the VGS.
	 * 
	 * @param key The key that was pressed. For example, `"V"`.
	 * @note This is case insensitive.
	 */
	public press(key: string): void {
		key = key.toUpperCase();
		const isCancel = this.isCancelKey(key);
		const isLong = key.length > 1;
		const isTrigger = this.isTriggerKey(key);

		if (isCancel || isLong) {
			this.cancel();
			return;
		}
		if (!this.sequence.length && !isTrigger) {
			return;
		}

		globalThis.clearTimeout(this.timer);
		if (this.config.timeout) {
			this.timer = globalThis.setTimeout(() => this.timeout(), this.config.timeout);
		}
		for (const callback of this.callbacks.trigger) {
			callback();
		}
		this.sequence.push(key);
		this.processSequence();
	}

	/**
	 * Cancel the current VGS sequence.
	 * 
	 * @note This will fire the `cancel` event.
	 */
	public cancel(): void {
		this.reset();
		for (const callback of this.callbacks.cancel) {
			callback();
		}
	}

	/**
	 * Register a function to be called when a particular event is fired.
	 * 
	 * @param event The event to listen to.
	 * @param callback The function to call.
	 */
	public on<T extends VGSEvent>(event: T, callback: VGSCallback<T>): void {
		(this.callbacks[event] as VGSCallback<T>[]).push(callback);
	}
}
