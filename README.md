## shrink-yarn-lock
In case you are managing a lot of dependencies, sometimes yarn adds a lot of separate entries to lock file even if the same package could be reused for them.

`shrink-yarn-lock` allows you to optimise `yarn.lock` file merging together dependencies if they satisfy the same currently installed package version. This will help to save some time on downloading packages and unpacking them, along with space on file system.

### Example
```
ajv@^6.1.0:
  version "6.5.1"
  resolved "https://registry.yarnpkg.com/ajv/-/ajv-6.5.1.tgz#88ebc1263c7133937d108b80c5572e64e1d9322d"
  integrity sha1-iOvBJjxxM5N9EIuAxVcuZOHZMi0=
  dependencies:
    fast-deep-equal "^2.0.1"
    fast-json-stable-stringify "^2.0.0"
    json-schema-traverse "^0.4.1"
    uri-js "^4.2.1"

ajv@^6.5.5:
  version "6.10.0"
  resolved "https://registry.yarnpkg.com/ajv/-/ajv-6.10.0.tgz#90d0d54439da587cd7e843bfb7045f50bd22bdf1"
  integrity sha1-kNDVRDnaWHzX6EO/twRfUL0ivfE=
  dependencies:
    fast-deep-equal "^2.0.1"
    fast-json-stable-stringify "^2.0.0"
    json-schema-traverse "^0.4.1"
    uri-js "^4.2.2"

ajv@^6.6.1:
  version "6.7.0"
  resolved "https://registry.yarnpkg.com/ajv/-/ajv-6.7.0.tgz#e3ce7bb372d6577bb1839f1dfdfcbf5ad2948d96"
  integrity sha1-4857s3LWV3uxg58d/fy/WtKUjZY=
  dependencies:
    fast-deep-equal "^2.0.1"
    fast-json-stable-stringify "^2.0.0"
    json-schema-traverse "^0.4.1"
    uri-js "^4.2.2"
```
becomes just

```
ajv@^6.1.0, ajv@^6.5.5, ajv@^6.6.1:
  version "6.10.0"
  resolved "https://registry.yarnpkg.com/ajv/-/ajv-6.10.0.tgz#90d0d54439da587cd7e843bfb7045f50bd22bdf1"
  integrity sha1-kNDVRDnaWHzX6EO/twRfUL0ivfE=
  dependencies:
    fast-deep-equal "^2.0.1"
    fast-json-stable-stringify "^2.0.0"
    json-schema-traverse "^0.4.1"
    uri-js "^4.2.2"

```

### Usage
`yarn shrink-yarn-lock <path to yarn.lock>`

Then run `yarn` to make sure your lock file is valid and to remove obsolete dependencies which might have been referenced by older versions of merged packages.