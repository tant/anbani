import { AUDIO } from './recording';

let stream: MediaStream | null = null;
let ctx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;

/**
 * One microphone for the whole session: the reader is asked for permission once, and the level
 * meter reads from the same stream the recorder writes.
 */
export async function mic() {
	if (!stream) {
		stream = await navigator.mediaDevices.getUserMedia({
			audio: { channelCount: AUDIO.channels, sampleRate: AUDIO.sampleRate, echoCancellation: true, noiseSuppression: true }
		});
		ctx = new AudioContext();
		analyser = ctx.createAnalyser();
		analyser.fftSize = 1024;
		ctx.createMediaStreamSource(stream).connect(analyser);
	}
	await ctx!.resume().catch(() => {});
	return { stream, analyser: analyser! };
}

export function releaseMic() {
	stream?.getTracks().forEach((track) => track.stop());
	void ctx?.close();
	stream = ctx = analyser = null;
}

/** Loudness of the live signal, 0 to 1, for the meter that tells the reader the mic is hearing them. */
export function levelOf(analyser: Pick<AnalyserNode, 'getByteTimeDomainData'>, buffer: Uint8Array<ArrayBuffer>) {
	analyser.getByteTimeDomainData(buffer);
	let peak = 0;
	for (const sample of buffer) peak = Math.max(peak, Math.abs(sample - 128));
	// Speech close to the phone rarely fills the range; 96 of 128 reads as a full bar.
	return Math.min(1, peak / 96);
}
