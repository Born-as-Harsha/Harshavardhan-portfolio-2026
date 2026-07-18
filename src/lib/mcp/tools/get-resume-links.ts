import { defineTool } from "@lovable.dev/mcp-js";
import { PROFILE } from "@/lib/resume-data";

export default defineTool({
  name: "get_resume_links",
  title: "Get resume links",
  description:
    "Return canonical URLs for viewing Harshavardhan's portfolio, print-ready resume page, and social/research profiles.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const site = "https://harshavardhan-vlsi.lovable.app";
    const links = {
      portfolio: site,
      resume: `${site}/resume`,
      github: PROFILE.github,
      linkedin: PROFILE.linkedin,
      orcid: PROFILE.orcid,
      scholar: PROFILE.scholar,
      email: PROFILE.email,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(links, null, 2) }],
      structuredContent: links,
    };
  },
});
