import type {
  EmotionLabel,
  SentimentLabel,
  SentimentResult,
} from '@/types';

// ---- Expanded Lexicons ----

const POSITIVE_WORDS = new Set([
  // General positive
  'good','great','excellent','amazing','awesome','fantastic','wonderful','love',
  'loved','loves','loving','best','perfect','brilliant','superb','outstanding','happy',
  'pleased','satisfied','recommend','recommended','reliable','fast','easy','helpful',
  'impressed','impressive','quality','value','worth','delight','delighted',
  'enjoy','enjoyed','enjoyable','smooth','seamless','intuitive','beautiful','clean',
  'responsive','friendly','polite','professional','efficient','affordable',
  'thrilled','grateful','thankful','appreciate','appreciated','super','nice','cool',
  'fun','lovely','premium','top','win','winner','genuine','honest','trust','trusted',
  'comfortable','durable','fresh','tasty','delicious','quick','prompt','courteous',
  'kind','patient','supportive','innovative','powerful','robust','secure','stable',
  'elegant','simple','clear','transparent','fair','flexible','generous','rewarding',
  'exceeded','flawless','remarkable','phenomenal','exceptional','stellar','solid',
  // Intelligence / capability (positive in context)
  'smart','clever','intelligent','wise','brilliant','genius','talented','skilled',
  'capable','competent','resourceful','resilient','strong','tough','adaptable',
  // Affection / admiration
  'adorable','cute','sweet','charming','endearing','lovable','precious','darling',
  ' gorgeous','stunning','handsome','attractive','magnificent','glorious','majestic',
  // Praise / advocacy
  'deserve','deserves','deserved','deserving','better','deserve','respect','respected',
  'admire','admired','admirable','applaud','applauded','applause','bravo','kudos',
  'praise','praised','celebrate','celebrated','champion','champions','defend','defended',
  'support','supported','stand','proud','proudly','honor','honored','honorable',
  // Success / thriving
  'thriving','thrive','thrived','flourish','flourishing','succeed','succeeded','success',
  'successful','prosper','prosperous','bloom','blossom','grow','growing','progress',
  'progressing','improve','improved','improving','upgrade','upgraded','enhance','enhanced',
  // Agreement / validation
  'agree','agreed','exactly','true','correct','right','spot','nailed','spotless',
  'facts','relatable','this','underrated','underappreciated','masterpiece','goated',
  'icon','iconic','legend','legendary','king','queen','goat','fire','based','w',
  // Positive verbs
  'like','liked','loving','enjoying','prefer','preferred','adore','adored','treasure',
  'cherish','cherished','value','valued','prize','prized','welcome','welcomed',
  // Positive adjectives
  'amazing','incredible','unbelievable','unreal','insane','crazy','wild','sick','dope',
  'fresh','lit','vibing','wholesome','heartwarming','touching','inspiring','motivating',
  'motivated','encouraged','encouraging','uplifting','hopeful','optimistic','positive',
  ' blessed','lucky','fortunate','grateful',
  // Quality descriptors
  'underrated','sleek','polished','refined','crisp','sharp','vibrant','rich','deep',
  'immersive','engaging','captivating','compelling','gripping','fascinating','intriguing',
  'entertaining','hilarious','funny','amusing','delightful','refreshing','satisfying',
  'rewarding','fulfilling','meaningful','impactful','valuable','insightful','profound',
]);

