/* Prints the fixture chat answers: npx vite-node scripts/check-answers.ts */
import { answerFor } from "../src/jodz/home";
for (const q of ["What's trending?", "How are the ads doing?", "Can we afford the proposed stock purchase?", "What should we reorder?", "Which wholesale orders are blocked?"]) {
  const a = answerFor(q);
  console.log("\n> " + q + "\n[" + a.tool + "] " + a.text);
}
