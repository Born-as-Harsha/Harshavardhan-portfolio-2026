import { defineMcp } from "@lovable.dev/mcp-js";
import getProfile from "./tools/get-profile";
import getProjects from "./tools/get-projects";
import getExperience from "./tools/get-experience";
import getSkills from "./tools/get-skills";
import getResearch from "./tools/get-research";
import getCertifications from "./tools/get-certifications";
import getCodingProfiles from "./tools/get-coding-profiles";
import getResumeLinks from "./tools/get-resume-links";

export default defineMcp({
  name: "harshavardhan-portfolio-mcp",
  title: "Yelleti Harshavardhan — Portfolio MCP",
  version: "0.1.0",
  instructions:
    "Public tools that expose Yelleti Harshavardhan's portfolio data — profile, projects, experience, skills, research, certifications, coding profiles, and resume links. Use these when a user asks about his background, VLSI/RTL/FPGA work, or how to reach him.",
  tools: [
    getProfile,
    getProjects,
    getExperience,
    getSkills,
    getResearch,
    getCertifications,
    getCodingProfiles,
    getResumeLinks,
  ],
});
