import { fail, ok } from "@/lib/api-response";
import { getAuth } from "@/lib/auth";

export async function GET() {
  const auth = await getAuth();
  if (!auth) return fail("Unauthorized", 401);
  return ok(auth);
}
