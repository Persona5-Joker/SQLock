export function detectSQLi(payload: string): [string, number] {
  if (!payload) return ["allow", 0];

  const patterns: { re: RegExp; name: string }[] = [
    { re: /union\s+select/i, name: "union_select" },
    { re: /or\s+1\s*=\s*1/i, name: "or_true" },
    { re: /--|#|\/\*/i, name: "sql_comment" },
    { re: /sleep\s*\(/i, name: "time_sleep" },
  ];

  let score = 0;
  const hits: string[] = [];

  for (const p of patterns) {
    if (p.re.test(payload)) {
      score += 25;
      hits.push(p.name);
    }
  }

  if (score > 100) score = 100;

  if (score >= 60) return ["block", score];
  if (score >= 30) return ["challenge", score];
  return ["allow", score];
}
