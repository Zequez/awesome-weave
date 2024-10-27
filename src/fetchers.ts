import axios from "axios";
import { parse } from "node-html-parser";
import type { Branch, Person, Project, HomeData, Contributor } from "./types";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export async function getBranches(repo: Project): Promise<Branch[] | null> {
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

export async function getHome(project: Project): Promise<HomeData | null> {
  const response = await fetchRepo(project);
  if (!response) return null;
  return {
    description: response.description,
    stars: response.stargazers_count,
    createdAt: new Date(response.created_at).getTime(),
    pushedAt: new Date(response.pushed_at).getTime(),
  };
}

export async function getContributors(
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

export async function getPerson(login: string): Promise<Person | null> {
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

export async function getReadme(
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

export async function fetchPerson(login: string) {
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
