---
title: Introducing HTTP types
description: A standard for recording HTTP requests and responses
author: Mike Solomon
authorLink: https://dev.to/mikesol
date: 2020-02-18
tags:
  - javascript
  - python
  - api
  - opensource
---

At Meeshkan, we've recorded millions of HTTP transactions. In doing so, we've noticed that there's no standard format for recording them.  Even within our own company (which only has 10 people!) we managed to create competing standards for recording HTTP traffic.

To fix this, we've created an open standard for storing HTTP transactions.  With it, we hope to achieve one of two outcomes:

- `http-types` evolves into an ISO standard, or
- Someone smarter than us will either make something better or point us to a better standard.

In the absence of either of these things for the time being, we're happy to announce [`http-types`](https://github.com/Meeshkan/http-types)!

# The format

The top-level type in `http-types` is the `HttpExhange`, an object with two keys:

- `request`: the incoming request, and
- `response`: the outgoing response


The following is an example of a request and response stored in the `HttpExchange` format:

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
    "body": "(response body string)",
    "headers": {
      "content-length": "1999",
      "content-type": "text/html; charset=utf-8"
    },
    "timestamp": "2018-11-13T20:20:39+02:00"
  }
}
```

More detailed documentation can be found on the [`http-types` GitHub repo](https://github.com/Meeshkan/http-types). We also have a small [website](https://meeshkan.github.io/http-types/) for the project with a general overview.


# Client libraries

We've written `http-types` client libraries in the most common languages we use at Meeshkan.  The current available client libraries are:

- [java-http-types](https://github.com/Meeshkan/java-http-types): Java library available on [Maven Central](https://search.maven.org/artifact/com.meeshkan/http-types).
- [py-http-types](https://github.com/Meeshkan/py-http-types): Python library available on [PyPi](https://pypi.org/project/http-types/).
- [ts-http-types](https://github.com/Meeshkan/ts-http-types): TypeScript library available on [npm](https://www.npmjs.com/package/http-types).

If you'd like to contribute a client library, please propose one on our [GitHub issues page](https://github.com/Meeshkan/http-types/issues).

We would love to see more people play with `http-types`.  While it's far from perfect, it has been relatively stable within Meeshkan and we think it can serve as a good basis for community discussion on how to store web traffic.

**If you find it useful or have any questions/comments/criticisms, please let us know in the comment section below.**

Enjoy `http-types`!
