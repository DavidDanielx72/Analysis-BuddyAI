import type {
  EmotionLabel,
  SentimentLabel,
  SentimentResult,
} from '@/types';

// ============================================================
//  Contextual Sentiment Engine
//  Combines lexicon scoring, phrase-pattern detection,
//  negation handling, intensifiers, emoji analysis,
//  and slang/internet-language awareness.
// ============================================================

// ---- Positive lexicon ----
const POSITIVE_WORDS = new Set([
  // Core positive
  'good','great','excellent','amazing','awesome','fantastic','wonderful','love',
  'loved','loves','loving','best','perfect','brilliant','superb','outstanding',
  'happy','pleased','satisfied','recommend','recommended','reliable','fast','easy',
  'helpful','impressed','impressive','quality','value','worth','delight','delighted',
  'enjoy','enjoyed','enjoyable','smooth','seamless','intuitive','beautiful','clean',
  'responsive','friendly','polite','professional','efficient','affordable',
  'thrilled','grateful','thankful','appreciate','appreciated','super','nice','cool',
  'fun','lovely','premium','top','win','winner','genuine','honest','trust','trusted',
  'comfortable','durable','fresh','tasty','delicious','quick','prompt','courteous',
  'kind','patient','supportive','innovative','powerful','robust','secure','stable',
  'elegant','simple','clear','transparent','fair','flexible','generous','rewarding',
  'exceeded','flawless','remarkable','phenomenal','exceptional','stellar','solid',
  // Intelligence / capability
  'smart','clever','intelligent','wise','genius','talented','skilled','capable',
  'competent','resourceful','resilient','strong','tough','adaptable',
  // Affection / admiration
  'adorable','cute','sweet','charming','endearing','lovable','precious','darling',
  'gorgeous','stunning','handsome','attractive','magnificent','glorious','majestic',
  // Praise / advocacy
  'deserve','deserves','deserved','respect','respected','admire','admired','admirable',
  'applaud','applauded','applause','bravo','kudos','praise','praised','celebrate',
  'celebrated','champion','champions','defend','defended','support','supported',
  'proud','proudly','honor','honored','honorable',
  // Success / thriving
  'thriving','thrive','thrived','flourish','flourishing','succeed','succeeded',
  'success','successful','prosper','prosperous','bloom','blossom','progress',
  'progressing','improve','improved','improving','upgrade','upgraded','enhance',
  'enhanced',
  // Agreement / validation
  'agree','agreed','exactly','true','correct','right','nailed','facts','relatable',
  'underrated','underappreciated','masterpiece','goated','icon','iconic','legend',
  'legendary','king','queen','goat','fire','based','wholesome','heartwarming',
  'touching','inspiring','motivating','motivated','encouraged','encouraging',
  'uplifting','hopeful','optimistic','blessed','lucky','fortunate',
  // Positive verbs
  'like','liked','adore','adored','treasure','cherish','cherished','valued',
  'prize','prized','welcome','welcomed',
  // Modern internet praise
  'sick','dope','lit','vibing','mid','goat','w','based','real','peak','unreal',
  'insane','crazy','wild','bussin','banger','bop','slaps','fire','heat','gas',
  'clean','cracked','different','special','unique','rare','elite','pro','master',
  // Quality descriptors
  'sleek','polished','refined','crisp','sharp','vibrant','rich','deep','immersive',
  'engaging','captivating','compelling','gripping','fascinating','intriguing',
  'entertaining','hilarious','funny','amusing','delightful','refreshing',
  'satisfying','rewarding','fulfilling','meaningful','impactful','valuable',
  'insightful','profound',
  // Welcome-back / return
  'back','returned','welcome','finally','glad','missed','missing','return',
  'returns','returning','here','yooo','yoooo','omg','omggg','lets','go',
]);

