// Repository guardrails for BF-006 AC3: no secrets committed and no LLM SDK in the app.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const SECRET_PATTERNS = [
  { name: "OpenAI-style key", re: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}/ },
  { name: "Anthropic key", re: /\bsk-ant-[A-Za-z0-9_-]{20,}/ },
  { name: "JWT (e.g. Supabase service_role)", re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { name: "Supabase access token", re: /\bsbp_[a-f0-9]{30,}/ },
  { name: "Private key block", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
];

const FORBIDDEN_DEPS = ["openai", "@anthropic-ai/sdk", "@anthropic-ai/claude-agent-sdk", "ai", "@ai-sdk/openai", "@ai-sdk/anthropic"];

export function findSecrets(text) {
  return SECRET_PATTERNS.filter(({ re }) => re.test(text)).map(({ name }) => name);
}

export function findForbiddenDeps(pkg) {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.optionalDependencies };
  return FORBIDDEN_DEPS.filter((name) => name in deps);
}

// BF-008 AC3: privileged Supabase credentials must never reach the browser bundle.
const PUBLIC_ENV_SECRET = /NEXT_PUBLIC_\w*(?:SERVICE|SECRET|TOKEN|PRIVATE)/i;
const SERVER_ONLY_DIR = "src/server/";

export function findClientExposure(file, text) {
  const normalized = file.replaceAll("\\", "/");
  const problems = [];
  if (PUBLIC_ENV_SECRET.test(text)) problems.push("secret-like name exposed through a NEXT_PUBLIC_ variable");
  if (normalized.startsWith("src/") && !normalized.startsWith(SERVER_ONLY_DIR) && /service_role/i.test(text)) {
    problems.push("service_role referenced outside src/server/");
  }
  return problems;
}

function main() {
  const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
    .split("\0")
    .filter((f) => f && !/(package-lock\.json|\.(ico|png|jpg|svg|webp))$/.test(f) && f !== "scripts/guardrails.mjs");
  const problems = [];
  for (const file of files) {
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const name of findSecrets(text)) problems.push(`${file}: possible ${name}`);
    for (const issue of findClientExposure(file, text)) problems.push(`${file}: ${issue}`);
  }
  for (const name of findForbiddenDeps(JSON.parse(readFileSync("package.json", "utf8")))) {
    problems.push(`package.json: forbidden LLM dependency "${name}" (DEC-005)`);
  }
  if (problems.length > 0) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  console.log(`guardrails: ${files.length} files checked, no problems`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll("\\", "/").split("/").pop())) main();
