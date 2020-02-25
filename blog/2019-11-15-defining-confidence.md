---
title: Defining Confidence in Software Testing
date: 2019-11-15
author: Carolyn Stransky
authorLink: https://twitter.com/carolstran
tags:
  - posts
  - video
  - testing
  - webdev
  - learninpublic
---

📹 _This post is a transcript from our [wtfuzz video series](https://www.youtube.com/watch?v=JC2mbve347c&list=PLRkRCk0XEUGhs2sRL6Ri2a1r5eApbLQLr)._ 📹

[![YouTube thumbnail](https://img.youtube.com/vi/ulUUvBPn4nY/0.jpg)](https://www.youtube.com/watch?v=ulUUvBPn4nY)

So, I’m starting to realize all of the testing vocabulary that I hear people say - or that I even use - but that I don’t actually know how to define.

For example, take my last video about the testing pyramid. Here's something that I said...

"The testing pyramid is defined as a framework for designing a test suite that optimizes for speed and confidence."

Watching it again… I don’t actually know what the “confidence” part really means. I know that when my tests pass, I feel confident - but there’s probably more to it than that. 

So I investigated. 

And for this episode of wtfuzz, we’re going to define the term confidence in context of software testing.

According to the dictionary, yes like the word book, confidence is defined as  “the feeling or belief that one can rely on someone or something.”

Moving over to math, like numbers and symbols and things, they call it the “confidence level interval” - and it’s the percentage of time that a statistical result would be correct if you took a bunch of random samples. Essentially, the percentage says how “sure” you are that something will happen.

With both definitions, there’s that factor of reliability - and that’s true for testing as well. The main difference though is that with software - there isn’t just one definition of confidence.
 
Some, like Stefano Magni, form it into a question: "How can you be sure that the application you're working on works if the tests pass?"

Others, like Brad Thompson, look at it in terms of how much testing we feel we need to execute before we can sign off on anything.

But no matter how you approach it, it comes down to this: Confidence is a measurement of trust. Particularly, the trust that you have in your tests to prove that the product is working as expected. 

So ok, so that’s cool - but how do we measure this trust and feeling of confidence?

Well, in my exploration I found out that there is a mathematical equation for calculating confidence levels.

Confidence Level = 1 – α (alpha)

It looks smart, but… I don’t really know what to do with this. Fortunately, though, many software engineers who came before found systems for measuring confidence. Much like the definition, how you measure confidence can greatly vary. But here are a few ways people are doing it.

### Number of Bugs

There are teams that count bugs because they believe that the more bugs found after a feature is shipped, the lower the confidence.

They ask questions like…
- How bad are the bugs? 
- How many bugs found were fixed? Reopened? Closed? Or deferred?

### Quality of Test Cases 

This looks at exactly _what_ you’re testing for and the total number of test cases you have. 

Higher quality test cases help us know that areas with the most business value (like signups or payment transactions) are working correctly - giving us more confidence in our product. 

### Stability of Test Results

This asks how sure we are that the tests are reliable. 

With this approach, we can ask… 
- What’s the current pass rate like?
- How many test cases failed or are blocked?
- How stable are these results? 

### Code Coverage

Code coverage might be most popular way to measure confidence. It’s the idea that the more tests you have that expand to different parts of your system, the higher the confidence.

How much code coverage an application should have is up for debate, but many resources point to 80% as a target to aim for.

And finally, my personal favorite...

### A Combination of Them All 

Blogger Mike MacDonagh claims that you can have 100% confidence "if all of the in scope requirements have test coverage and all of those tests have passed for the last few test runs."

While I don’t think we can ever reach 100%, I do like that it’s multi-dimensional and looks at a variety of metrics to determine overall confidence. 

### But in the end...

It’s your decision how you measure confidence. The most important thing is that you’re measuring it at all.

Now I’ll turn it over to you, dear viewer: Are there any software testing terms that you aren’t sure about?

As I mentioned earlier, there’s a lot of terms I don’t know - so this “Defining ___” type video might just become recurring in this wtfuzz series. 

Some potential ones from my list: 
- Smoke test
- Scalability
- Blackbox testing
- Functional requirement 

And if there are any you want to know about, please [send an email](mailto:contact@meeshkan.com) and let me know. 

But for now, thank you so much for watching!

You can check out the [Gist of resources](https://gist.github.com/carolstran/9eed93d603146a0fcc1b999c049b1e3d) that I used for this post.

And… yeah. See you next time! 