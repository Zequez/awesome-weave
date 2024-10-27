import * as fs from "node:fs";
import type { Person, Project } from "./types";

function build() {
  const happs = JSON.parse(fs.readFileSync("./db/happs.json", "utf-8")) as {
    [key: string]: Project;
  };

  const people = JSON.parse(fs.readFileSync("./db/people.json", "utf-8")) as {
    [key: string]: Person | null;
  };

  const frames = JSON.parse(fs.readFileSync("./db/frames.json", "utf-8")) as {
    [key: string]: Project;
  };

  function save() {
    fs.writeFileSync("./db/happs.json", JSON.stringify(happs, null, 2));
    fs.writeFileSync("./db/people.json", JSON.stringify(people, null, 2));
    fs.writeFileSync("./db/frames.json", JSON.stringify(frames, null, 2));
  }

  return { happs, people, frames, save };
}

const DB = build();

export default DB;
