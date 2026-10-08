import { ALPHABET, type Lang } from './letters';

/**
 * What a native speaker is asked to read. The catalogue lives in the repo, like the letters: it is
 * versioned, reviewable in a pull request, and works offline. Only the recordings themselves live in
 * PocketBase, keyed by `id`.
 *
 * The words, clusters and phrases below are a draft written from reference material; the speaker
 * checks the spelling before recording, and anything they flag gets fixed here.
 */
export type ItemType = 'letter' | 'cluster' | 'word' | 'phrase';

/**
 * Takes per item: every item is read exactly three times in one sitting, and all three are kept.
 * Three is a requirement, not a ceiling — an item with fewer still counts as unrecorded.
 */
export const TAKES = 3;

export interface Item {
	/** Stable key for the recording; never reused for different text. */
	id: string;
	type: ItemType;
	/** Georgian text to read aloud. */
	text: string;
	/** For clusters: a real word that carries it, so the reader says it naturally. */
	example?: string;
	translit: string;
	meaning?: Record<Lang, string>;
}

const letters: Item[] = ALPHABET.map((l) => ({
	id: `letter:${l.char}`,
	type: 'letter',
	text: l.char,
	translit: l.translit
}));

/** Consonant runs that trip up learners; the example word is what the reader actually says. */
const clusters: Item[] = [
	{ id: 'cluster:mts-v', text: 'მწვ', example: 'მწვანე', translit: "mts'v", meaning: { vi: 'xanh lá', en: 'green' } },
	{ id: 'cluster:brts-q', text: 'ბრწყ', example: 'ბრწყინვალე', translit: "brts'q'", meaning: { vi: 'rực rỡ', en: 'brilliant' } },
	{ id: 'cluster:tskhv', text: 'ცხვ', example: 'ცხვირი', translit: 'tskhv', meaning: { vi: 'mũi', en: 'nose' } },
	{ id: 'cluster:tkb', text: 'ტკბ', example: 'ტკბილი', translit: "t'k'b", meaning: { vi: 'ngọt', en: 'sweet' } },
	{ id: 'cluster:skhv', text: 'სხვ', example: 'სხვა', translit: 'skhv', meaning: { vi: 'khác', en: 'other' } },
	{ id: 'cluster:tkv', text: 'თქვ', example: 'თქვენ', translit: 'tkv', meaning: { vi: 'các bạn', en: 'you (plural)' } },
	{ id: 'cluster:vkhvd', text: 'ვხვდ', example: 'ვხვდები', translit: 'vkhvd', meaning: { vi: 'tôi hiểu ra', en: 'I realise' } },
	{ id: 'cluster:mkvl', text: 'მკვლ', example: 'მკვლევარი', translit: "mk'vl", meaning: { vi: 'nhà nghiên cứu', en: 'researcher' } },
	{ id: 'cluster:prtskvn', text: 'ფრცქვ', example: 'გვფრცქვნი', translit: 'prtskv', meaning: { vi: 'bạn bóc vỏ cho chúng tôi', en: 'you peel us' } },
	{ id: 'cluster:dzv', text: 'ძვ', example: 'ძვირი', translit: 'dzv', meaning: { vi: 'đắt', en: 'expensive' } }
].map((c) => ({ ...c, type: 'cluster' as const }));

