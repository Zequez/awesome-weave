import * as fs from "node:fs";

export function parseReadmeSection(section: string): string[] {
  const readme = fs.readFileSync("./README.md", "utf-8");

  const regex = new RegExp(`<!-- ${section}([\\s\\S]*?)-->`, "m");
  const m = readme.match(regex);
  if (m) {
    return m[1]
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l)
      .map((l) => l.match(/- (.*)/)!)
      .filter((l) => l)
      .map((m) => {
        return m[1];
      });
  } else {
    throw `No section ${section}`;
  }
}

export function writeGenerated(section: string, content: string) {
  const readme = fs.readFileSync("./README.md", "utf-8");
  const regex1 = new RegExp(`<!-- ${section}([\\s\\S]*?)-->`, "m");
  const regex2 = new RegExp(`<!-- /${section} -->`, "m");
  const match1 = readme.match(regex1);
  const match2 = readme.match(regex2);
  if (match1 && match2) {
    const readme1 = readme.slice(0, match1.index! + match1[0].length);
    const readme2 = readme.slice(match2.index!);
    fs.writeFileSync("./README.md", `${readme1}\n${content}\n${readme2}`);
  } else {
    throw `No section ${section}`;
  }
}
