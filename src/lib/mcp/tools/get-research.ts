import { defineTool } from "@lovable.dev/mcp-js";
import { RESEARCH } from "@/lib/resume-data";

export default defineTool({
  name: "get_research",
  title: "Get research",
  description:
    "Return Harshavardhan's research publications and working papers with title, venue, year, abstract, and keywords.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: JSON.stringify(RESEARCH, null, 2) }],
    structuredContent: { research: RESEARCH },
  }),
});
