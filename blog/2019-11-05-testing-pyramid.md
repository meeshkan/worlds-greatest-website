---
title: What is the Testing Pyramid even? 
description: Because no one wants to fail a technical interview because of a metaphor.
date: 2019-11-05
author: Carolyn Stransky
authorLink: https://twitter.com/carolstran
tags:
  - video
  - testing
  - webdev
  - learninpublic
---

📹 _This post is a transcript from our [wtfuzz video series](https://www.youtube.com/watch?v=JC2mbve347c&list=PLRkRCk0XEUGhs2sRL6Ri2a1r5eApbLQLr)._ 📹

[![YouTube thumbnail](https://img.youtube.com/vi/ndMYYxP_Gzs/0.jpg)](https://www.youtube.com/watch?v=ndMYYxP_Gzs)

Not sure about you, but I've definitely failed the ’what is the testing pyramid’ interview question before 😅 

That's why I thought this would be the perfect topic to kick off the series. Plus it’s important for me to figure out how [Unmock](https://www.unmock.io/docs/introduction), the testing library I’m now maintaining, fits in this concept.

The testing pyramid is defined as a framework for designing a test suite that optimizes for speed and confidence. It was created by Mike Cohn back in 2003 but it didn’t really take off until he wrote about it in his book Succeeding with Agile in 2009.

The traditional testing pyramid is made up of three parts: 

The top and thinnest layer represents UI tests - also referred to as end-to-end or feature tests. They interact with the product like a real user would and cover a path through the system.

The next layer down is integration or sometimes called service tests. These check whether or not our code is properly integrated with an external system, such as a third-party API, the DOM or a database. 

And the bottom and largest layer is unit tests. These cover the individual components - or “units” - of our software. The beauty of unit tests is that they can range in granularity. Large grained tests can work with multiple objects and functions as opposed to small grained which interact directly with one.

There are other interpretations you may have seen like the bug funnel, ice cream cone, hourglass or trophy - but for this post, we’ll focus on the classic pyramid. 

In order to understand how the test layers are sorted, I realized that you need to ask another question first:

Why do we write tests?

Well, when you write software - you get bugs. And bugs cost money - whether it’s through a developer’s time to make the fix or losing users directly as a result. Writing tests though can help you limit the frequency of bugs.

In other words, and in the true nature of capitalism, it’s about money. 

Looking again at the testing pyramid, creator Mike Cohn suggests that we tackle it from bottom to top, so unit tests, integration tests then finally UI tests.

Using this bottom-to-top approach, we can also look at the pyramid in terms of… 
- Faster to slower run times 
- Smaller to larger scopes 
- Increasing complexity 
- Increasing write times 

All that considered, this also makes tests more expensive as you move up the pyramid. Again, it usually comes back to money.

That’s why it’s implied that the larger the layer, the higher percentage of your test suite that layer should take up. Unit tests are smaller and cost less to write and run, so they should have the highest coverage. Whereas UI tests are the most expensive and should be reserved for areas that are high risk or bring a lot of business value. 

But we need to remember that the testing pyramid is one approach to structuring our test suite - and not the only way. 

With more lightweight, automated end-to-end testing frameworks like Cypress or Serenity, many have started questioning if this classic testing pyramid is still best practice.

Another area with a lot of uncertainty is that integration layer. This is because microservice-based architectures are gaining more popularity - and the traditional pyramid doesn’t necessarily account for how to test those products in a meaningful way.

For the work that I’ll be doing for Unmock, our focus is at that integration testing layer. So that’s what we’re going to be looking at in this series. But of course, if you want to see more about unit or UI testing, please leave a comment and let me know. 

I’ve also created a [Gist of resources](https://gist.github.com/carolstran/a46257e37ba6e4d301198d2a8c3304ab) used for this post to help you learn more about the testing pyramid and how to integrate the logic into your own testing suite.

Thank you so much for reading!
