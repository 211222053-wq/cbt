export type ScoreInput = {
  type: string;
  answerKey: string;
  answerText?: string | null;
  selectedOptions?: string[];
  weight: number;
};

export function scoreObjectiveQuestion(input: ScoreInput): number | null {
  const normalizedKey = input.answerKey.trim();
  const weight = input.weight;

  if (input.type === "ESSAY") return null;

  if (input.type === "SINGLE_CHOICE") {
    return (input.selectedOptions?.[0] ?? "") === normalizedKey ? weight : 0;
  }

  if (input.type === "MULTI_CHOICE") {
    const expected = normalizedKey.split(",").map((v) => v.trim()).filter(Boolean).sort();
    const selected = [...(input.selectedOptions ?? [])].sort();
    if (!selected.length) return 0;
    const intersection = selected.filter((x) => expected.includes(x)).length;
    const penalty = selected.filter((x) => !expected.includes(x)).length;
    return Math.max(0, ((intersection - penalty) / expected.length) * weight);
  }

  if (input.type === "TRUE_FALSE_MULTI") {
    return (input.answerText ?? "").trim().toUpperCase() === normalizedKey.toUpperCase() ? weight : 0;
  }

  if (input.type === "MATCHING") {
    return (input.answerText ?? "").trim() === normalizedKey ? weight : 0;
  }

  if (input.type === "SHORT_ANSWER") {
    return (input.answerText ?? "").trim().toLowerCase() === normalizedKey.toLowerCase() ? weight : 0;
  }

  return 0;
}
