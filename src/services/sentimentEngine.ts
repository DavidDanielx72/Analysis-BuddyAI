import type {
  EmotionLabel,
  SentimentLabel,
  SentimentResult,
} from '@/types';

// ---- Lexicons (curated, compact but effective) ----

const POSITIVE_WORDS = new Set([
  'good','great','excellent','amazing','awesome','fantastic','wonderful','love',
  'loved','loves','best','perfect','brilliant','superb','outstanding','happy',
  'pleased','satisfied','recommend','recommended','reliable','fast','easy','helpful',
  'impressed','impressive','quality','quality','value','worth','delight','delighted',
  'enjoy','enjoyed','enjoyable','smooth','seamless','intuitive','beautiful','clean',
  'responsive','friendly','polite','professional','efficient','affordable','cheap',
  'thrilled','grateful','thankful','appreciate','appreciated','super','nice','cool',
  'fun','lovely','premium','top','win','winner','genuine','honest','trust','trusted',
  'comfortable','durable','fresh','tasty','delicious','quick','prompt','courteous',
  'kind','patient','supportive','innovative','powerful','robust','secure','stable',
  'elegant','simple','clear','transparent','fair','flexible','generous','rewarding',
  'exceeded','flawless','remarkable','phenomenal','exceptional','stellar','solid',
]);

const NEGATIVE_WORDS = new Set([
  'bad','terrible','horrible','awful','worst','poor','disappointing','disappointed',
  'disappointment','hate','hated','dislike','slow','broken','buggy','crash','crashes',
  'crashed','fail','failed','failure','useless','worthless','waste','scam','fraud',
  'rude','unprofessional','expensive','overpriced','cheap','flimsy','late','delay',
  'delayed','ignored','ignore','unresponsive','confusing','confused','complicated',
  'difficult','hard','frustrating','frustrated','frustration','angry','mad','furious',
  'sad','unhappy','unsatisfied','dissatisfied','complaint','complain','complaining',
  'problem','issue','issues','bug','bugs','error','errors','glitch','crash','freeze',
  'freezes','frozen','lag','laggy','clunky','ugly','messy','mess','annoying','annoyed',
  'boring','dull','outdated','obsolete','inferior','shoddy','defective','damaged',
  'missing','lost','stolen','charged','overcharge','refund','refund','wrong','faulty',
  'unreliable','unstable','insecure','vulnerable','spam','scam','fake','liar','lies',
  'misleading','deceptive','careless','negligent','sloppy','sloppy','tedious','painful',
  'regret','regretful','disaster','nightmare','garbage','trash','rubbish','pathetic',
]);

const INTENSIFIERS = new Set([
  'very','really','extremely','super','so','incredibly','absolutely','totally',
  'completely','utterly','highly','remarkably','truly','genuinely','especially',
]);

const NEGATORS = new Set([
  'not','no','never','none','nobody','nothing','neither','nor','hardly','barely',
  "isn't","wasn't","aren't","weren't","don't","doesn't","didn't","won't","can't",
  "couldn't","shouldn't","wouldn't","cannot","without",
]);

interface EmotionLexicon {
  emotion: EmotionLabel;
  words: string[];
  valence: 'positive' | 'negative';
}

