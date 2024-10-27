export type Project = {
  owner: string;
  repo: string;
  branches: {
    fetchedAt: number;
    list: Branch[];
  } | null;
  home:
    | (HomeData & {
        fetchedAt: number;
      })
    | null;
  contributors: {
    list: Contributor[];
    fetchedAt: number;
  } | null;
  readme: {
    fetchedAt: number;
    title: string;
  } | null;
};

export type HomeData = {
  description: string;
  stars: number;
  createdAt: number;
  pushedAt: number;
};

export type Contributor = {
  login: string;
  contributions: number;
};

export type Branch = {
  name: string;
  path: string;
  authoredDate: number;
  author: string;
};

export type Person = {
  fetchedAt: number;
  login: string;
  name: string;
  avatarUrl: string;
  avatarB64: {
    fetchedAt: number;
    data: string;
  } | null;
  allContributions: number;
};
