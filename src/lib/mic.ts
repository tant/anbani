import { AUDIO } from './recording';
import { LEAD } from './vad';

interface Mic {
	/** The live signal, for deciding when the reading starts and stops. */
	analyser: AnalyserNode;
	/** The same signal half a second later, which is what the recorder writes; see vad.ts. */
	delayed: MediaStream;
}

let stream: MediaStream | null = null;
let ctx: AudioContext | null = null;
let graph: Mic | null = null;

/**
 * One microphone for the whole session: the reader is asked for permission once, and the delay line
 * stays primed so a take can begin with the half second that came before the first sound.
 */
export async function mic(): Promise<Mic> {
	if (!graph) {
		stream = await navigator.mediaDevices.getUserMedia({
			audio: { channelCount: AUDIO.channels, sampleRate: AUDIO.sampleRate, echoCancellation: true, noiseSuppression: true }
		});
		// Resampling here rather than in the encoder keeps the whole chain at the rate speech-to-text
		// works in; a browser that refuses the rate just runs the graph at its own.
		try {
			ctx = new AudioContext({ sampleRate: AUDIO.sampleRate });
		} catch {
			ctx = new AudioContext();
		}
		const source = ctx.createMediaStreamSource(stream);
		const analyser = ctx.createAnalyser();
		analyser.fftSize = 1024;
		source.connect(analyser);

		const delay = new DelayNode(ctx, { delayTime: LEAD, maxDelayTime: LEAD * 2 });
		const out = new MediaStreamAudioDestinationNode(ctx, { channelCount: AUDIO.channels });
		source.connect(delay).connect(out);
		graph = { analyser, delayed: out.stream };
	}
	await ctx!.resume().catch(() => {});
	return graph;
}

export function releaseMic() {
	stream?.getTracks().forEach((track) => track.stop());
	void ctx?.close();
	stream = ctx = graph = null;
}

/** Loudness of the live signal, 0 to 1, for the meter and for the gate in vad.ts. */
export function levelOf(analyser: Pick<AnalyserNode, 'getByteTimeDomainData'>, buffer: Uint8Array<ArrayBuffer>) {
	analyser.getByteTimeDomainData(buffer);
	let peak = 0;
	for (const sample of buffer) peak = Math.max(peak, Math.abs(sample - 128));
	// Speech close to the phone rarely fills the range; 96 of 128 reads as a full bar.
	return Math.min(1, peak / 96);
}
