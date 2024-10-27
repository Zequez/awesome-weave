import DB from "../db";
import { writeGenerated } from "../readmeTools";
import type { Project, Branch, Person } from "../types";
import { capitalize, ghUrl } from "../utils";

const sortedProjects = Object.values(DB.happs).toSorted(
  (p1, p2) => (p2.home?.pushedAt || 0) - (p1.home?.pushedAt || 0)
);

function generateProjectText(p: Project) {
  let txt = "";
  const title = p.readme?.title || capitalize(p.repo);
  txt += `**${title}**`;
  txt += `<sub><sup> [${p.owner}/${p.repo}](${ghUrl(
    p.owner + "/" + p.repo
  )}) </sub></sup>\n`;
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

function generateProjectTableRow(p: Project) {
  let txt = "";
  const title = p.readme?.title || capitalize(p.repo);
  txt += `| **${title}**`;
  txt += `<sub><sup> [${p.owner}/${p.repo}](${ghUrl(
    p.owner + "/" + p.repo
  )}) </sub></sup> |`;
  txt += ` ${p.home?.description || ""} | `;

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
    const branchLink = `[${latestBranch.name}](${ghUrl(latestBranch.path)})`;
    txt += `  ${dateTxt} | ${branchLink} | `;
  } else {
    txt += "| |";
  }

  if (p.contributors) {
    const links = p.contributors.list
      .map((c) => {
        const p = DB.people[c.login];
        return `[@${c.login}](${ghUrl(c.login)})`;
      })
      .join(", ");
    txt += `${links} |`;
  }

  return txt;
}

const projectsHeader = `\n| Happ | Summary | Last updated | Last branch | Contributors |
| --- | --- | --- | --- | --- |\n`;
const projects =
  projectsHeader + sortedProjects.map(generateProjectTableRow).join("\n");
const frames = Object.values(DB.frames).map(generateProjectText).join("\n\n");

writeGenerated("GENERATE_HAPPS", projects);
writeGenerated("GENERATE_FRAMES", frames);

// const people = (Object.values(DB.people).filter((a) => a) as Person[])
//   .toSorted((p1, p2) => p2.allContributions - p1.allContributions)
//   .filter((p) => p.allContributions > 1);

// const peopleText = people
//   .map((p) => {
//     return `[<span title="${
//       p.name
//     }" style="position: relative; display: inline-block; margin-right: 16px;"><img style="width: 32px; height: 32px; border-radius: 50%;" src="${
//       p.avatarUrl
//     }&size=32" alt="${
//       p.name
//     }"/><span style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); font-size: 6px; background: black; border-radius: 4px; color: white; white-space: nowrap; padding: 0 3px;">${
//       p.login
//     }</span></span>](${ghUrl(p.login)})`;
//   })
//   .join("");

// writeGenerated("PEOPLE");

function getLatestBranch(branches: Branch[]): Branch {
  return branches.toSorted((b1, b2) => b2.authoredDate - b1.authoredDate)[0];
}
