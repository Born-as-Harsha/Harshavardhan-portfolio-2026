import { defineTool } from "@lovable.dev/mcp-js";
import { PROFILE, ROLES, EDUCATION, INTERESTS } from "@/lib/resume-data";

export default defineTool({
  name: "get_profile",
  title: "Get profile",
  description:
    "Get Yelleti Harshavardhan's core profile: name, title, university, degree, CGPA, contact links, roles, education, and interests.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(
          { profile: PROFILE, roles: ROLES, education: EDUCATION, interests: INTERESTS },
          null,
          2,
        ),
      },
    ],
    structuredContent: {
      profile: PROFILE,
      roles: ROLES,
      education: EDUCATION,
      interests: INTERESTS,
    },
  }),
});
