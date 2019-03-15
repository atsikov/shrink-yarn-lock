var fs = require("fs");
var path = require("path");
var utils = require("./utils");
var semverMatch = require("semver-match");

var yarnLockPath = process.argv[process.argv.length - 1];
if (!yarnLockPath || yarnLockPath.lastIndexOf(".lock") !== yarnLockPath.length - 5) {
    console.log("Usage: yarn shrink <path to yarn.lock>");
    process.exit(1);
}

yarnLockPath = path.resolve(__dirname, yarnLockPath);

var yarnLockRawContent;
try {
    yarnLockRawContent = fs.readFileSync(yarnLockPath).toString();
} catch (e) {
    console.log("Unable to read yarn.lock from provided path");
    console.log(e.message);
    process.exit(1);
}

var yarnLockHeader = "";
var pos = 0;
while (yarnLockRawContent[pos] === "#" || yarnLockRawContent[pos] === "\n") {
    var line = yarnLockRawContent.substring(pos, yarnLockRawContent.indexOf("\n", pos) + 1);
    yarnLockHeader += line;
    pos += line.length;
}

var yarnLockEntries = {};
var reEntryInstalledVersion = /version "(\d+\.\d+\.\d+(-[a-z0-9\.]+)?)"/
while (pos < yarnLockRawContent.length) {
    var line = yarnLockRawContent.substring(pos, yarnLockRawContent.indexOf("\n", pos) - 1);
    pos = yarnLockRawContent.indexOf("\n", pos) + 1;
    var entryHeader = utils.parseEntryHeader(line);
    var entryContents = "";
    while (yarnLockRawContent[pos] === " " || yarnLockRawContent[pos] === "\n") {
        var nextLineStartIndex = yarnLockRawContent.indexOf("\n", pos) + 1;
        line = yarnLockRawContent.substring(pos, nextLineStartIndex);
        pos = nextLineStartIndex;
        entryContents += line;
    }

    if (!yarnLockEntries[entryHeader.package]) {
        yarnLockEntries[entryHeader.package] = {};
    }

    entryHeader.versions.forEach(function(version) {
        var matches = entryContents.match(reEntryInstalledVersion);
        if (!matches) {
            console.log(entryContents);
            throw new Error("Unable to get installed package version");
        }
        yarnLockEntries[entryHeader.package][version] = {
            version: matches[1],
            contents: entryContents,
        };
    });
}

var mergedEntries = Object.keys(yarnLockEntries).reduce(function(merged, package) {
    var packageEntry = yarnLockEntries[package];
    var requiredVersions = Object.keys(packageEntry);
    var installedVersions = requiredVersions.reduce(function(acc, version) {
        var installed = packageEntry[version];
        if (acc.every(function(entry) { return entry.version !== installed.version; })) {
            acc.push(installed);
        }
        return acc;
    }, []);

    var suitableVersions = requiredVersions.reduce(function(acc, version) {
        var matchedVersion = semverMatch(version, installedVersions.map(installed => installed.version)) || packageEntry[version].version;
        if (!acc[matchedVersion]) {
            acc[matchedVersion] = [];
        }
        acc[matchedVersion].push(version);
        return acc;
    }, {});

    merged[package] = {};

    Object.keys(suitableVersions).forEach(function(version) {
        var required = suitableVersions[version].join(",");
        var mathcingInstalled = installedVersions.find(function(installed) {
            return installed.version === version;
        });

        merged[package][required] = mathcingInstalled;
    });

    return merged;
}, {});

fs.writeFileSync(yarnLockPath, utils.createYarnLock(yarnLockHeader, mergedEntries));
