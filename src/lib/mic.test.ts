import { describe, expect, it } from 'vitest';
import { levelOf } from './mic';

const signal = (peak: number) => ({
	getByteTimeDomainData(buffer: Uint8Array) {
		buffer.fill(128);
		buffer[0] = 128 + peak;
	}
});

describe('levelOf', () => {
	it('reads silence as an empty meter', () => {
		expect(levelOf(signal(0), new Uint8Array(8))).toBe(0);
	});

	it('rises with the loudest sample in the window', () => {
		expect(levelOf(signal(48), new Uint8Array(8))).toBeCloseTo(0.5);
	});

	it('fills the bar before the signal clips, and never overflows', () => {
		expect(levelOf(signal(96), new Uint8Array(8))).toBe(1);
		expect(levelOf(signal(127), new Uint8Array(8))).toBe(1);
	});
});
