---
title: Building a real-time HTTP traffic stream with Apache Kafka
description: A practical how-to guide and example application for building automated OpenAPI specifications.
author: Kimmo Sääskilahti
authorLink: https://dev.to/ksaaskil
tags: 
  - tutorial
  - kafka
  - node
  - api
---

There are many reasons to record and analyze the traffic flowing in and out of your APIs. This data enables you to build audit logs or send alerts of anomalous activities, such as denial-of-service (DoS) attacks. More generally, you can also monitor the health and usage of your API and deeply understand customer behavior.

This article focuses on building a real-time pipeline for streaming HTTP traffic to [Apache Kafka](https://kafka.apache.org/). By the end, we'll have built an example server application with Node.js, started Apache Kafka locally, and recorded data to Kafka from our server.

Kafka (short for Apache Kafka) is a high-performance distributed streaming platform. It's often used to centralize log management and to decouple data sources from data sinks. Kafka is a good choice for streaming data because it can ingest data from various sources at huge volumes. It's also tailor-made for real-time use cases, such as sending alerts of DoS attacks. Kafka also has [various connectors](https://docs.confluent.io/current/connect/managing/connectors.html) for sending data to other services for further analysis. For example: Amazon S3, Azure Blob Storage, ElasticSearch, or HDFS.

⚠️ Prerequisites:
- [Node.js](https://nodejs.org/en/) >= 8.0 and optionally [yarn](https://classic.yarnpkg.com/en/docs/install/)
- Either [Docker](https://docs.docker.com/) or [Kafka](https://kafka.apache.org/quickstart#quickstart_download)
- [Python](https://www.python.org/) 3.6.0+ 
- [pip](https://pip.pypa.io/en/stable/installing/)

✅ Steps:
1. [Creating a Node.js server](#creating-a-nodejs-server)
1. [Preparing Kafka](#preparing-kafka)
1. [Creating an OpenAPI specification from recordings](#creating-an-openapi-specification-from-recordings)
1. [Conclusion](#conclusion)

All of the code and instructions for this tutorial can be found in the [`meeshkan-express-kafka-demo` GitHub repository](https://github.com/Meeshkan/meeshkan-express-kafka-demo).

## Creating a Node.js server

We'll create a RESTful server with [Express](https://expressjs.com/) and record traffic logs in the [HTTP Types](https://meeshkan.github.io/http-types/) format. HTTP Types is a human-readable JSON format for HTTP exchanges, with an example exchange looking as follows:

```json
{
  "request": {
    "method": "get",
    "protocol": "http",
    "host": "example.com",
    "headers": {
      "accept": "*/*",
      "user-agent": "Mozilla/5.0 (pc-x86_64-linux-gnu) Siege/3.0.8"
    },
    "pathname": "/user/repos",
    "query": { "param": "value" },
    "timestamp": "2018-11-13T20:20:39+01:00"
  },
  "response": {
    "statusCode": 200,
    "body": "Hello as response!",
    "headers": {
      "content-length": "1999",
      "content-type": "text/html; charset=utf-8"
    },
    "timestamp": "2018-11-13T20:20:39+02:00"
  }
}
```

To log HTTP traffic from Express to Kafka, we'll need:
1. Middleware converting Express requests and responses to HTTP Types objects. The [@meeshkanml/express-middleware](https://github.com/Meeshkan/express-middleware) package handles this.
1. A transport sending the HTTP Types objects to Kafka. This is provided by [http-types-kafka](https://github.com/meeshkan/http-types-kafka-node). 

We'll see how to put these together below.

Our server is defined in [src/index.ts](https://github.com/meeshkan/meeshkan-express-kafka-demo/blob/master/src/index.ts). The entry point to the program is the `main()` function defined as follows:

```ts
const KAFKA_TOPIC = "http_recordings";
const KAFKA_CONFIG: KafkaConfig = {
  brokers: ["localhost:9092"],
};

const main = async () => {
  const httpTypesKafkaProducer = HttpTypesKafkaProducer.create({
    kafkaConfig: KAFKA_CONFIG,
    topic: KAFKA_TOPIC,
  });

  const kafkaExchangeTransport = async (exchange: HttpExchange) => {
    debugLog("Sending an exchange to Kafka");
    await httpTypesKafkaProducer.send(exchange);
  };

  const app = buildApp(kafkaExchangeTransport);

  // Prepare
  await kafkaTransport.connect();

  app.listen(PORT, "localhost", () => {
    console.log(`Listening at port ${PORT}`);
  });
  app.on("close", () => console.log("Closing express"));
};

main();
```

Here, we're first creating a Kafka producer by defining the Kafka topic to write to and the list of brokers (consisting only of `localhost:9092`). `http-types-kafka` is a wrapper around [kafkajs](https://github.com/tulios/kafkajs) and `KafkaConfig` is defined in `kafkajs`. `kafkaExchangeTransport` is a function taking a `HttpExchange` object and returning a promise.

 In our case, this promise is defined as:

```ts
const kafkaExchangeTransport = async (exchange: HttpExchange) => {
  debugLog("Sending an exchange to Kafka");
  await httpTypesKafkaProducer.send(exchange);
};
```

The Express `app` is defined in the `buildApp` function. This function is also in the `src/index.ts` and looks like:

```ts
import httpTypesExpressMiddleware from "@meeshkanml/express-middleware";

const buildApp = (
  exchangeTransport: (exchange: HttpExchange) => Promise<void>
) => {
  const app = express();

  app.use(express.json());

  const kafkaExchangeMiddleware = httpTypesExpressMiddleware({
    transports: [exchangeTransport],
  });

  app.use(kafkaExchangeMiddleware);

  const userStore = new UserStore();

  app.use("/users", usersRouter(userStore));

  return app;
};
```

Here, we're using `express.json()` middleware to parse request bodies as JSON. Express middleware for logging API traffic is created with the `httpTypesExpressMiddleware` imported from the `@meeshkanml/express-middleware` package. The object takes a list of transports as an argument, so we could also send our logs to other destinations such as a local file.

The actual user-facing API of our server is mounted on the `/users` route defined in `usersRouter`. The function creating the [Express router](https://expressjs.com/en/4x/api.html#router) takes an instance of `UserStore` to access the list of users. For demonstration purposes, we define our synchronous in-memory user store as follows:

```ts
// Representation of user
interface User {
  id: string;
  name: string;
  email: string;
}

interface CreateUserInput {
  name: string;
  email: string;
}

class UserStore {
  private readonly users: Record<string, User> = {};
  constructor() {}

  getUserById(userId: string): User | undefined {
    return this.users[userId];
  }

  createUser(userInput: CreateUserInput): User {
    const userId = uuidv4();
    const user: User = {
      id: userId,
      name: userInput.name,
      email: userInput.email,
    };
    this.users[userId] = user;
    return user;
  }
}
```

The store keeps an in-memory dictionary of users by mapping user IDs to `User` objects. It also exposes `getUserById` and `createUser` methods for getting and creating users.

User requests are handled by our server as follows:

```ts
const usersRouter = (userStore: UserStore): express.Router => {
  const router = express.Router();

  router.post("/", (req: express.Request, res: express.Response) => {
    // Create a new user
    let userInput: CreateUserInput;
    debugLog("Incoming post user", req.body);
    try {
      userInput = parseCreateUserInput(req.body);
    } catch (err) {
      debugLog("Bad request", err, req.body);
      return res.sendStatus(400);
    }
    const newUser = userStore.createUser(userInput);
    // Set Location for client-navigation
    res.location(`users/${newUser.id}`);
    return res.json(newUser);
  });

  router.get("/:userId", (req: express.Request, res: express.Response) => {
    // Get user by ID
    const userId = req.params.userId;
    if (typeof userId !== "string") {
      return res.sendStatus(400);
    }
    const maybeUser = userStore.getUserById(userId);
    if (maybeUser) {
      return res.json(maybeUser);
    } else {
      return res.sendStatus(404);
    }
  });

  return router;
};
```

The router exposes `POST /` and `GET /:userId` routes for creating and fetching users, respectively. Remember the router is mounted to `/users`, so the routes translate to `POST /users` and `GET /users/:userId` routes at top-level.

The request to create a new user is handled by validating the user input first. Creating a new user is then delegated to `userStore.createUser` and the created `User` object is sent back to the user as JSON.

Fetching a user is similar. The user ID given in the route must be a string, after which a user is fetched from `userStore.getUserbyId`. The store returns `undefined` if the user is not found, so that's converted to a response with status code 404.

## Preparing Kafka

Before starting our server, we need to start Kafka. 

If you prefer to install Kafka on your own machine, you can follow the instructions in [Kafka Quick Start](https://kafka.apache.org/quickstart). Alternatively, you can use Docker. Our [demo repository](https://github.com/Meeshkan/meeshkan-express-kafka-demo) has a Docker Compose file [docker-compose.yml](https://github.com/meeshkan/meeshkan-express-kafka-demo/blob/master/docker-compose.yml). This file starts a single instance of [Zookeeper](https://zookeeper.apache.org/), a centralized service for maintaining configuration information, and a single instance of Kafka. The Docker Compose file has been copied from the [kafka-stack-docker-compose repository](https://github.com/simplesteph/kafka-stack-docker-compose) with small modifications.

Using Docker Compose, we can use the command line to start the Kafka cluster by running:

```bash
$ docker-compose up -d
```

The `-d` flag starts the Kafka cluster in the background. Data stored in Kafka is persisted in the local `kafka-data/` directory so that data is not lost after stopping the containers. Kafka broker is listening at port 9092, which is also published by Docker.

Now we need to create a Kafka topic for our recordings. Run one of the following commands to create a topic named `http_recordings`, depending on whether you have Kafka tools installed or not:

```bash
# If you have Kafka installed
$ bin/kafka-topics.sh --bootstrap-server localhost:9092 --topic http_recordings --create --partitions 3 --replication-factor 1

# If you're using Docker
$ docker exec kafka1 kafka-topics --bootstrap-server localhost:9092 --topic http_recordings --create --partitions 3 --replication-factor 1
```

The latter command executes the `kafka-topics` command inside the `kafka1` container started by Docker Compose.

To see messages arriving to Kafka, start a console consumer to consume the `http_recordings` topic:

```bash
# If you have Kafka installed
$ bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic http_recordings --from-beginning

# If you're using Docker
$ docker exec kafka1 kafka-console-consumer --bootstrap-server localhost:9092 --topic http_recordings --from-beginning
```

### Recording calls

Now we're ready to start our server and make some calls! You can start the server with:

```bash
$ yarn  # Install dependencies
$ yarn start  # Start server
# OR if using npm
$ npm install
$ npm run start
```

Let's now make some calls to `localhost:3000` using [`curl`](https://curl.haxx.se/):

```bash
# Create a user
$ curl -X POST -d '{"name": "Kimmo", "email": "kimmo@example.com" }' -H "Content-Type: application/json" http://localhost:3000/users
# Example response:
# {"id":"95768802-5476-4cae-aae4-fb51a6b62ec1","name":"Kimmo","email":"kimmo@example.com"}

# Replace the user ID with the value you got
$ curl http://localhost:3000/users/95768802-5476-4cae-aae4-fb51a6b62ec1
# Example response:
# {"id":"95768802-5476-4cae-aae4-fb51a6b62ec1","name":"Kimmo","email":"kimmo@example.com"}

# To save the created user ID to environment variable USER_ID in bash, you can use sed (https://www.gnu.org/software/sed/manual/sed.html) to replace the whole response body with the captured ID:
$ export USER_ID=`curl -X POST -d '{"name": "Kimmo", "email": "kimmo@example.com" }' -H "Content-Type: application/json" http://localhost:3000/users | sed 's/.*"id":"\([^"]*\)".*/\1/'`

# Get created user by using the environment variable
$ curl http://localhost:3000/users/${USER_ID}
```

Our Kafka console consumer should print HTTP exchanges line by line, showing we're successfully recording:

```bash
{"request":{"method":"post","protocol":"http","host":"localhost","headers":{"host":"localhost:3000","user-agent":"curl/7.54.0","accept":"*/*","content-type":"application/json","content-length":"48"},"body":"{\"name\":\"Kimmo\",\"email\":\"kimmo@example.com\"}","path":"/users","pathname":"/users","query":{}},"response":{"timestamp":"2020-02-28T10:39:28.833Z","statusCode":200,"headers":{"x-powered-by":"Express","location":"users/0549a790-fe19-4e1b-ae15-2ab99a2c91ad","content-type":"application/json; charset=utf-8","content-length":"88","etag":"W/\"58-LnvhpMtTNC8tDgPlNu5AwKbj3P0\""},"body":"{\"id\":\"0549a790-fe19-4e1b-ae15-2ab99a2c91ad\",\"name\":\"Kimmo\",\"email\":\"kimmo@example.com\"}"}}
{"request":{"method":"get","protocol":"http","host":"localhost","headers":{"host":"localhost:3000","user-agent":"curl/7.54.0","accept":"*/*"},"body":"{}","path":"/users/0549a790-fe19-4e1b-ae15-2ab99a2c91ad","pathname":"/users/0549a790-fe19-4e1b-ae15-2ab99a2c91ad","query":{}},"response":{"timestamp":"2020-02-28T10:39:54.034Z","statusCode":200,"headers":{"x-powered-by":"Express","content-type":"application/json; charset=utf-8","content-length":"88","etag":"W/\"58-LnvhpMtTNC8tDgPlNu5AwKbj3P0\""},"body":"{\"id\":\"0549a790-fe19-4e1b-ae15-2ab99a2c91ad\",\"name\":\"Kimmo\",\"email\":\"kimmo@example.com\"}"}}
```

## Creating an OpenAPI specification from recordings

To show a potential use case for our HTTP recordings, we'll use the recordings to create an [OpenAPI specification](https://swagger.io/specification/). This will be done using the [`meeshkan`](https://github.com/Meeshkan/meeshkan) Python tool. Our OpenAPI specification will then act as a contract - specifying the API endpoints and what data they consume or produce. It can be used for documentation or testing.

To get started, install `meeshkan` from [PyPI](https://pypi.org/project/meeshkan/):

```bash
$ pip install meeshkan
```

To create an OpenAPI specification to the directory `my_spec/`, run the following command:

```bash
$ meeshkan build --source kafka -o my_spec
```

`meeshkan` will update the OpenAPI specification in memory whenever new data arrives in `http_recordings` topic. Stop `meeshkan` with `Ctrl+C` and the specification is written to `my_spec` directory with an `openapi.json` as follows:

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "API title",
    "version": "1.0",
    "description": "API description"
  },
  "paths": {
    "/users": {
      "summary": "Path summary",
      "description": "Path description",
      "post": {
        "responses": {
          "200": {
            "description": "Response description",
            "headers": {},
            "content": {
              "application/json": {
                "schema": {
                  "required": ["email", "id", "name"],
                  "properties": {
                    "id": { "type": "string" },
                    "name": { "type": "string" },
                    "email": { "type": "string" }
                  },
                  "type": "object"
                }
              }
  ...
}
```

Finally, we can close down our Kafka cluster:

```bash
$ docker-compose down
```

## Conclusion

To summarize, we created an Express server running in Node.js and added a middleware logging all HTTP exchanges to Apache Kafka. We also saw how to use [`meeshkan`](https://github.com/meeshkan/meeshkan) to create an OpenAPI specification of our server.

If you haven't tried it yourself yet, you can [follow the steps of this article in our GitHub repository](https://github.com/Meeshkan/meeshkan-express-kafka-demo). 

[`meeshkan`](https://github.com/meeshkan/meeshkan) is still under development, so we very much appreciate any feedback. Feel free to comment below or [try our tutorial](https://github.com/meeshkan/meeshkan-tutorial/). 

Thank you for reading!
