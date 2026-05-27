import { config } from '../../shared/config.js';

export interface YouTubeComment {
  id: string;
  author: string;
  text: string;
  likeCount: number;
  publishedAt: string;
}

export interface CommentAnalysis {
  videoId: string;
  videoTitle: string;
  totalComments: number;
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  topThemes: Array<{
    theme: string;
    count: number;
    examples: string[];
  }>;
  topQuestions: Array<{
    question: string;
    count: number;
  }>;
  rawComments: YouTubeComment[];
}

/**
 * Fetch top-level comments from a YouTube video.
 * Uses commentThreads endpoint (1 quota unit per call).
 */
export async function fetchVideoComments(videoId: string, maxResults = 100): Promise<YouTubeComment[]> {
  const key = config.YOUTUBE_API_KEY;
  const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=${maxResults}&order=relevance&key=${key}`;

  const res = await fetch(url);
  const data = await res.json() as any;

  if (data.error) {
    throw new Error(`YouTube Comments API Error: ${data.error.message}`);
  }

  const items = data.items || [];
  return items.map((item: any) => {
    const snippet = item.snippet?.topLevelComment?.snippet || {};
    return {
      id: item.id,
      author: snippet.authorDisplayName || 'Anonymous',
      text: snippet.textDisplay || '',
      likeCount: snippet.likeCount || 0,
      publishedAt: snippet.publishedAt || new Date().toISOString(),
    };
  });
}

// Simple Spanish/English sentiment keywords
const POSITIVE_WORDS = new Set([
  'gracias', 'excelente', 'genial', 'brillante', 'increíble', 'perfecto', 'buenísimo', 'top', 'master',
  'thank', 'great', 'awesome', 'amazing', 'perfect', 'love', 'best', 'nice', 'good', 'helpful',
  '👍', '🔥', '❤️', '💯', '🙏', '🚀', '👏', '✨', '💪',
]);

const NEGATIVE_WORDS = new Set([
  'malo', 'horrible', 'peor', 'basura', 'odio', 'terrible', 'nefasto', 'aburrido', 'inútil',
  'bad', 'hate', 'terrible', 'awful', 'worst', 'boring', 'useless', 'disappointed', 'poor',
  '👎', '🤮', '💩', '😡', '🤬',
]);

function classifySentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lower = text.toLowerCase();
  let posScore = 0;
  let negScore = 0;

  for (const word of POSITIVE_WORDS) {
    if (lower.includes(word)) posScore++;
  }
  for (const word of NEGATIVE_WORDS) {
    if (lower.includes(word)) negScore++;
  }

  if (posScore > negScore) return 'positive';
  if (negScore > posScore) return 'negative';
  return 'neutral';
}

// Theme extraction via keyword clustering
const THEME_KEYWORDS: Record<string, string[]> = {
  'TypeScript': ['typescript', 'ts', 'type', 'interface', 'generic'],
  'JavaScript': ['javascript', 'js', 'node', 'nodejs', 'ecmascript'],
  'React': ['react', 'jsx', 'hook', 'component', 'useeffect'],
  'Performance': ['performance', 'speed', 'fast', 'slow', 'optimize', 'optimization', 'memory', 'cpu'],
  'API / Backend': ['api', 'backend', 'server', 'endpoint', 'rest', 'graphql', 'database'],
  'CSS / Styling': ['css', 'tailwind', 'style', 'styled', 'scss', 'sass'],
  'Testing': ['test', 'testing', 'jest', 'vitest', 'cypress', 'e2e'],
  'Deployment': ['deploy', 'docker', 'vercel', 'aws', 'hosting', 'ci/cd', 'github actions'],
  'Architecture': ['architecture', 'pattern', 'clean', 'hexagonal', 'ddd', 'microservices'],
  'AI / ML': ['ai', 'ml', 'openai', 'gpt', 'llm', 'gemini', 'model'],
  'Career': ['job', 'career', 'salary', 'interview', 'hire', 'remote', 'freelance', 'work'],
  'Tools': ['vscode', 'cursor', 'ide', 'editor', 'git', 'github', 'copilot'],
};

function extractThemes(comments: YouTubeComment[]): Map<string, { count: number; examples: string[] }> {
  const themes = new Map<string, { count: number; examples: string[] }>();

  for (const comment of comments) {
    const lower = comment.text.toLowerCase();
    for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
      if (keywords.some(kw => lower.includes(kw))) {
        const existing = themes.get(theme) || { count: 0, examples: [] };
        existing.count++;
        if (existing.examples.length < 3 && comment.text.length < 200) {
          existing.examples.push(comment.text);
        }
        themes.set(theme, existing);
      }
    }
  }

  return themes;
}

function extractQuestions(comments: YouTubeComment[]): Map<string, number> {
  const questions = new Map<string, number>();

  for (const comment of comments) {
    const text = comment.text.trim();
    // Look for question marks or Spanish question words
    if (text.includes('?') || /\b(cómo|como|qué|que|por qué|porque|cuándo|cuando|dónde|donde|cuál|cual|quién|quien|cuánto|cuanto)\b/i.test(text)) {
      // Normalize: lowercase, remove extra spaces, limit length
      const normalized = text.toLowerCase().replace(/\s+/g, ' ').slice(0, 120);
      const count = questions.get(normalized) || 0;
      questions.set(normalized, count + 1);
    }
  }

  return questions;
}

/**
 * Analyze a batch of YouTube comments and extract insights.
 */
export function analyzeComments(
  videoId: string,
  videoTitle: string,
  comments: YouTubeComment[]
): CommentAnalysis {
  const sentiment = { positive: 0, negative: 0, neutral: 0 };

  for (const comment of comments) {
    const s = classifySentiment(comment.text);
    sentiment[s]++;
  }

  const themesMap = extractThemes(comments);
  const themes = Array.from(themesMap.entries())
    .map(([theme, data]) => ({ theme, count: data.count, examples: data.examples }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const questionsMap = extractQuestions(comments);
  const questions = Array.from(questionsMap.entries())
    .map(([question, count]) => ({ question, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    videoId,
    videoTitle,
    totalComments: comments.length,
    sentiment,
    topThemes: themes,
    topQuestions: questions,
    rawComments: comments,
  };
}