// ---- Negative lexicon ----
const NEGATIVE_WORDS = new Set([
  // Core negative
  'bad','terrible','horrible','awful','worst','poor','disappointing','disappointed',
  'disappointment','hate','hated','dislike','slow','broken','buggy','crash',
  'crashes','crashed','fail','failed','failure','useless','worthless','waste',
  'scam','fraud','rude','unprofessional','expensive','overpriced','flimsy','late',
  'delay','delayed','ignored','ignore','unresponsive','confusing','confused',
  'complicated','difficult','frustrating','frustrated','frustration','angry','mad',
  'furious','sad','unhappy','unsatisfied','dissatisfied','complaint','complain',
  'complaining','problem','issue','issues','bug','bugs','error','errors','glitch',
  'freeze','freezes','frozen','lag','laggy','clunky','ugly','messy','annoying',
  'annoyed','boring','dull','outdated','obsolete','inferior','shoddy','defective',
  'damaged','missing','lost','stolen','overcharge','refund','wrong','faulty',
  'unreliable','unstable','insecure','vulnerable','spam','fake','liar','lies',
  'misleading','deceptive','careless','negligent','sloppy','tedious','painful',
  'regret','disaster','nightmare','garbage','trash','rubbish','pathetic',
  // Negative emotions
  'depressing','depressed','bleak','grim','dread','dreadful','miserable','suffering',
  'suffer','suffered','agony','torment','anguish','despair','hopeless','helpless',
  'tragic','tragedy','heartbreaking','heartbroken','devastating','devastated',
  'crushed','lonely','alone','abandoned','rejected','betrayed','betray','abuse',
  'abused','abusive','cruel','mean','nasty','vile','disgusting','gross',
  'repulsive','revolting','sickening','toxic','poison','poisonous','malice',
  'malicious','spite','spiteful','bitter',
  // Negative descriptors
  'cringe','cringey','cringeworthy','embarrassing','embarrassed','shame',
  'shameful','lame','stupid','dumb','idiotic','moronic','brainless','foolish',
  'ridiculous','absurd','nonsense','bullshit','crap','suck','sucks','sucked',
  'overrated','bland','stale','flat','lifeless','soulless','generic','derivative',
  'lazy','uninspired','weak','feeble','pitiful','laughable','mockery',
  // Negative verbs
  'ruin','ruined','ruining','destroy','destroyed','demolish','wreck','wrecked',
  'tarnish','tarnished','corrupt','corrupted','harm','harmed','hurt','hurts',
  'hurting','damage','damaged','wound','wounded','attack','attacked','assault',
  'insult','insulted','mock','mocked','ridicule','humiliate','humiliated',
  'oppress','oppressed','exploit','exploited','manipulate','manipulated','deceive',
  'deceived','cheat','cheated','steal','stole','rob','robbed','threaten',
  'threatened','intimidate','intimidated','bully','bullied','harass','harassed',
  'torment','tormented','torture','tortured','starve','starving','starved',
  // Negative context
  'hatred','hateful','bigot','bigoted','racist','sexist','homophobic',
  'xenophobic','prejudice','prejudiced','discrimination','discriminatory','unfair',
  'unjust','wrongful','illegal','unlawful','crooked','shady',
  // Fled / abandoned (context: negative in "fled the country")
  'fled','abandon','abandoned','ran','quit','quitter','give','gave','giving',
  'dropped','ghosted','disappeared','vanished','gone','left','leaving',
]);

// ---- Words that are positive ONLY in context (not inherently) ----
// These are handled by phrase patterns, not the word set, to avoid
// misclassification when used neutrally.
const CONTEXT_DEPENDENT_POSITIVE = new Set([
  'back','returned','return','returns','here','finally','glad','missed',
]);
const CONTEXT_DEPENDENT_NEGATIVE = new Set([
  'fled','ran','left','gone',
]);
// Words that are negative ONLY in certain contexts — when used in a
// narrative contrast ("I was depressed... but now I'm happy") they
// should NOT contribute negative sentiment. The phrase patterns
// handle the contrast detection; these words are dampened when a
// contrast pattern has already fired.
const EMOTIONAL_STATE_WORDS = new Set([
  'depressed','depressing','sad','unhappy','miserable','down','struggling',
  'suffering','suffer','lonely','alone','hopeless','helpless','bleak','grim',
  'gloomy','broken','lost','hurting','hurt','painful','pain','agony',
  'torment','anguish','despair','crying','tears','heartbroken','devastated',
  'crushed','abandoned','rejected','betrayed',
]);

const CONTEXT_DEPENDENT = new Set([
  ...CONTEXT_DEPENDENT_POSITIVE,
  ...CONTEXT_DEPENDENT_NEGATIVE,
]);

// Remove context-dependent words from the base sets so they only
// trigger via phrase patterns
for (const w of CONTEXT_DEPENDENT) {
  POSITIVE_WORDS.delete(w);
  NEGATIVE_WORDS.delete(w);
}
// Remove emotional state words from negative set — they'll be handled
// by phrase patterns and only count as negative when NOT in a contrast
for (const w of EMOTIONAL_STATE_WORDS) {
  NEGATIVE_WORDS.delete(w);
}

// ---- Intensifiers ----
const INTENSIFIERS = new Set([
  'very','really','extremely','super','so','incredibly','absolutely','totally',
  'completely','utterly','highly','remarkably','truly','genuinely','especially',
  'way','too','insanely','crazy','ridiculously','stupidly','hella','mad','af',
  'freaking','frickin','damn','sooo','soooo','waaay','tooootally',
]);

// ---- Negators ----
const NEGATORS = new Set([
  'not','no','never','none','nobody','nothing','neither','nor','hardly','barely',
  "isn't","wasn't","aren't","weren't","don't","doesn't","didn't","won't","can't",
  "couldn't","shouldn't","wouldn't","cannot","without","ain't","dont","wont",
  'cant','couldnt','shouldnt','wouldnt','isnt','wasnt','arent','werent','didnt',
  'aint',
]);

