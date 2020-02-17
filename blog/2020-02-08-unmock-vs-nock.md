---
title: unmock vs nock - comparing two JS mocking frameworks
date: 2020-02-08
author: Mike Solomon
authorLink: https://dev.to/mikesol
tags:
  - posts
  - javascript
  - typescript
  - testing
---

When we built `unmock`, we took a lot of inspiration from `nock`, and we often get asked what the difference is between the two libraries.  Here's a brief explanation with some examples.

# Why mock?

Mocking is used mostly in tests when the code you want to test relies on a REST API call, like a call to a third-party service or an internal microservice. A **mock** is a stand-in for software, like a service or database or library, that captures a small portion of the original's functionality while being simpler to maintain and access than its real counterpart. When testing code involving a REET API, it's usually a good idea to mock the API in order to avoid making a network call from your tests.  There are four main advantages of mocking instead of making a network call.

- If the network is down, your tests can still run.
- Network calls are slow.
- In general, you don't want to access production data or shared resources, like staging environments, during tests.
- Writing mocks allow you to specify corner cases you'd like to test.

Both [`unmock`](https://github.com/Meeshkan/unmock) and [`nock`](https://github.com/nock/nock) allow you to override REST endpoints with mocks.

# Installation

You can install both `unomck` and `nock` using NPM or yarn.

```bash
$ npm install --save-dev unmock nock // or yarn add -D unmock nock
```

If you are a typescript user, you will need to install the `nock` types separately.

```bash
$ npm install --save-dev @types/nock // or yarn add -D @types/nock
```

`unmock` is written in typescript, so no additional installation is needed.

# Fixed mocks

Here's how you mock an endpoint with fixed data in both `unmock` and `nock`. By "fixed data", I mean data that is entirely deterministic and doesn't change from test to test.  The two examples below use `jest`.

## With unmock

```javascript
// my.test.js
const unmock = require('unmock');
const axios = require('axios');
unmock
  .nock('https://myservice.io')
  .get('/users')
  .reply(200, [{ name: "Ruth", age: 43 }, {name: "Avishai", age: 3 },
               { name: "Yaron", age: 37 }, {name: "Shimrit", age: 82 },
               { name: "Maya", age: 17 ]);

beforeAll(() => unmock.on());

const fetchUsersAndFlagMinors = async () => {
  const { data }= await axios('https://myservice.io/users');
  return data.map(user => { ...user, minor: user.age < 18 });
};

test("Minors are correctly identified in users array", async () => {
  const res = await fetchUsersAndFlagMinors();
  expect(res[0].minor).toBe(false);
  expect(res[1].minor).toBe(true);
  expect(res[2].minor).toBe(false);
  expect(res[3].minor).toBe(false);
  expect(res[4].minor).toBe(true);
});
```

## With nock

```javascript
// my.test.js
const nock = require('nock');
const axios = require('axios');
nock('https://myservice.io')
  .get('/users')
  .reply(200, [{ name: "Ruth", age: 43 }, {name: "Avishai", age: 3 },
               { name: "Yaron", age: 37 }, {name: "Shimrit", age: 82 },
               { name: "Maya", age: 17 ]);

const fetchUsersAndFlagMinors = async () => {
  const { data } = await axios('https://myservice.io/users');
  return data.map(user => { ...user, minor: user.age < 18 });
};

test("Minors are correctly identified in users array", async () => {
  const res = await fetchUsersAndFlagMinors();
  expect(res[0].minor).toBe(false);
  expect(res[1].minor).toBe(true);
  expect(res[2].minor).toBe(false);
  expect(res[3].minor).toBe(false);
  expect(res[4].minor).toBe(true);
});
```

## Comparison and remarks

`unmock` and `nock` have almost no differences when using fixed mocks.

Truth be told, I'm not a fan of fixed mocks. In my opinion, the issue with using them is that they hardcode assumptions about mock data in the test.  For example, the test above knows that the mock data contains five elements and that the order of minors will be `[false, true, false, false, true]`.  Does that mean we expect that the function will always return five elements?  That the order of minors will always be the one above?  We have no way to know the answers to these questions from looking at the tests alone, and its easy for newcomers to confuse characteristics of a mock with expectations about how the function will behave (ie thinking "Oh, this function always returns five users.", etc).

One solution to this problem is to use **dynamic mocks**.

# Dynamic mocks

Let's rewrite the example above in `unmock` to use dynamic mocks.  Dynamic mocking is not possible in `nock`.

```javascript
// my.test.js
const unmock = require('unmock');
const { u } = unmock;
const axios = require('axios');
unmock
  .nock('https://myservice.io')
  .get('/users')
  .reply(200, u.array({ name: u.string(), age: u.integer() });

beforeAll(() => unmock.on());

const fetchUsersAndFlagMinors = async () => {
  const { data }= await axios('https://myservice.io/users');
  return data.map(user => { ...user, minor: user.age < 18 });
};

test("Minors are correctly identified in users array", async () => {
  const res = await fetchUsersAndFlagMinors();
  res.forEach(user => expect(user.minor).toBe(user.age < 18));
});
```

Not only is the test shorter - it conveys our intent with greater clarity.  We expect that, for every user in the list, they will be flagged as minor if their age is less than 18.  Furthermore, we expect our API to return an array of user objects with a `string` name and `integer` age.  For more on the `u.` sytanx in `unmock`, check out the [documentation](https://www.unmock.io/docs/unmock#poet).

## Remarks

While dynamic mocks are useful, they are limited to a single test case.  What if the code has a bug when there are zero users?  100 users?  Users in various orders of age?  Dynamic mocks take us half way there - to cross the bridge fully, we need **fuzz testing**.

# Fuzzing

`unmock` is most powerful when used with the `runner`.  Let's use the same test above, adding the `runner` right after the string defining the test.

```javascript
// my.test.js
const unmock = require('unmock');
const { u, runner } = unmock;
const axios = require('axios');
unmock
  .nock('https://myservice.io')
  .get('/users')
  .reply(200, u.array({ name: u.string(), age: u.integer() });

beforeAll(() => unmock.on());
unmock.randomize.on();

const fetchUsersAndFlagMinors = async () => {
  const { data }= await axios('https://myservice.io/users');
  return data.map(user => { ...user, minor: user.age < 18 });
};

test("Minors are correctly identified in users array", runner(async () => {
  const res = await fetchUsersAndFlagMinors();
  res.forEach(user => expect(user.minor).toBe(user.age < 18));
}));
```

The only change in the code above from the previous example is that we have added the runner in the test definition. This runs the test twenty times by default, although the number of times is tweakable.  The advantage of this approach is that the runner will throw lots of different permutations of data at your function (empty array, large array, different orders of elements), which is a great way to expose bugs.  It's also a more realistic way to test APIs - as you never know what an API will return, testing with a runner is a good way to increase confidence that your code will handle a wide range of outcomes.

You can check out the `runner` [documentation](https://www.unmock.io/docs/fuzz) for more information.  We are currently actively developing the runner to better explore common corner cases and to support more test frameworks, like `mocha`, `tap` and `ava`.

# Conclusion

`unmock` and `nock` are both frameworks for mocking REST APIs in JavaScript.  They have similar APIs and are both useful for mocking with static mocks.  If you would like to use dynamic mocks and a runner, `unmock` may be a good fit.  In addition to these features, `unmock` contains [spies](https://www.unmock.io/docs/expectations#spying) that provide information about data coming into and going out of the REST APIs you consume.  It also has a [functional API](https://www.unmock.io/docs/setting-state) for tweaking responses in case you need to narrow the range of possible outcomes produced by the runner.

We hope you enjoy checking out `unmock` and `nock` and one or both of them useful in your next JS or TS project that makes REST API calls!