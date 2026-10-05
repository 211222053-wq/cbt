import { scoreObjectiveQuestion } from "@/lib/scoring";
import { shuffleDeterministic } from "@/lib/utils";

function assert(cond: boolean, message: string) {
  if (!cond) throw new Error(message);
}

const score = scoreObjectiveQuestion({
  type: "SINGLE_CHOICE",
  answerKey: "A",
  selectedOptions: ["A"],
  weight: 2,
});
assert(score === 2, "Single choice scoring gagal");

const zero = scoreObjectiveQuestion({
  type: "SHORT_ANSWER",
  answerKey: "jakarta",
  answerText: "bandung",
  weight: 1,
});
assert(zero === 0, "Short answer mismatch harus 0");

const ordered1 = shuffleDeterministic(["1", "2", "3", "4"], "seed-a").join(",");
const ordered2 = shuffleDeterministic(["1", "2", "3", "4"], "seed-a").join(",");
assert(ordered1 === ordered2, "Randomisasi harus deterministik per seed");

console.log("Smoke checks passed");
