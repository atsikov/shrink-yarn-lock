function parseEntryHeader(header) {
    const parsed = header
        .split(", ")
        .map(function(name) {
            return name.replace(/"/g, "");
        })
        .map(function(name) {
            return parsePackageName(name);
        });

    return {
        package: parsed[0].package,
        entries: parsed,
    };
}

function parsePackageName(rawEntry) {
    var packageName;
    var fullPackageName;
    var version = -1;
    if (rawEntry.indexOf("file:") === 0) {
        packageName = rawEntry;
    } else if (rawEntry.indexOf("://") !== -1) {
        packageName = rawEntry;
    } else {
        var splitted = rawEntry.split("@");
        version = splitted.pop();
        packageName = rawEntry.indexOf(":") !== -1
            ? splitted.join("@").split(":")[1]
            : splitted.join("@");
        fullPackageName = splitted.join("@");
    }
    return {
        package: packageName,
        fullPackageName: fullPackageName || packageName,
        raw: rawEntry,
        version: version,
    };
}

function createYarnLock(header, entries, mergedVersions) {
    var result = "";
    result += header;
    var packages = Object.keys(entries);
    packages.forEach(function(packageName) {
        var rawVersions = Object.keys(mergedVersions[packageName]);
        rawVersions.forEach(function(rawVersionsEntry) {
            var versions = rawVersionsEntry.split(",");
            var requiredPackages = entries[packageName]
                .entries
                .filter(function(entry) {
                    return entry.version === -1 || versions.indexOf(entry.version) !== -1;
                })
                .map(function(entry) {
                    var line = "";
                    var name = entry.fullPackageName;
                    var version = entry.version;
                    var needQuotes = name.indexOf("@") !== -1 || version.indexOf(" ") !== -1;
                    var packageWithVersion = name + "@" + version;
                    if (needQuotes) {
                        packageWithVersion = "\"" + packageWithVersion + "\"";
                    }

                    return packageWithVersion;
                });
            result += requiredPackages.join(", ")
                + ":\n"
                + mergedVersions[packageName][rawVersionsEntry].contents;
        });
    });

    return result;
}

module.exports = {
    parseEntryHeader: parseEntryHeader,
    createYarnLock: createYarnLock,
};
