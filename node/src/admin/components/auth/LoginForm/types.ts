export type LoginStep = 'login' | 'mfaSelection' | 'mfaVerification';

export type LocationState = {
  nextPathname?: string;
};
