---
title: How to mock API calls in React Native 
description: Learn to use unmock and react-native-testing-library.
date: 2019-10-23
author: Kimmo Sääskilahti
authorLink: https://dev.to/ksaaskil
tags:
  - posts
  - javascript
  - reactnative
  - testing
---

Testing networking logic in React Native apps can be hard. You don't want to use the production API to run tests, so you need to mock network calls. Mocking also lets you test both the happy case where API works as expected as well as the case where the API fails.

There are different ways to mock network calls. You could use dependency injection to inject "fetching service" into the components. In tests, you would replace the real service with a mock. Or you could use [Context](https://reactjs.org/docs/context.html) to wrap components in a "fetching service" context. Both of these solutions can work, but there should be a simpler way.

In this post, we are going to build a basic React Native application tested in end-to-end fashion. We use [Unmock](https://www.unmock.io) to serve mock data to the app. Unmock is an HTTP testing library using [node-mitm](https://github.com/moll/node-mitm) behind the scenes to intercept HTTP traffic. At interception, it generates random data mocking the API.

We'll run our tests in Node.js with [Jest](https://jestjs.io). We use [React Native Testing Library](https://github.com/callstack/react-native-testing-library) to render the component and trigger React hooks. You can find the repository for this project [here](https://github.com/unmock/unmock-react-native-example). Repository also includes instructions for running the app.

## Tour of the sample application

The sample application shows a random cat fact fetched from the [Cat Facts API](https://alexwohlbruck.github.io/cat-facts/). User can refresh the fact by pressing the button. The app in all its glory looks like this, running here in Android virtual device:

![Screenshot of the sample application](https://thepracticaldev.s3.amazonaws.com/i/7p5tawbc8at2u16d8l0v.png)

Code for the app contains a single component defined in [App.tsx](https://github.com/unmock/unmock-react-native-example/blob/master/src/App.tsx). At high-level, we define the `App` component like this:

```ts
const App = () => {
  /* React hooks */
  const [shownFact, setFact] = useState('');
  const [err, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  /* Refresh cat fact, see below */
  const refreshFact = async () => {
    /* */
  };

  /* Initial data fetching */
  useEffect(() => {
    refreshFact();
  }, []);

  return (
    /* JSX, see below */
  );
};
```

We use `useState` from React hooks for managing the state of `shownFact`, `err`, and `loading`. These variables contain the cat fact displayed to the user, possible fetch error, and the loading state.

The `refreshFact` function refreshes the cat fact shown to the user:

```ts
const refreshFact = async () => {
  try {
    setLoading(true);
    const fact = await fetchFact();
    setFact(fact);
    setError(null);
  } catch (err) {
    setError(err);
  } finally {
    setLoading(false);
  }
};
```

This function sets the component state and uses `fetchFact` function for the network call. The `fetchFact` function uses [Fetch API](https://facebook.github.io/react-native/docs/network) provided by React Native:

```ts
const CAT_FACT_URL =
  'https://cat-fact.herokuapp.com/facts/random?animal_type=cat&amount=1';

const fetchFact = async () => {
  const fetchResult = await fetch(CAT_FACT_URL);
  if (!fetchResult.ok) {
    throw Error(`Failed fetching cat fact with code: ${fetchResult.status}`);
  }
  const body = await fetchResult.json();
  const fact = body.text;
  return fact;
};
```

We parse the body by first parsing a JSON and extract the cat fact from the `text` property as documented [here](https://alexwohlbruck.github.io/cat-facts/docs/endpoints/facts.html).

Application component renders content based on the values of `loading` and `err`:

```jsx
{
  loading ? (
    <Text style={styles.loading} testID="loading">
      Loading...
    </Text>
  ) : err ? (
    <Text style={{...styles.fact, ...styles.error}} testID="error">
      Something went horribly wrong, please try again!
    </Text>
  ) : (
    <Text style={styles.fact} testID="fact">
      {shownFact}
    </Text>
  );
}
```

If the state of `loading` is `true`, we show the text "Loading...". If the state of `err` contains an error, user will see an apology. Otherwise, app shows the cat fact.

Note that we also give the components [testID](https://facebook.github.io/react-native/docs/view#testid) properties to simplify testing.

## Writing tests

### Prerequisites

File [App.test.tsx](https://github.com/unmock/unmock-react-native-example/blob/master/__tests__/App.test.tsx) contains the tests. The first step in the tests is to fill in `fetch` (not available in Node.js) with [node-fetch](https://www.npmjs.com/package/node-fetch):

```ts
// @ts-ignore
global.fetch = require('node-fetch');
```

In the `beforeAll` block, we switch on Unmock with `unmock.on()`. Then we add rules for intercepting all outgoing traffic for the Cat Facts API URL:

```ts
beforeAll(() => {
  unmock.on();
  unmock
    .nock('https://cat-fact.herokuapp.com', 'catFactApi')
    .get('/facts/random?animal_type=cat&amount=1')
    .reply(200, {text: u.string('lorem.sentence')})
    .reply(500, 'Internal server error');
});
```

In `unmock.nock` call, we also a give the name `catFactApi` for the created fake service. Later in tests, we use the `catFactApi` name to change the behaviour of the service.

In the behaviour for status code 200, we specify that the API should return a JSON body with `text` property. The syntax `u.string('lorem.sentence')` means that the value should be a fake sentence. See [faker.js](https://github.com/marak/Faker.js/) for other kinds of fake values you can use. Notice how we don't need to hardcode "foo" or "bar" in our tests!

Before each test, we reset the state of `unmock` so that the tests remain decoupled:

```ts
beforeEach(() => {
  unmock.reset();
});
```

### Test for success

The first test ensures that when the API returns a cat fact, the app contains the correct element:

```ts
it('renders the fact block when API succeeds', async () => {
  const api = unmock.services['catFactApi'];
  api.state(transform.withCodes(200));
  const renderApi: RenderAPI = render(<App />);

  await waitForElement(() => {
    return renderApi.getByTestId('fact');
  });
});
```

Here we first set the API to always return 200, simulating success. We then use `render` from `library` to render the component and run all hooks. We use `waitForElement` to wait for the element with `testID="fact"` to show up.

Second test for success ensures that when user clicks the button, the app fetches a new fact from the API. We simulate button press with the `fireEvent` from `react-native-testing-library`:

```ts
it('renders new fact after clicking the button', async () => {
  const api = unmock.services['catFactApi'];
  api.state(transform.withCodes(200));

  const renderApi: RenderAPI = render(<App />);

  fireEvent.press(renderApi.getByText('Get me a new one'));

  await waitForElement(() => {
    const secondCall = api.spy.secondCall;
    const secondFact = secondCall.returnValue.bodyAsJson;
    return renderApi.getByText(secondFact.text);
  });
});
```

Here we again use `waitForElement` like above. This time we wait for an element containing the same text as the random fact returned from the API. Because the API returns a random sentence, we need to find its value. Unmock services keep track of mocked calls in the `spy` property. This property is a [SinonJS spy](https://sinonjs.org/releases/latest/spies/). The spy exposes its second call via the `secondCall` property. The return value of that call is in `returnValue`. See the [chapter on expectations](https://www.unmock.io/docs/expectations) in Unmock documentation for more information.

### Test for failure

Test for failure proceeds as the test for success. we change the API to return status code 500, render the app, and wait for the element with `testID="error"` to show up.

```ts
it('renders error when the API fails', async () => {
  const api = unmock.services['catFactApi'];
  api.state(transform.withCodes(500));

  const renderApi: RenderAPI = render(<App />);

  await waitForElement(() => {
    return renderApi.getByTestId('error');
  });
});
```

## Conclusion

That's it! Using Unmock, Jest and React Native Testing Library, we wrote comprehensive integration tests for our component. The tests made sure that the app triggers data fetching via React hooks. We also ensured that the app displays the returned cat fact without hardcoding "foo" or "bar". We also tested the case when the API call fails. We did not need to inject extra dependencies into our component or use contexts to mock the API.

Note that `unmock` currently only supports Node.js environment. If you would like to see Unmock populate your React Native app with fake data, create an issue in [unmock-js](https://github.com/unmock/unmock-js) repository.

Thanks a lot for reading, as always we appreciate any feedback and comments!