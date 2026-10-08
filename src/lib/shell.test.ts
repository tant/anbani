import { describe, expect, it } from 'vitest';
import { preferCached, worthKeeping } from './shell';

const ORIGIN = 'https://anbani.korbvazi.com';

describe('worthKeeping', () => {
	it('keeps a real page from this origin', () => {
		expect(worthKeeping({ ok: true, url: `${ORIGIN}/learn` }, ORIGIN)).toBe(true);
	});

	it('refuses the 502 the proxy serves while a deploy swaps containers', () => {
		expect(worthKeeping({ ok: false, url: `${ORIGIN}/` }, ORIGIN)).toBe(false);
	});

	it('refuses a page that was not found', () => {
		expect(worthKeeping({ ok: false, url: `${ORIGIN}/nope` }, ORIGIN)).toBe(false);
	});

	it('refuses a response that ended up on another origin', () => {
		expect(worthKeeping({ ok: true, url: 'https://elsewhere.example/' }, ORIGIN)).toBe(false);
	});

	it('refuses a response with no usable address', () => {
		expect(worthKeeping({ ok: true, url: '' }, ORIGIN)).toBe(false);
	});
});

describe('preferCached', () => {
	it('answers a server error from the last good copy', () => {
		expect(preferCached({ status: 502 })).toBe(true);
		expect(preferCached({ status: 500 })).toBe(true);
	});

	it('lets a real answer through, including a genuine 404', () => {
		expect(preferCached({ status: 200 })).toBe(false);
		expect(preferCached({ status: 404 })).toBe(false);
	});
});
