import DB from "./db";
import { writeGenerated } from "./readmeTools";
import type { Project, Branch } from "./types";

const sortedProjects = Object.values(DB.projects).toSorted(
  (p1, p2) => (p2.home?.pushedAt || 0) - (p1.home?.pushedAt || 0)
);

function generateProjectText(p: Project) {
  let txt = "";
  const title = p.readme?.title || capitalize(p.repo);
  txt += `**${title}**`;
  txt += `<sub><sup> [${p.owner}/${p.repo}](${ghUrl(
    p.owner + "/" + p.repo
  )}) </sub></sup>`;
  if (p.home?.description) txt += `\n${p.home?.description}`;

  // if (title) txt += ` **${title}**`;

  const updateDate = p.home?.pushedAt ? new Date(p.home.pushedAt) : null;
  const latestBranch = getLatestBranch(p.branches?.list || []);
  const updateAuthorLogin = latestBranch?.author || null;
  const updateAuthor = updateAuthorLogin ? DB.people[updateAuthorLogin] : null;
  if (updateDate && latestBranch && updateAuthor) {
    const isoDate = updateDate.toISOString();
    // Example date: 6 Aug, 2016
    const dateTxt = updateDate.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const authorLink = `[@${updateAuthor.login}](${ghUrl(updateAuthor.login)})`;
    const branchLink = `[${latestBranch.name}](${ghUrl(latestBranch.path)})`;
    txt += `\n- 🕑 <relative-time datetime="${isoDate}">${dateTxt}</relative-time> on ${branchLink} by ${authorLink}`;
  }

  if (p.contributors) {
    const links = p.contributors.list
      .map((c) => {
        const p = DB.people[c.login];
        return `[@${c.login}](${ghUrl(c.login)})`;
      })
      .join(", ");
    txt += `\n- 👥 ${links}`;
  }

  return txt;
}

const text = sortedProjects.map(generateProjectText).join("\n\n");

writeGenerated("GENERATE_HAPPS", text);

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function ghUrl(path: string) {
  return `https://github.com/${path.replace(/^\//, "")}`;
}

function getLatestBranch(branches: Branch[]): Branch {
  return branches.toSorted((b1, b2) => b2.authoredDate - b1.authoredDate)[0];
}
