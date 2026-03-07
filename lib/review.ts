// lib/review.ts
// App Store review prompt logic
// Uses expo-store-review for native review dialog

import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REVIEW_KEY = 'dealkit_review_state';

interface ReviewState {
  paidDealsCount: number;
  lastPromptDate: string | null;
  hasReviewed: boolean;
}

const DEFAULT_STATE: ReviewState = {
  paidDealsCount: 0,
  lastPromptDate: null,
  hasReviewed: false,
};

// Thresholds for showing review prompt
const FIRST_PROMPT_AFTER = 2;  // After 2 paid deals
const REPEAT_PROMPT_AFTER = 5; // Then every 5 more paid deals
const MIN_DAYS_BETWEEN = 30;   // At least 30 days between prompts

async function getReviewState(): Promise<ReviewState> {
  try {
    const raw = await AsyncStorage.getItem(REVIEW_KEY);
    return raw ? JSON.parse(raw) : { ...DEFAULT_STATE };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

async function saveReviewState(state: ReviewState): Promise<void> {
  try {
    await AsyncStorage.setItem(REVIEW_KEY, JSON.stringify(state));
  } catch {
    // Silently fail
  }
}

/**
 * Call this when a payment is marked as paid.
 * Automatically decides whether to show the review prompt.
 */
export async function onDealPaid(): Promise<void> {
  try {
    const state = await getReviewState();

    // Don't prompt if already reviewed
    if (state.hasReviewed) return;

    state.paidDealsCount += 1;

    // Check if we should prompt
    const shouldPrompt =
      (state.paidDealsCount === FIRST_PROMPT_AFTER) ||
      (state.paidDealsCount > FIRST_PROMPT_AFTER &&
       (state.paidDealsCount - FIRST_PROMPT_AFTER) % REPEAT_PROMPT_AFTER === 0);

    if (shouldPrompt) {
      // Check time since last prompt
      if (state.lastPromptDate) {
        const lastDate = new Date(state.lastPromptDate);
        const now = new Date();
        const daysSince = Math.floor(
          (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSince < MIN_DAYS_BETWEEN) {
          await saveReviewState(state);
          return;
        }
      }

      // Check if review is available on this device
      const isAvailable = await StoreReview.isAvailableAsync();
      if (isAvailable) {
        // Small delay so it doesn't feel jarring right after the action
        setTimeout(async () => {
          try {
            await StoreReview.requestReview();
            state.lastPromptDate = new Date().toISOString();
            state.hasReviewed = true; // Assume reviewed after prompt
            await saveReviewState(state);
          } catch {
            // Silently fail
          }
        }, 1500);
      }
    }

    await saveReviewState(state);
  } catch {
    // Never crash the app for review logic
  }
}
