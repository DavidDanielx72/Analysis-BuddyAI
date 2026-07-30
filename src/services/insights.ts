import type {
  AnalysisItem,
  AnalysisRecord,
  AnalysisSource,
  EmotionLabel,
  SentimentLabel,
} from '@/types';
import { analyzeSentiment, dominantEmotionAcross, extractKeywords } from './sentimentEngine';

// ---- Topic extraction (n-gram based) ----

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
        sentiment: (avg > 0.08 ? 'positive' : avg < -0.08 ? 'negative' : 'neutral') as SentimentLabel,
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
        sentiment: (avg > 0.08 ? 'positive' : avg < -0.08 ? 'negative' : 'neutral') as SentimentLabel,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);
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

  insights.push(
    `Across ${total} ${sourceLabel.toLowerCase()} entries, ${Math.round(overall.positive * 100)}% express positive sentiment, ${Math.round(overall.neutral * 100)}% are neutral, and ${Math.round(overall.negative * 100)}% are negative. The overall sentiment score of ${overall.averageScore.toFixed(2)} indicates a ${overall.averageScore > 0.1 ? 'generally favorable' : overall.averageScore < -0.1 ? 'predominantly critical' : 'mixed'} response.`,
  );

  if (topics.length) {
    const top = topics.slice(0, 3);
    const topicStr = top.map((t) => `"${t.topic}" (${t.count} mentions, ${t.sentiment})`).join(', ');
    insights.push(
      `The most discussed themes are ${topicStr}. These recurring topics represent the core of what your audience is talking about and should guide prioritization.`,
    );
  }

  const posKeywords = keywords.filter((k) => k.sentiment === 'positive').slice(0, 5);
  const negKeywords = keywords.filter((k) => k.sentiment === 'negative').slice(0, 5);
  if (posKeywords.length) {
    insights.push(
      `Strengths highlighted by your audience include: ${posKeywords.map((k) => k.word).join(', ')}. These are consistently associated with positive experiences and are competitive advantages worth promoting.`,
    );
  }
  if (negKeywords.length) {
    insights.push(
      `Recurring concerns cluster around: ${negKeywords.map((k) => k.word).join(', ')}. These terms appear most often in negative feedback and point to areas requiring immediate attention.`,
    );
  }

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
    `The dominant emotional signal is "${dominantEmo}". This emotional tone shapes how your audience is likely to act — ${dominantEmo === 'angry' || dominantEmo === 'frustrated' ? 'frustrated users tend to churn and share negative word-of-mouth' : dominantEmo === 'happy' || dominantEmo === 'excited' ? 'positive users are more likely to recommend and remain loyal' : 'neutral audiences may need clearer value communication to convert'}.`,
  );

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

  // Customer behaviour
  insights.push(
    `Customer behaviour signals: audiences are ${overall.positive > overall.negative ? 'engaged and vocal about what works' : 'vocal about friction points'}. ${topics.length ? 'They tend to cluster discussion around ' + topics.slice(0, 2).map((t) => `"${t.topic}"`).join(' and ') + '.' : 'Discussion is broadly distributed with no single dominant theme.'}`,
  );

  // Opportunities & risks
  if (negKeywords.length) {
    insights.push(
      `Business opportunity: converting the negative feedback around ${negKeywords.slice(0, 2).map((k) => k.word).join(' and ')} into product improvements could differentiate you from competitors who ignore these signals.`,
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

  if (negKeywords.some((k) => ['support', 'service', 'response', 'reply', 'help'].includes(k.word))) {
    recs.push('Improve customer support responsiveness — set a target first-reply time under 2 hours and add self-service resources for common questions.');
  } else if (overall.negative > 0.2) {
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

  if (posKeywords.length) {
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

  return recs.slice(0, 8);
}

// ---- Summary ----

function generateSummary(
  overall: AnalysisRecord['overall'],
  topics: AnalysisRecord['topics'],
  keywords: AnalysisRecord['keywords'],
  sourceLabel: string,
  items: AnalysisItem[],
): string {
  const total = overall.totalItems;
  const posPct = Math.round(overall.positive * 100);
  const neuPct = Math.round(overall.neutral * 100);
  const negPct = Math.round(overall.negative * 100);

  const tone =
    overall.averageScore > 0.15
      ? 'overwhelmingly positive'
      : overall.averageScore > 0.05
        ? 'mostly positive'
        : overall.averageScore > -0.05
          ? 'mixed'
          : overall.averageScore > -0.15
            ? 'mostly negative'
            : 'overwhelmingly negative';

  const topTopics = topics.slice(0, 3).map((t) => t.topic);
  const topicStr = topTopics.length
    ? ` The conversation centers on ${topTopics.join(', ')}.`
    : '';

  const posKw = keywords.filter((k) => k.sentiment === 'positive').slice(0, 3).map((k) => k.word);
  const negKw = keywords.filter((k) => k.sentiment === 'negative').slice(0, 3).map((k) => k.word);

  const positiveExamples = items
    .filter((i) => i.result.label === 'positive')
    .slice(0, 2)
    .map((i) => `"${i.text.slice(0, 80)}${i.text.length > 80 ? '...' : ''}"`)
    .join(' and ');
  const negativeExamples = items
    .filter((i) => i.result.label === 'negative')
    .slice(0, 2)
    .map((i) => `"${i.text.slice(0, 80)}${i.text.length > 80 ? '...' : ''}"`)
    .join(' and ');

  let detail = '';
  if (posPct > negPct && posKw.length) {
    detail = ` Reviewers particularly praise ${posKw.join(', ')}${positiveExamples ? `, with comments like ${positiveExamples}` : ''}.`;
  } else if (negPct > posPct && negKw.length) {
    detail = ` Common concerns include ${negKw.join(', ')}${negativeExamples ? `, with comments like ${negativeExamples}` : ''}.`;
  } else {
    detail = ` Feedback is balanced with no single dominant direction.`;
  }

  const emotionStr = ` The dominant emotion across all entries is "${overall.dominantEmotion}"`;

  return `Analysis of ${total} ${sourceLabel.toLowerCase()} entries found sentiment to be ${tone}, with ${posPct}% positive, ${neuPct}% neutral, and ${negPct}% negative feedback.${topicStr}${detail}${emotionStr}.`;
}

// ---- Explanation ----

function generateExplanation(
  items: AnalysisItem[],
  overall: AnalysisRecord['overall'],
  keywords: AnalysisRecord['keywords'],
): string[] {
  const exp: string[] = [];
  exp.push(
    `Sentiment is classified by evaluating each piece of text against a lexicon of positive and negative terms, accounting for negation ("not good") and intensifiers ("very good"). ${Math.round(overall.positive * 100)}% of entries contained more positive signal, ${Math.round(overall.negative * 100)}% more negative, and ${Math.round(overall.neutral * 100)}% were balanced or lacked strong signal.`,
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
    `Recurring themes were detected by finding two-word phrases that appear across multiple entries. Themes inherit the average sentiment of the entries they appear in, which is why some topics are tagged positive and others negative.`,
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
  // Group by day
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
