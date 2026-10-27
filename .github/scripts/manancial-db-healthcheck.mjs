// Executa uma leitura real e mínima em public.keepalive.
// Sem tokens privilegiados, sem escrita, sem imprimir a chave usada.
import { readFileSync } from "node:fs";

function readDotEnv(file) {
  const vars = {};
  for (const line of file.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    const raw = match[2];
    vars[match[1]] = raw.length > 1 && (
      (raw.startsWith('"') && raw.endsWith('"')) ||
      (raw.startsWith("'") && raw.endsWith("'"))
    ) ? raw.slice(1, -1) : raw;
  }
  return vars;
}

async function main() {
  const fileEnv = readDotEnv(readFileSync(".env", "utf8"));
  const overrideUrl = (process.env.MANANCIAL_SUPABASE_URL ?? "").trim();
  const overrideKey = (process.env.MANANCIAL_SUPABASE_PUBLISHABLE_KEY ?? "").trim();
  if (Boolean(overrideUrl) !== Boolean(overrideKey)) {
    throw new Error("Defina MANANCIAL_SUPABASE_URL e MANANCIAL_SUPABASE_PUBLISHABLE_KEY em conjunto.");
  }

  const base = (overrideUrl || fileEnv.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
  const key = overrideKey || fileEnv.VITE_SUPABASE_PUBLISHABLE_KEY || "";
  if (!base || !key || key.startsWith("sb_secret_")) {
    throw new Error("URL e chave publicável obrigatórias; nunca utilize service_role ou sb_secret_.");
  }
  const target = new URL(base);
  if (target.protocol !== "https:" || !target.hostname.endsWith(".supabase.co") || target.pathname !== "/") {
    throw new Error("URL inválida: esperado https://<ref>.supabase.co.");
  }
  if (process.argv.includes("--validate-only")) {
    console.log("Configuração de keepalive válida:", target.hostname);
    return;
  }

  const endpoint = new URL("/rest/v1/keepalive?select=id&limit=1", target);
  const response = await fetch(endpoint, {
    headers: { apikey: key, Accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(
      "Falha ao ler public.keepalive: HTTP " + response.status +
      ". Confirme o projeto correto, aplique docs/database/keepalive.sql e revise os logs."
    );
  }
  console.log("Leitura do banco confirmada:", target.hostname, "(HTTP " + response.status + ")");
}

main().catch((error) => {
  console.error("Keepalive Manancial:", error.message);
  process.exitCode = 1;
});