const words: Item[] = [
	{ id: 'word:water', text: 'წყალი', translit: "ts'q'ali", meaning: { vi: 'nước', en: 'water' } },
	{ id: 'word:bread', text: 'პური', translit: "p'uri", meaning: { vi: 'bánh mì', en: 'bread' } },
	{ id: 'word:wine', text: 'ღვინო', translit: 'ghvino', meaning: { vi: 'rượu vang', en: 'wine' } },
	{ id: 'word:coffee', text: 'ყავა', translit: "q'ava", meaning: { vi: 'cà phê', en: 'coffee' } },
	{ id: 'word:tea', text: 'ჩაი', translit: 'chai', meaning: { vi: 'trà', en: 'tea' } },
	{ id: 'word:house', text: 'სახლი', translit: 'sakhli', meaning: { vi: 'nhà', en: 'house' } },
	{ id: 'word:city', text: 'ქალაქი', translit: 'kalaki', meaning: { vi: 'thành phố', en: 'city' } },
	{ id: 'word:street', text: 'ქუჩა', translit: 'kucha', meaning: { vi: 'đường phố', en: 'street' } },
	{ id: 'word:friend', text: 'მეგობარი', translit: 'megobari', meaning: { vi: 'bạn', en: 'friend' } },
	{ id: 'word:mother', text: 'დედა', translit: 'deda', meaning: { vi: 'mẹ', en: 'mother' } },
	{ id: 'word:father', text: 'მამა', translit: 'mama', meaning: { vi: 'cha', en: 'father' } },
	{ id: 'word:child', text: 'ბავშვი', translit: 'bavshvi', meaning: { vi: 'đứa trẻ', en: 'child' } },
	{ id: 'word:day', text: 'დღე', translit: 'dghe', meaning: { vi: 'ngày', en: 'day' } },
	{ id: 'word:night', text: 'ღამე', translit: 'ghame', meaning: { vi: 'đêm', en: 'night' } },
	{ id: 'word:man', text: 'კაცი', translit: "k'atsi", meaning: { vi: 'người đàn ông', en: 'man' } },
	{ id: 'word:woman', text: 'ქალი', translit: 'kali', meaning: { vi: 'người phụ nữ', en: 'woman' } },
	{ id: 'word:book', text: 'წიგნი', translit: "ts'igni", meaning: { vi: 'quyển sách', en: 'book' } },
	{ id: 'word:car', text: 'მანქანა', translit: 'mankana', meaning: { vi: 'xe hơi', en: 'car' } },
	{ id: 'word:shop', text: 'მაღაზია', translit: 'maghazia', meaning: { vi: 'cửa hàng', en: 'shop' } },
	{ id: 'word:good', text: 'კარგი', translit: "k'argi", meaning: { vi: 'tốt', en: 'good' } },
	{ id: 'word:bad', text: 'ცუდი', translit: 'tsudi', meaning: { vi: 'tệ', en: 'bad' } },
	{ id: 'word:big', text: 'დიდი', translit: 'didi', meaning: { vi: 'to', en: 'big' } },
	{ id: 'word:small', text: 'პატარა', translit: "p'at'ara", meaning: { vi: 'nhỏ', en: 'small' } },
	{ id: 'word:green', text: 'მწვანე', translit: "mts'vane", meaning: { vi: 'màu xanh lá', en: 'green' } }
].map((w) => ({ ...w, type: 'word' as const }));

