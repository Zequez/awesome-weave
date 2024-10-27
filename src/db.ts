import * as fs from "node:fs";
import type { Person, Project } from "./types";

function build() {
  const projects = JSON.parse(
    fs.readFileSync("./db/projects.json", "utf-8")
  ) as {
    [key: string]: Project;
  };

  const people = JSON.parse(fs.readFileSync("./db/people.json", "utf-8")) as {
    [key: string]: Person | null;
  };

  function save() {
    fs.writeFileSync("./db/projects.json", JSON.stringify(projects, null, 2));
    fs.writeFileSync("./db/people.json", JSON.stringify(people, null, 2));
  }

  return { projects, people, save };
}

const DB = build();

export default DB;
