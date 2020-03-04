---
title: Announcing Meeshkan, a new tool for mocking HTTP APIs
description: A coming-out party for the world's greatest API mocking tool that no one has ever heard of. Yet.
author: Mike Solomon
authorLink: https://dev.to/mikesol
tags:
  - news
  - testing
  - opensource
---

[Meeshkan](https://github.com/meeshkan/meeshkan) is a tool that mocks HTTP APIs for use in sandboxes as well as for automated and exploratory testing. It uses a combination of API definitions, recorded traffic and code to make crafting mocks as enjoyable as possible. We launched it in January of this year, and we think you're going to _love it_.

In this article, I'll present a high-level overview of what Meeshkan is.  By the time you're done reading, I hope you have a good sense of the problem Meeshkan solves and the reason we're so excited about building it.  I also hope this article entices you to [check out our GitHub and try Meeshkan out](https://github.com/meeshkan/meeshkan).

## Table of Contents

* [How does Meeshkan work?](#how-does-meeshkan-work)
* [Who should use Meeshkan?](#who-should-use-meeshkan)
* [Why did we build Meeshkan?](#why-did-we-build-meeshkan)
* [What is our goal?](#what-is-our-goal)
* [How can you be part of the journey?](#how-can-you-be-part-of-the-journey)
* [What does Meeshkan mean?](#what-does-meeshkan-mean)
* [How can I stay updated?](#how-can-i-stay-updated)
* [Is meeshkan.com broken?](#is-meeshkancom-broken)
* [Where can I learn more about Meeshkan?](#where-can-i-learn-more-about-meeshkan)

## How does Meeshkan work?

The main Meeshkan workflow is **collect, build, and mock.** Meeshkan starts by **collecting**  recordings of server traffic and OpenAPI specs for a service. Then, Meeshkan uses this information to **build** a unified schema that describes how the API works. Finally, Meeshkan uses this schema to **mock** a service's behavior.

You can explore this entire flow in detail in our [meeshkan-tutorial](https://github.com/meeshkan/meeshkan-tutorial) repo.

## Who should use Meeshkan?

Anyone that makes a REST API call from their codebase could benefit from Meeshkan. This is because, at some point, you'll want to write a test where that API is called. Instead of calling the real API, it may make sense to use a mock. That's where we come in.

There are several products and projects on the market that compete with Meeshkan:
- [wiremock](https://github.com/tomakehurst/wiremock)
- [hoverfly](https://github.com/SpectoLabs/hoverfly)
- [prism](https://github.com/stoplightio/prism)

You might ask, why make another product when these alternative solutions exist? This would be a reasonable question, and our answer is twofold:

1. The general adoption of server mocking tools has been pretty low. This is despite the fact that integration testing is still a huge pain point for developers. We feel that this is because no one has gotten mocking quite right yet, and we hope to change that.
1. Our approach is different. Our goal is to create mock versions of services that are so lightweight and so accurate that testing hundreds of different integration scenarios becomes a basic part of the integration testing workflow.

If you've never written an integration test, or if you have written very few, or if you feel your codebase is too broken or rushed or incomplete to think about integration tests, Meeshkan is for _you_. The next time you're working on a project and you suspect there is a bug coming from an interaction with a REST API, that's a _great_ time to start using Meeshkan. And if you need help getting started, you can always reach out to [@MeeshkanML on Twitter](https://twitter.com/MeeshkanML).

## Why did we build Meeshkan?

When we started working with clients on integration testing, we were writing a lot of bespoke code, mostly in Python. At the same time, we were maintaining an open-source library, [unmock-js](https://github.com/meeshkan/unmock.js), that had very little traction with our clients. While we still believe in unmock-js and its potential to bring fuzz testing practices to API testing, we felt that our project would have more momentum if we focused more on open-sourcing the code from our commercial collaborations.

Doing this required us to federate around ten separate repos under the banner of one. Plus we had to clean up lots of cruft and eliminate several points of duplication, sometimes spanning multiple languages. It was the type of code consolidation that also helped consolidate the purpose. Meeshkan represents the core of what we do best - observing how a digital system works and making an accurate replica of it.

## What is our goal?

When developers are empowered with mocks, they can build and ship with more confidence. Mocks of systems allow developers to experiment,  prototype, and test. In many other disciplines (music, architecture, weather), the mock (rehearsal, model, simulation) has become an established and essential part of the workflow. Despite all the advances in programming over the past decade, we have a long way to go with mocks. As a result, integrated systems break easily and are clunky to build. We want to fix that.

Eventually, we want Meeshkan to be able to learn from any machine-to-machine communication. Then, in a matter of seconds, it will be able to create an up-to-date, realistic mock of all parties to the communication based on how they interact with each other. It is not that different from Natural Language Processing projects that look to recreate human writing or speech - except we recreate machine communication.

## How can you be part of the journey?

Almost all of our work is open-source. We make money by building and maintaining sandbox servers for clients. To pull this off, we need to have the most vetted, battle-tested tooling on the market. We believe that open-source is the only way to get there.

All contributions are welcome, including:
- Tweeting us [@MeeshkanML](https://twitter.com/MeeshkanML) as you are discovering and using the tool. Any feedback is appreciated!
- Reporting an [issue](https://github.com/meeshkan/meeshkan/issues). This could be a feature request, a question, or a bug report.
- Writing a short article on [dev.to](https://dev.to) about your experience using Meeshkan.
- Exploring our other repos, including [micro-jaymock](https://github.com/meeshkan/micro-jaymock), [unmock-js](https://github.com/meeshkan/unmock-js), and [http-types](https://github.com/meeshkan/http-types) to name a few.
- Contributing a new feature, fixing a bug, or helping with documentation through a [pull request](https://github.com/meeshkan/meeshkan/pulls).

We're looking forward to hearing your ideas as well.

We realize, and are grateful for, the fact that your contributions to  Meeshkan will help us in our engagements with clients. We hope that, in return, you feel like a valued member of our community and that you learn from our team of engineers.

## What does Meeshkan mean?

Meeshkan is a Hebrew word (משכן) that loosely translates to tabernacle. It's the portable temple that the Israelites built during the Exodus from Egypt. It served as a stand-in for the larger one they were to build in Jerusalem.

This very week, on February 29th, Jews all over the world will read from the Torah about [how the Meeshkan was constructed](https://www.chabad.org/parshah/article_cdo/aid/1314/jewish/Anatomy-of-a-Dwelling.htm). The Lubavitcher Rebbe teaches that the Meeshkan was made of:

> Fifteen physical substances, including gold, silver, copper, wood, wool, linen, animal skins, oil, spices and gemstones — representing a cross-section of the mineral, vegetable and animal resources of the physical universe and the human resources invested in their workmanship.

Digital mocks are no different. Their substances need to be limited while being _representative_ of the diversity and entropy of the systems they are mocking.

In short, we think that mocks are like Meeshkans. They are stand-ins for the real thing, and in many ways, they need to resemble the real thing, but are more lightweight and not as full-featured.

I don't mean to endorse one religious tradition over another. But at the end of the day, my own tradition is where my knowledge is strongest. What I've learned is that the problems our company is solving are ancient and of fundamental importance to many communities. The story of the Meeshkan helps me focus on the humanistic backbone of what we are doing.

## How can I stay updated?

You can [sign up for our mailing list](https://www.subscribepage.com/meeshkan). You can sign up for our mailing list. We'll only email you once a month with exciting feature updates or particularly juicy articles. We won't send you spam and you can unsubscribe at any time.

## Is meeshkan.com broken?

No, [meeshkan.com](https://meeshkan.com) is not broken. The entire thing is [open source](https://github.com/meeshkan/worlds-greatest-website) and built using [11ty](https://github.com/eleventy/11ty). I consistently ask development firms and consultants "How could we improve our website?" and people are at a loss for words, so I can only assume that we are close to perfection.

I proposed to the [creator of 11ty](https://twitter.com/MeeshkanML/status/1230120931101679617) that we have a sort of "theme roulette" for the website. He seemed kind of into the idea. So if you'd like to spice it up, please make a PR and we'll have a look.

## Where can I learn more about Meeshkan?

Here are some resources to learn more about Meeshkan:
- [Try the meeshkan-tutorial](https://github.com/meeshkan/meeshkan-tutorial).
- [Check out our README](https://github.com/meeshkan/meeshkan).
- [Read our articles](https://dev.to/meeshkan).

I'm also available to answer any questions you have about Meeshkan. Our team has built Meeshkan because we believe in the problem it solves and in the power of integration testing. Thanks for giving it a shot - and I'm looking forward to learning from you as you learn about Meeshkan!
