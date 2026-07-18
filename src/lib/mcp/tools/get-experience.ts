import { defineTool } from "@lovable.dev/mcp-js";
import { EXPERIENCE } from "@/lib/resume-data";

export default defineTool({
  name: "get_experience",
  title: "Get experience",
  description:
    "Return Harshavardhan's internships and research/project work with role, organization, dates, bullet points, and certificate URLs.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: JSON.stringify(EXPERIENCE, null, 2) }],
    structuredContent: { experience: EXPERIENCE },
  }),
});