// ---- Diminishers (reduce sentiment intensity) ----
const DIMINISHERS = new Set([
  'kinda','sorta','somewhat','slightly','a','bit','little','fairly','rather',
  'quite','meh','ish','semi',
]);

// ============================================================
//  Phrase Patterns — contextual multi-word sentiment
//  These are checked FIRST and override word-level scoring.
// ============================================================

interface PhrasePattern {
  regex: RegExp;
  sentiment: 'positive' | 'negative';
  weight: number;
  emotion?: EmotionLabel;
}

const PHRASE_PATTERNS: PhrasePattern[] = [
  // --- Welcome back / return patterns ---
  { regex: /\b(the\s+)?goat\s+(is\s+)?(back|returned|here)\b/i, sentiment: 'positive', weight: 2.0, emotion: 'excited' },
  { regex: /\b(welcome\s+back|welcome\s+home|glad\s+(you'?re|ur|your)\s+back|glad\s+to\s+(have|see)\s+you\s+back)\b/i, sentiment: 'positive', weight: 2.0, emotion: 'happy' },
  { regex: /\b(glad\s+(ur|you'?re)\s+back|happy\s+(ur|you'?re)\s+back)\b/i, sentiment: 'positive', weight: 2.0, emotion: 'happy' },
  { regex: /\b(missed\s+(you|u|ya|this)|miss\s+you|missing\s+(you|u|this))\b/i, sentiment: 'positive', weight: 1.5, emotion: 'appreciative' },
  { regex: /\b(he'?s\s+back|she'?s\s+back|they'?re\s+back|bro'?s\s+back|king\s+is\s+back|queen\s+is\s+back)\b/i, sentiment: 'positive', weight: 1.8, emotion: 'excited' },
  { regex: /\bfinally\s+(back|returned|here|uploading|posting|making\s+videos)\b/i, sentiment: 'positive', weight: 1.5, emotion: 'excited' },
  { regex: /\b(let'?s?\s+go|lets\s+go|lfg|let'?s\s+fucking\s+go)\b/i, sentiment: 'positive', weight: 1.5, emotion: 'excited' },
  { regex: /\b(yooo+|yoooo+|omgg+|omg|let'?s\s+go)\b/i, sentiment: 'positive', weight: 1.0, emotion: 'excited' },

  // --- Advocacy / defending ---
  { regex: /\b(way\s+too\s+much|too\s+much|so\s+much)\s+(hate|hatred|hating|negativity|flak|crap|shade|disrespect)\b/i, sentiment: 'positive', weight: 1.8, emotion: 'appreciative' },
  { regex: /\b(give|gives|giving|got|gets|getting)\s+\w+\s+(too\s+much\s+)?(hate|hatred|flak|crap|shade|disrespect|negativity)\b/i, sentiment: 'positive', weight: 1.5, emotion: 'appreciative' },
  { regex: /\b(stop|end|no\s+more|less)\s+(hate|hatred|hating|bullying|negativity|disrespect)\b/i, sentiment: 'positive', weight: 1.5, emotion: 'appreciative' },
  { regex: /\b(deserve\s+(better|more|respect|love|attention|recognition))\b/i, sentiment: 'positive', weight: 1.8, emotion: 'appreciative' },
  { regex: /\b(deserves\s+(better|more|respect|love|attention|recognition))\b/i, sentiment: 'positive', weight: 1.8, emotion: 'appreciative' },
  { regex: /\b(underrated|under\s+rated|underappreciated|under\s+appreciated)\b/i, sentiment: 'positive', weight: 1.5, emotion: 'appreciative' },
  { regex: /\b(still\s+(thriving|going\s+strong|here|surviving|standing|out\s+here))\b/i, sentiment: 'positive', weight: 1.3, emotion: 'appreciative' },
  { regex: /\b(been\s+around\s+(for\s+)?(centuries|decades|years|ages|forever))\b/i, sentiment: 'positive', weight: 1.0, emotion: 'appreciative' },

  // --- Transformation / changed mind ---
  { regex: /\b(used\s+to\s+(not|never|dislike|hate|didn'?t|dont)\b.{0,100}?\b(but|now|then|however|glad|happy)\b)/i, sentiment: 'positive', weight: 2.0, emotion: 'happy' },
  { regex: /\b(i\s+(used\s+to|didnt|didn'?t)\s+(not\s+)?(care|like|watch|understand|get\s+it).{0,100}?(but|now|then|glad|happy)\b)/i, sentiment: 'positive', weight: 1.8, emotion: 'happy' },
  { regex: /\b(changed\s+my\s+(mind|life|perspective|view))\b/i, sentiment: 'positive', weight: 1.8, emotion: 'appreciative' },
  { regex: /\b(opened\s+my\s+(eyes|mind))\b/i, sentiment: 'positive', weight: 1.6, emotion: 'appreciative' },

  // --- Sarcasm / dismissive negation ---
  { regex: /\b(not\s+(that\s+)?(bad|terrible|horrible|awful|wrong))\b/i, sentiment: 'positive', weight: 1.0 },
  { regex: /\b(not\s+(a\s+)?(scam|fraud|fake|joke|waste))\b/i, sentiment: 'positive', weight: 1.2 },
  { regex: /\b(not\s+(hate|hating|hated|bad|wrong|terrible|awful))\b/i, sentiment: 'positive', weight: 0.8 },
  { regex: /\b(i\s+(don'?t|dont)\s+(hate|dislike|mind))\b/i, sentiment: 'positive', weight: 1.2, emotion: 'happy' },
  { regex: /\b(can'?t\s+(hate|be\s+mad|be\s+angry|argue\s+with\s+that))\b/i, sentiment: 'positive', weight: 1.2, emotion: 'happy' },

  // --- Genuine complaints ---
  { regex: /\b(waste\s+of\s+(time|money|effort|space))\b/i, sentiment: 'negative', weight: 2.2, emotion: 'frustrated' },
  { regex: /\b(don'?t\s+(waste|buy|bother|recommend|watch|go))\b/i, sentiment: 'negative', weight: 1.8, emotion: 'disappointed' },
  { regex: /\b(never\s+(again|going\s+back|buying|watching|ordering|coming))\b/i, sentiment: 'negative', weight: 2.0, emotion: 'disappointed' },
  { regex: /\b(rip\s+off|ripped\s+off)\b/i, sentiment: 'negative', weight: 2.5, emotion: 'angry' },
  { regex: /\b(worst\s+(ever|experience|service|product|video|content|ending))\b/i, sentiment: 'negative', weight: 2.2, emotion: 'disappointed' },

  // --- Praise phrases ---
  { regex: /\b(this\s+is\s+(the\s+)?(best|greatest|amazing|incredible|awesome|perfect))\b/i, sentiment: 'positive', weight: 1.8, emotion: 'excited' },
  { regex: /\b(love\s+(this|it|you|your|the|that))\b/i, sentiment: 'positive', weight: 1.5, emotion: 'happy' },
  { regex: /\b(so\s+(good|amazing|incredible|true|real|wholesome|sweet|kind|funny|happy|glad))\b/i, sentiment: 'positive', weight: 1.4, emotion: 'happy' },
  { regex: /\b(keep\s+(up\s+the\s+good|up\s+the\s+great|doing\s+(god'?s|gods|this|that|you)|going|making))\b/i, sentiment: 'positive', weight: 1.4, emotion: 'appreciative' },
  { regex: /\b(can'?t\s+stop\s+watching|rewatching|listening)\b/i, sentiment: 'positive', weight: 1.5, emotion: 'excited' },
  { regex: /\b(snag|snagged|got)\s+a?\s*(picture|photo|pic|selfie)\b/i, sentiment: 'positive', weight: 1.3, emotion: 'excited' },
  { regex: /\b(happy\s+(to|that)\s+(hear|see|have|welcome|be))\b/i, sentiment: 'positive', weight: 1.4, emotion: 'happy' },
  { regex: /\b(travels\s+went\s+well|all\s+good|all\s+went\s+well)\b/i, sentiment: 'positive', weight: 1.2, emotion: 'happy' },

  // --- Storytelling / joke framing (positive context) ---
  // "Bro got the worst X, did Y, then fled" = humorous positive
  { regex: /\bbro\s+got\s+the\s+worst\b.{0,60}?\bthen\s+(fled|ran|left|dipped|bounced|peaced)\b/i, sentiment: 'positive', weight: 1.5, emotion: 'excited' },
  { regex: /\b(got\s+the\s+worst\b.{0,60}?\b(fled|ran|left|dipped|bounced))\b/i, sentiment: 'positive', weight: 1.2, emotion: 'excited' },
  { regex: /\bglad\s+(ur|you'?re|u)\s+back\b/i, sentiment: 'positive', weight: 2.0, emotion: 'happy' },

  // --- Narrative contrast / emotional turn (positive resolution) ---
  // "I was/have been depressed/sad... but/and now X brightened/made me happy"
  // The negative state is just context; the overall sentiment is positive.
  { regex: /\b(i'?ve\s+been\s+(in\s+a\s+)?(depressed|sad|down|bad|dark|rough|tough|low|hard)\s*(state|place|time|mood|period|spot|headspace)?\b.{0,120}?\b(brightened|made\s+my\s+day|cheered|lifted|helped|saved|healed|happy|glad|smile|better|turned\s+around|changed)\b)/i, sentiment: 'positive', weight: 2.5, emotion: 'appreciative' },
  { regex: /\b(been\s+(in\s+a\s+)?(depressed|sad|down|bad|dark|rough|tough|low|hard)\s*(state|place|time|mood|period|spot|headspace)?\b.{0,120}?\b(brightened|made\s+my\s+day|cheered|lifted|helped|saved|healed|happy|glad|smile|better|turned\s+around|changed)\b)/i, sentiment: 'positive', weight: 2.5, emotion: 'appreciative' },
  { regex: /\b((depressed|sad|down|unhappy|miserable|struggling|suffering)\s*(state|place|time|mood|period)?\b.{0,120}?\b(brightened|made\s+my\s+day|cheered|lifted|helped|saved|healed|happy|glad|smile|better|turned\s+around|changed)\b)/i, sentiment: 'positive', weight: 2.2, emotion: 'appreciative' },
  // "was X but now Y" general contrast pattern
  { regex: /\b(was\s+(so\s+)?(depressed|sad|down|unhappy|miserable|lost|struggling|hurting|broken)\b.{0,100}?(but|now|then|and)\b.{0,80}?(happy|glad|better|healed|smiling|brightened|grateful|blessed|alive|good|great|amazing|wonderful|joy|peace|hope|love)\b)/i, sentiment: 'positive', weight: 2.0, emotion: 'happy' },
  // "brightened my day" standalone
  { regex: /\b(brightened\s+my\s+(day|week|month|mood|spirits)|made\s+my\s+(day|week|month)|cheered\s+me\s+up|lifted\s+my\s+(spirits|mood)|turned\s+my\s+(day|week|mood)\s+around)\b/i, sentiment: 'positive', weight: 2.0, emotion: 'happy' },
  // "seeing the return of X" = positive
  { regex: /\b(seeing\s+the\s+return\s+of|seeing\s+x\s+return|so\s+happy\s+to\s+see|so\s+glad\s+to\s+see)\b/i, sentiment: 'positive', weight: 1.5, emotion: 'excited' },
  // "actually" as a positive surprise marker
  { regex: /\bactually\s+(brightened|made|cheered|helped|saved|improved|better|good|great|amazing|love|enjoy)\b/i, sentiment: 'positive', weight: 1.3, emotion: 'happy' },

  // --- Genuine negative ---
  { regex: /\b(i\s+hate|absolutely\s+hate|fucking\s+hate|really\s+hate)\b/i, sentiment: 'negative', weight: 2.0, emotion: 'angry' },
  { regex: /\b(this\s+is\s+(bad|terrible|awful|horrible|trash|garbage))\b/i, sentiment: 'negative', weight: 2.0, emotion: 'frustrated' },
  { regex: /\b(don'?t\s+(like|recommend|enjoy))\b/i, sentiment: 'negative', weight: 1.5, emotion: 'disappointed' },
  { regex: /\b(makes\s+me\s+(sad|angry|mad|sick|depressed|uncomfortable))\b/i, sentiment: 'negative', weight: 1.8, emotion: 'sad' },
  { regex: /\b(no\s+one\s+(cares|asked|wanted))\b/i, sentiment: 'negative', weight: 1.5, emotion: 'frustrated' },
];

// ---- Emoji sentiment ----
const POSITIVE_EMOJI_RE = /[\u{1F600}-\u{1F64F}\u{1F970}\u{1F60A}\u{1F604}\u{1F601}\u{1F602}\u{1F605}\u{1F609}\u{1F60D}\u{1F618}\u{1F929}\u{1F44D}\u{1F44F}\u{1F64C}\u{1F389}\u{2728}\u{1F31F}\u{1F4AF}\u{1F525}\u{1F495}\u{1F496}\u{1F497}\u{1F49F}\u{1F4AB}\u{1F388}\u{1F38A}]/gu;
const NEGATIVE_EMOJI_RE = /[\u{1F621}\u{1F620}\u{1F629}\u{1F62B}\u{1F624}\u{1F616}\u{1F623}\u{1F622}\u{1F62D}\u{1F631}\u{1F628}\u{1F630}\u{1F44E}\u{1F4A9}\u{1F612}\u{1F614}\u{1F615}\u{1F637}\u{1F634}\u{1F635}]/gu;
const NEUTRAL_EMOJI_RE = /[\u{1F610}\u{1F611}\u{1F636}\u{1FAE0}\u{1F928}\u{1F9D0}]/gu;

// ---- Emotion lexicons ----
interface EmotionLexicon {
  emotion: EmotionLabel;
  words: string[];
  valence: 'positive' | 'negative';
}

const EMOTION_LEXICONS: EmotionLexicon[] = [
  {
    emotion: 'happy',
    valence: 'positive',
    words: ['happy','glad','joy','joyful','pleased','delighted','content','cheerful',
      'smile','smiling','enjoy','enjoyed','satisfied','satisfaction','lovely','sweet',
      'wholesome','heartwarming','blessed','lucky','fortunate','glad','thrilled',
      'grateful','thankful','welcome','welcomed','missed','happy','yay','hooray',
    ],
  },
  {
    emotion: 'excited',
    valence: 'positive',
    words: ['excited','exciting','thrilled','amazing','awesome','fantastic','incredible',
      'wow','stunning','mindblowing','spectacular','eager','pumped','hyped','unreal',
      'insane','fire','lit','goated','iconic','legend','legendary','goat','king',
      'queen','yooo','omg','omggg','let','lfg','hyped','pumped','stoked','giddy',
      'ecstatic','overjoyed','elated','jazzed','amped','fired','up',
    ],
  },
  {
    emotion: 'appreciative',
    valence: 'positive',
    words: ['appreciate','appreciated','grateful','thankful','thanks','thank','blessed',
      'gratitude','kind','generous','thoughtful','courteous','helpful','deserve',
      'deserves','respect','respected','admire','admired','applaud','applause',
      'kudos','praise','champion','support','supported','proud','honor','underrated',
      'underappreciated','welcome','welcomed','missed','deserve','deserved',
    ],
  },
  {
    emotion: 'angry',
    valence: 'negative',
    words: ['angry','mad','furious','rage','outraged','livid','irritated','irritating',
      'infuriating','pissed','hostile','resentful','scam','fraud','rip','ripped',
      'crooked','shady','corrupt','toxic','malicious','spiteful','cruel','vile',
      'hate','hated','hatred',
    ],
  },
  {
    emotion: 'frustrated',
    valence: 'negative',
    words: ['frustrated','frustrating','frustration','annoyed','annoying','stuck',
      'blocked','difficult','struggling','ugh','impossible','tedious','aggravating',
      'hate','dislike','disgusting','garbage','trash','rubbish','pathetic','useless',
      'worthless','waste','cringe','cringey','lame','stupid','dumb','ridiculous',
      'absurd','boring','dull','mid','overrated','annoying','aggravating','fed','up',
    ],
  },
  {
    emotion: 'sad',
    valence: 'negative',
    words: ['sad','unhappy','depressed','depressing','down','upset','heartbroken',
      'heartbreaking','devastated','devastating','gloomy','miserable','lonely',
      'alone','tears','crying','hurt','painful','suffering','suffer','tragic',
      'tragedy','bleak','grim','hopeless','helpless','crushed','abandoned',
      'rejected','betrayed',
    ],
  },
  {
    emotion: 'disappointed',
    valence: 'negative',
    words: ['disappointed','disappointing','disappointment','letdown','underwhelmed',
      'expected','hoped','misleading','failed','shortfall','lacking','regret',
      'regretful','terrible','horrible','awful','worst','poor','bad','waste',
      'never','again',
    ],
  },
  {
    emotion: 'confused',
    valence: 'negative',
    words: ['confused','confusing','confusion','unclear','puzzled','lost','unsure',
      'uncertain','baffled','perplexed','mixed','complicated','nonsense',
    ],
  },
];

// ---- Stopwords for keyword extraction ----
const STOPWORDS = new Set([
  'the','a','an','and','or','but','if','then','else','when','at','by','for','with',
  'about','against','between','into','through','during','before','after','above',
  'below','to','from','up','down','in','out','on','off','over','under','again',
  'further','once','here','there','all','any','both','each','few','more','most',
  'other','some','such','no','nor','not','only','own','same','so','than','too',
  'very','can','will','just','is','am','are','was','were','be','been','being',
  'have','has','had','do','does','did','this','that','these','those','i','me','my',
  'we','our','you','your','he','him','his','she','her','it','its','they','them',
  'their','what','which','who','whom','whose','how','why','where','of','as','also',
  'would','could','should','really','get','got',
  'one','two','go','going','im','ive','id','dont','cant','wont','didnt','thats',
  'theres','use','using','used','like','even','still','much','many','well','way',
  'thing','things','something','everything','nothing','anything','someone',
  'anyone','everyone','say','said','says','make','made','makes','want','wants',
  'wanted','need','needs','needed','think','thought','know','knew','see','seen',
  'look','looked','come','came','take','took','give','gave','find','found','tell',
  'told','ask','asked','try','tried','feel','felt','become','became','leave','left',
  'put','let','keep','kept','begin','began','seem','seemed','help','helped','show',
  'showed','run','play','move','live','believe','hold','bring','happen',
  'happened','write','written','sit','sitting','stand','standing','lose','lost',
  'pay','paid','meet','met','include','included','continue','set','learn',
  'learned','change','changed','lead','led','understand','understood','watch',
  'watching','follow','followed','stop','stopped','create','created','speak',
  'spoke','read','allow','allowed','add','added','spend','spent','grow','grew',
  'open','opened','walk','walked','win','won','offer','offered','remember',
  'remembered','love','loved','consider','considered','appear','appeared','buy',
  'bought','wait','waited','serve','served','die','died','send','sent','expect',
  'expected','build','built','stay','stayed','fall','fell','cut','reach',
  'reached','kill','killed','raise','raised','pass','passed','sell','sold',
  'decide','decided','return','returned','explain','explained','hope','hoped',
  'develop','developed','carry','carried','break','broke','receive','received',
  'agree','agreed','support','supported','hit','hitting','produce','produced',
  'eat','ate','cover','covered','catch','caught','draw','drew','choose','chose',
  'point','pointed','save','saved','design','designed','occur','occurred',
  // Common filler
  'bro','yo','yoo','yooo','omg','omggg','nah','yeah','yes','no','ok','okay',
  'lol','lmao','fr','smh','tbh','ngl','like','literally','actually','basically',
  'honestly','seriously','obviously','clearly','definitely','probably','maybe',
  'perhaps','might','must','shall','may','could','would','should','ought',
  'wasn','isn','aren','weren','don','doesn','didn','won','can','couldn','shouldn',
  'wouldn','hasn','haven','hadn','mightn','mustn','needn','shan','oughtn',
  'ain','re','ve','ll','d','s','t','m',
]);

// ============================================================
//  Tokenization
// ============================================================

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// ============================================================
//  Keyword extraction
// ============================================================

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

// ============================================================
//  Core scoring
// ============================================================

function scoreText(text: string): {
  positive: number;
  negative: number;
  emotions: Record<EmotionLabel, number>;
  contributingWords: string[];
  contrastDetected: boolean;
} {
  const sentences = splitSentences(text.length ? text : ' ');
  let positive = 0;
  let negative = 0;
  let contrastDetected = false;
  const emotions = {
    happy: 0, excited: 0, angry: 0, sad: 0,
    frustrated: 0, appreciative: 0, confused: 0, disappointed: 0,
  } as Record<EmotionLabel, number>;
  const contributing: string[] = [];

  // 1) Phrase-level patterns (highest priority — contextual overrides)
  for (const pattern of PHRASE_PATTERNS) {
    const flags = pattern.regex.flags.includes('g') ? pattern.regex.flags : pattern.regex.flags + 'g';
    const matches = text.match(new RegExp(pattern.regex.source, flags));
    if (matches) {
      for (const m of matches) {
        if (pattern.sentiment === 'positive') {
          positive += pattern.weight;
          // Track if this is a contrast/turn pattern
          if (/brightened|depressed|sad|down|unhappy|miserable|struggling|was\s+|been\s+/.test(m)) {
            contrastDetected = true;
          }
        } else {
          negative += pattern.weight;
        }
        if (pattern.emotion) {
          emotions[pattern.emotion] += pattern.weight;
        }
        contributing.push(m.slice(0, 40));
      }
    }
  }

  // 2) Emoji sentiment
  const posEmojiCount = (text.match(POSITIVE_EMOJI_RE) ?? []).length;
  const negEmojiCount = (text.match(NEGATIVE_EMOJI_RE) ?? []).length;
  const neuEmojiCount = (text.match(NEUTRAL_EMOJI_RE) ?? []).length;
  if (posEmojiCount) {
    positive += posEmojiCount * 0.8;
    emotions.happy += posEmojiCount * 0.4;
    emotions.excited += posEmojiCount * 0.3;
  }
  if (negEmojiCount) {
    negative += negEmojiCount * 0.8;
    emotions.frustrated += negEmojiCount * 0.4;
    emotions.sad += negEmojiCount * 0.2;
  }
  // Neutral emojis dampen signal slightly
  if (neuEmojiCount && totalSignal(positive, negative) < 1) {
    // keep neutral if no other signal
  }

  // 3) Word-level scoring with negation + intensifier + diminisher windowing
  for (const sentence of sentences) {
    const tokens = tokenize(sentence);

    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      const prev = tokens[i - 1];
      const prev2 = tokens[i - 2];
      const prev3 = tokens[i - 3];

      // Skip if context-dependent word (handled by phrase patterns)
      if (CONTEXT_DEPENDENT.has(tok)) continue;

      // If contrast was detected by phrase patterns, skip emotional
      // state words entirely — they're narrative context, not sentiment
      if (contrastDetected && EMOTIONAL_STATE_WORDS.has(tok)) continue;

      // Check for negation within previous 3 tokens
      const isNegated =
        NEGATORS.has(prev) || NEGATORS.has(prev2) || NEGATORS.has(prev3);

      // Check for intensifier
      let intensify = 1;
      if (INTENSIFIERS.has(prev)) intensify = 1.8;
      else if (INTENSIFIERS.has(prev2)) intensify = 1.4;

      // Check for diminisher
      if (DIMINISHERS.has(prev) || DIMINISHERS.has(prev2)) intensify *= 0.5;

      let added = false;
      if (POSITIVE_WORDS.has(tok)) {
        const weight = (isNegated ? -0.7 : 1) * intensify;
        if (weight > 0) {
          positive += weight;
        } else {
          // Negated positive = mild negative
          negative += Math.abs(weight) * 0.6;
        }
        contributing.push(tok);
        added = true;
      } else if (NEGATIVE_WORDS.has(tok)) {
        const weight = (isNegated ? -0.85 : 1) * intensify;
        if (weight > 0) {
          negative += weight;
        } else {
          // Negated negative = positive (e.g. "not bad" = good, "don't hate" = like)
          positive += Math.abs(weight) * 0.85;
        }
        contributing.push(tok);
        added = true;
      }

      // Emotion scoring (separate from pos/neg)
      for (const lex of EMOTION_LEXICONS) {
        if (lex.words.includes(tok)) {
          const emoWeight = (isNegated ? 0.25 : 1) * intensify;
          emotions[lex.emotion] += emoWeight;
        }
      }
    }
  }

  return { positive, negative, emotions, contributingWords: contributing, contrastDetected };
}

function totalSignal(pos: number, neg: number): number {
  return pos + neg;
}

// ============================================================
//  Main sentiment analysis
// ============================================================

export function analyzeSentiment(text: string): SentimentResult {
  const { positive, negative, emotions, contributingWords } = scoreText(text);
  const keywords = [...new Set(contributingWords)].slice(0, 8);

  const signal = positive + negative;
  const diff = positive - negative;

  let positiveScore: number;
  let negativeScore: number;
  let neutralScore: number;

  if (signal === 0) {
    // No lexical or phrase signal — check emojis alone
    const posE = (text.match(POSITIVE_EMOJI_RE) ?? []).length;
    const negE = (text.match(NEGATIVE_EMOJI_RE) ?? []).length;
    if (posE > negE && posE > 0) {
      positiveScore = 0.6;
      negativeScore = 0.1;
      neutralScore = 0.3;
    } else if (negE > posE && negE > 0) {
      positiveScore = 0.1;
      negativeScore = 0.6;
      neutralScore = 0.3;
    } else {
      positiveScore = 0.15;
      negativeScore = 0.15;
      neutralScore = 0.7;
    }
  } else {
    // Signal-based scoring with aggressive non-neutral bias
    // Even a single strong signal should push away from neutral
    const signalStrength = Math.min(1, signal / 2.5);
    // Neutral is heavily suppressed when there's real signal
    neutralScore = (1 - signalStrength) * 0.15;
    const remaining = 1 - neutralScore;

    // Ratio determines split of remaining score
    const ratio = diff / signal; // -1 to 1
    if (ratio >= 0) {
      positiveScore = remaining * (0.55 + ratio * 0.45);
      negativeScore = remaining * (0.45 - ratio * 0.45);
    } else {
      positiveScore = remaining * (0.55 + ratio * 0.45);
      negativeScore = remaining * (0.45 - ratio * 0.45);
    }
    // Clamp to valid range
    positiveScore = Math.max(0.02, positiveScore);
    negativeScore = Math.max(0.02, negativeScore);
    // Renormalize
    const sum = positiveScore + negativeScore + neutralScore;
    positiveScore /= sum;
    negativeScore /= sum;
    neutralScore /= sum;
  }

  const score = positiveScore - negativeScore;
  let label: SentimentLabel = 'neutral';

  // Tight thresholds — even mild signal classifies as positive/negative
  if (score > 0.02) label = 'positive';
  else if (score < -0.02) label = 'negative';

  const confidence = Math.max(positiveScore, negativeScore, neutralScore);

  // Dominant emotion
  let dominantEmotion: EmotionLabel = 'happy';
  let maxEmotion = -1;
  (Object.keys(emotions) as EmotionLabel[]).forEach((e) => {
    if (emotions[e] > maxEmotion) {
      maxEmotion = emotions[e];
      dominantEmotion = e;
    }
  });
  // If no emotion triggered, infer from sentiment label
  if (maxEmotion <= 0) {
    if (label === 'positive') dominantEmotion = 'happy';
    else if (label === 'negative') dominantEmotion = 'frustrated';
    else dominantEmotion = 'appreciative';
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

// ============================================================
//  Batch helpers
// ============================================================

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
    if (totalNegative > totalPositive) dominant = 'frustrated';
    else if (totalPositive > totalNegative) dominant = 'happy';
    else dominant = 'appreciative';
  }
  return dominant;
}

export { keywordSet };
