---
title: Getting started with Meeshkan
description: An interactive tutorial for the Meeshkan collect, build, and mock workflow.
author: Mike Solomon
authorLink: https://dev.to/mikesol
tags:
  - python
  - testing
  - api
---

TL;DR Run `pip install meeshkan-tutorial && meeshkan-tutorial` in your terminal to start an interactive Meeshkan tutorial.

Hi! We've made a tutorial for Meeshkan.  We made it to help developers get started with Meeshkan and to show the tool's core features. 

You can install it by running:

```bash
pip install meeshkan-tutorial
```

And then start the tutorial by invoking:

```bash
meeshkan-tutorial
```

Here are some tips for going through the tutorial:
- Use a virtual environment.  For example, `virtualenv .venv && source .venv/bin/activate` on POSIX, `virutalenv .venv ; .venv\Scripts\activate` on Windows.
- Use a large window.
- Have an editor handy to inspect the files that are being created.
- At the end, pretty-please [fill out our survey](https://meeshkan.typeform.com/to/FpRakX).

The tutorial is open-source, and if you'd like to suggest an improvement or file a bug report, [please do so here](https://github.com/meeshkan/meeshkan-tutorial).

Spoiler alert! What follows below is the text of the tutorial.  That said, nothing beats doing it yourself.

************

```bash
   ____ ___  ___  ___  _____/ /_  / /______ _____
  / __ `__ \/ _ \/ _ \/ ___/ __ \/ //_/ __ `/ __ \
 / / / / / /  __/  __(__  ) / / / ,< / /_/ / / / /
/_/ /_/ /_/\___/\___/____/_/ /_/_/|_|\__,_/_/ /_/


The tutorial!!
Press ENTER to continue...

##############################

Meeshkan allows you to create mocks of APIs from server traffic and OpenAPI specs.  To start, we'll record some server traffic.  But before we get started, there are a few things you should know.

First, Meeshkan will create a directory called __meeshkan__ in the current working directory. Don't put anything special in there, as it may get overwritten by this tutorial!

Next, this tutorial makes some network calls to the Pokemon API (pokeapi.co).  Please make sure you have a working internet connection.

With that in mind, press ENTER to continue (or the q key followed by ENTER to quit):

##############################

First, let's record a bit of server traffic. We've written a file to `__meeshkan__/api_calls.py` to make our recordings.  Meeshkan expects recordings to be in the http-types format, so we'll use that.

Open up `__meeshkan__api_calls.py`. You'll see that we call the API 33 times using Meeshkan as a forward proxy.

After you've checked out `__meeshkan__/api_calls.py`, press ENTER to execute the script!

##############################

  ** Calling https://pokeapi.co/api/v2/pokemon/1/, path 1 of 33
  ** Calling https://pokeapi.co/api/v2/pokemon/2/, path 2 of 33
  ** Calling https://pokeapi.co/api/v2/pokemon/3/, path 3 of 33
  ** Calling https://pokeapi.co/api/v2/pokemon/4/, path 4 of 33
  [...skip...skip...skip]
  ** Calling https://pokeapi.co/api/v2/ability/10/, path 32 of 33
  ** Calling https://pokeapi.co/api/v2/ability/, path 33 of 33

Now, if you check out `__meeshkan__/recordings.jsonl`, you'll see all of the recorded server traffic. Press ENTER to continue.

##############################

The command `meeshkan build` transforms your recordings into an OpenAPI spec.  The `replay` flag tells Meeshkan to build a spec that's identical to the recorded traffic. Press ENTER to invoke `meeshkan build` in `replay` mode.

##############################

$ meeshkan build -i __meeshkan__/recordings.jsonl -o __meeshkan__/replay -m replay`

  **** building ****

Done.  Now, open up __meeshkan__/replay/openapi.json. Search within this document for `/api/v2/pokemon/10/:`.  This is a translation of the `GET` request you got from the Pokemon API into OpenAPI.

Now, let's use this spec to create a server that serves back our recordings.  Press ENTER to boot up the mock server.

##############################

The server is up and running.  Press ENTER to send a `GET`
request to the endpoint `/api/v2/pokemon/10/`.

##############################

Here is the response we got back from the server.

{
  "order": 14,
  "forms": [
    {
      "name": "caterpie",
      "url": "https://pokeapi.co/api/v2/pokemon-form/10/"
    }
  ],
  "held_items": [],
  "location_area_encounters": "https://pokeapi.co/api/v2/pokemon/10/encounters",    
  "weight": 29,
  "id": 10,
  "stats": [
    {
      "base_stat": 45,
      "effort": 0,
      "stat": {
        "name": "speed",
        "url": "https://pokeapi.co/api/v2/stat/6/"
      }
    }
    ............. more json ..............
  ]
}
..............................

It's the exact same response we got back from the Pokemon API.  Pretty cool, huh?  You can try the same thing. From curl, Postman or your web browser, try calling endpoints like http://localhost:8000/api/v2/ability/ or http://localhost:8000/api/v2/type/2/.  When doing so, make sure to set the following headers:

{
    "Host": "pokeapi.co",
    "X-Meeshkan-Scheme": "https"
}

Once you're done exploring, press ENTER to turn off the server and continue.




##############################

Now, let's build a new spec.  This time, instead of serving
back fixed data, we will use the recordings to create
_synthetic_ data.   We do this by invoking `meeshkan build
--mode gen`.

Press ENTER to build the new spec.

Hang tight, we're building your spec!

$ meeshkan build -i __meeshkan__/recordings.jsonl -o
__meeshkan__/gen -m gen`

Done.  In __meeshkan__/gen/, you'll see a new OpenAPI spec.

Now, let's see use this spec to create some _synthetic_
data.  Press ENTER to reboot the mock server on port 8000.

##############################

The server is up and running.  Press ENTER to send a `GET`
request to the endpoint `/api/v2/pokemon/10/`.

##############################

..............................

The data above is synthetic, but it has the same layout as the recorded data.

Why synthetic data?  Well, I'm glad you asked!  Two main reasons.

1. Security breaches are most common when dealing with log files and in test environments.  So, when testing, you never want to use real data if possible.
2. Using synthetic data forces you write tests that focus on business logic rather than focusing on the content of fixtures, which is (in our opinion) a cleaner way to do testing.

From curl, postman or your web browser, try calling http://localhost:8000/api/v2/pokemon/\{id\}/ , where `\{id\}` is _any_ positive integer. And when doing so, make sure to set following two headers:

{
  "Host": "pokeapi.co",
  "X-Meeshkan-Scheme": "https"
}

You'll see that Meeshkan generates a synthetic response for an arbitrary Pokemon. Once you're done exploring, press ENTER to continue.

##############################

Lastly, please open the file `merge_specs.py` that we just created in the Meeshkan directory. It's a script that merges together the two OpenAPI specs - replay and gen - created by Meeshkan.  After you've looed at it, press ENTER to execute it.

$ python __meeshkan__/merge_specs.py

Done.  In `__meeshkan__/both/`, you'll see an OpenAPI spec that combines _both_ the fixutres from `__meeshkan__/replay/openapi.json` and the synthetic spec from `__meeshkan__/replay/openapi.json`.

Like the other two specs, this one can be used to create a mock server.  Try it yourself!  After this tutorial, run `meeshkan mock -i __meeshkan__/both -r`, making sure to set the same headers as before, and see how the server responds.  Press ENTER to continue.

##############################

Thanks for checking out Meeshkan!  There are several other cool features, like callbacks to implement stateful logic and various connectors from libraries and platforms like Express and Kong.

If you have a moment, please fill out our post-tutorial survey on https://meeshkan.typeform.com/to/FpRakX.  In addition to helping us improve Meeshkan, it will help us improve this and other tutorials.

Take care, and happy mocking!
```
