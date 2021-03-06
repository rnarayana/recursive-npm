const path = require("path");
const assert = require("assert");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs-extra");
const os = require("os");
const execSync = require("child_process").execSync;

var script = path.join(__dirname, "../recursive-npm.js");
if (process.platform.startsWith("win")) {
  script = `node ${script}`;
}

describe("recursive install", function () {
  var cwd;
  var installedPaths;
  var notInstalledPaths;
  var result = { code: 0 };

  beforeEach(function () {
    installedPaths = [".", "/hello/world", "/foo/bar"];

    notInstalledPaths = ["/notInstalledPaths/node_modules/a-module"];

    cwd = path.join(os.tmpdir(), "recursive-npm".concat(uuidv4()));
    fs.ensureDirSync(cwd);

    installedPaths.concat(notInstalledPaths).forEach(function (p) {
      var newPath = path.join(cwd, p);
      fs.ensureDirSync(newPath);
      fs.copySync(
        path.join(__dirname, "test-package.json"),
        path.join(newPath, "package.json")
      );
    });
  });

  afterEach(function () {
    if (fs.lstatSync(cwd).isDirectory()) {
      fs.removeSync(cwd);
    }
  });

  describe("npm install without option", function () {
    beforeEach(function (done) {
      this.timeout(60000); // update timeout in case npm install take time
      try {
        execSync(script.concat(" install"), { cwd: cwd }); // Throw an error if exec fail
        done();
      } catch (err) {
        done(err);
      }
    });

    it("installs all packages", function () {
      installedPaths.forEach(function (p) {
        var workingDir = path.join(cwd, p);
        assert(
          fs.lstatSync(path.join(workingDir, "node_modules")).isDirectory(),
          "Failed to install for " +
            workingDir +
            ". Directory Listing: " +
            fs.readdirSync(workingDir)
        );

        assert(
          fs
            .lstatSync(path.join(workingDir, "node_modules", "right-pad"))
            .isDirectory(),
          "Failed to install dev dependencies for " +
            workingDir +
            ". Directory Listing: " +
            fs.readdirSync(workingDir)
        );
      });
    });

    it("doesn't install packages in node_modules", function () {
      notInstalledPaths.forEach(function (p) {
        var workingDir = path.join(cwd, p);
        assert(
          !fs.existsSync(path.join(workingDir, "node_modules")),
          "Install incorrectly succeeded for " +
            workingDir +
            ". Directory Listing: " +
            fs.readdirSync(workingDir)
        );
      });
    });
  });

  describe("npm install with option --production", function () {
    beforeEach(function (done) {
      this.timeout(60000); // update timeout in case npm install take time
      try {
        execSync(script.concat(" install --production"), { cwd: cwd }); // Throw an error if exec fail
        done();
      } catch (err) {
        done(err);
      }
    });

    it("installs packages, but not devDependencies", function () {
      installedPaths.forEach(function (p) {
        var workingDir = path.join(cwd, p);
        assert(
          fs.lstatSync(path.join(workingDir, "node_modules")).isDirectory(),
          "Failed to install for " +
            workingDir +
            ". Directory Listing: " +
            fs.readdirSync(workingDir)
        );

        assert(
          !fs.existsSync(path.join(workingDir, "node_modules", "right-pad")),
          "Should not install dev dependencies for " +
            workingDir +
            ". Directory Listing: " +
            fs.readdirSync(workingDir)
        );
      });
    });

    it("doesn't install packages in node_modules", function () {
      notInstalledPaths.forEach(function (p) {
        var workingDir = path.join(cwd, p);
        assert(
          !fs.existsSync(path.join(workingDir, "node_modules")),
          "Install incorrectly succeeded for " +
            workingDir +
            ". Directory Listing: " +
            fs.readdirSync(workingDir)
        );
      });
    });
  });
});