const EMOTION_LEXICONS: EmotionLexicon[] = [
  {
    emotion: 'happy',
    valence: 'positive',
    words: ['happy','glad','joy','joyful','pleased','delighted','content','cheerful','smile','smiling','enjoy','enjoyed','satisfied','satisfaction'],
  },
  {
    emotion: 'excited',
    valence: 'positive',
    words: ['excited','exciting','thrilled','amazing','awesome','fantastic','incredible','wow','stunning','mindblowing','spectacular','eager','pumped','hyped'],
  },
  {
    emotion: 'appreciative',
    valence: 'positive',
    words: ['appreciate','appreciated','grateful','thankful','thanks','thank','blessed','gratitude','kind','generous','thoughtful','courteous','helpful'],
  },
  {
    emotion: 'angry',
    valence: 'negative',
    words: ['angry','mad','furious','rage','outraged','livid','irritated','irritating','infuriating','pissed','hostile','resentful'],
  },
  {
    emotion: 'frustrated',
    valence: 'negative',
    words: ['frustrated','frustrating','frustration','annoyed','annoying','stuck','blocked','difficult','struggling','ugh','impossible','tedious','aggravating','hate','hated','dislike','disgusting','garbage','trash','rubbish','pathetic','useless','worthless','waste'],
  },
  {
    emotion: 'sad',
    valence: 'negative',
    words: ['sad','unhappy','depressed','down','upset','heartbroken','devastated','gloomy','miserable','lonely','tears','crying','hurt','painful'],
  },
  {
    emotion: 'disappointed',
    valence: 'negative',
    words: ['disappointed','disappointing','disappointment','letdown','underwhelmed','expected','hoped','misleading','failed','shortfall','lacking','regret','regretful','terrible','horrible','awful','worst','poor','bad'],
  },
  {
    emotion: 'confused',
    valence: 'negative',
    words: ['confused','confusing','confusion','unclear','unclear','puzzled','lost','unsure','uncertain','baffled','perplexed','mixed','complicated'],
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
  'why','where','of','as','it','its','also','would','could','should','really','very','get','got',
  'one','two','get','go','going','im','ive','id','dont','cant','wont','didnt','thats','theres',
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
  'sent','expect','expected','build','built','stay','stayed','fall','fell','cut','cut','reach','reached',
  'kill','killed','raise','raised','pass','passed','sell','sold','decide','decided','return','returned',
  'explain','explained','hope','hoped','develop','developed','carry','carried','break','broke','receive',
  'received','agree','agreed','support','supported','hit','hitting','produce','produced','eat','ate',
  'cover','covered','catch','caught','draw','drew','choose','chose','point','pointed','save','saved',
  'design','designed','occur','occurred','continue','continued','am','is','are','was','were','be',
  'been','being','have','has','had','having','do','does','did','doing','will','would','shall','should',
  'may','might','must','can','could','need','dare','ought','used','that','this','these','those','am',
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

  for (const sentence of sentences) {
    const tokens = tokenize(sentence);
    let negate = false;
    let intensify = 1;
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      const prev = tokens[i - 1];
      const prev2 = tokens[i - 2];

      if (NEGATORS.has(tok)) {
        negate = true;
        continue;
      }
      if (INTENSIFIERS.has(tok)) {
        intensify = 1.8;
        continue;
      }
      // decay negate/intensify after a few tokens
      if (i - (prev ? 1 : 0) > 3) negate = false;

      let added = false;
      if (POSITIVE_WORDS.has(tok)) {
        const weight = (negate ? -1.2 : 1) * intensify;
        if (weight > 0) positive += weight;
        else negative += Math.abs(weight);
        contributing.push(tok);
        added = true;
      } else if (NEGATIVE_WORDS.has(tok)) {
        const weight = (negate ? -0.9 : 1) * intensify;
        if (weight > 0) negative += weight;
        else positive += Math.abs(weight) * 0.6;
        contributing.push(tok);
        added = true;
      }

      // Emotion scoring
      for (const lex of EMOTION_LEXICONS) {
        if (lex.words.includes(tok)) {
          emotions[lex.emotion] += negate ? 0.3 : 1 * intensify;
        }
      }

      if (added) {
        negate = false;
        intensify = 1;
      }
      // reset negate after distance
      if (prev && NEGATORS.has(prev) && i > 1 && prev2 && !NEGATORS.has(prev2)) {
        // keep negate window short
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
    positiveScore = 0.15;
    negativeScore = 0.15;
    neutralScore = 0.7;
  } else {
    const ratio = diff / totalSignal;
    const signalStrength = Math.min(1, totalSignal / 4);
    neutralScore = (1 - signalStrength) * 0.35;
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
  if (score > 0.05) label = 'positive';
  else if (score < -0.05) label = 'negative';

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
    // No emotion signal at all — infer from sentiment polarity instead of defaulting to happy
    const negativeEmotions: EmotionLabel[] = ['angry', 'frustrated', 'sad', 'disappointed', 'confused'];
    const positiveEmotions: EmotionLabel[] = ['happy', 'excited', 'appreciative'];
    const totalNegative = negativeEmotions.reduce((s, e) => s + (emotions[e] ?? 0), 0);
    const totalPositive = positiveEmotions.reduce((s, e) => s + (emotions[e] ?? 0), 0);
    if (totalNegative > totalPositive) {
      dominant = 'frustrated';
    } else if (totalPositive > totalNegative) {
      dominant = 'happy';
    } else {
      // Truly no signal — default to neutral-ish
      dominant = 'appreciative';
    }
  }
  return dominant;
}

export { keywordSet };
