export type Lang = 'vi' | 'en';

/** Letters whose sounds learners mix up; used for glyph → sound distractors. */
export type SoundGroup = 'vowel' | 'labial' | 'dental' | 'velar' | 'sibilant' | 'palatal';

export interface Letter {
	char: string;
	/** Georgian national romanisation (2002); ' marks an ejective. */
	translit: string;
	ipa: string;
	group: SoundGroup;
	/** Three most similar glyphs: blurred-pixel IoU in Noto Serif + Sans Georgian, baseline aligned. */
	looksLike: string[];
	hint: Record<Lang, string>;
}

const EJECTIVE_VI = 'khép cổ họng rồi bật âm thật gọn, không có luồng hơi';
const EJECTIVE_EN = 'close your throat, then release it sharply with no puff of air';

/** Teaching order: roughly by how often the letter appears in Georgian text. */
export const LETTERS: Letter[] = [
	{ char: 'ა', translit: 'a', ipa: 'ɑ', group: 'vowel', looksLike: ['პ', 'ჰ', 'ი'], hint: { vi: 'Như a trong “ba”.', en: 'Like a in “father”.' } },
	{ char: 'ი', translit: 'i', ipa: 'i', group: 'vowel', looksLike: ['ბ', 'ძ', 'ხ'], hint: { vi: 'Như i trong “đi”.', en: 'Like ee in “see”.' } },
	{ char: 'ე', translit: 'e', ipa: 'ɛ', group: 'vowel', looksLike: ['ვ', 'ქ', 'უ'], hint: { vi: 'Như e trong “xe”.', en: 'Like e in “bed”.' } },
	{ char: 'ს', translit: 's', ipa: 's', group: 'sibilant', looksLike: ['ხ', 'ნ', 'ზ'], hint: { vi: 'Như x trong “xa”, s không uốn lưỡi.', en: 'Like s in “sun”.' } },
	{ char: 'რ', translit: 'r', ipa: 'r', group: 'dental', looksLike: ['ო', 'ღ', 'თ'], hint: { vi: 'R rung nhẹ đầu lưỡi, như r trong tiếng Tây Ban Nha.', en: 'A tapped r, as in Spanish “pero”.' } },
	{ char: 'მ', translit: 'm', ipa: 'm', group: 'labial', looksLike: ['შ', 'ძ', 'ნ'], hint: { vi: 'Như m trong “mẹ”.', en: 'Like m in “mother”.' } },
	{ char: 'ბ', translit: 'b', ipa: 'b', group: 'labial', looksLike: ['ზ', 'ი', 'მ'], hint: { vi: 'Như b trong “bà”.', en: 'Like b in “bed”.' } },
	{ char: 'დ', translit: 'd', ipa: 'd', group: 'dental', looksLike: ['ღ', 'თ', 'ფ'], hint: { vi: 'Như đ trong “đi”.', en: 'Like d in “dog”.' } },
	{ char: 'ო', translit: 'o', ipa: 'ɔ', group: 'vowel', looksLike: ['ღ', 'რ', 'თ'], hint: { vi: 'Như o trong “no”.', en: 'Like o in “more”, but short.' } },
	{ char: 'ლ', translit: 'l', ipa: 'l', group: 'dental', looksLike: ['დ', 'ღ', 'ე'], hint: { vi: 'Như l trong “là”.', en: 'Like l in “lamp”.' } },
	{ char: 'ვ', translit: 'v', ipa: 'v', group: 'labial', looksLike: ['ე', 'კ', 'გ'], hint: { vi: 'Như v trong “về”.', en: 'Like v in “van”.' } },
	{ char: 'ნ', translit: 'n', ipa: 'n', group: 'dental', looksLike: ['ხ', 'ზ', 'წ'], hint: { vi: 'Như n trong “nó”.', en: 'Like n in “no”.' } },
	{ char: 'ტ', translit: "t'", ipa: 'tʼ', group: 'dental', looksLike: ['ც', 'ღ', 'ჭ'], hint: { vi: `T tống hơi: ${EJECTIVE_VI}. Gần t trong “ta” nhưng dứt hơn.`, en: `Ejective t: ${EJECTIVE_EN}.` } },
	{ char: 'გ', translit: 'g', ipa: 'ɡ', group: 'velar', looksLike: ['ვ', 'ე', 'ჟ'], hint: { vi: 'G tắc như g trong tiếng Anh “go”, không xát như g tiếng Việt.', en: 'Like g in “go”.' } },
	{ char: 'უ', translit: 'u', ipa: 'u', group: 'vowel', looksLike: ['ე', 'ჟ', 'ვ'], hint: { vi: 'Như u trong “thu”.', en: 'Like oo in “food”.' } },
	{ char: 'ქ', translit: 'k', ipa: 'kʰ', group: 'velar', looksLike: ['ე', 'ვ', 'უ'], hint: { vi: 'K bật hơi, như k trong tiếng Anh “kite”. Không phải kh tiếng Việt.', en: 'Like k in “kite”, with a puff of air.' } },
	{ char: 'კ', translit: "k'", ipa: 'kʼ', group: 'velar', looksLike: ['ვ', 'ე', 'ჟ'], hint: { vi: `K tống hơi: ${EJECTIVE_VI}. Gần c trong “ca” nhưng dứt hơn.`, en: `Ejective k: ${EJECTIVE_EN}.` } },
	{ char: 'თ', translit: 't', ipa: 'tʰ', group: 'dental', looksLike: ['დ', 'ო', 'ფ'], hint: { vi: 'T bật hơi, như th trong “tha”.', en: 'Like t in “top”, with a puff of air.' } },
	{ char: 'შ', translit: 'sh', ipa: 'ʃ', group: 'palatal', looksLike: ['მ', 'ძ', 'ბ'], hint: { vi: 'Như sh trong tiếng Anh “she”, gần s uốn lưỡi.', en: 'Like sh in “she”.' } },
	{ char: 'ც', translit: 'ts', ipa: 'tsʰ', group: 'sibilant', looksLike: ['ვ', 'ყ', 'ე'], hint: { vi: 'Như ts trong tiếng Anh “cats”, có luồng hơi.', en: 'Like ts in “cats”, with a puff of air.' } },
	{ char: 'ხ', translit: 'kh', ipa: 'x', group: 'velar', looksLike: ['ნ', 'ს', 'ზ'], hint: { vi: 'Như kh trong “khá”.', en: 'Like ch in Scottish “loch”.' } },
	{ char: 'წ', translit: "ts'", ipa: 'tsʼ', group: 'sibilant', looksLike: ['ნ', 'ზ', 'შ'], hint: { vi: `Ts tống hơi: ${EJECTIVE_VI}.`, en: `Ejective ts: ${EJECTIVE_EN}.` } },
	{ char: 'ყ', translit: "q'", ipa: 'qʼ', group: 'velar', looksLike: ['ჟ', 'ე', 'ვ'], hint: { vi: `Q tống hơi, đặt sâu trong cổ họng hơn k: ${EJECTIVE_VI}.`, en: `Ejective q, further back than k: ${EJECTIVE_EN}.` } },
	{ char: 'ზ', translit: 'z', ipa: 'z', group: 'sibilant', looksLike: ['ხ', 'ნ', 'ბ'], hint: { vi: 'Như z trong tiếng Anh “zoo”, gần d trong “da” giọng Bắc.', en: 'Like z in “zoo”.' } },
	{ char: 'ფ', translit: 'p', ipa: 'pʰ', group: 'labial', looksLike: ['თ', 'დ', 'ღ'], hint: { vi: 'P bật hơi, như p trong tiếng Anh “pen”. Không phải ph tiếng Việt.', en: 'Like p in “pen”, with a puff of air.' } },
	{ char: 'ჩ', translit: 'ch', ipa: 'tʃʰ', group: 'palatal', looksLike: ['ნ', 'წ', 'ხ'], hint: { vi: 'Như ch trong tiếng Anh “church”, có luồng hơi; khác ch tiếng Việt.', en: 'Like ch in “church”, with a puff of air.' } },
	{ char: 'ძ', translit: 'dz', ipa: 'dz', group: 'sibilant', looksLike: ['მ', 'შ', 'ბ'], hint: { vi: 'Như ds trong tiếng Anh “kids”.', en: 'Like ds in “kids”.' } },
	{ char: 'ღ', translit: 'gh', ipa: 'ɣ', group: 'velar', looksLike: ['ო', 'დ', 'რ'], hint: { vi: 'Như g trong “ga” của tiếng Việt, âm xát.', en: 'A throaty g, close to the French r in “Paris”.' } },
	{ char: 'ჯ', translit: 'j', ipa: 'dʒ', group: 'palatal', looksLike: ['ვ', 'გ', 'უ'], hint: { vi: 'Như j trong tiếng Anh “jam”.', en: 'Like j in “jam”.' } },
	{ char: 'პ', translit: "p'", ipa: 'pʼ', group: 'labial', looksLike: ['ჰ', 'ა', 'მ'], hint: { vi: `P tống hơi: ${EJECTIVE_VI}.`, en: `Ejective p: ${EJECTIVE_EN}.` } },
	{ char: 'ჭ', translit: "ch'", ipa: 'tʃʼ', group: 'palatal', looksLike: ['ვ', 'გ', 'ე'], hint: { vi: `Ch tống hơi (như “church”): ${EJECTIVE_VI}.`, en: `Ejective ch: ${EJECTIVE_EN}.` } },
	{ char: 'ჟ', translit: 'zh', ipa: 'ʒ', group: 'palatal', looksLike: ['ე', 'უ', 'ყ'], hint: { vi: 'Như s trong tiếng Anh “measure”.', en: 'Like s in “measure”.' } },
	{ char: 'ჰ', translit: 'h', ipa: 'h', group: 'velar', looksLike: ['პ', 'ა', 'მ'], hint: { vi: 'Như h trong “hà”.', en: 'Like h in “hat”.' } }
];

export const ALPHABET = [...LETTERS].sort((a, b) => a.char.codePointAt(0)! - b.char.codePointAt(0)!);

export const byChar = new Map(LETTERS.map((l) => [l.char, l]));
