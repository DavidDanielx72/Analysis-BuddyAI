import type {
  AnalysisItem,
  AnalysisRecord,
  AnalysisSource,
  EmotionLabel,
  SentimentLabel,
} from '@/types';
import { analyzeSentiment, dominantEmotionAcross, extractKeywords, STOPWORDS } from './sentimentEngine';

// ---- Topic extraction (n-gram based with filtering) ----

// Filter out bigrams that are meaningless noise
function isMeaningfulBigram(a: string, b: string): boolean {
  // Skip if either word is too short or a number
  if (a.length < 3 || b.length < 3) return false;
  // Skip if both words are the same
  if (a === b) return false;
  // Skip common filler pairs
  const pair = `${a} ${b}`;
  const fillerPairs = new Set([
    'this is', 'that is', 'it was', 'i am', 'you are', 'they are', 'we are',
    'this was', 'that was', 'there is', 'there was', 'here is', 'here was',
    'i was', 'you were', 'they were', 'we were', 'i have', 'you have',
    'they have', 'we have', 'i had', 'you had', 'they had', 'we had',
    'do not', 'does not', 'did not', 'will not', 'can not', 'could not',
    'would not', 'should not', 'is not', 'was not', 'are not', 'were not',
    'have not', 'has not', 'had not', 'if you', 'if i', 'but i', 'but you',
    'and i', 'and you', 'and they', 'and we', 'or i', 'or you', 'so i',
    'so you', 'so they', 'so we', 'then i', 'then you', 'then they',
  ]);
  if (fillerPairs.has(pair)) return false;
  return true;
}

