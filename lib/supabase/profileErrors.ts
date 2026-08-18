/**
 * Translates a Postgres unique-violation (23505) from the users table's
 * username/phone indexes into a friendly Spanish message. Returns null
 * if the error isn't a recognized uniqueness conflict.
 */
export function friendlyUniqueViolation(error: {
  code?: string;
  message?: string;
} | null): string | null {
  if (!error || error.code !== "23505") return null;

  if (error.message?.includes("users_username_unique_idx")) {
    return "Ese nombre de usuario ya está en uso.";
  }
  if (error.message?.includes("users_phone_unique_idx")) {
    return "Ese número de teléfono ya está registrado en otra cuenta.";
  }
  return "Ese valor ya está en uso.";
}
