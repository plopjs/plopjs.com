import { dirname } from 'path';
import { fileURLToPath } from 'url';
import markdown from "metalsmith-markdown";
import registerHelpers from "metalsmith-register-helpers";
import permalinks from "metalsmith-permalinks";
import layouts from "metalsmith-layouts";
import browserify from "metalsmith-browserify-alt";
import stylus from "metalsmith-stylus";
import browserSync from "metalsmith-browser-sync";
import htmlMinify from "metalsmith-html-minifier";
import nib from "nib";
// custom plugins
import mdLeftNav from "./plugins/md-left-nav.js";
import ghContributors from "./plugins/gh-contributors.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

import metalsmith from "metalsmith";
var ms = metalsmith(__dirname)
  .source("./content")
  .destination("./build")
  .clean(true)
  .use((files, metalsmith, done) => {
    setImmediate(done);
    metalsmith.metadata({
      name: "PLOP",
      title: "Consistency Made Simple",
      production: process.env.NODE_ENV === "production",
    });
  })
  .use(ghContributors())
  .use(markdown())
  .use(mdLeftNav())
  .use(permalinks({ relative: false }))
  .use(registerHelpers())
  .use(
    layouts({
      engine: "handlebars",
      partials: "partials",
    })
  )
  .use(htmlMinify())
  .use(
    stylus({
      compress: true,
      sourcemap: process.env.NODE_ENV !== "production",
      paths: ["./styles"],
      use: [nib()],
    })
  )
  .use(
    browserify({
      defaults: {
        cache: {},
        packageCache: {},
        transform: ["uglifyify"],
        plugin: process.env.NODE_ENV !== "production" ? ["watchify"] : [],
        debug: process.env.NODE_ENV !== "production",
      },
    })
  );

if (process.env.NODE_ENV !== "production") {
  ms = ms.use(
    browserSync({
      ui: false,
      files: [
        "content/**",
        "styles/**",
        "scripts/**",
        "layouts/**",
        "partials/**",
        "helpers/**",
      ],
      server: "build",
      port: 5000,
      ghostMode: false,
      open: false,
    })
  );
}

ms.build(function (err) {
  if (err) throw err;
});
