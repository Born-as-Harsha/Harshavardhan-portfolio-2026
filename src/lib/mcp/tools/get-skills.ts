import { defineTool } from "@lovable.dev/mcp-js";
import { SKILL_GROUPS } from "@/lib/resume-data";

export default defineTool({
  name: "get_skills",
  title: "Get skills",
  description:
    "Return categorized technical skills across VLSI, Electronics, Computer Architecture, Embedded, Programming, ML, and EDA tools, each with a self-rated proficiency (0-100).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: JSON.stringify(SKILL_GROUPS, null, 2) }],
    structuredContent: { skillGroups: SKILL_GROUPS },
  }),
});