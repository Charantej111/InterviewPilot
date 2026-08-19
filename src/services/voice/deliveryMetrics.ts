import { DeliveryObservation } from '../../types/interview';

export interface RawDeliveryInput {
  transcript: string;
  durationSeconds: number;
  pauseCount?: number;
}

const COMMON_FILLER_WORDS = [
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
];

export function analyzeDeliveryMetrics(input: RawDeliveryInput): DeliveryObservation {
  const text = (input.transcript || '').toLowerCase();
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;
  const minutes = Math.max(0.1, input.durationSeconds / 60);

  const speakingPaceWPM = Math.round(wordCount / minutes);

  let paceRating: 'optimal' | 'too_fast' | 'too_slow' = 'optimal';
  if (speakingPaceWPM < 110) {
    paceRating = 'too_slow';
  } else if (speakingPaceWPM > 175) {
    paceRating = 'too_fast';
  }

  let fillerWordCount = 0;
  const frequentFillerWords: string[] = [];

  for (const filler of COMMON_FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches && matches.length > 0) {
      fillerWordCount += matches.length;
      frequentFillerWords.push(filler);
    }
  }

  // Delivery score is a separate coaching observation (0 - 10), NEVER a content score penalty
  let deliveryScore = 8.5;
  if (paceRating !== 'optimal') deliveryScore -= 1.0;
  if (fillerWordCount > 5) deliveryScore -= 1.5;
  else if (fillerWordCount > 2) deliveryScore -= 0.8;

  deliveryScore = Math.min(10.0, Math.max(1.0, Math.round(deliveryScore * 10) / 10));

  return {
    speakingPaceWPM,
    paceRating,
    longPauseCount: input.pauseCount || 0,
    fillerWordCount,
    frequentFillerWords,
    clarityRating: wordCount > 10 ? 'clear' : 'moderate',
    deliveryScore,
  };
}
