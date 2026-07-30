import type { AnalysisRecord, ResponseTone } from '@/types';

const TONE_LABELS: Record<ResponseTone, string> = {
  professional: 'Professional',
  friendly: 'Friendly',
  formal: 'Formal',
  apology: 'Apology',
  support: 'Customer Support',
  thankyou: 'Thank You',
  marketing: 'Marketing',
};

export function toneLabel(tone: ResponseTone): string {
  return TONE_LABELS[tone];
}

export function generateResponse(
  tone: ResponseTone,
  record: AnalysisRecord,
  customText?: string,
): string {
  const sentiment = record.overall;
  const topTopic = record.topics[0]?.topic ?? 'your feedback';
  const negKw = record.keywords.filter((k) => k.sentiment === 'negative').map((k) => k.word).slice(0, 3);
  const posKw = record.keywords.filter((k) => k.sentiment === 'positive').map((k) => k.word).slice(0, 3);

  const base = customText?.trim() || record.summary;

  switch (tone) {
    case 'professional':
      return `Thank you for sharing your feedback regarding ${topTopic}. We have reviewed the concerns raised and are taking steps to address them. Our team is committed to delivering a reliable experience, and we appreciate your patience as we work through these improvements. If you have additional details to share, please reach out — every insight helps us serve you better.`;
    case 'friendly':
      return `Hey there! Thank you so much for taking the time to share this — we genuinely appreciate it. We hear you on ${topTopic}${negKw.length ? `, especially around ${negKw.join(' and ')}` : ''}, and we're already on it. ${posKw.length ? `It's also great to hear you're enjoying ${posKw.join(' and ')} — that means a lot to us! ` : ''}We'll keep improving and would love to hear from you again anytime.`;
    case 'formal':
      return `We acknowledge receipt of your feedback dated ${new Date().toLocaleDateString()}. Your comments regarding ${topTopic} have been formally reviewed and logged for action by the appropriate department. We take all input seriously and will incorporate it into our continuous improvement process. A follow-up will be scheduled should further clarification be required. Thank you for your contribution.`;
    case 'apology':
      return `I am truly sorry. There is no excuse for the experience you described${negKw.length ? `, particularly regarding ${negKw.join(' and ')}` : ''}. We failed you, and that is on us — not on you, not on circumstances, on us. ${record.overall.dominantEmotion === 'angry' || record.overall.dominantEmotion === 'frustrated' ? 'You have every right to be frustrated — we would be too.' : 'You deserved better, and we did not deliver.'} We are not going to make excuses or deflect. Instead, here is what we are doing right now: investigating exactly what went wrong, fixing it at the source, and following up with you personally to make sure it is resolved. We know trust is earned, and we have work to do. I am sorry, and I thank you for holding us accountable.`;
    case 'support':
      return `Hello, thank you for reaching out about ${topTopic}. I'm here to help resolve this for you. Based on your feedback${negKw.length ? ` regarding ${negKw.join(' and ')}` : ''}, here's what we can do right now: 1) Document your case for our product team, 2) Provide a status update within 24 hours, and 3) Follow up until it's resolved. Could you share any additional details so we can act faster?`;
    case 'thankyou':
      return `Thank you so much for your feedback! ${posKw.length ? `We're thrilled you highlighted ${posKw.join(' and ')} — knowing what works helps us keep doing more of it. ` : ''}Your input directly shapes how we evolve, and supporters like you make that possible. We'd love to keep the conversation going — feel free to share more anytime.`;
    case 'marketing':
      return `We hear you — and we're acting on it. Your feedback about ${topTopic} is driving real changes behind the scenes. ${posKw.length ? `You'll be happy to know ${posKw.join(' and ')} are getting even better. ` : ''}Stay tuned for what's next, and thank you for being part of our journey. The best is yet to come.`;
    default:
      return base;
  }
}

export function generateStrategy(record: AnalysisRecord): {
  priorityIssues: string[];
  recommendedActions: string[];
  retentionStrategies: string[];
  improvements: string[];
  nextSteps: string[];
  longTermOpportunities: string[];
} {
  const neg = record.overall.negative;
  const pos = record.overall.positive;
  const negKw = record.keywords.filter((k) => k.sentiment === 'negative').map((k) => k.word).slice(0, 5);
  const posKw = record.keywords.filter((k) => k.sentiment === 'positive').map((k) => k.word).slice(0, 5);
  const negTopics = record.topics.filter((t) => t.sentiment === 'negative').map((t) => t.topic).slice(0, 3);

  const priorityIssues: string[] = [];
  if (neg > 0.3) priorityIssues.push(`High volume of negative feedback (${Math.round(neg * 100)}%) requires immediate attention.`);
  if (negKw.length) priorityIssues.push(`Recurring negative themes: ${negKw.join(', ')}.`);
  if (negTopics.length) priorityIssues.push(`Problem areas: ${negTopics.join(', ')}.`);
  if (record.overall.dominantEmotion === 'angry' || record.overall.dominantEmotion === 'frustrated')
    priorityIssues.push('Dominant emotion is frustration/anger — emotional churn risk is elevated.');
  if (!priorityIssues.length) priorityIssues.push('No critical priority issues detected — sentiment is stable.');

  const recommendedActions: string[] = [
    negKw.length ? `Triage and address root causes of: ${negKw.slice(0, 3).join(', ')}.` : 'Maintain current quality standards.',
    'Set up a feedback loop to close the loop with users who left negative comments.',
    posKw.length ? `Amplify what works — document and scale: ${posKw.slice(0, 3).join(', ')}.` : 'Identify and document positive drivers to reinforce them.',
    'Assign owners and deadlines to each action item.',
  ];

  const retentionStrategies: string[] = [
    pos > 0.4 ? 'Launch a loyalty or referral program to capitalize on satisfied users.' : 'Focus on reducing friction before investing in loyalty programs.',
    'Send personalized follow-ups to users who left negative feedback to rebuild trust.',
    'Create a community or feedback channel so users feel heard between purchases.',
    'Monitor sentiment trends weekly to catch churn signals early.',
  ];

  const improvements: string[] = [
    negKw.length ? `Product/service improvements targeting: ${negKw.slice(0, 3).join(', ')}.` : 'Continue iterative improvement based on ongoing feedback.',
    'Improve onboarding and self-service documentation to reduce confusion-related complaints.',
    'Invest in support team training and response-time SLAs.',
  ];

  const nextSteps: string[] = [
    'Share this report with product, support, and marketing teams.',
    'Pick the top 3 recommendations and assign owners this week.',
    'Re-run this analysis in 30 days to measure sentiment shift.',
    'Set up a recurring feedback collection cadence.',
  ];

  const longTermOpportunities: string[] = [
    posKw.length ? `Build marketing narratives around proven strengths: ${posKw.slice(0, 3).join(', ')}.` : 'Develop a clear value narrative once positive drivers are identified.',
    'Use sentiment trends as a north-star metric in leadership reviews.',
    'Consider building features or services that address the most-discussed topics.',
    'Turn your most positive users into advocates through case studies and testimonials.',
  ];

  return {
    priorityIssues,
    recommendedActions,
    retentionStrategies,
    improvements,
    nextSteps,
    longTermOpportunities,
  };
}
