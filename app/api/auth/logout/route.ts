import { fail, ok } from "@/lib/api-response";
import { clearSession, getAuth } from "@/lib/auth";

export async function POST() {
  const auth = await getAuth();
  if (!auth) return fail("Unauthorized", 401);
  await clearSession();
  return ok({ message: "Logout berhasil" });
}