const phrases: Item[] = [
	{ id: 'phrase:hello', text: 'გამარჯობა', translit: 'gamarjoba', meaning: { vi: 'xin chào', en: 'hello' } },
	{ id: 'phrase:morning', text: 'დილა მშვიდობისა', translit: 'dila mshvidobisa', meaning: { vi: 'chào buổi sáng', en: 'good morning' } },
	{ id: 'phrase:evening', text: 'საღამო მშვიდობისა', translit: 'saghamo mshvidobisa', meaning: { vi: 'chào buổi tối', en: 'good evening' } },
	{ id: 'phrase:night', text: 'ღამე მშვიდობისა', translit: 'ghame mshvidobisa', meaning: { vi: 'chúc ngủ ngon', en: 'good night' } },
	{ id: 'phrase:how-are-you', text: 'როგორ ხარ?', translit: 'rogor khar?', meaning: { vi: 'bạn khoẻ không?', en: 'how are you?' } },
	{ id: 'phrase:im-fine', text: 'კარგად ვარ, მადლობა', translit: "k'argad var, madloba", meaning: { vi: 'tôi khoẻ, cảm ơn', en: 'I am well, thank you' } },
	{ id: 'phrase:thanks', text: 'მადლობა', translit: 'madloba', meaning: { vi: 'cảm ơn', en: 'thank you' } },
	{ id: 'phrase:thanks-a-lot', text: 'დიდი მადლობა', translit: 'didi madloba', meaning: { vi: 'cảm ơn nhiều', en: 'thank you very much' } },
	{ id: 'phrase:youre-welcome', text: 'არაფრის', translit: 'arapris', meaning: { vi: 'không có gì', en: "you're welcome" } },
	{ id: 'phrase:sorry', text: 'ბოდიში', translit: 'bodishi', meaning: { vi: 'xin lỗi', en: 'sorry' } },
	{ id: 'phrase:please', text: 'გთხოვთ', translit: 'gtkhovt', meaning: { vi: 'làm ơn', en: 'please' } },
	{ id: 'phrase:yes', text: 'დიახ', translit: 'diakh', meaning: { vi: 'vâng', en: 'yes' } },
	{ id: 'phrase:no', text: 'არა', translit: 'ara', meaning: { vi: 'không', en: 'no' } },
	{ id: 'phrase:goodbye', text: 'ნახვამდის', translit: 'nakhvamdis', meaning: { vi: 'tạm biệt', en: 'goodbye' } },
	{ id: 'phrase:how-much', text: 'რა ღირს?', translit: 'ra ghirs?', meaning: { vi: 'cái này bao nhiêu?', en: 'how much is it?' } },
	{ id: 'phrase:dont-understand', text: 'არ მესმის', translit: 'ar mesmis', meaning: { vi: 'tôi không hiểu', en: "I don't understand" } },
	{ id: 'phrase:where-is', text: 'სად არის?', translit: 'sad aris?', meaning: { vi: 'ở đâu?', en: 'where is it?' } },
	{ id: 'phrase:my-name-is', text: 'მე მქვია', translit: 'me mkvia', meaning: { vi: 'tôi tên là', en: 'my name is' } }
].map((p) => ({ ...p, type: 'phrase' as const }));

export const CATALOGUE: Item[] = [...letters, ...clusters, ...words, ...phrases];

/**
 * How a take is encoded. Speech at one channel and 16 kHz is what a speech-to-text engine resamples
 * to anyway, and ~24 kbps of Opus keeps a few seconds of audio in a couple of kilobytes, so the
 * reader can send a whole session over mobile data. The server caps each take at the same size.
 */
export const AUDIO = {
	channels: 1,
	sampleRate: 16_000,
	bitrate: 24_000,
	maxBytes: 512 * 1024,
	/** A take is a letter, a word or a short phrase; anything longer is a stuck recorder. */
	maxSeconds: 10
};

/** Opus first; Safari offers neither container and records AAC in an MP4 instead. */
const CONTAINERS = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'];

export const pickMime = (supported: (mime: string) => boolean) => CONTAINERS.find(supported);

/** PocketBase matches the field's allowed types against a bare type, without the codec parameter. */
export const baseMime = (mime: string) => mime.split(';')[0];

export const extensionFor = (mime: string) =>
	mime.includes('webm') ? 'webm' : mime.includes('ogg') ? 'ogg' : 'm4a';

/**
 * A readable name for the stored file. The item id carries Georgian letters, which the server strips
 * out, leaving files nobody can tell apart; the reading survives ASCII and says which item it is.
 */
export const takeName = (item: Item, take: number, mime: string) =>
	`${`${item.type}-${item.translit}`.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'take'}-${take}.${extensionFor(mime)}`;

/**
 * The next item still missing takes, carrying on from the one just finished and wrapping around, so
 * a reader who starts in the middle of the list still gets shown everything that is left.
 */
export function nextUnrecorded(done: Set<string>, afterId?: string) {
	const from = afterId ? CATALOGUE.findIndex((i) => i.id === afterId) + 1 : 0;
	return [...CATALOGUE.slice(from), ...CATALOGUE.slice(0, from)].find((i) => !done.has(i.id));
}

export const ITEM_TYPES: ItemType[] = ['letter', 'cluster', 'word', 'phrase'];

export const byType = (type: ItemType) => CATALOGUE.filter((i) => i.type === type);

/** How much of the catalogue is recorded, for the progress screen. */
export function recordedCount(done: Set<string>, type?: ItemType) {
	const items = type ? byType(type) : CATALOGUE;
	return { done: items.filter((i) => done.has(i.id)).length, total: items.length };
}
