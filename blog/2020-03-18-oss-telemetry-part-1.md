---
title: Understanding telemetry features in open-source software
description: What does it mean to have telemetry features in open source projects and how do developers feel about it.
series: Can you do telemetry without being evil?
author: Carolyn Stransky
authorLink: https://twitter.com/carolstran
tags: 
  - opensource
  - ethics
  - data
---

Until recently, I was unaware that many of the open-source products I use regularly - like Visual Studio Code or Netlify - have telemetry features that track usage. Admittedly, I had no idea these kinds of features existed at all. But I wasn't surprised. What bothered me more was that I didn't know my data was being tracked. 

So I began talking to other developers in my network. I learned that people fell somewhere on a spectrum - ranging from blissfully unaware (like me) to vigilant about data protection. Some even told me that they refuse to use products that have these features.

All of this got me thinking about the general attitude and ethics around telemetry features in open source technology. Can tracking data be ethical if that data is open and available? If telemetry is bad, how can open source maintainers best track usage to improve the project? I decided to dig deeper and thus, this series was born.

This first post will cover the what and why of telemetry features, insights on developer attitudes and what else you can expect from this series.

## Table of Contents

- [What is telemetry?](#what-is-telemetry)
- [Why would I implement a telemetry feature?](#why-would-i-implement-a-telemetry-feature)
- [How do developers feel about telemetry?](#how-do-developers-feel-about-telemetry)
- [What's next?](#whats-next)

## What is telemetry?

Telemetry is a feature that enables data collection. Many products (open source or otherwise) implement telemetry features to track usage. This usage data can range from performance metrics to errors encountered by users.

Let's dive deeper into the term telemetry. If you look at [a very scientific resource called Wikipedia](https://en.wikipedia.org/wiki/Telemetry), it defines telemetry as follows:

> Telemetry is the collection of measurements or other data at remote or inaccessible points and their automatic transmission to receiving equipment or monitoring.

When you abstract this a bit, you can see how this would apply to software:

* `collection of measurements or other data`: How and when people are using the product.
* `remote or inaccessible points`: Other people's computers.
* `their automatic transmission`: Actions done by the implemented telemetry features.
* `receiving equipment or monitoring`: How the product is tracking this usage data (for instance, a dashboard or log).

To put it into context, you can check out [Gatsby's telemetry package](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-telemetry), which is entirely open source. Or if you're curious about working with a telemetry feature, take a look at this example of [how CodeSandbox sends telemetry events](https://github.com/codesandbox/codesandbox-client/blob/master/packages/node-services/src/module.ts#L197-L217). 

## Why would I implement a telemetry feature?

[Firefox's source documentation](https://firefox-source-docs.mozilla.org/toolkit/components/telemetry/index.html) describes this well. It says that their telemetry features are used to track "information about how Firefox performs in the wild." And this is exactly the benefit: Raw usage data.

Many teams choose to implement telemetry features to help them understand how to improve their product. There are other ways to source user feedback - like case studies, surveys or even GitHub issue templates. But telemetry features are different because they can offer continuous, unfiltered insight into a user's experiences.

It can be difficult to prioritize fixes or features when you aren't sure how the product is being used. And not every user will be motivated to file a bug report when they do run into issues. So for some, telemetry helps find those answers. 

## How do developers feel about telemetry?

Back in October 2019, [I asked Twitter](https://twitter.com/carolstran/status/1182571331390464001): Are you ok with open source projects having a telemetry feature that collects anonymous usage data? Assuming you can opt-out.

Over 440 developers participated in the poll, but the results varied.

While 53% answered some form of yes, over half of them indicated that the data must be open and available. Twenty percent said no flat out. 

Those who answered "Depends on what's tracked" and took the time to reply brought up a variety of issues. These included opting-in rather than out, what type of data is being tracked, whether the data is anonymous and many more that we'll dive into in a later post.

Developers being skeptical about telemetry is nothing new. Just look at this issue discussion from 2016 titled, [.NET core should not SPY on users by default](https://github.com/dotnet/sdk/issues/6145). But the attitude towards telemetry seems to be shifting. **If there is some benefit that comes from sharing this usage data (less bugs, more descriptive errors, relevant features), people are more willing to do it.**

The majority agreed that an important factor is the recipient - who is the one collecting the data? [Dan Callahan](https://twitter.com/callahad) pointed out specifically, "Happy to send telemetry to non-profits and independent developers. Otherwise, there needs to be an exchange of value." But we don't all maintain projects as independent developers or work for non-profits. So then the question becomes what value exchange would be enticing enough for people to share their personal data.

In cases involving larger organizations, some mentioned that how the information is communicated and documented is what matters.

No matter how you spin it, the general consensus is that the data needs to be anonymous, it should be clearly documented and it must be able to be switched off easily (or opt-in if possible). 

## What's next?

This is the first in an undetermined number of posts about telemetry in open-source software. Throughout this series, we'll discuss a variety of topics - from building a telemetry feature to documenting it after.

If you have any requests for this series, [please reach out via email](mailto:carolyn@meeshkan.com).