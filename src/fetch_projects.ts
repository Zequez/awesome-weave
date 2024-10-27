import axios from "axios";
import { parse } from "node-html-parser";
import { parseReadmeProjects } from "./readmeTools";

import type { Branch, Person, Project, HomeData, Contributor } from "./types";
import DB from "./db";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const FORCE_FETCH_BRANCHES = false;
const FORCE_FETCH_HOME = false;
const FORCE_FETCH_CONTRIBUTORS = false;
const FORCE_FETCH_PEOPLE = false;
const FORCE_FETCH_README = false;

function initProject(owner: string, repo: string) {
  const id = `${owner}/${repo}`;
  DB.projects[id] = DB.projects[id] || {
    owner,
    repo,
    branches: null,
    home: null,
  };
}

parseReadmeProjects("GENERATE_HAPPS").forEach(({ owner, repo }) =>
  initProject(owner, repo)
);

const projectsPeople: string[] = [];
const sumContributions: { [key: string]: number } = {};

for (let id in DB.projects) {
  const project = DB.projects[id];
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

  if (!project.home || project.home.fetchedAt < oneDayAgo || FORCE_FETCH_HOME) {
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

// ███████╗███████╗████████╗ ██████╗██╗  ██╗███████╗██████╗ ███████╗
// ██╔════╝██╔════╝╚══██╔══╝██╔════╝██║  ██║██╔════╝██╔══██╗██╔════╝
// █████╗  █████╗     ██║   ██║     ███████║█████╗  ██████╔╝███████╗
// ██╔══╝  ██╔══╝     ██║   ██║     ██╔══██║██╔══╝  ██╔══██╗╚════██║
// ██║     ███████╗   ██║   ╚██████╗██║  ██║███████╗██║  ██║███████║
// ╚═╝     ╚══════╝   ╚═╝    ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝

async function getBranches(repo: Project): Promise<Branch[] | null> {
  const url = `https://github.com/${repo.owner}/${repo.repo}/branches`;
  console.log(`Fetching ${url}`);
  try {
    const response = await axios.get(url);
    const html = parse(response.data);
    const script = html.querySelector(
      "script[data-target=react-app.embeddedData]"
    );
    if (script) {
      try {
        const data = JSON.parse(script.innerText);
        const dataBranches = data?.payload?.branches;
        if (!dataBranches || !dataBranches.default || !dataBranches.active) {
          console.log("No branches on payload");
          return null;
        }
        const branches = [dataBranches.default, ...dataBranches.active] as {
          name: string;
          path: string;
          author: { path: string; avatarUrl: string };
          authoredDate: string;
        }[];

        if (branches && branches.length) {
          return branches.map((branch) => ({
            name: branch.name,
            path: branch.path,
            authoredDate: new Date(branch.authoredDate).getTime(),
            author: branch.author.path.slice(1),
          }));
        } else {
          console.log("Could not read branches");
          return null;
        }
      } catch (e) {
        console.log("Could not parse JSON");
        return null;
      }
    } else {
      console.log("Could not find data");
      return null;
    }
  } catch (e) {
    console.log("Fetch failed");
    return null;
  }
}

async function getHome(project: Project): Promise<HomeData | null> {
  const response = await fetchRepo(project);
  if (!response) return null;
  return {
    description: response.description,
    stars: response.stargazers_count,
    createdAt: new Date(response.created_at).getTime(),
    pushedAt: new Date(response.pushed_at).getTime(),
  };
}

async function getContributors(
  project: Project
): Promise<Contributor[] | null> {
  const response = (await fetchRepo(project, "contributors")) as
    | { login: string; contributions: number }[]
    | null;
  if (!response) return null;
  return response.map((c) => ({
    login: c.login,
    contributions: c.contributions,
  }));
}

async function getPerson(login: string): Promise<Person | null> {
  const r = await fetchPerson(login);
  if (r) {
    return {
      login: login,
      avatarUrl: r.avatar_url,
      name: r.name,
      fetchedAt: new Date().getTime(),
      allContributions: 0,
    };
  } else {
    return null;
  }
}

async function getReadme(
  project: Project
): Promise<{ fetchedAt: number; title: string } | null> {
  const response = await fetchRepo(project, "readme");
  if (!response) return null;
  const readme = atob(response.content);
  const m = readme.match(/# (.*)/);
  return {
    fetchedAt: new Date().getTime(),
    title: m ? m[1] : "",
  };
}

async function fetchPerson(login: string) {
  return (await fetchApi(`/users/${login}`)) as {
    login: string;
    avatar_url: string;
    name: string;
  };
}

function fetchRepo(project: Project, path?: string) {
  return fetchApi(
    `/repos/${project.owner}/${project.repo}${path ? `/${path}` : ""}`
  );
}

async function fetchApi(path: string) {
  const url = `https://api.github.com${path}`;
  console.log(`Fetching ${url}`);
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    });
    return response.data;
  } catch (e) {
    console.log("Fetch failed");
    return null;
  }
}
