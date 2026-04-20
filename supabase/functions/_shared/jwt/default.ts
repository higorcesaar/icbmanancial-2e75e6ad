import { createRemoteJWKSet, jwtVerify } from "https://deno.land/x/jose@v5.2.0/index.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const JWKS = createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`));

export async function verifyJWT(req: Request): Promise<{ userId: string; email: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "");
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      algorithms: ["ES256", "HS256"],
    });
    return {
      userId: payload.sub as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}