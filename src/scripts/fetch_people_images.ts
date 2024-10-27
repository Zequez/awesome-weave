import axios from "axios";
import DB from "../db";

const oneWeekAgo = new Date().getTime() - 1000 * 60 * 60 * 24 * 7;
for (let login in DB.people) {
  const person = DB.people[login];
  if (!person) continue;
  if (person.avatarB64 && person.avatarB64.fetchedAt > oneWeekAgo) continue;
  const url = person.avatarUrl;
  if (url) {
    console.log(`Fetching ${url}`);
    try {
      const contr = person.allContributions;
      const size = contr >= 1000 ? 128 : contr >= 100 ? 64 : 32;
      const response = await axios.get(url + "&size=" + size, {
        responseType: "arraybuffer", // Important to specify 'arraybuffer' to handle binary data
      });
      const buffer = Buffer.from(response.data, "binary");
      const base64String = buffer.toString("base64");
      const mimeType = response.headers["content-type"];
      const base64Image = `data:${mimeType};base64,${base64String}`;
      person.avatarB64 = {
        fetchedAt: new Date().getTime(),
        data: base64Image,
      };
    } catch (e) {
      console.log("Fetch failed");
    }
  }
}

DB.save();