const NEGATIVE_WORDS = new Set([
  // General negative
  'bad','terrible','horrible','awful','worst','poor','disappointing','disappointed',
  'disappointment','hate','hated','dislike','slow','broken','buggy','crash','crashes',
  'crashed','fail','failed','failure','useless','worthless','waste','scam','fraud',
  'rude','unprofessional','expensive','overpriced','flimsy','late','delay',
  'delayed','ignored','ignore','unresponsive','confusing','confused','complicated',
  'difficult','hard','frustrating','frustrated','frustration','angry','mad','furious',
  'sad','unhappy','unsatisfied','dissatisfied','complaint','complain','complaining',
  'problem','issue','issues','bug','bugs','error','errors','glitch','freeze',
  'freezes','frozen','lag','laggy','clunky','ugly','messy','mess','annoying','annoyed',
  'boring','dull','outdated','obsolete','inferior','shoddy','defective','damaged',
  'missing','lost','stolen','charged','overcharge','refund','wrong','faulty',
  'unreliable','unstable','insecure','vulnerable','spam','fake','liar','lies',
  'misleading','deceptive','careless','negligent','sloppy','tedious','painful',
  'regret','regretful','disaster','nightmare','garbage','trash','rubbish','pathetic',
  // Negative emotions
  'depressing','depressed','bleak','grim','dread','dreadful','miserable','suffering',
  'suffer','suffered','agony','torment','anguish','despair','hopeless','helpless',
  'tragic','tragedy','heartbreaking','heartbroken','devastating','devastated','crushed',
  'lonely','alone','abandoned','rejected','betrayed','betray','abuse','abused','abusive',
  'cruel','mean','nasty','vile','disgusting','gross','repulsive','revolting','sickening',
  'toxic','poison','poisonous','venom','malice','malicious','spite','spiteful','bitter',
  // Negative descriptors
  'cringe','cringey','cringeworthy','embarrassing','embarrassed','shame','shameful',
  'lame','stupid','dumb','idiotic','moronic','brainless','foolish','ridiculous','absurd',
  'nonsense','bullshit','crap','suck','sucks','sucked','sucking','mid','overrated',
  'bland','stale','dull','flat','lifeless','soulless','generic','derivative','lazy',
  'uninspired','weak','feeble','pathetic','pitiful','laughable','jokey','mockery',
  // Negative verbs
  'ruin','ruined','ruining','destroy','destroyed','demolish','wreck','wrecked',
  'tarnish','tarnished','corrupt','corrupted','poison','poisoned','infect','infected',
  'rot','rotten','decay','decayed','spoil','spoiled','spolit','taint','tainted',
  'harm','harmed','hurt','hurts','hurting','damage','damaged','wound','wounded',
  'attack','attacked','assault','insult','insulted','mock','mocked','ridicule',
  'humiliate','humiliated','oppress','oppressed','exploit','exploited','manipulate',
  'manipulated','deceive','deceived','cheat','cheated','steal','stole','rob','robbed',
  'threaten','threatened','intimidate','intimidated','bully','bullied','harass',
  'harassed','torment','tormented','torture','tortured','starve','starving','starved',
  // Negative context
  'hate','hatred','hateful','bigot','bigoted','racist','sexist','homophobic',
  'xenophobic','prejudice','prejudiced','discrimination','discriminatory','unfair',
  'unjust','wrongful','illegal','unlawful','corrupt','corrupted','crooked','shady',
]);

const INTENSIFIERS_WORDS = new Set([
  'very','really','extremely','super','so','incredibly','absolutely','totally',
  'completely','utterly','highly','remarkably','truly','genuinely','especially',
  'way','too','insanely','crazy','ridiculously','stupidly','hella','mad','af',
]);

const NEGATOR_WORDS = new Set([
  'not','no','never','none','nobody','nothing','neither','nor','hardly','barely',
  "isn't","wasn't","aren't","weren't","don't","doesn't","didn't","won't","can't",
  "couldn't","shouldn't","wouldn't","cannot","without","ain't","dont","wont",
  'cant','couldnt','shouldnt','wouldnt','isnt','wasnt','arent','werent','didnt',
]);

// ---- Multi-word phrase patterns (contextual) ----
// These flip or boost sentiment based on phrase context rather than individual words.
interface PhrasePattern {
  regex: RegExp;
  sentiment: 'positive' | 'negative';
  weight: number;
  emotion?: EmotionLabel;
}

