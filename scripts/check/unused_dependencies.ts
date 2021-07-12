#!/usr/bin/env -S node -r ./register-ts-node

import * as path from 'path';
import depcheck, { Options, Results } from 'depcheck';

const options: Options = {
  skipMissing: false,
  ignoreDirs: ['dist'],
  parsers: {
    '**/*.js': depcheck.parser.es6,
    '**/*.ts': depcheck.parser.typescript,
    '**/*.tsx': depcheck.parser.typescript,
  },
  detectors: [
    depcheck.detector.requireCallExpression,
    depcheck.detector.importDeclaration,
    depcheck.detector.exportDeclaration,
    depcheck.detector.typescriptImportType,
    depcheck.detector.typescriptImportEqualsDeclaration,
  ],
  specials: [
    depcheck.special.eslint,
    depcheck.special.webpack,
    depcheck.special.jest,
    depcheck.special.mocha,
    depcheck.special.react17,
    depcheck.special.ttypescript,
    depcheck.special.prettier,
    depcheck.special.tslint,
    depcheck.special.husky,
  ],
  ignoreMatches: [
    '@capacitor/android',
    '@capacitor/filesystem',
    '@capacitor/ios',
    '@capacitor/keyboard',
    '@types/jest',
    '@types/webpack-env',
    'css-loader',
    'eslint-plugin-prettier',
    'file-loader',
    'identity-obj-proxy',
    'jest-cli',
    '@types/mocha',
    'mocha',
    'style-loader',
    'ts-loader',
    'ttypescript',
    'url-loader',
    'react-devtools',
    '@types/react-devtools',
    'react-devtools',
    'tslib',
  ],
};

const logIfExists = (
  label: string,
  values: string[] | Record<string, string>
) => {
  if (check(values)) {
    console.log(label);
    if (Array.isArray(values)) {
      values.forEach((dep) => {
        console.log(dep);
      });
    } else {
      Object.keys(values).forEach((key) => {
        console.log(`${key} - ${values[key]}`);
      });
    }
    console.log();
  }
};

const check = (value: any) => value && Object.keys(value).length > 0;

depcheck(path.resolve(__dirname, '../../'), options).then(
  ({ dependencies, devDependencies, invalidFiles, invalidDirs }: Results) => {
    logIfExists('Unused dependencies:', [...dependencies, ...devDependencies]);
    logIfExists("Files that couldn't be checked:", invalidFiles);
    logIfExists("Directories that couldn't be checked:", invalidDirs);

    if (
      check(dependencies) ||
      check(devDependencies) ||
      check(invalidFiles) ||
      check(invalidDirs)
    ) {
      process.exit(1);
    }
  }
);
