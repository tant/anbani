/**
 * Deciding when a take begins and ends from the live signal, so a stored take is the reading itself
 * and not a minute of room noise around it.
 *
 * The reader taps once and speaks. The microphone is heard twice over: live, to decide, and through
 * a half-second delay, which is what the recorder writes. Starting the recorder the moment speech is
 * heard therefore captures the half second that came *before* it, and stopping a full second after
 * the last sound leaves half a second of quiet at the end. Nothing has to be cut afterwards, so the
 * take stays exactly as the encoder produced it.
 */

/** Quiet kept before the first sound, in seconds; also the delay the recorder reads through. */
export const LEAD = 0.5;
/** Quiet kept after the last sound. */
export const TAIL = 0.5;
/** Give up if the reader says nothing: the microphone may be muted or pointing the wrong way. */
export const PATIENCE = 8;
/** One item is a letter, a word or a short phrase; past this the recorder is stuck on noise. */
export const MAX = 10;
/** Below this the signal is treated as silence however quiet the room is. */
export const FLOOR = 0.1;

export interface Gate {
	/** Quietest level seen before the first sound; the threshold rides on top of it. */
	floor: number;
	voiced: boolean;
	/** When the signal last rose above the threshold, in seconds since listening began. */
	lastVoice: number;
}

export const newGate = (): Gate => ({ floor: 1, voiced: false, lastVoice: 0 });

/**
 * A noisy room raises the bar, a quiet one does not lower it below FLOOR, and no room raises it so
 * far that ordinary speech stops counting.
 */
export const trigger = (floor: number) => Math.min(0.3, Math.max(FLOOR, floor * 3));

export type Step = 'wait' | 'open' | 'keep' | 'close' | 'silent';

/** What to do with a signal of `level`, `now` seconds after listening began. */
export function step(gate: Gate, level: number, now: number): Step {
	if (!gate.voiced) {
		// Learn the room only from the quiet part, or one loud first frame would set the bar too high.
		if (level < 0.3) gate.floor = Math.min(gate.floor, level);
		if (level > trigger(gate.floor)) {
			gate.voiced = true;
			gate.lastVoice = now;
			return 'open';
		}
		return now >= PATIENCE ? 'silent' : 'wait';
	}
	if (level > trigger(gate.floor)) gate.lastVoice = now;
	if (now >= MAX || now - gate.lastVoice >= LEAD + TAIL) return 'close';
	return 'keep';
}
