import { describe, expect, it } from 'vitest';
import { LEAD, MAX, newGate, PATIENCE, step, TAIL, trigger } from './vad';

/** Plays a signal through the gate and reports what it decided, frame by frame. */
function run(frames: [level: number, at: number][]) {
	const gate = newGate();
	return frames.map(([level, at]) => step(gate, level, at));
}

describe('trigger', () => {
	it('never asks for more than ordinary speech, however noisy the room', () => {
		expect(trigger(0.5)).toBe(0.3);
	});

	it('never drops below the floor, however quiet the room', () => {
		expect(trigger(0)).toBe(0.1);
	});

	it('rises above a noisy room so hiss does not start a take', () => {
		expect(trigger(0.06)).toBeCloseTo(0.18);
	});
});

describe('step', () => {
	it('waits while the room is quiet, then opens on the first sound', () => {
		expect(run([
			[0.02, 0],
			[0.03, 0.1],
			[0.6, 0.2],
			[0.5, 0.3]
		])).toEqual(['wait', 'wait', 'open', 'keep']);
	});

	it('closes a full second after the last sound, which leaves the lead and the tail', () => {
		const gate = newGate();
		step(gate, 0.02, 0);
		expect(step(gate, 0.6, 0.2)).toBe('open');
		expect(step(gate, 0.02, 0.2 + LEAD + TAIL - 0.1)).toBe('keep');
		expect(step(gate, 0.02, 0.2 + LEAD + TAIL)).toBe('close');
	});

	it('treats a short pause inside a phrase as part of the reading', () => {
		const gate = newGate();
		step(gate, 0.02, 0);
		step(gate, 0.6, 0.2);
		expect(step(gate, 0.02, 0.7)).toBe('keep');
		expect(step(gate, 0.6, 0.9)).toBe('keep');
		expect(step(gate, 0.02, 1.6)).toBe('keep');
		expect(step(gate, 0.02, 1.95)).toBe('close');
	});

	it('gives up when nothing is said at all', () => {
		const gate = newGate();
		expect(step(gate, 0.01, PATIENCE - 0.1)).toBe('wait');
		expect(step(gate, 0.01, PATIENCE)).toBe('silent');
	});

	it('stops a take that runs on, even while sound keeps coming', () => {
		const gate = newGate();
		step(gate, 0.6, 0);
		expect(step(gate, 0.6, MAX - 0.1)).toBe('keep');
		expect(step(gate, 0.6, MAX)).toBe('close');
	});

	it('ignores hiss in a noisy room but still hears speech over it', () => {
		expect(run([
			[0.07, 0],
			[0.08, 0.1],
			[0.09, 0.2],
			[0.5, 0.3]
		])).toEqual(['wait', 'wait', 'wait', 'open']);
	});
});
