function parseEntryHeader(header) {
    var packages = header
        .split(", ")
        .map(function(name) {
            return name.replace(/"/g, "");
        });
    var packageName = packages[0].substring(0, packages[0].lastIndexOf("@"));
    var versions = packages.map(function(name) {
        return name.substring(name.lastIndexOf("@") + 1);
    });
    return {
        package: packageName,
        versions: versions,
    };
}

function createYarnLock(header, entries) {
    var result = "";
    result += header;
    var packages = Object.keys(entries);
    packages.forEach(function(packageName) {
        var allRequiredVersions = Object.keys(entries[packageName]);
        allRequiredVersions.forEach(function(versions) {
            result +=
                getPackageVersionsString(packageName, versions.split(","))
                + entries[packageName][versions].contents;
        });
    });

    return result;
}

function getPackageVersionsString(package, versions) {
    var packageVersions = versions.map(function(version) {
        var needQuotes = package.indexOf("@") !== -1 || version.indexOf(" ") !== -1;
        var packageWithVersion = package + "@" + version;
        if (needQuotes) {
            packageWithVersion = "\"" + packageWithVersion + "\"";
        }

        return packageWithVersion;
    });

    return packageVersions.join(", ") + ":\n";
}

module.exports = {
    parseEntryHeader: parseEntryHeader,
    createYarnLock: createYarnLock,
};
