// bcrypt only reads the first 72 bytes of a password, so anything longer would quietly let in every password that
// starts the same way. It's bytes, not letters: accented letters take 2 bytes and emoji 4.
export const PASSWORD_MAX_BYTES = 72;
export const PASSWORD_TOO_LONG = `Password is too long (${PASSWORD_MAX_BYTES} bytes max; accented letters and emoji count as 2-4)`;

export function passwordFits(password: string) {
  return new TextEncoder().encode(password).length <= PASSWORD_MAX_BYTES;
}
