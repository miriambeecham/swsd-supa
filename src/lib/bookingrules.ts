// src/lib/bookingRules.ts
export type ClassType = 'adult' | 'mother-daughter';

export type ParticipantInput = {
  firstName: string;
  lastName: string;
  ageYears?: number | null;             // preferred (exact)
  ageGroup?: 'Adult' | 'Teen' | 'Child';// optional fallback if you don't collect exact ages
};

export const AGE_RULES = {
  ADULT_MIN_AGE: 16,   // you said "presumably 16+"
  ADULT_CLASS_MIN: 15, // adult class intended age
  DAUGHTER_MIN: 12,
  DAUGHTER_MAX: 15
} as const;

function inferAge(p: ParticipantInput): number | null {
  if (typeof p.ageYears === 'number') return p.ageYears;
  // fallback from Age Group if no numeric age
  if (p.ageGroup === 'Adult') return 18;
  if (p.ageGroup === 'Teen')  return 15; // treat teen as 15 to allow in adult class with warning
  if (p.ageGroup === 'Child') return 10;
  return null;
}

export function validateParticipants(
  classType: ClassType,
  participants: ParticipantInput[],
  contactIsParticipant?: boolean
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!participants?.length) {
    return { isValid: false, errors: ['Add at least one participant.'], warnings };
  }

  const ages = participants.map(inferAge);

  const hasUnder15 = ages.some(a => a != null && a < AGE_RULES.ADULT_CLASS_MIN);
  const hasUnder12 = ages.some(a => a != null && a < AGE_RULES.DAUGHTER_MIN);
  const hasOver15  = ages.some(a => a != null && a > AGE_RULES.DAUGHTER_MAX);
  const adults16   = ages.filter(a => a != null && a >= AGE_RULES.ADULT_MIN_AGE).length;
  const daughters12to15 = ages.filter(a => a != null && a >= AGE_RULES.DAUGHTER_MIN && a <= AGE_RULES.DAUGHTER_MAX).length;

  if (classType === 'adult') {
    // Hard rule: block < 12; Soft rule: 12–14 warn; 15+ OK
    if (hasUnder12) {
      errors.push('Adult classes are not suitable for under 12.');
    } else if (hasUnder15) {
      warnings.push('This adult class is intended for ages 15+. If registering ages 12–14, please call us first to discuss.');
    }
    // (No requirement for an adult to accompany here.)
  }

  if (classType === 'mother-daughter') {
    // Hard rule: must include at least one adult (16+)
    const hasAdult = adults16 > 0 || !!contactIsParticipant; // if the contact is participating and is the adult
    if (!hasAdult) {
      errors.push('At least one adult (16+) must attend the mother–daughter class.');
    }
    // Soft rule: daughters ideally 12–15; out-of-range gets a warning but allowed
    if (hasUnder12 || hasOver15) {
      warnings.push('This mother–daughter class is designed for daughters ages 12–15. If a participant is outside this range, please call us first to discuss.');
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}
