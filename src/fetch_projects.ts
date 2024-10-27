import { parseReadmeSection } from "./readmeTools";
import DB from "./db";
import {
  getBranches,
  getContributors,
  getHome,
  getPerson,
  getReadme,
} from "./fetchers";
import type { Project } from "./types";

const FORCE_FETCH_BRANCHES = false;
const FORCE_FETCH_HOME = false;
const FORCE_FETCH_CONTRIBUTORS = false;
const FORCE_FETCH_PEOPLE = false;
const FORCE_FETCH_README = false;

type ProjectMap = { [key: string]: Project };

function initProject(PJ: ProjectMap, owner: string, repo: string) {
  const id = `${owner}/${repo}`;
  PJ[id] = PJ[id] || {
    owner,
    repo,
    branches: null,
    home: null,
    contributors: null,
    readme: null,
  };
}

parseReadmeSection("GENERATE_HAPPS").forEach((repoLink: string) => {
  const [owner, repo] = repoLink.split("/");
  initProject(DB.happs, owner, repo);
});

parseReadmeSection("GENERATE_FRAMES").forEach((repoLink: string) => {
  const [owner, repo] = repoLink.split("/");
  initProject(DB.frames, owner, repo);
});

const projectsPeople: string[] = [];
const sumContributions: { [key: string]: number } = {};

async function processProjects(PJ: ProjectMap) {
  for (let id in PJ) {
    const project = PJ[id];
    const now = new Date().getTime();
    const oneDayAgo = now - 1000 * 60 * 60 * 24;
    const oneWeekAgo = now - 1000 * 60 * 60 * 24 * 7;

    // FETCH BRANCHES

    if (
      !project.branches ||
      project.branches.fetchedAt < oneDayAgo ||
      FORCE_FETCH_BRANCHES
    ) {
      const branches = await getBranches(project);
      if (branches) {
        project.branches = {
          fetchedAt: now,
          list: branches,
        };
      }
    }

    // FETCH MAIN REPO INFO

    if (
      !project.home ||
      project.home.fetchedAt < oneDayAgo ||
      FORCE_FETCH_HOME
    ) {
      const home = await getHome(project);
      if (home) {
        project.home = {
          fetchedAt: now,
          ...home,
        };
      }
    }

    // FETCH CONTRIBUTORS

    if (
      !project.contributors ||
      project.contributors.fetchedAt < oneDayAgo ||
      FORCE_FETCH_CONTRIBUTORS
    ) {
      const contributors = await getContributors(project);
      if (contributors) {
        project.contributors = {
          fetchedAt: now,
          list: contributors,
        };
      }
    }

    // FETCH README

    if (
      !project.readme ||
      project.readme.fetchedAt < oneWeekAgo ||
      FORCE_FETCH_README
    ) {
      const readme = await getReadme(project);
      if (readme) {
        project.readme = readme;
      }
    }

    if (project.contributors) {
      project.contributors.list.forEach((c) => {
        projectsPeople.push(c.login);
        sumContributions[c.login] = sumContributions[c.login] || 0;
        sumContributions[c.login] += c.contributions;
      });
    }

    if (project.branches) {
      project.branches.list.forEach((b) => {
        projectsPeople.push(b.author);
      });
    }
  }
}

await processProjects(DB.happs);
await processProjects(DB.frames);

// Remove repeated people
projectsPeople
  .filter((p, i, arr) => arr.indexOf(p) === i)
  .forEach((p) => {
    DB.people[p] = DB.people[p] || null;
  });

// FETCH PEOPLE

for (let login in DB.people) {
  const now = new Date().getTime();
  const oneWeekAgo = now - 1000 * 60 * 60 * 24 * 7;
  const person = DB.people[login];
  if (!person || person.fetchedAt < oneWeekAgo || FORCE_FETCH_PEOPLE) {
    const p = await getPerson(login);
    if (p) {
      DB.people[login] = p;
    }
  }
  if (person) person.allContributions = sumContributions[login] || 0;
}

DB.save();
