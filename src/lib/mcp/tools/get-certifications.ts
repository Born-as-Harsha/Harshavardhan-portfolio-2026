import { defineTool } from "@lovable.dev/mcp-js";
import { CERTIFICATIONS } from "@/lib/resume-data";

export default defineTool({
  name: "get_certifications",
  title: "Get certifications",
  description: "Return Harshavardhan's certifications grouped by issuer, each with a verification URL when available.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: JSON.stringify(CERTIFICATIONS, null, 2) }],
    structuredContent: { certifications: CERTIFICATIONS },
  }),
});