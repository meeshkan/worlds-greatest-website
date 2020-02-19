---
title: Comparing Prism, Hoverfly, and Meeshkan - Part 2
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
_This is the second article of a two-part series comparing Prism, Hoverfly, and Meeshkan. This article focuses on using all three tools to build a mock of the github API v3, whereas the [first article](https://dev.to/meeshkan/comparing-prism-hoverfly-and-meeshkan-part-1-27g6) focuses on a high level comparison of the tools._

![Meeshkan team](https://dev-to-uploads.s3.amazonaws.com/i/2ek2wxex4koaks7v2msf.jpg)
_Team Meeshkan busy building Meeshkan._

In the [previous article](https://dev.to/meeshkan/comparing-prism-hoverfly-and-meeshkan-part-1-27g6), we saw how to create a Prism server from an OpenAPI spec. We also saw how Hoverfly can play back recordings of server traffic.  Lastly, we saw how Meeshkan blends OpenAPI specs and recordings into a mock server.

In this article, we will examine how all three tools can mock the Stripe API.

# Prism

To mock the Stripe API with Prism, we first download the Stripe V3 OpenAPI spec.

```bash
$ wget https://github.com/stripe/openapi/blob/master/openapi/spec3.yaml?raw=true
```

Then, we spin up a Prism server that will mock the Stripe API according to the spec.

```bash
$ prism mock spec3.yaml
```

Let's inspect the API using some common Stripe endpoints.  For example, we can get test the balance endpoint by calling `/v1/balance`.

```bash
$ curl http://localhost:4010/v1/customers
```

Prism provides useful information in the console as it validates the URI.


```bash
$ [7:50:52 PM] » [HTTP SERVER] get /v1/customers i  info      Request 
received
[7:50:52 PM] »     [NEGOTIATOR] i  info      Request contains an accept header: */*
[7:50:52 PM] »     [VALIDATOR] ‼  warning   Request did not pass the validation rules
[7:50:52 PM] »     [NEGOTIATOR] √  success   Created a 401 from a default response
[7:50:52 PM] »     [NEGOTIATOR] √  success   Found response 401. I'll try with it.
[7:50:52 PM] »     [NEGOTIATOR] √  success   The response 401 has a 
schema. I'll keep going with this one
```

Unfortunately, this is where I ran into difficulties, as Prism serves the response.

```json
{
    "type": "https://stoplight.io/prism/errors#UNKNOWN",
    "title": "Your schema contains $ref. You must provide specification in the third parameter.",
    "status": 500,
    "detail": ""
}
```

While Prism is good at mocking most API specs, it struggled when it ran into the Stripe spec.  I'm sure the team will fix this in an upcoming version of Prism. In the meantime, let's see how Prism handles the ubiquitous [`petstore.yml`](https://github.com/OAI/OpenAPI-Specification/blob/master/examples/v2.0/yaml/petstore.yaml) spec.

```bash
$ prism mock petstore.yml
```

Now, when we query `/pets`, we get the following result.

```json
[
    {
        "id": -9223372036854776000,
        "properties": {
            "isCat": true
        },
        "name": "string",
        "tag": "string"
    }
]
```

**Conclusion:** Prism will create an out-of-the-box mock for many APIs. Although it struggled with Stripe, it works for most OpenAPI specs.  It also has helpful logs.

# Hoverfly

To create a Hoverfly mock, we first have to record the calls to the  API we would like to mock.  I'll use my Stripe test account, where I've created three mock customers. For example, here  is the information for a customer named Jane Doe.

![Jane Doe on Stripe](https://dev-to-uploads.s3.amazonaws.com/i/pppak23y4d91eey6cdww.png)

If we call the Stripe `/v1/customers` endpoint, we get information on all three mock customers.

```bash
$ curl -u **redacted** https://api.stripe.com/v1/customers
```

And here's an abbreviated JSON.

```json
{
  "object": "list",
  "data": [
    {
      "id": "cus_GhmXKD3awekHyV",
      "object": "customer",
      "account_balance": -755,
      "address": {
        "city": "Elk Grove",
        "country": "US",
        "line1": "12 McKenna Dr",
        "line2": "",
        "postal_code": "95757",
        "state": "CA"
      }
      ...
    }
    ...
  ],
  "has_more": false,
  "url": "/v1/customers"
}
```

Now, let's fire up Hoverfly and record our interactions with some Stripe endpoints.  First, we'll need to get the Hoverfly SSL certificate so we can call the Stripe HTTPS endpoint.

```bash
$ wget https://raw.githubusercontent.com/SpectoLabs/hoverfly/master/core/cert.pem
```

We'll record several different outcomes, including failures.

```bash
$ hoverctl start
$ hoverctl mode capture
$ curl --proxy localhost:8500 https://api.stripe.com/v1/customers # leave out the key
$ curl --proxy localhost:8500 -u **redacted** https://api.stripe.com/v1/customers # include the key
$ curl --proxy localhost:8500 -u **redacted** https://api.stripe.com/v1/customers/cus_GhmV4PbooARHhM --cacert cert.pem # getting one customer # get one customer
$ curl --proxy localhost:8500 -u **redacted** -X POST -d email="susan@example.com" -d name="Susan McLane" -d description="Our secret favorite customer" https://api.stripe.com/v1/customers/cus_GhmV4PbooARHhM --cacert cert.pem # add one customer
$ curl --proxy localhost:8500 -u **redacted** -X DELETE https://api.stripe.com/v1/customers --cacert cert.pem # try to delete all customers, will fail!
$ curl --proxy localhost:8500 -u **redacted** -X DELETE https://api.stripe.com/v1/customers/cus_GhmV4PbooARHhM --cacert cert.pem # try to delete one customer, will succeed
$ curl --proxy localhost:8500 -u  -X DELETE https://api.stripe.com/v1/customers/cus_GhmV4PbooARHhM --cacert cert.pem # leave out the key, will fail
$ curl --proxy localhost:8500 -u **redacted** -X DELETE https://api.stripe.com/v1/customers/cus_GhmV4PbooARHhM # delete a customer that doesn't exist, will fail 
$ hoverctl export stripe-simulation.json
$ hoverctl stop
```

Digressing for a moment, I'd like to say a word about making recordings for tests. As you saw in the example above, POST or DELETE  mutates the real data backing your requests. If you're not careful, this can lead to some pretty bad consequences.  That's why I would always recommend recording real server traffic.

Back to Hoverfly, let's now examine how our recordings are transformed into a mock API.  We'll start by firing up a Hoverfly server.

```bash
$ hoverctl start webserver
$ hoverctl import stripe-simulation.json
```

Now, let's test retrieving a single customer.

```bash
$ curl http://localhost:8500/v1/customers/foobar -u **redacted**
```

Hoverfly produces a helpful error message indicating what went wrong.  It also gives suggestions how to fix the matcher to produce a result. Here is a truncated error message:

```bash
Hoverfly Error!

There was an error when matching

Got error: Could not find a match for request, create or record a valid matcher first!

The following request was made, but was not matched by Hoverfly:       

{
    "Path": "/v1/customers/foobar",
    "Method": "GET",
    ...
}

Whilst Hoverfly has the following state:

{}

But it did not match on the following fields:

[path]

Which if hit would have given the following response:

{
    "status": 200,
    "body": "...",
}
```

Let's follow its suggestion and add a glob wildcard to `stripe-simulation.json`.  Before, the file contained this.

```json
[
    {
        "matcher": "exact",
        "value": "/v1/customers/cus_GhmV4PbooARHhM"
    }
]
```

And now, we will change it to this.

```json
[
    {
        "matcher": "glob",
        "value": "/v1/customers/*"
    }
]
```

Running our curl request again, we get the recorded response. w00t! Here's a shortened version of the response.

```json
{
  "id": "cus_GhmV4PbooARHhM",
  "object": "customer",
  "account_balance": 0,
  "address": {
    "city": "Melbourne",
    "country": "AU",
    "line1": "1 Batman Way",
    "line2": "",
    "postal_code": "3000",
    "state": "NSW"
  },
  ...
  "tax_info": null,
  "tax_info_verification": null
}
```

This is the basic flow in Hoverfly. For small APIs, I find this to be a compelling approach.  For larger APIs with more complex behavior, OpenAPI-based mocks tend to perform better.  This is because the spec will likely contain more outcomes and endpoints than you would see in the wild.

# Meeshkan

The first step in creating a Meeshkan mock is the same as the Prism mock - we download the OpenAPI spec.

```bash
$ wget https://github.com/stripe/openapi/blob/master/openapi/spec3.yaml?raw=true
```

We'll create a folder called `stripe-mock`, where we will move the spec.

```bash
$ mkdir stripe-spec && mv spec3.yaml ./stripe-spec
```

Already here, we can start Meeshkan in server mode an examine some results.

```bash
$ meeshkan mock -a ./stripe-spec
$ curl -i -X GET http://localhost:8000/v1/clients
```

We can see in the gist below that the result is an array of mock users built using Stripe's OpenAPI spec.


```json
{
  "data": [
    {
      "created": 74675021,
      "id": "dolor enim minim culpa ipsum",
      "livemode": true,
      "object": "customer",
      ...
    }
    ...
  ],
  "has_more": true,
  "object": "list",
  "url": "/v1/customers"
}
```

Now, let's enrich the spec with the same set of recordings we made when building our Hoverfly mock.  Blending an OpenAPI spec with recorded server traffic has two main advantages:

- it allows Meeshkan to pick up on features of the spec not present in the recordings and vice versa.
- you can alternate between serving rote recordings and synthetic data.

For example, let's record a call to `/v1/customers` as we did in the previous example.

```bash
$ meeshkan record --log_dir ./stripe-logs
$ curl -u **redacted** http://localhost:8500/https/api.stripe.com/v1/customers
$ curl http://localhost:8000/https/api.stripe.com/v1/customers # leave out the key
$ curl -u **redacted** http://localhost:8000/https/api.stripe.com/v1/customers # include the key
$ curl -u **redacted** http://localhost:8000/https/api.stripe.com/v1/customers/cus_GhmV4PbooARHhM --cacert cert.pem # getting one customer # get one customer
$ curl -u **redacted** -X POST -d email="susan@example.com" -d name="Susan McLane" -d description="Our secret favorite customer" http://localhost:8000/https/api.stripe.com/v1/customers/cus_GhmV4PbooARHhM --cacert cert.pem # add one customer
$ curl -u **redacted** -X DELETE http://localhost:8000/https/api.stripe.com/v1/customers --cacert cert.pem # try to delete all customers, will fail!
$ curl -u **redacted** -X DELETE http://localhost:8000/https/api.stripe.com/v1/customers/cus_GhmV4PbooARHhM --cacert cert.pem # try to delete one customer, will succeed
$ curl -u  -X DELETE http://localhost:8000/https/api.stripe.com/v1/customers/cus_GhmV4PbooARHhM --cacert cert.pem # leave out the key, will fail
$ curl -u **redacted** -X DELETE http://localhost:8000/https/api.stripe.com/v1/customers/cus_GhmV4PbooARHhM # delete a customer that doesn't exist, will fail
```

Now, let's build a spec using this mock. We'll use `gen` mode. That means that if our mock runs into a customer it hasn't recorded, it will create a mock customer on the fly.

```bash
$ meeshkan build -i ./stripe-logs/ --mode gen -o build
$ meeshkan mock -s build/
$ curl http://localhost:8500/v1/customers -u **redacted**
$ curl http://localhost:8500/v1/customers/cus_x410fdsfxfs -u **redacted**
```

## Conclusion

In this article, we saw how three mocking tools - Prism, Hoverfly and  Meeshkan - can create a mock of the Stripe API.  I hope that, in going through this, you got a sense of the differences between the three tools. In short:

- Prism can create a mock of an OpenAPI spec
- Hoverfly can serve back recordings
- Meeshkan can serve a mix of recordings and synthetic data