function extractTopics(items: AnalysisItem[]): { topic: string; count: number; sentiment: SentimentLabel }[] {
  const ngramCounts = new Map<string, { count: number; sentimentScores: number[] }>();
  for (const item of items) {
    const tokens = item.text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 3);
    const seen = new Set<string>();
    for (let i = 0; i < tokens.length - 1; i++) {
      if (!isMeaningfulBigram(tokens[i], tokens[i + 1])) continue;
      const bigram = `${tokens[i]} ${tokens[i + 1]}`;
      if (seen.has(bigram)) continue;
      seen.add(bigram);
      const entry = ngramCounts.get(bigram) ?? { count: 0, sentimentScores: [] };
      entry.count += 1;
      entry.sentimentScores.push(item.result.score);
      ngramCounts.set(bigram, entry);
    }
  }
  return [...ngramCounts.entries()]
    .filter(([, v]) => v.count >= 2)
    .map(([topic, v]) => {
      const avg = v.sentimentScores.reduce((s, v2) => s + v2, 0) / v.sentimentScores.length;
      return {
        topic,
        count: v.count,
        sentiment: (avg > 0.05 ? 'positive' : avg < -0.05 ? 'negative' : 'neutral') as SentimentLabel,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// ---- Keyword aggregation ----

function aggregateKeywords(items: AnalysisItem[]) {
  const kwMap = new Map<string, { count: number; sentimentScores: number[] }>();
  for (const item of items) {
    const kws = extractKeywords(item.text, 10);
    for (const kw of kws) {
      const entry = kwMap.get(kw) ?? { count: 0, sentimentScores: [] };
      entry.count += 1;
      entry.sentimentScores.push(item.result.score);
      kwMap.set(kw, entry);
    }
  }
  return [...kwMap.entries()]
    .map(([word, v]) => {
      const avg = v.sentimentScores.reduce((s, v2) => s + v2, 0) / v.sentimentScores.length;
      return {
        word,
        count: v.count,
        sentiment: (avg > 0.05 ? 'positive' : avg < -0.05 ? 'negative' : 'neutral') as SentimentLabel,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);
}

// ---- Content synthesis helpers ----

interface ContentTheme {
  label: string;
  items: AnalysisItem[];
  sentiment: SentimentLabel;
}

function identifyContentThemes(items: AnalysisItem[]): ContentTheme[] {
  // Extract meaningful multi-word phrases (bigrams + trigrams) across all items
  const phraseMap = new Map<string, AnalysisItem[]>();

  for (const item of items) {
    const tokens = item.text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOPWORDS.has(t));

    const seen = new Set<string>();

    // Bigrams
    for (let i = 0; i < tokens.length - 1; i++) {
      const phrase = `${tokens[i]} ${tokens[i + 1]}`;
      if (seen.has(phrase)) continue;
      seen.add(phrase);
      const arr = phraseMap.get(phrase) ?? [];
      arr.push(item);
      phraseMap.set(phrase, arr);
    }

    // Trigrams (for richer context)
    for (let i = 0; i < tokens.length - 2; i++) {
      const phrase = `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`;
      if (seen.has(phrase)) continue;
      seen.add(phrase);
      const arr = phraseMap.get(phrase) ?? [];
      arr.push(item);
      phraseMap.set(phrase, arr);
    }
  }

  // Find phrases mentioned by multiple people, sort by frequency
  const themes = [...phraseMap.entries()]
    .filter(([, arr]) => arr.length >= 2)
    .map(([label, arr]) => {
      const avgScore = arr.reduce((s, it) => s + it.result.score, 0) / arr.length;
      return {
        label,
        items: arr,
        sentiment: (avgScore > 0.05 ? 'positive' : avgScore < -0.05 ? 'negative' : 'neutral') as SentimentLabel,
      };
    })
    // Deduplicate: remove phrases that are substrings of longer phrases with same or higher count
    .sort((a, b) => b.items.length - a.items.length)
    .slice(0, 8);

  // Remove sub-phrases (e.g. if "goat is back" and "is back" both exist, keep only "goat is back")
  const filtered: ContentTheme[] = [];
  for (const theme of themes) {
    const isSubstring = filtered.some(
      (f) => f.label.includes(theme.label) && f.items.length >= theme.items.length,
    );
    if (!isSubstring) filtered.push(theme);
  }

  return filtered.slice(0, 5);
}

function pickRepresentativeQuotes(items: AnalysisItem[], count: number, sentiment: SentimentLabel): string[] {
  return items
    .filter((i) => i.result.label === sentiment)
    .sort((a, b) => Math.abs(b.result.score) - Math.abs(a.result.score))
    .slice(0, count)
    .map((i) => `"${i.text.slice(0, 100)}${i.text.length > 100 ? '...' : ''}"`);
}

function describeSentimentBreakdown(overall: AnalysisRecord['overall']): string {
  const posPct = Math.round(overall.positive * 100);
  const neuPct = Math.round(overall.neutral * 100);
  const negPct = Math.round(overall.negative * 100);

  if (posPct >= 70) return `overwhelmingly positive (${posPct}% positive, ${neuPct}% neutral, ${negPct}% negative)`;
  if (posPct >= 50) return `mostly positive (${posPct}% positive, ${neuPct}% neutral, ${negPct}% negative)`;
  if (negPct >= 70) return `overwhelmingly negative (${negPct}% negative, ${neuPct}% neutral, ${posPct}% positive)`;
  if (negPct >= 50) return `mostly negative (${negPct}% negative, ${neuPct}% neutral, ${posPct}% positive)`;
  return `mixed (${posPct}% positive, ${neuPct}% neutral, ${negPct}% negative)`;
}

function describeDominantEmotion(emotion: EmotionLabel, items: AnalysisItem[]): string {
  const emotionItems = items.filter((i) => i.result.dominantEmotion === emotion);
  const examples = emotionItems.slice(0, 1).map((i) => `"${i.text.slice(0, 80)}${i.text.length > 80 ? '...' : ''}"`);

  const descriptions: Record<EmotionLabel, string> = {
    happy: `happiness and joy${examples.length ? `, as seen in ${examples[0]}` : ''}`,
    excited: `excitement and enthusiasm${examples.length ? `, like ${examples[0]}` : ''}`,
    appreciative: `appreciation and gratitude${examples.length ? `, reflected in ${examples[0]}` : ''}`,
    angry: `anger and frustration${examples.length ? `, evident in ${examples[0]}` : ''}`,
    frustrated: `frustration and annoyance${examples.length ? `, as in ${examples[0]}` : ''}`,
    sad: `sadness and disappointment${examples.length ? `, like ${examples[0]}` : ''}`,
    disappointed: `disappointment${examples.length ? `, seen in ${examples[0]}` : ''}`,
    confused: `confusion and uncertainty${examples.length ? `, as in ${examples[0]}` : ''}`,
  };

  return descriptions[emotion] ?? descriptions.happy;
}

// ---- Insight generation ----

function generateInsights(
  items: AnalysisItem[],
  overall: AnalysisRecord['overall'],
  topics: AnalysisRecord['topics'],
  keywords: AnalysisRecord['keywords'],
  sourceLabel: string,
): string[] {
  const insights: string[] = [];
  const total = overall.totalItems || items.length;
  const themes = identifyContentThemes(items);

  insights.push(
    `Across ${total} ${sourceLabel.toLowerCase()} entries, sentiment is ${describeSentimentBreakdown(overall)}. The overall sentiment score of ${overall.averageScore.toFixed(2)} indicates a ${overall.averageScore > 0.1 ? 'generally favorable' : overall.averageScore < -0.1 ? 'predominantly critical' : 'mixed'} response.`,
  );

  // Theme-driven insights (what people actually talked about)
  if (themes.length) {
    const topThemes = themes.slice(0, 3);
    const themeStr = topThemes
      .map((t) => `"${t.label}" (${t.items.length} mentions, ${t.sentiment})`)
      .join(', ');
    insights.push(
      `The most discussed themes are ${themeStr}. These recurring topics represent the core of what your audience is talking about and should guide prioritization.`,
    );

    // Per-theme sentiment breakdown
    for (const theme of topThemes.slice(0, 2)) {
      const posCount = theme.items.filter((i) => i.result.label === 'positive').length;
      const negCount = theme.items.filter((i) => i.result.label === 'negative').length;
      const totalCount = theme.items.length;
      if (posCount > negCount && posCount > 0) {
        insights.push(
          `"${theme.label}" is received positively — ${Math.round((posCount / totalCount) * 100)}% of mentions are positive. This is a strength to lean into.`,
        );
      } else if (negCount > posCount && negCount > 0) {
        insights.push(
          `"${theme.label}" is a pain point — ${Math.round((negCount / totalCount) * 100)}% of mentions are negative. This needs immediate attention.`,
        );
      }
    }
  }

  // Keyword-driven strengths and concerns (use multi-word themes where available)
  const positiveThemes = themes.filter((t) => t.sentiment === 'positive').slice(0, 3).map((t) => t.label);
  const negativeThemes = themes.filter((t) => t.sentiment === 'negative').slice(0, 3).map((t) => t.label);
  const posKeywords = keywords.filter((k) => k.sentiment === 'positive').slice(0, 5).map((k) => k.word);
  const negKeywords = keywords.filter((k) => k.sentiment === 'negative').slice(0, 5).map((k) => k.word);

  const strengthTerms = positiveThemes.length ? positiveThemes : posKeywords;
  const concernTerms = negativeThemes.length ? negativeThemes : negKeywords;

  if (strengthTerms.length) {
    insights.push(
      `Strengths highlighted by your audience include: ${strengthTerms.join(', ')}. These are consistently associated with positive experiences and are competitive advantages worth promoting.`,
    );
  }
  if (concernTerms.length) {
    insights.push(
      `Recurring concerns cluster around: ${concernTerms.join(', ')}. These terms appear most often in negative feedback and point to areas requiring immediate attention.`,
    );
  }

  // Emotional tone
  const emotionTotals = items.reduce(
    (acc, it) => {
      (Object.keys(acc) as EmotionLabel[]).forEach((e) => {
        acc[e] += it.result.emotions[e];
      });
      return acc;
    },
    {
      happy: 0, excited: 0, angry: 0, sad: 0,
      frustrated: 0, appreciative: 0, confused: 0, disappointed: 0,
    } as Record<EmotionLabel, number>,
  );
  const dominantEmo = dominantEmotionAcross(emotionTotals);
  insights.push(
    `The dominant emotional signal is "${dominantEmo}". This emotional tone shapes how your audience is likely to act — ${dominantEmo === 'angry' || dominantEmo === 'frustrated' ? 'frustrated users tend to churn and share negative word-of-mouth' : dominantEmo === 'happy' || dominantEmo === 'excited' ? 'positive users are more likely to recommend and remain loyal' : dominantEmo === 'appreciative' ? 'appreciative users are receptive to upsells and deeper engagement' : dominantEmo === 'disappointed' || dominantEmo === 'sad' ? 'disappointed users may not return unless their concerns are addressed' : 'neutral audiences may need clearer value communication to convert'}.`,
  );

  // Volume-based signals
  if (overall.negative > 0.25) {
    insights.push(
      `Negative sentiment represents ${Math.round(overall.negative * 100)}% of the dataset — a meaningful share. Addressing the top complaints could materially shift overall perception and reduce churn risk.`,
    );
  }
  if (overall.positive > 0.5) {
    insights.push(
      `With ${Math.round(overall.positive * 100)}% positive sentiment, there is a strong base of satisfied users. Leveraging their enthusiasm through testimonials, referrals, and community features could amplify organic growth.`,
    );
  }

  // Content-aware opportunity
  if (concernTerms.length) {
    insights.push(
      `Opportunity: converting the negative feedback around ${concernTerms.slice(0, 2).join(' and ')} into improvements could differentiate you from competitors who ignore these signals.`,
    );
  }
  insights.push(
    `Potential risk: ${overall.negative > 0.3 ? 'the volume of negative sentiment poses a reputational risk if left unaddressed.' : 'sentiment is stable, but complacency risks letting emerging issues grow — monitor trends over time.'}`,
  );

  return insights;
}

// ---- Recommendations ----

function generateRecommendations(
  items: AnalysisItem[],
  overall: AnalysisRecord['overall'],
  topics: AnalysisRecord['topics'],
  keywords: AnalysisRecord['keywords'],
): string[] {
  const recs: string[] = [];
  const negKeywords = keywords.filter((k) => k.sentiment === 'negative');
  const posKeywords = keywords.filter((k) => k.sentiment === 'positive');
  const themes = identifyContentThemes(items);
  const negativeThemes = themes.filter((t) => t.sentiment === 'negative');
  const positiveThemes = themes.filter((t) => t.sentiment === 'positive');

  // Theme-driven recommendations (highest priority — based on actual content)
  for (const theme of negativeThemes.slice(0, 2)) {
    const sampleQuote = theme.items.find((i) => i.result.label === 'negative');
    const quoteText = sampleQuote ? ` For example: "${sampleQuote.text.slice(0, 100)}${sampleQuote.text.length > 100 ? '...' : ''}"` : '';
    recs.push(`Address the "${theme.label}" issue — it appears in ${theme.items.length} entries with negative sentiment.${quoteText}`);
  }

  // Keyword-based pattern matching
  if (negKeywords.some((k) => ['support', 'service', 'response', 'reply', 'help'].includes(k.word))) {
    recs.push('Improve customer support responsiveness — set a target first-reply time under 2 hours and add self-service resources for common questions.');
  } else if (overall.negative > 0.2 && !negativeThemes.length) {
    recs.push('Strengthen customer support channels — even without explicit complaints, proactive support reduces negative sentiment drift.');
  }

  if (negKeywords.some((k) => ['delivery', 'shipping', 'late', 'delay', 'slow'].includes(k.word))) {
    recs.push('Address delivery and fulfillment issues — audit your shipping partners, set realistic delivery estimates, and proactively notify customers of delays.');
  }

  if (negKeywords.some((k) => ['price', 'expensive', 'overpriced', 'cost', 'value'].includes(k.word))) {
    recs.push('Re-evaluate pricing communication — clarify value proposition, introduce tiered plans, or offer limited-time discounts to reframe perceived value.');
  }

  if (negKeywords.some((k) => ['bug', 'crash', 'slow', 'broken', 'error', 'glitch'].includes(k.word))) {
    recs.push('Prioritize stability and performance fixes — create a public bug tracker and ship a quality-focused release to rebuild trust.');
  }

  // Promote what people love (use themes if available, fall back to keywords)
  if (positiveThemes.length) {
    recs.push(`Promote frequently praised themes — ${positiveThemes.slice(0, 3).map((t) => `"${t.label}"`).join(', ')} are clear strengths; feature them in marketing and onboarding.`);
  } else if (posKeywords.length) {
    recs.push(`Promote frequently praised features — ${posKeywords.slice(0, 3).map((k) => k.word).join(', ')} are clear strengths; feature them in marketing and onboarding.`);
  }

  if (negKeywords.some((k) => ['communication', 'unclear', 'confusing', 'confused', 'misleading'].includes(k.word))) {
    recs.push('Improve communication clarity — rewrite FAQs, add in-app tooltips, and ensure marketing claims match the actual product experience.');
  }

  if (topics.some((t) => t.sentiment === 'negative')) {
    const negTopic = topics.find((t) => t.sentiment === 'negative');
    if (negTopic) recs.push(`Investigate the "${negTopic.topic}" theme — it carries negative sentiment and is a high-impact improvement opportunity.`);
  }

  recs.push('Identify high-impact improvements by ranking issues by frequency × sentiment severity, then tackle the top three in the next quarter.');

  if (overall.positive > 0.4) {
    recs.push('Launch a referral or advocacy program — your satisfied users are your best growth channel right now.');
  }

  if (overall.neutral > 0.5) {
    recs.push('A large share of feedback is neutral — consider gathering more specific feedback through targeted surveys to understand what would move these users to a strong opinion.');
  }

  return recs.slice(0, 8);
}

// ---- Summary (content-aware synthesis) ----

function generateSummary(
  overall: AnalysisRecord['overall'],
  topics: AnalysisRecord['topics'],
  keywords: AnalysisRecord['keywords'],
  sourceLabel: string,
  items: AnalysisItem[],
): string {
  const total = overall.totalItems;
  const sentimentDesc = describeSentimentBreakdown(overall);
  const themes = identifyContentThemes(items);

  // Build a natural-language summary that synthesizes what people actually said
  const parts: string[] = [];

  // Opening: sentiment overview
  parts.push(`Analysis of ${total} ${sourceLabel.toLowerCase()} entries found sentiment to be ${sentimentDesc}.`);

  // What are people talking about? (use multi-word themes, not single keywords)
  if (themes.length) {
    const topThemes = themes.slice(0, 3).map((t) => t.label);
    if (topThemes.length === 1) {
      parts.push(`The conversation centers on ${topThemes[0]}.`);
    } else if (topThemes.length === 2) {
      parts.push(`The conversation centers on ${topThemes.join(' and ')}.`);
    } else {
      parts.push(`The conversation centers on ${topThemes.slice(0, -1).join(', ')}, and ${topThemes[topThemes.length - 1]}.`);
    }
  }

  // What's the emotional tone?
  const emotionDesc = describeDominantEmotion(overall.dominantEmotion, items);
  parts.push(`The dominant emotional tone is ${emotionDesc}.`);

  // Pick representative quotes that actually illustrate the sentiment
  const positiveQuotes = pickRepresentativeQuotes(items, 2, 'positive');
  const negativeQuotes = pickRepresentativeQuotes(items, 2, 'negative');

  const posPct = Math.round(overall.positive * 100);
  const negPct = Math.round(overall.negative * 100);

  if (posPct >= negPct && positiveQuotes.length) {
    parts.push(`Positive feedback highlights include ${positiveQuotes.join(' and ')}.`);
  } else if (negPct > posPct && negativeQuotes.length) {
    parts.push(`Negative feedback includes ${negativeQuotes.join(' and ')}.`);
  } else if (positiveQuotes.length || negativeQuotes.length) {
    const anyQuotes = [...positiveQuotes, ...negativeQuotes].slice(0, 2);
    parts.push(`Representative comments include ${anyQuotes.join(' and ')}.`);
  }

  // What specifically do people like / dislike? (use multi-word themes with sentiment)
  const positiveThemes = themes.filter((t) => t.sentiment === 'positive').slice(0, 3).map((t) => t.label);
  const negativeThemes = themes.filter((t) => t.sentiment === 'negative').slice(0, 3).map((t) => t.label);

  if (positiveThemes.length) {
    parts.push(`Reviewers particularly appreciate ${positiveThemes.join(', ')}.`);
  }
  if (negativeThemes.length) {
    parts.push(`Common concerns revolve around ${negativeThemes.join(', ')}.`);
  }

  return parts.join(' ');
}

// ---- Explanation ----

function generateExplanation(
  items: AnalysisItem[],
  overall: AnalysisRecord['overall'],
  keywords: AnalysisRecord['keywords'],
): string[] {
  const exp: string[] = [];
  exp.push(
    `Sentiment is classified by evaluating each piece of text against a lexicon of positive and negative terms, accounting for negation ("not good"), intensifiers ("very good"), contextual phrases ("too much hate" = positive defense), and internet slang ("GOAT", "based", "fire"). ${Math.round(overall.positive * 100)}% of entries contained more positive signal, ${Math.round(overall.negative * 100)}% more negative, and ${Math.round(overall.neutral * 100)}% were balanced or lacked strong signal.`,
  );
  const posKw = keywords.filter((k) => k.sentiment === 'positive').slice(0, 5);
  const negKw = keywords.filter((k) => k.sentiment === 'negative').slice(0, 5);
  if (posKw.length)
    exp.push(`Keywords driving positive classification: ${posKw.map((k) => k.word).join(', ')}. These terms appear most frequently in entries marked positive.`);
  if (negKw.length)
    exp.push(`Keywords driving negative classification: ${negKw.map((k) => k.word).join(', ')}. These terms appear most frequently in entries marked negative.`);
  exp.push(
    `Confidence scores reflect how strongly the sentiment signal dominates the text. High confidence means the text used clearly polarized language; low confidence means the language was ambiguous or mixed.`,
  );
  exp.push(
    `Recurring themes were detected by finding meaningful multi-word phrases (2-3 word combinations) that appear across multiple entries. Themes inherit the average sentiment of the entries they appear in, which is why some topics are tagged positive and others negative.`,
  );
  return exp;
}

// ---- Trend data (if timestamps exist) ----

function buildTrend(items: AnalysisItem[]): AnalysisRecord['trendData'] {
  const withTs = items.filter((i) => i.timestamp);
  if (withTs.length < 3) return undefined;
  const sorted = [...withTs].sort((a, b) =>
    (a.timestamp ?? '').localeCompare(b.timestamp ?? ''),
  );
  const groups = new Map<string, AnalysisItem[]>();
  for (const it of sorted) {
    const day = (it.timestamp ?? '').slice(0, 10);
    const g = groups.get(day) ?? [];
    g.push(it);
    groups.set(day, g);
  }
  return [...groups.entries()].map(([day, g]) => {
    const pos = g.filter((i) => i.result.label === 'positive').length / g.length;
    const neg = g.filter((i) => i.result.label === 'negative').length / g.length;
    return {
      label: day,
      positive: Math.round(pos * 100),
      neutral: Math.round((1 - pos - neg) * 100),
      negative: Math.round(neg * 100),
    };
  });
}

// ---- Main analysis runner ----

export function runAnalysis(
  rawItems: { text: string; source?: string; likes?: number; timestamp?: string }[],
  source: AnalysisSource,
  sourceLabel: string,
  title: string,
): AnalysisRecord {
  const items: AnalysisItem[] = rawItems
    .filter((r) => r.text && r.text.trim().length > 0)
    .map((r, idx) => ({
      id: `${Date.now()}-${idx}`,
      text: r.text,
      source: r.source ?? `entry ${idx + 1}`,
      likes: r.likes,
      timestamp: r.timestamp,
      result: analyzeSentiment(r.text),
    }));

  if (items.length === 0) {
    throw new Error('No text content could be extracted for analysis.');
  }

  const total = items.length;
  const pos = items.filter((i) => i.result.label === 'positive').length / total;
  const neg = items.filter((i) => i.result.label === 'negative').length / total;
  const neu = 1 - pos - neg;
  const avgScore = items.reduce((s, i) => s + i.result.score, 0) / total;

  const emotionTotals = items.reduce(
    (acc, it) => {
      (Object.keys(acc) as EmotionLabel[]).forEach((e) => {
        acc[e] += it.result.emotions[e];
      });
      return acc;
    },
    {
      happy: 0, excited: 0, angry: 0, sad: 0,
      frustrated: 0, appreciative: 0, confused: 0, disappointed: 0,
    } as Record<EmotionLabel, number>,
  );

  const overall = {
    positive: pos,
    neutral: neu,
    negative: neg,
    averageScore: avgScore,
    dominantEmotion: dominantEmotionAcross(emotionTotals),
    totalItems: total,
  };

  const topics = extractTopics(items);
  const keywords = aggregateKeywords(items);
  const insights = generateInsights(items, overall, topics, keywords, sourceLabel);
  const recommendations = generateRecommendations(items, overall, topics, keywords);
  const summary = generateSummary(overall, topics, keywords, sourceLabel, items);
  const explanation = generateExplanation(items, overall, keywords);
  const trendData = buildTrend(items);

  const topPositive = [...items]
    .filter((i) => i.result.label === 'positive')
    .sort((a, b) => b.result.score - a.result.score)[0];
  const topNegative = [...items]
    .filter((i) => i.result.label === 'negative')
    .sort((a, b) => a.result.score - b.result.score)[0];
  const mostLiked = items.find((i) => i.likes !== undefined)?.likes
    ? [...items].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))[0]
    : undefined;

  return {
    id: `${Date.now()}`,
    title,
    createdAt: Date.now(),
    source,
    sourceLabel,
    items,
    overall,
    emotionTotals,
    keywords,
    topics,
    insights,
    recommendations,
    summary,
    explanation,
    topPositive,
    topNegative,
    mostLiked,
    trendData,
  };
}
