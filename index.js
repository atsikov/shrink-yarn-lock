#!/usr/bin/env node

var fs = require("fs");
var path = require("path");
var utils = require("./utils");
var semverMatch = require("semver-match");

var yarnLockPathParam = process.argv[process.argv.length - 1];
var yarnLockPath = path.resolve(
    process.cwd(),
    yarnLockPathParam && yarnLockPathParam.lastIndexOf(".lock") === yarnLockPathParam.length - 5
        ? yarnLockPathParam
        : "yarn.lock",
);

if (!fs.existsSync(yarnLockPath)) {
    console.log("yarn.lock is not found at " + yarnLockPath);
    console.log("Usage: shrink-yarn-lock <optional: path to yarn.lock file>");
    process.exit(1);
}

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
        yarnLockEntries[entryHeader.package] = {
            versions: {},
            entries: [],
        };
    }

    var packageVersions = yarnLockEntries[entryHeader.package].versions;

    entryHeader.entries.forEach(function(entry) {
        var matches = entryContents.match(reEntryInstalledVersion);
        if (!matches) {
            throw new Error("Unable to get installed package version");
        }
        var installedVersion = matches[1];
        var packageVersion = entry.version !== -1 ? entry.version : installedVersion;
        packageVersions[packageVersion] = {
            version: installedVersion,
            contents: entryContents,
        };
    });

    yarnLockEntries[entryHeader.package].entries = yarnLockEntries[entryHeader.package].entries.concat(entryHeader.entries);
}

var mergedEntries = Object.keys(yarnLockEntries).reduce(function(merged, package) {
    var packageEntry = yarnLockEntries[package];
    var packageVersions = packageEntry.versions;
    var requiredVersions = Object.keys(packageVersions);
    var installedVersions = requiredVersions.reduce(function(acc, version) {
        var installed = packageVersions[version];
        if (acc.every(function(entry) { return entry.version !== installed.version; })) {
            acc.push(installed);
        }
        return acc;
    }, []);

    var suitableVersions = requiredVersions.reduce(function(acc, version) {
        var matchedVersion = semverMatch(
            version,
            installedVersions.map(function(installed) {
                return installed.version;
            })
        ) || packageVersions[version].version;
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

fs.writeFileSync(
    yarnLockPath, 
    utils.createYarnLock(yarnLockHeader, yarnLockEntries, mergedEntries),
);
