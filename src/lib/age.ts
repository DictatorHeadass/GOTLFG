/**
 * Age handling.
 *
 * We store a birth DATE and derive age on every read. Storing an age integer at
 * signup would silently rot — a 17-year-old stays 17 in the database forever and
 * quietly ages into 18+ groups they were never re-checked for.
 *
 * None of this is verified. Discord OAuth tells us nothing about how old someone
 * is, so an "18+" group is a preference filter, not a vetted space. The UI says
 * so explicitly; see AgeDisclaimer.
 */

/** Hard floor for signup (COPPA). Under this, no profile is created at all. */
export const MIN_SIGNUP_AGE = 13;

/** Age in whole years on the given date (defaults to now). */
export function getAge(birthDate: Date, on: Date = new Date()): number {
  let age = on.getFullYear() - birthDate.getFullYear();
  const monthDelta = on.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && on.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
}

/** Can this user (by birth date) join a group requiring `minAge`? */
export function meetsAgeGate(birthDate: Date | null, minAge: number): boolean {
  if (!birthDate) return false;
  return getAge(birthDate) >= minAge;
}

/** Is this birth date old enough to hold an account at all? */
export function isOldEnoughToSignUp(birthDate: Date): boolean {
  return getAge(birthDate) >= MIN_SIGNUP_AGE;
}

/**
 * Parse a yyyy-mm-dd string from a date input into a UTC-noon Date.
 * Noon avoids the classic off-by-one where a UTC-midnight date shifts back a
 * day for anyone west of Greenwich and ages them down a year on their birthday.
 */
export function parseBirthDate(input: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  // Reject calendar-invalid dates like 2005-02-30, which Date silently rolls over.
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  if (date.getTime() > Date.now()) return null;
  if (year < 1900) return null;
  return date;
}
