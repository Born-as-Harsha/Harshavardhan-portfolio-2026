import { defineTool } from "@lovable.dev/mcp-js";
import { CODING, ACHIEVEMENTS } from "@/lib/resume-data";

export default defineTool({
  name: "get_coding_profiles",
  title: "Get coding profiles",
  description: "Return Harshavardhan's competitive-programming handles (LeetCode, CodeChef, HackerRank, Codeforces) and notable achievements.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: JSON.stringify({ profiles: CODING, achievements: ACHIEVEMENTS }, null, 2) }],
    structuredContent: { profiles: CODING, achievements: ACHIEVEMENTS },
  }),
});