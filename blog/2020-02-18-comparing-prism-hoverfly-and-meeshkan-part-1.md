---
title: Comparing Prism, Hoverfly, and Meeshkan - Part 1
description: An article comparing three mocking frameworks
author: Mike Solomon
authorLink: https://dev.to/mikesol
date: 2020-02-18
tags:
  - api
  - web
  - devops
  - testing
---

_This is the first article of a two-part series comparing Prism, Hoverfly, and Meeshkan. This article presents a high-level comparison. The [second one](https://dev.to/meeshkan/comparing-prism-hoverfly-and-meeshkan-part-2-139i) shows they can be used with a specific API._

![Meeshkan team](https://dev-to-uploads.s3.amazonaws.com/i/bni2ip09m23dml1nozod.jpg)
_Our team during a brief, spontaneous moment of levity._

At Meeshkan, we reverse engineer software. Our mission is to build a tool that can clone even the most complex systems with a high degree of accuracy.

We have recently begun to open-source more of our stack as we get closer to achieving our mission. In doing so, we've come up against some strong incumbents such as Prism and Hoverfly.  In this article, I'd like to present both of those tools to our new open-source project [Meeshkan](https://github.com/meeshkan/meeshkan).

# Prism

Prism is an open-source component of the [stoplight.io](https://stoplight.io) stack.  Stoplight is, in my experience, the best editor for building OpenAPI specifications.  The UI is gorgeous. If you are authoring an OpenAPI spec and don't like writing YAML or JSON, you should try Spotlight.

Using Prism, you can take your OpenAPI spec built on Stoplight (or built with any other tool) and run:

```bash
$ prism mock my-spec.yml
```

Prism will create a server that mocks all of the endpoints of your OpenAPI spec.  For example, imagine that `my-spec.yml` contains a path `/users`. You can call `http://loalhost:3000/users` to get a list of mock users that conforms to the spec in `my-spec.yml`.

**Conclusion:**: Prism is a great tool to turn an OpenAPI spec into a mock server.

# Hoverfly

Hoverfly creates a mock server based on recordings of a live service.

The most straightforward way to record traffic with Hoverfly is to use it as a proxy. To do this, you start hoverctl and instruct it to run in capture mode.  Then, you can use curl or Postman to send your HTTP traffic through the Hoverfly proxy.  It is also possible to set up a proxy in specific languages. For example, in NodeJS, you can set the HTTP_PROXY and HTTPS_PROXY environment variables.

From here, you can export the recording to a simulation file and stop `hoverctl` when you're done.

```bash
$ hoverctl start
$ hoverctl mode capture
$ curl --proxy http://localhost:8500 http://echo.jsontest.com/a/b
$ hoverctl export simulation.json
$ hoverctl stop
```

After this, `hoverfly` consumes the simulation file in order to serve mock data.  In this case, it will serve the recording we made of `/a/b`.

```bash
$ hoverctl start webserver
$ hoverctl import simulation.json
$ curl http://localhost:8500/a/b
$ hoverctl stop
```

In this way, Hoverfly allows you to record and store various fixtures from a mock API and serve them back. Hoverfly uses a custom JSON format to store its recordings. In this JSON file, you can do things like specify matching if your URLs have wildcards.

Hoverfly is extensible through a middleware system that communicates through `stdin` and `stdout`.  Middleware can do things like change a response's status code and even add latency.

**Conclusion:** Hoverfly is a good tool when you need to serve back recordings of an API for testing.

{% twitter 1229838532983828481 %}

# Meeshkan

If Hoverfly and Prism had a baby, it would be Meeshkan. Meeshkan allows developers to build a mock server from recordings and OpenAPI specs. It exposes a Python API for building a persistance layer behind mocks. We also use it to tie together ML models to simulate realistic server traffic.

Meeshkan ingests recordings in the [`http-types`](https://github.com/meeshkan/http-types) format. You can build these Meeshkan recordings using middleware or a proxy.  For example, let's say that we have an `express` server and want to do our recording from that.  We can use the [Meeshkan `express` middleware](https://github.com/meeshkan/express-middleware) to save recordings.

```javascript
app.use(meeshkan({
    transport: S3Transport({
        bucket: 'my-recording-bucket',
        key: '/ myservice',
        prefix: 'recording_',
    })
}));
```

It's also possible to use Meeshkan as a reverse proxy for recording.

```bash
$ meeshkan record --log_dir ./logs
$ curl http://localhost:8000/http/echo.jsontest.com/a/b
```

Then, we use `meeshkan build` to turn these recordings into an OpenAPI spec.  In the example below, we mix the recordings with a preexisting spec. The result is an enhanced OpenAPI spec.

```bash
$ meeshkan build --mode replay -i recording.json -a spec.yml -o enhanced_spec
```

If you use `gen` mode, then Meeshkan will infer a spec from recordings instead of serving them rote.

```bash
$ meeshkan build --mode gen -i recording.json -a spec.yml -o enhanced_spec
```

Like Hoverfly and Prism, Meeshkan can be started in server mode.

```bash
$ meeshkan mock -i enhanced_spec/
```

**Conclusion:** Meeshkan blends together recordings and OpenAPI specs into an enhanced OpenAPI spec. We'd love to hear your feedback on our [GitHub issues page](https://github.com/meeshkan/meeshkan/issues). **Also, please don't hesitate to leave a comment with feedback!**