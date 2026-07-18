import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { PROJECTS } from "@/lib/resume-data";

export default defineTool({
  name: "get_projects",
  title: "Get projects",
  description:
    "List Harshavardhan's engineering projects (VLSI, RTL, FPGA, ML, full-stack) with tech stack, highlights, and GitHub links. Optionally filter by tag substring.",
  inputSchema: {
    tag: z
      .string()
      .optional()
      .describe(
        "Case-insensitive substring to match against a project's tag (e.g. 'RTL', 'FPGA', 'ML').",
      ),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ tag }) => {
    const items = tag
      ? PROJECTS.filter((p) => p.tag.toLowerCase().includes(tag.toLowerCase()))
      : PROJECTS;
    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { projects: items },
    };
  },
});
