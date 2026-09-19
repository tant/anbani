/** localStorage key set once the learner leaves the welcome screen. */
export const ONBOARDED_KEY = 'onboarded';

/** Learners who already studied on this device (from before the welcome screen existed, or synced) skip it. */
export const shouldWelcome = (onboarded: boolean, cardCount: number) => !onboarded && cardCount === 0;
