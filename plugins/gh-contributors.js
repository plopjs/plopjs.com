const https = require("https");
const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
const sharp = require("sharp");
const repos = ["plopjs/plop", "plopjs/node-plop", "plopjs/plopjs.com"];

module.exports = function (config) {
  let firstRun = true;
  return function (files, metalsmith, done) {
    var meta = metalsmith.metadata();
    var contributorData = {};

    if (firstRun) {
      firstRun = false;
    } else {
      meta.contributors = require("./mock-contributors.json");
      console.log("MOCK contributors: ", meta.contributors.length);
      done();
      return;
    }

    repos.forEach(function (repoName) {
      const requestConfig = {
        host: "api.github.com",
        path: `/repos/${repoName}/contributors`,
        headers: { "user-agent": "Mozilla/5.0" },
      };

      https
        .get(requestConfig, function (res) {
          var body = "";

          res.on("data", function (chunk) {
            body += chunk;
          });
          res.on("end", function () {
            contributorData[repoName] = JSON.parse(body);
            processWhenDone(contributorData);
          });
        })
        .on("error", function (err) {
          console.log("ERROR!", err);
          done();
        });
    });

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
      const host = "avatars.githubusercontent.com";
      const headers = { "user-agent": "Mozilla/5.0" };
      var avatarCount = contributors.length;
      const avatarDir = path.resolve(
        metalsmith._destination,
        "images",
        "avatars"
      );
      mkdirp.sync(avatarDir);

      contributors.forEach(function (c) {
        const imgPath = path.join(avatarDir, c.login + ".jpg");
        var avatarFile = fs.createWriteStream(imgPath);
        const avatarCompress = sharp()
          .resize(200, 200)
          .jpeg({ quality: 85, progressive: true });
        avatarFile.on("finish", () => (--avatarCount === 0 ? done() : null));
        var request = https.get(
          { host, headers, path: `/u/${c.id}?v=3` },
          (response) => response.pipe(avatarCompress).pipe(avatarFile)
        );
      });
    }
  };
};
