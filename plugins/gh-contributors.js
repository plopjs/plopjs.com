import fetch from 'node-fetch';
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from 'url';
import mkdirp from "mkdirp";
const repos = ["plopjs/plop", "plopjs/node-plop", "plopjs/plopjs.com"];

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function (config) {
  let firstRun = true;
  return function (files, metalsmith, done) {
    var meta = metalsmith.metadata();
    var contributorData = {};

    if (firstRun) {
      firstRun = false;
    } else {
      const jsonRawText = fs.readFileSync("./plugins/mock-contributors.json");
      meta.contributors = JSON.parse(jsonRawText);
      meta.top5Contributors = contributors.slice(0, 5);
      meta.restOfContributors = contributors.slice(5);
      console.log("MOCK contributors: ", meta.contributors.length);
      done();
      return;
    }

    Promise.all(repos.map(repoName => (
      fetch(`https://api.github.com/repos/${repoName}/contributors`)
        .then(res => res.json())
        .then(json => {
          contributorData[repoName] = json;
        })
        .catch(err => {
          console.log("ERROR!", err);
          done();
        })
    )))
    .then(() => processWhenDone(contributorData));

    function processWhenDone(data) {
      var contributors;
      if (Object.keys(data).sort().join("|") !== repos.sort().join("|")) {
        return;
      }

      repos.forEach(function (repo) {
        if (contributors == null) {
          contributors = data[repo].filter((c) => c.type === "User");
        } else {
          data[repo]
            .filter((c) => c.type === "User")
            .forEach(function (contributor) {
              const existingC = contributors.find(
                (c) => c.login === contributor.login
              );
              if (existingC == null) {
                contributors.push(contributor);
              } else {
                existingC.contributions += contributor.contributions;
              }
            });
        }
      });

      contributors.sort(function (a, b) {
        const aVal = a.contributions;
        const bVal = b.contributions;
        if (aVal > bVal) {
          return -1;
        }
        if (bVal > aVal) {
          return 1;
        }
        return 0;
      });

      meta.contributors = contributors;
      meta.top5Contributors = contributors.slice(0, 5);
      meta.restOfContributors = contributors.slice(5);

      fs.writeFile(
        path.resolve(__dirname, "./mock-contributors.json"),
        JSON.stringify(contributors),
        (err) => {
          if (err != null) {
            console.error(err);
          }
        }
      );

      // go update the avatar images
      const avatarDir = path.resolve(
        metalsmith._destination,
        "images",
        "avatars"
      );
      mkdirp.sync(avatarDir);

      // Create batches of 6 avatar image downloads
      const imageBatches = contributors.reduce((batches, c) => {
        const url = `https://github.com/${c.login}.png?size=200`;
        const filePath = path.join(avatarDir, `${c.login}.png`);
        if (batches.at(-1).length < 6) {
          batches.at(-1).push({ url, filePath });
        } else {
          batches.push([{ url, filePath }]);
        }
        return batches;
      }, [[]])

      // Load avatar images in batches so github's api doesn't block us
      imageBatches.reduce((p, batch) => p.then(() => Promise.all(
        batch.map(({url, filePath}) => fetch(url)
          .then(res => res.body.pipe(fs.createWriteStream(filePath)))
        )
      )), Promise.resolve())
      .catch(err => {
        console.log('ERROR', err);
        done();
      })
      .finally(() => done());
    }
  };
};
