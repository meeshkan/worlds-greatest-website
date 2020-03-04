---
title:  Mocking the internet in a CircleCI pipeline 
description: How to test code with network calls in CircleCI.
author: Mike Solomon
authorLink: https://dev.to/mikesol
date: 2019-12-06
tags:
  - unmock
  - circleci
  - integrationtest
  - mocking
---

In your CI/CD pipeline, your code is protected like a caterpillar in a cocoon. Nasty hardware failure? No problem, a new image will spin up. Cluster-crashing bug? You're safe — the pipeline is isolated from your production environment. Code not production ready? Not to fear, the build will fail and you can try again.

But there is one place where your CI/CD pipeline will have to deal with the unpredictable, finnicky and generally hostile real world: **THE INTERNET**. This sprawling behemoth has outgrown the confines of its modest roots, when the entire thing could fit in a phone book, and now hosts the likes of Netflix, Twitter, and hundreds of millions of other services making billions of transactions a day.

None of this would be an issue if your code never interacted with the Internet, but as microservice patterns become more common and companies rely more and more on third-party services, the chances that the code in your CI/CD pipeline will make a network call under certain circumstances are higher than ever. This runs contrary to the idea that a CI/CD pipeline should be hermetically self contained, but unfortunately, a reasonable facsimile of the Internet is lacking from CircleCI and every other major build platform for good reason — faking the internet is HARD.

Enter [unmock](https://www.github.com/unmock/unmock-js), an open source project on a mission to build a high-quality mock of the entire internet. The whole darn thing. You can put the mock wherever you want, but for the purposes of this article, we'd recommend putting it in your CircleCI pipeline as a stand-in for network calls. Here's how!

# Option 1 — in-code mock

If you are a newbie to CI/CD and for small projects or small tests, we recommend using the in-code version of unmock. The in-code version, as the name suggests, activates and configures unmock right in your test files as you write your tests. There is no need to maintain a separate repository, and all of your mocking decisions are present directly in your code.

In this section, we will focus on in-code mocks using [unmock-js](https://www.github.com/unmock/unmock-js) + [CircleCI](https://www.circleci.com) for two reasons.

- JS/TS is popular.
- The other in-code versions of unmock aren't ready yet (did we mention that we're a [small team](https://www.github.com/unmock) and that pull requests are welcome?).

To use unmock in-code, you write an unmock spec for the network calls you are making and then use the runner to run the test multiple times. Here is the anatomy of a typical unmock test.

```js
// hello.test.js
const {
  default: unmock,
  transform,
  runner,
  u
} = require("unmock");
const { withCodes } = transform; 
const axios = require("axios");

function fetchDataFromService() {
  return axios.get("https://api.unmock.io").then(res => res.data);
}

unmock
  .nock("https://api.unmock.io", "hello")
  .get("/")
  .reply(200, {
    id: u.number({ minimum: 0 }),
    username: u.opt(u.string())
  })
  .reply(400, "Not Authorized");

describe("hello endpoint", () => {
  let helloService;

  beforeAll(() => {
    helloService = unmock.on().services.hello;
  });

  afterAll(() => {
    unmock.off();
  });

  beforeEach(() => {
    helloService.reset();
  });

  test("should return valid JSON", runner(async () => {
    helloService.state.transform(withCodes(200));
    const responseBody = await fetchDataFromService();
    expect(responseBody.id).toBeDefined();
    expect(typeof responseBody.hello === "number").toBe(true);
  }));
});
```

You can see several other examples like this in the [unmock examples](https://github.com/unmock/unmock-examples) and [unmock koans](https://github.com/unmock/unmock-ts-koans).

The important bits are as follows:

- The syntax `unmock.nock` is used to define the behavior of various endpoints. In this case, we define a single endpoint that can return an error or success and, in the case of success, returns a numeric ID greater than 0 and, optionally, a user name.
- In the test itself, we wrap the test function with the runner to run it multiple times. The unmock `runner` is highly optimized and adds an overhead of only milliseconds per test.
- The unmock reporter (`npm install --save-dev unmock-jest`) will show all of the different API responses the runner tests and how your code reacts. If everything behaves as expected, the test passes and the reporter is entirely green. Failed tests show up in red.

This last bit is where CircleCI comes in. By using the [unmock orb](https://circleci.com/orbs/registry/orb/unmock/unmock), your test reports are automatically saved as artifacts on CircleCI and a link to them is published to your pull request on GitHub. This is how you use the orb:

```yaml
# Javascript Node CircleCI 2.0 configuration file
#
# Check https://circleci.com/docs/2.0/language-javascript/ for more details
#
version: 2.1
orbs:
  unmock: unmock/unmock@volatile

defaults: &defaults
  working_directory: ~/repo
  docker:
    - image: circleci/node:8.12.0

jobs:
  build:
    <<: *defaults
    steps:
      - checkout
      - run: yarn
      - run: yarn build
      - run: yarn test
      - unmock/upload
      - persist_to_workspace:
          root: ~/repo
          paths: .

workflows:
  version: 2
  test-and-build:
    jobs:
      - build
```

We also have a full-fledged example of the orb on GitHub. Happy forking!

So, to summarize, use the in-code mock when you want a quick and effective way to author resilient tests. To learn more about the various features of unmock, you can [check out the docs](https://www.unmock.io/docs/introduction).

# Option 2 — Unmock server

Unmock server is a great fit for people that are a bit more comfortable with DevOps and for teams coding against an API in several projects. In `unmock-server`, the definition of the external service is made in a separate repo to the repo under test and is pulled into your CI/CD pipeline as a MITM proxy that intercepts network calls and serves back unmocked goodness. Another advantage of this approach compared to the in-code approach is that it frees you from including unmock as a development dependency in your projects, which means that when unmock is no longer the flavor of the week, you can migrate away from us to whatever the next cool thing is.

The recommended way to include the unmock server in your CircleCI pipeline is by using the `unmock-orb`.

```yaml
version: 2.1
orbs:
  unmock: unmock/unmock@volatile
jobs:
  build:
    working_directory: ~/repo
    docker:
      - image: 'circleci/golang:1.12'
    steps:
      - checkout
      - run: go mod download
      - unmock/start
      - unmock/set:
          code: 200
      - run:
          command: go test
          environment:
            GITHUB_TOKEN: fake-token
            NO_PROXY: gopkg.in
      - unmock/stop
workflows:
  version: 2
  test-and-build:
    jobs:
      - build
```

In the example below, our project is written in [go-lang](https://github.com/unmock/golang-example), and unmock server is started and stopped before our tests run. We can also pass `unmock-server` configuration options, ie the `code 200` set with `unmock/set`. A full example on how to integrate unmock server with a CircleCI project is available on GitHub for your forking pleasure.

# Unmock and CircleCI for the win!

Whether you use Option 1 or Option 2, both will help you test those corners of your code that deal with network calls and all their unpredictability. [Yoni Goldberg](http://github.com/goldbergyoni), one of our favorite testing gurus, recently conducted a poll that revealed that unpredictable results from networking as well as logical bugs in code that dealt with these results are among the major sources of headaches in modern programming. There are two solutions - Advil and unmock, and only one of them is free. We hope to see you using the unmock orb on CircleCI, and if you have any questions, reach out on our [gitter](https://gitter.im/unmock/community). While we always mock the internet, we will never mock you, and you are more than welcome!
