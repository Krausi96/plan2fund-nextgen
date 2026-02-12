import { callAI, AIRequest } from "../orchestrator";
import { checkLimit, trackUsage } from "./usageMemory";

export async function runAI({ userId, task, payload }) {

  checkLimit(userId);

  const res = await callAI({ type: task, payload } as AIRequest);

  // Track usage if tokens are available and greater than 0
  if (res?.llmStats?.tokens?.total != null && res.llmStats.tokens.total > 0) {
    trackUsage(userId, res.llmStats.tokens.total);
  }

  return res;
}