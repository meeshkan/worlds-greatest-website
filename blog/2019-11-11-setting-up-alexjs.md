---
title: Setting up the alex.js language linter in your project
description: A practical how-to for linting polarizing language in your Markdown files.
date: 2019-11-11
author: Carolyn Stransky
authorLink: https://twitter.com/carolstran
tags:
  - posts
  - documentation
  - opensource
  - tools
  - tutorial
---

[alex.js](https://alexjs.com/) is an open-source language linter designed to catch polarizing writing in Markdown files and suggest helpful alternatives. Because its rules are rooted in [retext-equality](https://github.com/retextjs/retext-equality/blob/master/rules.md), alex is able to flag language that is ableist, condescending, gendered, homophobic, racist and anything else that's better left out of our documentation.

As a linter, alex can be used as a command-line tool, an IDE integration or configured directly into your project's workflow. For this tutorial, we'll focus on the latter: Your project's workflow.

⚠️ Prerequisites: 
- [npm](https://www.npmjs.com/get-npm) or [yarn](https://yarnpkg.com/lang/en/docs/install/#mac-stable) installed
- A project with a [`package.json` file](https://docs.npmjs.com/creating-a-package-json-file)

_Any line beginning with ❇️ is an example from the [Unmock documentation](https://github.com/unmock/unmock.github.io) setup._

## Table of Contents

- [Install alex as a dependency](#install-alex)
- [Create and configure `.alexrc.js`](#config)
- [Set up `.alexignore`](#ignore) (optional)
- [Add linting script to `package.json`](#lint-script)
- [Add linting script to your CI configuration](#lint-ci) (optional)
- [alex && Unmock](#alex-unmock)
- [Special thanks](#thanks)

<a name="install-alex"></a>
## Install alex as a dependency

Run one of these commands in your terminal, depending on if you're using npm or yarn:

```
npm install alex --save-dev
yarn add alex --dev
```

You should now be able to see alex as a dependency in your `package.json` file.

```
{
  "devDependencies": {
    "alex": "^8.0.0",
    ...
  }
}
```

<a name="config"></a>
## Create and configure `.alexrc.js`

To configure alex using JavaScript, create an `.alexrc.js` file in the root directory of your project:

```
touch .alexrc.js
```

In this file, you can specify three fields to configure how alex lints your project: `allow`, `noBinary` and `profanitySureness`.

### `allow`

With the `allow` field, you can identify an array of rules (the words flagged as errors) that you always want alex to ignore.

🔗 [Full list of rules used by alex](https://github.com/retextjs/retext-equality/blob/master/rules.md#list-of-rules)

```javascript
exports.allow = [
    "hostesses-hosts" // name of the rule you want to allow
];
```

❇️ While it's considered by alex as gendered language, `hostesses-hosts` is allowed for Unmock because the concept of specifying network hosts is frequently referenced in our docs.

### `noBinary`

The `noBinary` field is a boolean with the default set to `false`.

On the default setting, alex will flag the sentence `He must satisfy the function's preconditions` as an error because `He` is gendered language. But it sees gendered pairs, like `he or she` as OK. So the sentence `He or she must satisfy the function's preconditions` wouldn't be considered an error. 

Switching `noBinary` to `true` will also flag those pairs.

```javascript
exports.noBinary = true;
```

❇️ We changed `noBinary` to `true` in our configuration file for Unmock because we want to eliminate all uses of gendered language. 

### `profanitySureness`

Set with a number between 0-2, the `profanitySureness` field uses [cuss](https://github.com/words/cuss) to determine how likely a word or phrase is profanity.

```javascript
exports.profanitySureness = 1;
```

❇️ When linting the Unmock docs, we set `profanitySureness = 1` instead of the default `0` to catch the two highest levels. 

The way we see it...

unlikely - `0`: Contains words like `execute`, `failed`, `pros` or `slope`. These could be used as a profanity, but it's unlikely in the context of our technical documentation.

maybe - `1`: Much more explicit. While some words like `addicted`, `abuse` or `torture` could be used appropriately in documentation - we'd prefer to find alternatives.

likely - `2`: ... I can't write any of them here because I'll get in trouble. So they definitely don't belong in our docs.

🔗 [Full list of English words flagged by cuss](https://github.com/words/cuss/blob/master/index.json)

### Configuring alex without JavaScript

This configuration can also be done in a standard `rc` file or using YAML. 

🔗 [Configuration - alex documentation](https://github.com/get-alex/alex#configuration)

<a name="ignore"></a>
## Set up `.alexignore` (optional)

If you have specific files that you don't want alex to lint, you can create an `.alexignore` file in the root directory of your project: 

```
touch .alexignore
```

To prevent a file from being linted, identify the path in your newly created `.alexignore`:

```
# The Code of Conduct includes descriptions of harassment so it's not linted
docs/code-of-conduct.md
```

❇️ We recommend adding a comment above the specified path. In the `.alexignore` file for Unmock, for instance, we state why we ignore the Code of Conduct even though it includes many terms flagged by alex.

🔗 [Ignoring files - alex documentation](https://github.com/get-alex/alex#ignoring-files)

<a name="lint-script"></a>
## Add linting script to `package.json`

In the `"scripts"` section of your `package.json` file, add a linting script with the `alex` command.

```
{
  "scripts": {
    ...
    "lint-language": "cd ../ && alex",
  },
  "devDependencies": {
    "alex": "^8.0.0",
    ...
  }
}
```

❇️ Because we're already linting Unmock with [eslint](https://eslint.org/), we named the script `lint-language` to distinguish each process.

Depending on where your `package.json` is located relative to the files you need linted, your script will vary. 

For example, if the `package.json` for the [Unmock documentation](https://github.com/unmock/unmock.github.io) was located at the root and we only wanted to lint the files in the `docs/` directory, the script would look like...

```
"scripts": {
  ...
  "lint-language": "alex ./docs/",
}
```

🔗 [Workflow - alex documentation](https://github.com/get-alex/alex#workflow)

<a name="lint-ci"></a>
## Add linting script to your CI configuration (optional)

You can also add alex to your continuous integration workflow. 

### CircleCI

If you're using [CircleCI](https://circleci.com/), there are a few ways to accomplish this from your `.circleci/config.yml` file. The following are two examples.

As its own job (example from [React Native](https://github.com/rickhanlonii/react-native-website/blob/1cda08e2df0a26de2b925aae747aa239aa4bcacd/.circleci/config.yml#L70-L80)). That way, the language linting will be reported separately on PRs.

```yaml
jobs:
  ...
  # --------------------------------------------------
  # JOB: lint
  # Lint the docs.
  # --------------------------------------------------
  language_lint:
    executor: node8
    working_directory: ~/react-native-website/website
    steps:
      - restore_cache_checkout
      - run_yarn
      - run: yarn lint

```

As a step in your test sequence (example from [Unmock](https://github.com/unmock/unmock.github.io/blob/source/.circleci/config.yml#L39-L51)). The benefit being that it will execute faster than in its own job.   

```yaml
jobs:
  tests:
    <<: *defaults
    steps:
      - checkout: *root-checkout
      ...
      - run:
          name: "Run language linter"
          command: "yarn lint-language"
```

### Other CI tools

You can also configure alex to work with Travis or other CI tools.

🔗 [Workflow - alex documentation](https://github.com/get-alex/alex#workflow)

<a name="alex-unmock"></a>
## alex && Unmock

Thanks to Abdelrahman Ashraf (@theashraf), we now have [alex linting our entire documentation website](https://github.com/unmock/unmock.github.io/pull/41) and [all of the pre-existing issues fixed](https://github.com/unmock/unmock.github.io/pull/44) for Unmock. 

Next move: Follow these steps to set up alex in all of our open source repos 🚀

<a name="thanks"></a>
## Special thanks

This tutorial was inspired by a tweet from [Rick Hanlon](https://twitter.com/rickhanlonii/status/1183790093770940416) who recently [integrated alex with the React Native documentation](https://github.com/facebook/react-native-website/pull/1337). He also reviewed this article before I hit publish! Thanks Ricky ✨