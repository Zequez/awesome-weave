import { generatePeopleSvg } from "../generatePeopleSvg";
import DB from "../db";
import fs from "node:fs";

const svg = generatePeopleSvg(
  Object.values(DB.people)
    .filter((a) => a)
    .map((a) => a!)
);
fs.writeFileSync("./public/people.svg", svg, "utf-8");
