---
title: How to remove condescending language from documentation 
description: A Hacktoberfest adventure in creating more inclusive open-source documentation.
date: 2019-11-22
author: Carolyn Stransky
authorLink: https://twitter.com/carolstran
tags:
  - documentation
  - opensource
  - tutorial
  - hacktoberfest
---

Inspired by [a tweet from Anjana Vakil](https://twitter.com/AnjanaVakil/status/1177959439447576576?s=20), I set a goal for Hacktoberfest 2019 to remove words like `simple`, `easy` or any other variation from open-source documentation.

Over the next month, I submitted over a dozen pull requests to projects like [Jest](https://github.com/facebook/jest/pull/9040), [Cypress](https://github.com/cypress-io/cypress-documentation/pull/2143), [Storybook](https://github.com/storybookjs/storybook/pull/8404) and even some of our own repositories at Meeshkan (🙈). This initiative also inspired pull requests to [webpack](https://github.com/webpack/webpack.js.org/pull/3320), [Tailwind CSS](https://github.com/tailwindcss/docs/pull/301) and [React Native](https://github.com/facebook/react-native-website/pull/1337). The React Native team even took it a step further and [linted all 56 versions of their documentation in 6 days](https://github.com/facebook/react-native-website/issues/1338) with help from 30 outside contributors.

Throughout this process, I learned a _lot_ about the value of creating more inclusive docs and the practicalities of making it happen. So I've compiled these learnings into a guide!

## Table of Contents

- [Why focus on condescending language?](#why)
- [What is condescending language?](#what)
- [As promised, a guide!](#guide)
- [Finally, a thank you 🎉](#thank-you)

<a name="why"></a>
## Why focus on condescending language?

Rick Hanlon from the React Native team summed this up well [in a recent tweet](https://twitter.com/rickhanlonii/status/1183815123334512640?s=20):

> When we say things are "easy" or "simple" then it makes people feel inadequate or otherwise hurt if they don't immediately understand it.

Language is subjective - a simple concept for one person isn't always simple for another. By banning condescending terms from our documentation, we're taking a proactive step towards making our material more inclusive.

If you're interested or want more information on this topic, I'd highly recommend watching [Jim Fisher's Don't Say Simply talk](https://www.youtube.com/watch?v=gsT2BBWBVmM) from Write the Docs Prague 2018.

<a name="what"></a>
## What is condescending language?

Some examples of language considered condescending includes...

```
simply
easy
basically
clearly
everyone knows
just
obviously
of course
```

If you're interested in why these words are considered condescending, `retext-equality` (a plugin that checks for insensitive language) has a [full list with explanatory notes](https://github.com/retextjs/retext-equality/blob/master/data/en/condescending.yml).

<a name="guide"></a>
## As promised, a guide!

⚠️ Prerequisites:
- [Download and install Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- An open-source project whose documentation you want to make more inclusive

✅ Steps:
1. [Open an issue describing your mission](#open-issues)
2. [Use the alex.js linter to flag condescending terms](#use-alex)
3. [Remove or replace instances of condescending language](#remove-or-replace)
4. [Create a pull request with your proposed changes](#create-pr)

<a name="open-issues"></a>
### 1. Open an issue describing your mission

If you aren't a regular contributor to the project, I'd suggest opening an issue before starting any work. If you're new to open source, GitHub has step-by-step documentation on [creating an issue](https://help.github.com/en/github/managing-your-work-on-github/creating-an-issue).

This step isn't always necessary, but it does give you the opportunity to describe the value a change like this will bring and see if the maintainers are open to this type of change (not all of them are). 

On the other hand, this allows maintainers to suggest a preferred format for the changes - for example, submitting one pull request for every section instead of all at once - and let you know if they have any existing language linters you can work with or modify.

Reference: [An issue I opened on the Cucumber Documentation](https://github.com/cucumber/docs.cucumber.io/issues/389).

<a name="use-alex"></a>
### 2. Use the alex.js linter to flag condescending terms 

You've gotten the OK from the maintainers. You've forked and cloned the repository. Now, you need to identify condescending terms to potentially remove.

You could manually search for terms within the documentation... but that can be tedious. Plus then you're more likely to miss variations (for example, `easily` instead of `easy`) or words you weren't aware were offensive. So to help, I'd suggest using [alex.js](https://alexjs.com/). 

alex.js is an open-source language linter designed to catch polarizing writing in Markdown files and suggest helpful alternatives. Because its rules are rooted in [`retext-equality`](https://github.com/retextjs/retext-equality/blob/master/rules.md), alex is able to flag the condescending language we're looking to remove as well as language that is ableist, gendered, homophobic, racist and anything else that's better left out of our documentation.

To use alex for linting open source docs, there are two approaches you could take:

#### Run `npx alex` within the repo directories

Using [`npx`](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) allows you to run the linter without installing alex as a dependency to the project. I'd suggest this as a first step because, speaking from experience, asking maintainers to add an additional dependency will take much more convincing than changing the wording in their docs.

To run alex locally, use your terminal to move into the directories containing the Markdown files you want to lint. In many projects, this folder will be called `docs/`. Once you're there, run the following command:

```
npx alex
```

You can also lint specific files by adding the file name to the end of the command. In this example, we're checking our project's `README.md` file:

```
npx alex README.md
```

#### Install alex as a dependency within the project

As mentioned, this one might take more convincing upfront - but if a project is dedicated to keeping this type of language out of their documentation, then this a proactive step they can take.

To set up alex in a project's workflow, you can follow this [step-by-step tutorial](https://dev.to/unmock/setting-up-the-alex-js-language-linter-in-your-project-3bpl). Because this requires additional configuration, a maintainer may ask you to tackle this in a separate pull request.

<a name="remove-or-replace"></a>
### 3. Remove or replace instances of condescending language

As tempting as it is, you don't want to remove every instance that is flagged by alex or your own search. Because, sometimes, these terms can be present out of necessity or as an attempt to be more welcoming.

Before changing anything, take a look at each instance and ask the following...

#### Is it actually condescending or offensive?

For instance, words like `simple` can be used to describe a specific type of network protocol or alex will flag terms like `host` which could refer to network hosts. So you want to be sure that you aren't removing or altering terms that are essential for comprehension.

#### Is it necessary?

In many cases, these condescending terms are adverbs that can be removed without any replacement. I've found that this is especially true for the words `just` and `of course`.

#### If it's necessary, what is it trying to say?

With documentation, it's rare for terms like `easy` to be intentionally condescending. Often times, writers use them to show that something isn't as intimidating as it sounds. If this is the case, think about _what_ the docs are trying to communicate and replace the condescending language with word choices that better represent the intention.

If you're struggling to find alternatives, [Jim Fisher has some suggestions](https://youtu.be/1vvjiJFsT-Y?t=1324):

* **Be specific**: Maybe it's easy because it's quick to set up, doesn't require much typing or has few moving parts.
* **Be comparative**: Something is smaller than something else. Compared to another product, your product requires less custom configuration.
* **Be absolute**: It takes 5 lines of code to integrate this library. There are two form fields required.
* **Show, don't tell**: Instead of using time as an indicator for how easy something is, create a video.

<a name="create-pr"></a>
### 4. Create a pull request with your proposed changes

Now that the work is done, you can propose your changes with a pull request. If you're new to open source, GitHub has step-by-step documentation on [creating a pull request](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request).

Be sure to follow the project's contributing guidelines and reference your original issue (if you opened one). Even if you're referencing an issue, it helps to include: 

* A summary of what you're trying to accomplish with this pull request
* Any agreements that were decided in the issue
* Examples of the terms you removed or replaced 

This way, if another maintainer reviews your changes, they can gain context without having to read the entire issue and discussion.

Reference: [A pull request I created for Prisma.](https://github.com/prisma/prisma2/pull/727)

<a name="thank-you"></a>
## Finally, a thank you 🎉

Thanks for taking the time to read this guide and taking steps towards more inclusive open-source documentation! We need more wonderful, caring people like you. This effort also requires awareness. So I'd encourage you to share your journey with your colleagues, friends, Twitter followers - whoever will listen.
