import { DeliveryObservation } from '../../types/interview';

export interface RawDeliveryInput {
  transcript: string;
  durationSeconds: number;
  pauseCount?: number;
}

export const COMMON_FILLER_WORDS = [
  'um',
  'uh',
  'like',
  'you know',
  'basically',
  'actually',
  'literally',
  'sort of',
  'kind of',
  'i mean',
  'to be honest',
  'so yeah',
  'right',
];

export interface FillerWordDetail {
  word: string;
  count: number;
}

export function detectFillerWords(text: string): { total: number; breakdown: FillerWordDetail[] } {
  const normalized = (text || '').toLowerCase();
  const breakdown: FillerWordDetail[] = [];
  let total = 0;

  for (const filler of COMMON_FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = normalized.match(regex);
    if (matches && matches.length > 0) {
      total += matches.length;
      breakdown.push({ word: filler, count: matches.length });
    }
  }

  breakdown.sort((a, b) => b.count - a.count);
  return { total, breakdown };
}

export function calculateSpeakingPace(wordCount: number, durationSeconds: number): {
  wpm: number;
  rating: 'optimal' | 'too_fast' | 'too_slow';
  label: string;
} {
  const minutes = Math.max(0.1, durationSeconds / 60);
  const wpm = Math.round(wordCount / minutes);

  if (wpm < 115) {
    return { wpm, rating: 'too_slow', label: 'Deliberate / Slow Pace' };
  } else if (wpm > 175) {
    return { wpm, rating: 'too_fast', label: 'Rapid / Fast Pace' };
  }
  return { wpm, rating: 'optimal', label: 'Optimal Conversational Cadence (120–165 WPM)' };
}

export function analyzeDeliveryMetrics(input: RawDeliveryInput): DeliveryObservation {
  const text = (input.transcript || '').trim();
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;

  const paceInfo = calculateSpeakingPace(wordCount, input.durationSeconds);
  const fillerInfo = detectFillerWords(text);

  // Delivery score coaching observation (0 - 10)
  let deliveryScore = 9.0;
  if (paceInfo.rating !== 'optimal') deliveryScore -= 1.0;
  if (fillerInfo.total > 6) deliveryScore -= 2.0;
  else if (fillerInfo.total > 3) deliveryScore -= 1.0;
  else if (fillerInfo.total > 0) deliveryScore -= 0.4;

  deliveryScore = Math.min(10.0, Math.max(1.0, Math.round(deliveryScore * 10) / 10));

  return {
    speakingPaceWPM: paceInfo.wpm,
    paceRating: paceInfo.rating,
    longPauseCount: input.pauseCount || 0,
    fillerWordCount: fillerInfo.total,
    frequentFillerWords: fillerInfo.breakdown.map((b) => `${b.word} (${b.count})`),
    clarityRating: wordCount > 15 ? 'clear' : 'moderate',
    deliveryScore,
  };
}
