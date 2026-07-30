const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface FetchRequest {
  type: "youtube" | "website";
  url: string;
}

interface CommentItem {
  text: string;
  author?: string;
  likes?: number;
  timestamp?: string;
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as FetchRequest;
    if (!body || !body.type || !body.url) {
      return new Response(
        JSON.stringify({ error: "Missing 'type' or 'url' in request body." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (body.type === "youtube") {
      const result = await fetchYouTubeComments(body.url);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (body.type === "website") {
      const result = await fetchWebsiteContent(body.url);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      return new Response(
        JSON.stringify({ error: `Unsupported type: ${body.type}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

// ==================== YouTube ====================

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function extractRunsText(runs: unknown): string {
  if (!Array.isArray(runs)) return "";
  return (runs as Array<{ text?: string }>).map((r) => r.text ?? "").join("").trim();
}

function parseLikeCount(label: string): number | undefined {
  if (!label) return undefined;
  const m = label.replace(/,/g, "").match(/(\d+)/);
  return m ? parseInt(m[1]) : undefined;
}

interface InnertubeConfig {
  apiKey: string;
  clientVersion: string;
  clientName: string;
}

function extractInnertubeConfig(html: string): InnertubeConfig {
  const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":\s*"([^"]+)"/);
  const clientVersionMatch = html.match(
    /"INNERTUBE_CONTEXT_CLIENT_VERSION":\s*"([^"]+)"/,
  );
  const clientNameMatch = html.match(
    /"INNERTUBE_CONTEXT_CLIENT_NAME":\s*(\d+)/,
  );
  const clientNames: Record<number, string> = {
    1: "WEB",
    2: "MWEB",
    3: "WEB_EMBEDDED_PLAYER",
    5: "ANDROID",
    56: "WEB_CREATOR",
  };
  return {
    apiKey: apiKeyMatch?.[1] ?? "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
    clientVersion: clientVersionMatch?.[1] ?? "2.20240101.00.00",
    clientName: clientNameMatch
      ? clientNames[parseInt(clientNameMatch[1])] ?? "WEB"
      : "WEB",
  };
}

async function innertubePost(
  endpoint: string,
  config: InnertubeConfig,
  payload: Record<string, unknown>,
): Promise<unknown> {
  const apiUrl = `https://www.youtube.com/youtubei/v1/${endpoint}?key=${config.apiKey}`;
  const body = {
    context: {
      client: {
        clientName: config.clientName,
        clientVersion: config.clientVersion,
        hl: "en",
        gl: "US",
      },
    },
    ...payload,
  };
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": UA,
      "Accept-Language": "en-US,en;q=0.9",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`YouTube API returned ${res.status}`);
  return res.json();
}

// Deep-walk to find ALL continuation tokens associated with comments.
// We collect every token we find, then try each one.
function findAllContinuationTokens(data: unknown): string[] {
  const tokens: string[] = [];
  const seen = new Set<string>();

  function walk(node: unknown): void {
    if (node === null || node === undefined || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    const obj = node as Record<string, unknown>;

    // continuationCommand with a token
    const contCmd = obj?.continuationCommand as
      | { token?: string; request?: string }
      | undefined;
    if (contCmd?.token && !seen.has(contCmd.token)) {
      seen.add(contCmd.token);
      tokens.push(contCmd.token);
    }

    // continuationItemRenderer
    const contItem = obj?.continuationItemRenderer as
      | { continuationEndpoint?: { continuationCommand?: { token?: string } } }
      | undefined;
    if (contItem?.continuationEndpoint?.continuationCommand?.token) {
      const t = contItem.continuationEndpoint.continuationCommand.token;
      if (t && !seen.has(t)) {
        seen.add(t);
        tokens.push(t);
      }
    }

    // buttonRenderer with a continuation command (e.g. "Show more comments")
    const button = obj?.buttonRenderer as
      | { command?: { continuationCommand?: { token?: string } } }
      | undefined;
    if (button?.command?.continuationCommand?.token) {
      const t = button.command.continuationCommand.token;
      if (t && !seen.has(t)) {
        seen.add(t);
        tokens.push(t);
      }
    }

    for (const key of Object.keys(obj)) {
      walk(obj[key]);
    }
  }

  walk(data);
  return tokens;
}

// Known YouTube UI/footer/navigation text that should never be treated as a comment.
const YT_NOISE_PATTERNS = [
  /^About Press Copyright Contact us/i,
  /^Creators Advertise Developers/i,
  /^Cancel Memberships Terms/i,
  /^Privacy Policy & Safety/i,
  /^How YouTube works/i,
  /^Test new features/i,
  /^© \d{4} Google LLC/i,
  /^YouTube About/i,
  /^How YouTube works Test new features/i,
  /Google LLC$/,
  /^Sign in to/i,
  /^Add a comment/i,
  /^Comments are turned off/i,
  /^Learn more/i,
  /^Show more comments/i,
  /^View reply/i,
  /^Reply$/i,
  /^Like$/i,
  /^Dislike$/i,
  /^Share$/i,
  /^Save$/i,
  /^Subscribe$/i,
  /^Join$/i,
];

function isNoise(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 3) return true;
  // Very short or link-only text
  if (/^https?:\/\//.test(trimmed)) return true;
  // Footer-style concatenated text (multiple YouTube nav items joined)
  if (/About.*Press.*Copyright.*Contact.*Creators.*Advertise/i.test(trimmed)) return true;
  for (const p of YT_NOISE_PATTERNS) {
    if (p.test(trimmed)) return true;
  }
  return false;
}

// Extract comments from the response. YouTube uses two formats:
// 1. Classic: commentRenderer nodes with contentText.runs
// 2. New (2024+): commentEntityPayload nodes with properties.content.content
// We only extract from commentThreadRenderer or commentViewModel structures
// to avoid picking up footer/navigation text.
function extractComments(data: unknown): CommentItem[] {
  const comments: CommentItem[] = [];
  const seen = new Set<string>();

  // First pass: find all commentThreadRenderer nodes. Comments live inside these.
  const threads: unknown[] = [];
  function findThreads(node: unknown): void {
    if (node === null || node === undefined || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) findThreads(item);
      return;
    }
    const obj = node as Record<string, unknown>;
    if (obj.commentThreadRenderer) {
      threads.push(obj.commentThreadRenderer);
    }
    for (const key of Object.keys(obj)) {
      findThreads(obj[key]);
    }
  }
  findThreads(data);

  // Also look for standalone commentEntityPayload nodes that have a commentId
  const payloads: unknown[] = [];
  function findPayloads(node: unknown): void {
    if (node === null || node === undefined || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) findPayloads(item);
      return;
    }
    const obj = node as Record<string, unknown>;
    const cep = obj.commentEntityPayload as
      | { properties?: { commentId?: string } }
      | undefined;
    if (cep?.properties?.commentId) {
      payloads.push(obj.commentEntityPayload);
    }
    for (const key of Object.keys(obj)) {
      findPayloads(obj[key]);
    }
  }
  findPayloads(data);

  function processPayload(cep: unknown): void {
    const p = cep as
      | {
        properties?: {
          content?: { content?: string };
          publishedTime?: string;
          commentId?: string;
        };
        author?: { displayName?: string };
        toolbar?: { likeCountNotliked?: string; likeCountLiked?: string };
      }
      | undefined;
    const text = p?.properties?.content?.content;
    if (!text || text.length < 3 || seen.has(text) || isNoise(text)) return;
    seen.add(text);
    comments.push({
      text,
      author: p?.author?.displayName ?? "",
      likes: parseLikeCount(
        p?.toolbar?.likeCountNotliked ?? p?.toolbar?.likeCountLiked ?? "",
      ),
      timestamp: p?.properties?.publishedTime ?? "",
    });
  }

  // Process payloads found inside threads first (highest confidence)
  for (const thread of threads) {
    const threadPayloads: unknown[] = [];
    function findThreadPayloads(node: unknown): void {
      if (node === null || node === undefined || typeof node !== "object") return;
      if (Array.isArray(node)) {
        for (const item of node) findThreadPayloads(item);
        return;
      }
      const obj = node as Record<string, unknown>;
      if (obj.commentEntityPayload) {
        threadPayloads.push(obj.commentEntityPayload);
      }
      // Classic format
      const cr = obj.commentRenderer as
        | {
          contentText?: { runs?: unknown };
          authorText?: { simpleText?: string; runs?: unknown };
          voteCount?: {
            accessibility?: { accessibilityData?: { label?: string } };
            simpleText?: string;
          };
          publishedTimeText?: { runs?: Array<{ text?: string }> };
        }
        | undefined;
      if (cr) {
        const text = extractRunsText(cr.contentText?.runs);
        if (text && text.length > 2 && !seen.has(text) && !isNoise(text)) {
          seen.add(text);
          comments.push({
            text,
            author:
              cr.authorText?.simpleText ??
              extractRunsText(cr.authorText?.runs),
            likes: parseLikeCount(
              cr.voteCount?.accessibility?.accessibilityData?.label ??
                cr.voteCount?.simpleText ?? "",
            ),
            timestamp: cr.publishedTimeText?.runs?.[0]?.text ?? "",
          });
        }
      }
      for (const key of Object.keys(obj)) {
        findThreadPayloads(obj[key]);
      }
    }
    findThreadPayloads(thread);
    for (const p of threadPayloads) processPayload(p);
  }

  // Also process standalone payloads (in case threads weren't found)
  if (comments.length === 0) {
    for (const p of payloads) processPayload(p);
  }

  return comments;
}

async function fetchYouTubeComments(
  url: string,
): Promise<{ title: string; videoId: string; items: CommentItem[] }> {
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error("Please enter a valid YouTube video URL.");

  let title = `YouTube video ${videoId}`;

  // 1. Get video title via oEmbed
  try {
    const oembedRes = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    );
    if (oembedRes.ok) {
      const data = await oembedRes.json();
      if (data.title) title = data.title;
    }
  } catch {
    // ignore
  }

  // 2. Fetch the watch page to get innertube config
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  let watchHtml = "";
  try {
    const res = await fetch(watchUrl, {
      headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
    });
    watchHtml = await res.text();
  } catch {
    throw new Error("Could not reach YouTube to retrieve comments.");
  }

  const config = extractInnertubeConfig(watchHtml);

  // 3. Call the next API with the video ID to get the page structure
  // This returns the comments section continuation token.
  let nextData: unknown = null;
  try {
    nextData = await innertubePost("next", config, { videoId });
  } catch {
    throw new Error("Could not retrieve video data from YouTube.");
  }

  // 4. Find all continuation tokens in the response and try each
  const tokens = findAllContinuationTokens(nextData);
  const comments: CommentItem[] = [];

  // The comments-section token typically starts with "Eg0S" and is shorter.
  // Prioritize tokens that look like comment section tokens.
  tokens.sort((a, b) => {
    const aIsComment = a.startsWith("Eg0S") ? 0 : 1;
    const bIsComment = b.startsWith("Eg0S") ? 0 : 1;
    if (aIsComment !== bIsComment) return aIsComment - bIsComment;
    return b.length - a.length;
  });

  // Try each token until we get actual comments
  for (const token of tokens) {
    if (comments.length >= 20) break;
    try {
      const commentData = await innertubePost("next", config, {
        continuation: token,
      });
      const found = extractComments(commentData);
      if (found.length > 0) {
        // Deduplicate against existing
        for (const c of found) {
          if (!comments.some((e) => e.text === c.text)) {
            comments.push(c);
          }
        }
      }
    } catch {
      // try next token
    }
  }

  // 5. If we found comments, also try to get more pages
  if (comments.length > 0 && comments.length < 50) {
    // Get the last response's continuation tokens for pagination
    try {
      const lastToken = tokens[0];
      const moreData = await innertubePost("next", config, {
        continuation: lastToken,
      });
      const moreTokens = findAllContinuationTokens(moreData);
      for (const token of moreTokens.slice(0, 2)) {
        if (comments.length >= 50) break;
        try {
          const more = await innertubePost("next", config, {
            continuation: token,
          });
          const found = extractComments(more);
          for (const c of found) {
            if (!comments.some((e) => e.text === c.text)) {
              comments.push(c);
            }
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
  }

  if (comments.length === 0) {
    throw new Error(
      "No comments could be retrieved for this video. Comments may be disabled, the video may be private, or YouTube may be blocking access. You can still analyze this video by pasting comments manually in the Text tab.",
    );
  }

  return { title, videoId, items: comments };
}

// ==================== Website ====================

function decodeEntities(html: string): string {
  return html
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&hellip;/g, "...")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–");
}

function stripTags(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

// Extract reviews/comments from JSON-LD structured data (schema.org)
function extractJsonLdReviews(html: string): { text: string; author?: string; rating?: number }[] {
  const reviews: { text: string; author?: string; rating?: number }[] = [];
  const seen = new Set<string>();

  const blocks = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const block of blocks) {
    const jsonStr = block.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
    try {
      const data = JSON.parse(jsonStr);
      const nodes = Array.isArray(data) ? data : [data];
      for (const node of nodes) {
        collectReviewsFromJsonLd(node, reviews, seen);
      }
    } catch {
      // ignore malformed JSON-LD
    }
  }
  return reviews;
}

function collectReviewsFromJsonLd(
  node: unknown,
  reviews: { text: string; author?: string; rating?: number }[],
  seen: Set<string>,
): void {
  if (!node || typeof node !== "object") return;
  const obj = node as Record<string, unknown>;

  // Direct review or comment
  const type = (obj["@type"] as string | string[] | undefined)?.toString().toLowerCase() ?? "";
  if (type.includes("review") || type.includes("comment")) {
    const body = (obj.reviewBody ?? obj.text ?? obj.description ?? obj.commentText) as string | undefined;
    const author = typeof obj.author === "object"
      ? (obj.author as Record<string, unknown>)?.name as string | undefined
      : (obj.author as string | undefined);
    const ratingVal = typeof obj.reviewRating === "object"
      ? (obj.reviewRating as Record<string, unknown>)?.ratingValue as number | undefined
      : undefined;
    if (body && body.length > 10 && !seen.has(body)) {
      seen.add(body);
      reviews.push({ text: body, author, rating: ratingVal });
    }
  }

  // Array of reviews (e.g. Product with "review" array)
  for (const key of ["review", "reviews", "comment", "comments"]) {
    const val = obj[key];
    if (Array.isArray(val)) {
      for (const item of val) collectReviewsFromJsonLd(item, reviews, seen);
    } else if (val && typeof val === "object") {
      collectReviewsFromJsonLd(val, reviews, seen);
    }
  }

  // Recurse into common container keys
  for (const key of ["@graph", "mainEntity", "itemListElement", "hasPart"]) {
    const val = obj[key];
    if (Array.isArray(val)) {
      for (const item of val) collectReviewsFromJsonLd(item, reviews, seen);
    } else if (val && typeof val === "object") {
      collectReviewsFromJsonLd(val, reviews, seen);
    }
  }
}

// CSS-like selectors for common review/comment platforms
const REVIEW_SELECTORS: { pattern: RegExp; label: string }[] = [
  // Generic review/comment classes
  { pattern: /class=["'][^"']*\b(review|comment|testimonial|feedback|opinion|user-review|customer-review|product-review)\b[^"']*/i, label: "review" },
  { pattern: /data-testid=["'][^"']*\b(review|comment|testimonial)\b[^"']*/i, label: "review" },
  { pattern: /itemprop=["']?(review|comment|description|reviewBody|commentText)/i, label: "review" },
  // Trustpilot
  { pattern: /class=["'][^"']*\b(typography_body.*review|review-card|styles_reviewCard)\b[^"']*/i, label: "trustpilot" },
  // Amazon
  { pattern: /class=["'][^"']*\b(review-text|review-content|a-expander-content|cr-original-review-content)\b[^"']*/i, label: "amazon" },
  // Google
  { pattern: /class=["'][^"']*\b(google-review|review-text|jftiEf|wiI7pd|MyEned)\b[^"']*/i, label: "google" },
  // Yelp
  { pattern: /class=["'][^"']*\b(comment.*review|review.*comment|yelp-review|review-content)\b[^"']*/i, label: "yelp" },
  // Reddit
  { pattern: /class=["'][^"']*\b(md.*comment|usertext-body|Comment)\b[^"']*/i, label: "reddit" },
  // Disqus
  { pattern: /class=["'][^"']*\b(disqus.*comment|post-content|post-body)\b[^"']*/i, label: "disqus" },
  // WordPress comments
  { pattern: /class=["'][^"']*\b(comment-content|comment-body|comment-text|wp-block-comment-content)\b[^"']*/i, label: "wordpress" },
  // Trustpilot review body
  { pattern: /class=["'][^"']*\b(typography_body-sm|typography_body-md)\b[^"']*/i, label: "trustpilot-body" },
];

// Extract review/comment text blocks from HTML by finding elements that match review patterns
function extractHtmlReviews(html: string): { text: string; author?: string; source: string }[] {
  const items: { text: string; author?: string; source: string }[] = [];
  const seen = new Set<string>();

  // Remove script/style/nav/footer first
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "");

  // Find all opening tags with their attributes and positions
  const tagRegex = /<(\w+)([^>]*)>/gi;
  let match: RegExpExecArray | null;
  const reviewElements: { tag: string; attrs: string; closeTag: string; label: string }[] = [];

  while ((match = tagRegex.exec(cleaned)) !== null) {
    const tag = match[1].toLowerCase();
    const attrs = match[2] ?? "";
    // Only look at container tags that could hold review text
    if (!["div", "section", "article", "p", "blockquote", "li", "span"].includes(tag)) continue;

    for (const sel of REVIEW_SELECTORS) {
      if (sel.pattern.test(attrs)) {
        // Find the matching closing tag
        const closeTag = `</${tag}>`;
        reviewElements.push({ tag, attrs, closeTag, label: sel.label });
        break;
      }
    }
  }

  // For each review element, extract the text between its opening and closing tag
  // We use a simple approach: find the opening tag position, then find the matching close tag
  for (const el of reviewElements) {
    const openTagStr = `<${el.tag}${el.attrs}>`;
    const openIdx = cleaned.indexOf(openTagStr);
    if (openIdx === -1) continue;
    const closeIdx = findMatchingCloseTag(cleaned, openIdx, el.tag);
    if (closeIdx === -1) continue;
    const innerHtml = cleaned.slice(openIdx + openTagStr.length, closeIdx);
    const text = stripTags(innerHtml).trim();
    if (text.length < 15 || seen.has(text)) continue;
    // Filter out navigation/boilerplate
    if (isBoilerplate(text)) continue;
    seen.add(text);
    items.push({ text, source: el.label });
  }

  return items;
}

// Find the matching close tag for a given opening tag position (handles nesting)
function findMatchingCloseTag(html: string, openPos: number, tag: string): number {
  const openTag = `<${tag}`;
  const closeTag = `</${tag}>`;
  let depth = 1;
  let pos = openPos + openTag.length;
  while (pos < html.length) {
    const nextOpen = html.indexOf(openTag, pos);
    const nextClose = html.indexOf(closeTag, pos);
    if (nextClose === -1) return -1;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      pos = nextOpen + openTag.length;
    } else {
      depth--;
      if (depth === 0) return nextClose;
      pos = nextClose + closeTag.length;
    }
  }
  return -1;
}

const BOILERPLASE_PATTERNS = [
  /^(cookie|privacy|subscribe|newsletter|sign up|log in|sign in|menu|search|home|about|contact|follow|share|download|learn more|read more|see more|view all|show more|all rights reserved|copyright)/i,
  /^(skip to|navigation|sidebar|footer|breadcrumb)/i,
  /^\d+\s*(star|review|comment)/i,
];

function isBoilerplate(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 15) return true;
  for (const p of BOILERPLASE_PATTERNS) {
    if (p.test(trimmed)) return true;
  }
  return false;
}

// Fallback: extract all readable text (used when no reviews are found)
function extractWebsiteText(html: string): string {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<aside[\s\S]*?<\/aside>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  const text = cleaned
    .replace(/<(p|h[1-6]|li|blockquote|article|section|div)[^>]*>/gi, "\n")
    .replace(/<\/(p|h[1-6]|li|blockquote|article|section|div)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return decodeEntities(text);
}

function splitChunks(text: string, maxLen = 600): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+|\S[^.!?]*$/g) ?? [text];
  const chunks: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + s).length > maxLen && cur) {
      chunks.push(cur.trim());
      cur = "";
    }
    cur += s;
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.filter((c) => c.length > 15);
}

async function fetchWebsiteContent(
  url: string,
): Promise<{ title: string; items: { text: string; source: string }[] }> {
  let target: URL;
  try {
    target = new URL(url.startsWith("http") ? url : `https://${url}`);
  } catch {
    throw new Error("Please enter a valid website URL (e.g. https://example.com).");
  }

  let html: string;
  try {
    const res = await fetch(target.toString(), {
      headers: {
        "User-Agent": UA,
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } catch {
    throw new Error(
      "Could not fetch this website. It may block external access, or the URL is invalid.",
    );
  }

  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1].trim()) : target.hostname;

  // 1. Try JSON-LD structured data (schema.org Reviews)
  const jsonLdReviews = extractJsonLdReviews(html);
  if (jsonLdReviews.length > 0) {
    const items = jsonLdReviews.slice(0, 100).map((r, i) => ({
      text: r.text,
      source: r.author ? `review ${i + 1} (${r.author})` : `review ${i + 1}`,
    }));
    return { title, items };
  }

  // 2. Try HTML pattern-based review extraction
  const htmlReviews = extractHtmlReviews(html);
  if (htmlReviews.length > 0) {
    const items = htmlReviews.slice(0, 100).map((r, i) => ({
      text: r.text,
      source: r.author ? `${r.source} ${i + 1} (${r.author})` : `${r.source} ${i + 1}`,
    }));
    return { title, items };
  }

  // 3. Fallback: extract all readable text (article mode)
  const text = extractWebsiteText(html);
  if (!text || text.length < 50) {
    throw new Error("No reviews or comments were found on this page. The page may not contain review content, or it may require JavaScript to load reviews. You can still paste text manually in the Text tab.");
  }

  const chunks = splitChunks(text, 600);
  const items = chunks.map((c, i) => ({ text: c, source: `paragraph ${i + 1}` }));
  if (!items.length) {
    throw new Error("No text content could be extracted from this page.");
  }
  return { title, items };
}