const PHRASE_PATTERNS: PhrasePattern[] = [
  // Advocacy / defending patterns — "too much hate", "give X hate" = positive (defender)
  { regex: /\b(way\s+too\s+much|too\s+much|so\s+much)\s+(hate|hatred|hating|negativity|flak|crap|shade|disrespect)\b/i, sentiment: 'positive', weight: 1.5, emotion: 'appreciative' },
  { regex: /\b(give|gives|giving|got|gets|getting)\s+\w+\s+(too\s+much\s+)?(hate|hatred|flak|crap|shade|disrespect|negativity)\b/i, sentiment: 'positive', weight: 1.3, emotion: 'appreciative' },
  { regex: /\b(stop|end|no\s+more|less)\s+(hate|hatred|hating|bullying|negativity|disrespect)\b/i, sentiment: 'positive', weight: 1.4, emotion: 'appreciative' },
  { regex: /\b(deserve\s+(better|more|respect|love|attention|recognition))\b/i, sentiment: 'positive', weight: 1.6, emotion: 'appreciative' },
  { regex: /\b(deserves\s+(better|more|respect|love|attention|recognition))\b/i, sentiment: 'positive', weight: 1.6, emotion: 'appreciative' },
  { regex: /\b(under rated|under-rated|underrated|underappreciated|under appreciated|under-appreciated)\b/i, sentiment: 'positive', weight: 1.3, emotion: 'appreciative' },
  { regex: /\b(still\s+(thriving|going\s+strong|here|surviving|standing))\b/i, sentiment: 'positive', weight: 1.2, emotion: 'happy' },
  { regex: /\b(been\s+around\s+for\s+(centuries|decades|years|ages|forever))\b/i, sentiment: 'positive', weight: 0.8, emotion: 'appreciative' },
  // "I used to ... but now" = positive transformation
  { regex: /\b(used\s+to\s+(not|never|dislike|hate)\b.{0,80}?\b(but|now|then|however)\b)/i, sentiment: 'positive', weight: 1.5, emotion: 'happy' },
  { regex: /\b(i\s+(used\s+to|didnt|didn't)\s+(not\s+)?(care|like|watch|understand|get\s+it).{0,80}?(but|now|then)\b)/i, sentiment: 'positive', weight: 1.4, emotion: 'happy' },
  // "I'm an X" personal disclosure that's actually positive advocacy
  { regex: /\b(i'?m\s+an?\s+\w+.{0,40}?\b(deserve|deserves|better|thriving|survivor|fighter|recovery|recovering|healing)\b)/i, sentiment: 'positive', weight: 1.0, emotion: 'appreciative' },
  // Sarcasm / dismissive negation
  { regex: /\b(not\s+(that\s+)?(bad|terrible|horrible|awful|wrong))\b/i, sentiment: 'positive', weight: 0.8 },
  { regex: /\b(not\s+(a\s+)?(scam|fraud|fake|joke|waste))\b/i, sentiment: 'positive', weight: 1.0 },
  { regex: /\b(not\s+(hate|hating|hated|bad|wrong|terrible|awful))\b/i, sentiment: 'positive', weight: 0.7 },
  // "I don't hate" = positive
  { regex: /\b(i\s+(don't|dont)\s+(hate|dislike|mind))\b/i, sentiment: 'positive', weight: 1.0, emotion: 'happy' },
  // Genuine complaints
  { regex: /\b(waste\s+of\s+(time|money|effort|space))\b/i, sentiment: 'negative', weight: 1.8, emotion: 'frustrated' },
  { regex: /\b(don't\s+(waste|buy|bother|recommend|watch|go))\b/i, sentiment: 'negative', weight: 1.5, emotion: 'disappointed' },
  { regex: /\b(never\s+(again|going\s+back|buying|watching|ordering|coming))\b/i, sentiment: 'negative', weight: 1.6, emotion: 'disappointed' },
  { regex: /\b(rip\s+off|ripped\s+off|scam|fraud)\b/i, sentiment: 'negative', weight: 2.0, emotion: 'angry' },
  { regex: /\b(worst\s+(ever|experience|service|product|video|content))\b/i, sentiment: 'negative', weight: 1.8, emotion: 'disappointed' },
  // Praise phrases
  { regex: /\b(this\s+is\s+(the\s+)?(best|greatest|amazing|incredible|awesome|perfect))\b/i, sentiment: 'positive', weight: 1.5, emotion: 'excited' },
  { regex: /\b(love\s+(this|it|you|your|the))\b/i, sentiment: 'positive', weight: 1.3, emotion: 'happy' },
  { regex: /\b(so\s+(good|amazing|incredible|true|real|wholesome|sweet|kind|funny))\b/i, sentiment: 'positive', weight: 1.2, emotion: 'happy' },
  { regex: /\b(changed\s+my\s+(mind|life|perspective|view))\b/i, sentiment: 'positive', weight: 1.5, emotion: 'appreciative' },
  { regex: /\b(opened\s+my\s+(eyes|mind))\b/i, sentiment: 'positive', weight: 1.4, emotion: 'appreciative' },
  { regex: /\b(keep\s+(up\s+the|doing|going|making))\b/i, sentiment: 'positive', weight: 1.2, emotion: 'appreciative' },
  { regex: /\b(can'?t\s+stop\s+watching|rewatching|listening)\b/i, sentiment: 'positive', weight: 1.3, emotion: 'excited' },
];

// ---- Emoji sentiment mapping ----
const POSITIVE_EMOJIS = /[\u{1F600}-\u{1F64F}\u{1F970}\u{1F60A}\u{1F604}\u{1F601}\u{1F602}\u{1F605}\u{1F609}\u{1F60D}\u{1F618}\u{1F929}\u{1F44D}\u{1F44F}\u{1F64C}\u{1F389}\u{2728}\u{1F31F}\u{1F4AF}\u{1F525}]/gu;
const NEGATIVE_EMOJIS = /[\u{1F621}\u{1F620}\u{1F629}\u{1F62B}\u{1F624}\u{1F616}\u{1F623}\u{1F622}\u{1F62D}\u{1F631}\u{1F628}\u{1F630}\u{1F44E}\u{1F4A9}\u{1F612}\u{1F614}\u{1F615}\u{1F637}]/gu;
const NEUTRAL_EMOJIS = /[\u{1F610}\u{1F611}\u{1F636}\u{1FAE0}\u{1F928}]/gu;

interface EmotionLexicon {
  emotion: EmotionLabel;
  words: string[];
  valence: 'positive' | 'negative';
}

const EMOTION_LEXICONS: EmotionLexicon[] = [
  {
    emotion: 'happy',
    valence: 'positive',
    words: ['happy','glad','joy','joyful','pleased','delighted','content','cheerful','smile','smiling','enjoy','enjoyed','satisfied','satisfaction','lovely','sweet','wholesome','heartwarming','blessed','lucky','fortunate'],
  },
  {
    emotion: 'excited',
    valence: 'positive',
    words: ['excited','exciting','thrilled','amazing','awesome','fantastic','incredible','wow','stunning','mindblowing','spectacular','eager','pumped','hyped','incredible','unreal','insane','fire','lit','goated','iconic'],
  },
  {
    emotion: 'appreciative',
    valence: 'positive',
    words: ['appreciate','appreciated','grateful','thankful','thanks','thank','blessed','gratitude','kind','generous','thoughtful','courteous','helpful','deserve','deserves','respect','respected','admire','admired','applaud','applause','kudos','praise','champion','support','proud','honor','underrated','underappreciated'],
  },
  {
    emotion: 'angry',
    valence: 'negative',
    words: ['angry','mad','furious','rage','outraged','livid','irritated','irritating','infuriating','pissed','hostile','resentful','scam','fraud','rip','ripped','crooked','shady','corrupt','toxic','malicious','spiteful','cruel','vile'],
  },
  {
    emotion: 'frustrated',
    valence: 'negative',
    words: ['frustrated','frustrating','frustration','annoyed','annoying','stuck','blocked','difficult','struggling','ugh','impossible','tedious','aggravating','hate','hated','dislike','disgusting','garbage','trash','rubbish','pathetic','useless','worthless','waste','cringe','cringey','lame','stupid','dumb','ridiculous','absurd','boring','dull','mid','overrated'],
  },
  {
    emotion: 'sad',
    valence: 'negative',
    words: ['sad','unhappy','depressed','depressing','down','upset','heartbroken','heartbreaking','devastated','devastating','gloomy','miserable','lonely','alone','tears','crying','hurt','painful','suffering','suffer','tragic','tragedy','bleak','grim','hopeless','helpless','crushed','abandoned','rejected','betrayed'],
  },
  {
    emotion: 'disappointed',
    valence: 'negative',
    words: ['disappointed','disappointing','disappointment','letdown','underwhelmed','expected','hoped','misleading','failed','shortfall','lacking','regret','regretful','terrible','horrible','awful','worst','poor','bad','waste','never','again','don\'t','dont','wont'],
  },
  {
    emotion: 'confused',
    valence: 'negative',
    words: ['confused','confusing','confusion','unclear','puzzled','lost','unsure','uncertain','baffled','perplexed','mixed','complicated','what','why','how','sense','nonsense'],
  },
];

// ---- Stopwords ----
const STOPWORDS = new Set([
  'the','a','an','and','or','but','if','then','else','when','at','by','for','with','about','against',
  'between','into','through','during','before','after','above','below','to','from','up','down','in',
  'out','on','off','over','under','again','further','once','here','there','all','any','both','each',
  'few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too',
  'very','can','will','just','is','am','are','was','were','be','been','being','have','has','had',
  'do','does','did','this','that','these','those','i','me','my','we','our','you','your','he','him',
  'his','she','her','it','its','they','them','their','what','which','who','whom','whose','how',
  'why','where','of','as','also','would','could','should','really','get','got',
  'one','two','go','going','im','ive','id','dont','cant','wont','didnt','thats','theres',
  'use','using','used','like','even','still','much','many','well','way','thing','things','something',
  'everything','nothing','anything','someone','anyone','everyone','say','said','says','make','made',
  'makes','want','wants','wanted','need','needs','needed','think','thought','know','knew','see','seen',
  'look','looked','come','came','take','took','give','gave','find','found','tell','told','ask','asked',
  'try','tried','feel','felt','become','became','leave','left','put','let','keep','kept','begin','began',
  'seem','seemed','help','helped','show','showed','run','play','move','live','believe','hold','bring',
  'happen','happened','write','written','sit','sitting','stand','standing','lose','lost','pay','paid',
  'meet','met','include','included','continue','set','learn','learned','change','changed','lead','led',
  'understand','understood','watch','watching','follow','followed','stop','stopped','create','created',
  'speak','spoke','read','allow','allowed','add','added','spend','spent','grow','grew','open','opened',
  'walk','walked','win','won','offer','offered','remember','remembered','love','loved','consider',
  'considered','appear','appeared','buy','bought','wait','waited','serve','served','die','died','send',
  'sent','expect','expected','build','built','stay','stayed','fall','fell','cut','reach','reached',
  'kill','killed','raise','raised','pass','passed','sell','sold','decide','decided','return','returned',
  'explain','explained','hope','hoped','develop','developed','carry','carried','break','broke','receive',
  'received','agree','agreed','support','supported','hit','hitting','produce','produced','eat','ate',
  'cover','covered','catch','caught','draw','drew','choose','chose','point','pointed','save','saved',
  'design','designed','occur','occurred',
]);

// ---- Tokenization ----

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// ---- Keyword extraction (frequency-based, filtered) ----

export function extractKeywords(text: string, max = 12): string[] {
  const tokens = tokenize(text).filter(
    (t) => !STOPWORDS.has(t) && t.length > 2,
  );
  const freq = new Map<string, number>();
  for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([w]) => w);
}

function keywordSet(text: string): Set<string> {
  return new Set(extractKeywords(text, 20));
}

// ---- Core sentiment scoring ----

function scoreText(text: string): {
  positive: number;
  negative: number;
  emotions: Record<EmotionLabel, number>;
  contributingWords: string[];
} {
  const sentences = splitSentences(text.length ? text : ' ');
  let positive = 0;
  let negative = 0;
  const emotions = {
    happy: 0, excited: 0, angry: 0, sad: 0,
    frustrated: 0, appreciative: 0, confused: 0, disappointed: 0,
  } as Record<EmotionLabel, number>;
  const contributing: string[] = [];

  // 1) Phrase-level patterns (high-priority contextual signals)
  for (const pattern of PHRASE_PATTERNS) {
    const matches = text.match(new RegExp(pattern.regex.source, pattern.regex.flags.includes('g') ? pattern.regex.flags : pattern.regex.flags + 'g'));
    if (matches) {
      for (const m of matches) {
        if (pattern.sentiment === 'positive') {
          positive += pattern.weight;
        } else {
          negative += pattern.weight;
        }
        if (pattern.emotion) {
          emotions[pattern.emotion] += pattern.weight;
        }
        contributing.push(m.slice(0, 30));
      }
    }
  }

  // 2) Emoji sentiment
  const posEmojiCount = (text.match(POSITIVE_EMOJIS) ?? []).length;
  const negEmojiCount = (text.match(NEGATIVE_EMOJIS) ?? []).length;
  const neuEmojiCount = (text.match(NEUTRAL_EMOJIS) ?? []).length;
  if (posEmojiCount) {
    positive += posEmojiCount * 0.6;
    emotions.happy += posEmojiCount * 0.3;
    emotions.excited += posEmojiCount * 0.2;
  }
  if (negEmojiCount) {
    negative += negEmojiCount * 0.6;
    emotions.frustrated += negEmojiCount * 0.3;
    emotions.sad += negEmojiCount * 0.2;
  }
  if (neuEmojiCount) {
    // neutral emojis slightly dampen signal
  }

  // 3) Word-level scoring with improved negation windowing
  for (const sentence of sentences) {
    const tokens = tokenize(sentence);
    let negateUntil = -1; // index until which negation applies

    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      const prev = tokens[i - 1];
      const prev2 = tokens[i - 2];

      // Intensifier check (look back 1-2 tokens)
      let intensify = 1;
      if (INTENSIFIER_WORDS.has(prev)) intensify = 1.8;
      if (INTENSIFIER_WORDS.has(prev2) && !INTENSIFIER_WORDS.has(prev)) intensify = Math.max(intensify, 1.5);

      // Negator check — set a window of 3 tokens ahead
      if (NEGATOR_WORDS.has(tok)) {
        negateUntil = i + 3;
        continue;
      }

      const isNegated = i < negateUntil;

      let added = false;
      if (POSITIVE_WORDS.has(tok)) {
        const weight = (isNegated ? -1.0 : 1) * intensify;
        if (weight > 0) {
          positive += weight;
        } else {
          // Negated positive = negative, but reduced (e.g. "not great" = mild negative)
          negative += Math.abs(weight) * 0.7;
        }
        contributing.push(tok);
        added = true;
      } else if (NEGATIVE_WORDS.has(tok)) {
        const weight = (isNegated ? -0.8 : 1) * intensify;
        if (weight > 0) {
          negative += weight;
        } else {
          // Negated negative = positive (e.g. "not bad" = positive, "don't hate" = positive)
          positive += Math.abs(weight) * 0.8;
        }
        contributing.push(tok);
        added = true;
      }

      // Emotion scoring
      for (const lex of EMOTION_LEXICONS) {
        if (lex.words.includes(tok)) {
          emotions[lex.emotion] += (isNegated ? 0.3 : 1) * intensify;
        }
      }

      if (added && i >= negateUntil) {
        negateUntil = -1;
      }
    }
  }

  return { positive, negative, emotions, contributingWords: contributing };
}

export function analyzeSentiment(text: string): SentimentResult {
  const { positive, negative, emotions, contributingWords } = scoreText(text);
  const keywords = [...new Set(contributingWords)].slice(0, 8);

  const totalSignal = positive + negative;
  const diff = positive - negative;

  let positiveScore: number;
  let negativeScore: number;
  let neutralScore: number;

  if (totalSignal === 0) {
    // No lexical or phrase signal — check emojis alone
    if ((text.match(POSITIVE_EMOJIS) ?? []).length > (text.match(NEGATIVE_EMOJIS) ?? []).length) {
      positiveScore = 0.55;
      negativeScore = 0.15;
      neutralScore = 0.3;
    } else if ((text.match(NEGATIVE_EMOJIS) ?? []).length > (text.match(POSITIVE_EMOJIS) ?? []).length) {
      positiveScore = 0.15;
      negativeScore = 0.55;
      neutralScore = 0.3;
    } else {
      positiveScore = 0.15;
      negativeScore = 0.15;
      neutralScore = 0.7;
    }
  } else {
    const ratio = diff / totalSignal;
    // Lower threshold for signal strength — even 1-2 strong signals should lean non-neutral
    const signalStrength = Math.min(1, totalSignal / 3);
    // Reduce neutral bias — strong signals should dominate
    neutralScore = (1 - signalStrength) * 0.25;
    const remaining = 1 - neutralScore;
    if (ratio >= 0) {
      positiveScore = remaining * (0.5 + ratio * 0.5);
      negativeScore = remaining * (0.5 - ratio * 0.5);
    } else {
      positiveScore = remaining * (0.5 + ratio * 0.5);
      negativeScore = remaining * (0.5 - ratio * 0.5);
    }
  }

  const score = positiveScore - negativeScore;
  let label: SentimentLabel = 'neutral';
  // Tighter thresholds so mild signals still classify
  if (score > 0.03) label = 'positive';
  else if (score < -0.03) label = 'negative';

  const confidence = Math.max(positiveScore, negativeScore, neutralScore);

  let dominantEmotion: EmotionLabel = 'happy';
  let maxEmotion = -1;
  (Object.keys(emotions) as EmotionLabel[]).forEach((e) => {
    if (emotions[e] > maxEmotion) {
      maxEmotion = emotions[e];
      dominantEmotion = e;
    }
  });
  if (maxEmotion <= 0) {
    dominantEmotion =
      label === 'positive' ? 'happy' : label === 'negative' ? 'frustrated' : 'appreciative';
  }

  return {
    label,
    score,
    confidence,
    positiveScore,
    negativeScore,
    neutralScore,
    emotions,
    dominantEmotion,
    keywords,
  };
}

// ---- Batch helpers ----

export function dominantEmotionAcross(
  emotions: Record<EmotionLabel, number>,
): EmotionLabel {
  let dominant: EmotionLabel = 'happy';
  let max = -1;
  (Object.keys(emotions) as EmotionLabel[]).forEach((e) => {
    if (emotions[e] > max) {
      max = emotions[e];
      dominant = e;
    }
  });
  if (max <= 0) {
    const negativeEmotions: EmotionLabel[] = ['angry', 'frustrated', 'sad', 'disappointed', 'confused'];
    const positiveEmotions: EmotionLabel[] = ['happy', 'excited', 'appreciative'];
    const totalNegative = negativeEmotions.reduce((s, e) => s + (emotions[e] ?? 0), 0);
    const totalPositive = positiveEmotions.reduce((s, e) => s + (emotions[e] ?? 0), 0);
    if (totalNegative > totalPositive) {
      dominant = 'frustrated';
    } else if (totalPositive > totalNegative) {
      dominant = 'happy';
    } else {
      dominant = 'appreciative';
    }
  }
  return dominant;
}

export { keywordSet };
