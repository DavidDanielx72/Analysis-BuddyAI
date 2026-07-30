export type SentimentLabel = 'positive' | 'neutral' | 'negative';

export type EmotionLabel =
  | 'happy'
  | 'excited'
  | 'angry'
  | 'sad'
  | 'frustrated'
  | 'appreciative'
  | 'confused'
  | 'disappointed';

export interface SentimentResult {
  label: SentimentLabel;
  score: number; // -1..1
  confidence: number; // 0..1
  positiveScore: number;
  negativeScore: number;
  neutralScore: number;
  emotions: Record<EmotionLabel, number>;
  dominantEmotion: EmotionLabel;
  keywords: string[];
}

export interface AnalysisItem {
  id: string;
  text: string;
  source: string; // e.g. "row 3", "comment #12"
  result: SentimentResult;
  likes?: number;
  timestamp?: string;
}

export type AnalysisSource =
  | 'text'
  | 'pdf'
  | 'docx'
  | 'txt'
  | 'csv'
  | 'website'
  | 'youtube';

export interface AnalysisRecord {
  id: string;
  title: string;
  createdAt: number;
  source: AnalysisSource;
  sourceLabel: string;
  items: AnalysisItem[];
  overall: {
    positive: number;
    neutral: number;
    negative: number;
    averageScore: number;
    dominantEmotion: EmotionLabel;
    totalItems: number;
  };
  emotionTotals: Record<EmotionLabel, number>;
  keywords: { word: string; count: number; sentiment: SentimentLabel }[];
  topics: { topic: string; count: number; sentiment: SentimentLabel }[];
  insights: string[];
  recommendations: string[];
  summary: string;
  explanation: string[];
  topPositive?: AnalysisItem;
  topNegative?: AnalysisItem;
  mostLiked?: AnalysisItem;
  trendData?: { label: string; positive: number; neutral: number; negative: number }[];
}

export interface AppSettings {
  theme: 'dark' | 'light';
  confidenceThreshold: number;
  maxItemsPerAnalysis: number;
  defaultResponseTone: ResponseTone;
}

export type ResponseTone =
  | 'professional'
  | 'friendly'
  | 'formal'
  | 'apology'
  | 'support'
  | 'thankyou'
  | 'marketing';
