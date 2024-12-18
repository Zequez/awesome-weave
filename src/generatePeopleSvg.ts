import { type Person } from "./types";
import { ghUrl } from "./utils";

const avatarSizes = {
  T1: 32,
  T2: 64,
  T3: 128,
};

const spaceX = 20;
const spaceY = 30;
const padding = 20;
const fontSize = 12;

const MAX_WIDTH = (avatarSizes.T3 + spaceX) * 4;

type PeopleGrouped = {
  T1: Person[];
  T2: Person[];
  T3: Person[];
};

export function generatePeopleSvg(rawPeople: Person[]) {
  const people = (Object.values(rawPeople).filter((a) => a) as Person[])
    .toSorted((p1, p2) => p2.allContributions - p1.allContributions)
    .filter((p) => p.allContributions > 1 && p.avatarB64);

  const peopleGrouped: PeopleGrouped = {
    T3: people.filter((p) => p.allContributions >= 1000),
    T2: people.filter(
      (p) => p.allContributions >= 100 && p.allContributions < 1000
    ),
    T1: people.filter((p) => p.allContributions < 100),
  };

  let output = "";

  let x = 0;
  let y = 0;
  for (let group in peopleGrouped) {
    const groupedPeople = peopleGrouped[group as keyof PeopleGrouped];
    const size = avatarSizes[group as keyof PeopleGrouped];
    let peopleLeft = groupedPeople.slice(0);
    const howManyFitOnRow = Math.floor(MAX_WIDTH / (size + spaceX));
    const rowsPeople: Person[][] = [];
    while (peopleLeft.length > 0) {
      const count = Math.min(peopleLeft.length, howManyFitOnRow);
      rowsPeople.push(peopleLeft.splice(0, count));
    }

    for (let row of rowsPeople) {
      x = 0;
      for (let person of row) {
        output += renderProfile({
          imgSize: size,
          x,
          y,
          person,
          group: group,
          noText: false,
        });
        x += size + spaceX;
      }
      y += size + spaceY;
    }
  }

  output = svgHeader(y) + output + `</svg>`;
  return output;
}

type PersonProfileElement = {
  imgSize: number;
  x: number;
  y: number;
  person: Person;
  group: string;
  noText: boolean;
};

function svgHeader(height: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MAX_WIDTH} ${height}" width="${MAX_WIDTH}" height="${height}">
  <style>
    .person-name {
      font-size: ${fontSize}px;
      font-family: sans-serif;
    }

    .group-T1 {
      font-size: 6px;
    }

    .group-T2 {
      font-size: 9px;
    }

    .group-T3 {
      font-size: 16px;
    }
  </style>
  `;
}

function renderProfile(el: PersonProfileElement) {
  const personUrl = ghUrl(el.person.login);
  const imgX = el.x;
  const imgY = el.y;
  const textX = el.x + el.imgSize / 2;
  const textY = el.y + el.imgSize + 16;
  let output = `<a xmlns="http://www.w3.org/2000/svg" href="${personUrl}" target="_blank">`;
  if (!el.noText) {
    output += `<text x="${textX}" y="${textY}" text-anchor="middle" class="person-name group-${el.group}" fill="currentColor">${el.person.login}</text>`;
  }
  output += `<image x="${imgX}" y="${imgY}" width="${el.imgSize}" height="${
    el.imgSize
  }" href="${el.person.avatarB64!.data}"/>`;
  output += `</a>`;
  return output;
}
