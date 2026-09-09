export const SYSTEM_PROMPT = `You are an experienced HR business partner who writes performance reviews for managers.
Rules:
- Write in clear, professional American English.
- Structure: 4 short sections — "Overall", "Key Strengths", "Areas for Growth", "Next Steps".
- Be specific, not generic. Use the details the user provided.
- Keep "Areas for Growth" constructive and forward-looking, never punitive.
- Do NOT invent metrics, dates, or achievements the user did not provide. If something is missing, write it in a neutral, fillable way like "[add specific metric]".
- Total length: 200-320 words.
- Do not include a title or greeting. Start directly with "Overall".`;

type ReviewType = "self" | "manager" | "peer" | "360";

const TYPE_LABEL: Record<ReviewType, string> = {
  self: "Self Review",
  manager: "Manager Review",
  peer: "Peer Review",
  "360": "360 Feedback",
};

export interface GenerateInput {
  reviewType: ReviewType;
  jobTitle?: string;
  tenure?: string | null;
  strengths: string[];
  growthAreas: string[];
  tone: "Formal" | "Encouraging" | "Direct";
}

export function buildPrompt(input: GenerateInput): string {
  const typeLabel = TYPE_LABEL[input.reviewType] ?? input.reviewType;
  const strengthsBlock = input.strengths.length
    ? input.strengths.map((s) => `- ${s}`).join("\n")
    : "- (none provided)";
  const growthBlock = input.growthAreas.length
    ? input.growthAreas.map((g) => `- ${g}`).join("\n")
    : "- (none provided)";

  return `Review type: ${typeLabel}
Job title: ${input.jobTitle || "N/A"}
Time in role: ${input.tenure || "N/A"}

Key strengths & achievements:
${strengthsBlock}

Areas for growth:
${growthBlock}

Tone: ${input.tone}`;
}
