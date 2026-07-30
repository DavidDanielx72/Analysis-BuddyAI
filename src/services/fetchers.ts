import { splitIntoChunks } from './textUtils';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function callEdgeFunction(type: 'youtube' | 'website', url: string) {
  const apiUrl = `${SUPABASE_URL}/functions/v1/fetch-content`;
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ type, url }),
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  return res.json();
}

export async function fetchWebsiteContent(
  url: string,
): Promise<{ items: { text: string; source: string }[]; title: string }> {
  try {
    const data = await callEdgeFunction('website', url);
    if (!data?.items?.length) {
      throw new Error('No readable article or review text was found on this page.');
    }
    return { items: data.items, title: data.title };
  } catch (e) {
    // Fallback to client-side CORS proxy if the edge function is unreachable
    try {
      return await fetchWebsiteClientSide(url);
    } catch {
      throw e;
    }
  }
}

async function fetchWebsiteClientSide(
  url: string,
): Promise<{ items: { text: string; source: string }[]; title: string }> {
  const PROXY = 'https://api.allorigins.win/raw?url=';
  let target: URL;
  try {
    target = new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch {
    throw new Error('Please enter a valid website URL (e.g. https://example.com).');
  }
  const res = await fetch(`${PROXY}${encodeURIComponent(target.toString())}`);
  if (!res.ok) throw new Error(`Fetch failed (HTTP ${res.status})`);
  const html = await res.text();
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : target.hostname;

  // Try to extract reviews from JSON-LD structured data first
  const jsonLdItems = extractJsonLdReviewsClientSide(html);
  if (jsonLdItems.length > 0) {
    return { items: jsonLdItems, title };
  }

  // Try HTML pattern-based review extraction
  const htmlReviewItems = extractHtmlReviewsClientSide(html);
  if (htmlReviewItems.length > 0) {
    return { items: htmlReviewItems, title };
  }

  // Fallback: extract all readable text
  const { extractText } = await import('./textUtils');
  const text = extractText(html);
  if (!text || text.length < 50)
    throw new Error('No reviews or comments were found on this page. The page may not contain review content, or it may require JavaScript to load reviews. You can still paste text manually in the Text tab.');
  const chunks = splitIntoChunks(text, 600);
  const items = chunks.map((c, i) => ({ text: c, source: `paragraph ${i + 1}` }));
  if (!items.length) throw new Error('No text content could be extracted from this page.');
  return { items, title };
}

function decodeEntitiesClient(html: string): string {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

function extractJsonLdReviewsClientSide(html: string): { text: string; source: string }[] {
  const items: { text: string; source: string }[] = [];
  const seen = new Set<string>();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  scripts.forEach((script) => {
    try {
      const data = JSON.parse(script.textContent || '');
      const nodes = Array.isArray(data) ? data : [data];
      for (const node of nodes) collectJsonLdReviews(node, items, seen);
    } catch {
      // ignore malformed JSON-LD
    }
  });
  return items;
}

function collectJsonLdReviews(
  node: unknown,
  items: { text: string; source: string }[],
  seen: Set<string>,
): void {
  if (!node || typeof node !== 'object') return;
  const obj = node as Record<string, unknown>;
  const type = (obj['@type'] as string | string[] | undefined)?.toString().toLowerCase() ?? '';
  if (type.includes('review') || type.includes('comment')) {
    const body = (obj.reviewBody ?? obj.text ?? obj.description ?? obj.commentText) as string | undefined;
    const author = typeof obj.author === 'object'
      ? (obj.author as Record<string, unknown>)?.name as string | undefined
      : (obj.author as string | undefined);
    if (body && body.length > 10 && !seen.has(body)) {
      seen.add(body);
      items.push({ text: body, source: author ? `review (${author})` : 'review' });
    }
  }
  for (const key of ['review', 'reviews', 'comment', 'comments']) {
    const val = obj[key];
    if (Array.isArray(val)) {
      for (const item of val) collectJsonLdReviews(item, items, seen);
    } else if (val && typeof val === 'object') {
      collectJsonLdReviews(val, items, seen);
    }
  }
  for (const key of ['@graph', 'mainEntity', 'itemListElement', 'hasPart']) {
    const val = obj[key];
    if (Array.isArray(val)) {
      for (const item of val) collectJsonLdReviews(item, items, seen);
    } else if (val && typeof val === 'object') {
      collectJsonLdReviews(val, items, seen);
    }
  }
}

const REVIEW_CLASS_PATTERNS = [
  /\b(review|comment|testimonial|feedback|opinion|user-review|customer-review|product-review)\b/i,
  /\b(review-text|review-content|review-card|review-body)\b/i,
  /\b(comment-content|comment-body|comment-text|wp-block-comment-content)\b/i,
  /\b(google-review|yelp-review|trustpilot|amazon-review)\b/i,
  /\b(usertext-body|disqus|post-content|post-body)\b/i,
  /\b(typography_body|jftiEf|wiI7pd|MyEned)\b/i,
];

const BOILERPLATE_PATTERNS = [
  /^(cookie|privacy|subscribe|newsletter|sign up|log in|sign in|menu|search|home|about|contact|follow|share|download|learn more|read more|see more|view all|show more|all rights reserved|copyright)/i,
  /^(skip to|navigation|sidebar|footer|breadcrumb)/i,
  /^\d+\s*(star|review|comment)/i,
];

function isBoilerplateText(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 15) return true;
  for (const p of BOILERPLATE_PATTERNS) {
    if (p.test(trimmed)) return true;
  }
  return false;
}

function extractHtmlReviewsClientSide(html: string): { text: string; source: string }[] {
  const items: { text: string; source: string }[] = [];
  const seen = new Set<string>();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove script, style, nav, footer, header
  doc.querySelectorAll('script, style, nav, footer, header, noscript').forEach((el) => el.remove());

  // Find elements with review/comment classes
  const candidates = doc.querySelectorAll('div, section, article, p, blockquote, li, span');
  let reviewIdx = 0;
  candidates.forEach((el) => {
    const classList = el.className || '';
    const dataTestId = el.getAttribute('data-testid') || '';
    const itemProp = el.getAttribute('itemprop') || '';
    const attrStr = `${classList} ${dataTestId} ${itemProp}`;
    const matched = REVIEW_CLASS_PATTERNS.some((p) => p.test(attrStr));
    if (!matched) return;
    const text = decodeEntitiesClient(el.textContent || '').trim();
    if (text.length < 15 || seen.has(text) || isBoilerplateText(text)) return;
    seen.add(text);
    reviewIdx++;
    items.push({ text, source: `review ${reviewIdx}` });
  });

  return items;
}

export async function fetchYouTubeComments(
  url: string,
): Promise<{
  items: { text: string; source: string; likes?: number; timestamp?: string }[];
  title: string;
  videoId: string;
}> {
  try {
    const data = await callEdgeFunction('youtube', url);
    if (!data?.items?.length) {
      throw new Error(
        'No comments could be retrieved for this video. Comments may be disabled or the video may be private. You can still analyze this video by pasting comments manually in the Text tab.',
      );
    }
    const items = data.items.map(
      (c: { text: string; author?: string; likes?: number; timestamp?: string }, i: number) => ({
        text: c.text,
        source: c.author ? `comment ${i + 1} (${c.author})` : `comment ${i + 1}`,
        likes: c.likes,
        timestamp: c.timestamp,
      }),
    );
    return { items, title: data.title, videoId: data.videoId };
  } catch (e) {
    throw e instanceof Error ? e : new Error('Failed to fetch YouTube comments.');
  }
}
