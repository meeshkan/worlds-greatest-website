---
title: Let It Snow!
description: A stocking stuffer bringing you open-source cheer.
author: Mike Solomon
authorLink: https://dev.to/mikesol
date: 2019-12-26
tags:
  - lilypond
  - scheme
  - vocalmusic
---

[![YouTube thumbnail](https://img.youtube.com/vi/Dnh-YGmpMuk/0.jpg)](https://www.youtube.com/watch?v=Dnh-YGmpMuk)

I've been arranging a lot of things over the past two years as the CEO of Meeshkan — meetups, obligatory insurances, flights, pizza deliveries. However, one thing I haven't gotten the chance to arrange much is music. Until now! This holiday season, I took the time to make a six-voice arrangement of _Let It Snow!_ by Sammy Cahn and Jule Styne. I have [open-sourced](https://github.com/meeshkan/let-it-snow) the [arrangement](https://github.com/Meeshkan/let-it-snow/releases/download/v0.0.0/let-it-snow.pdf) for folks to sing as they go caroling.  In addition to a PDF, this project contains the [LilyPond markdown](https://github.com/Meeshkan/let-it-snow/blob/ebc4702e8f7cd1f6d3a80d4dc4fbab632ed56d77/let-it-snow.ly
) and the small hack I wrote to get LilyPond to write swing rhythms correctly in the MIDI.

In this article, I'll discuss two facets of this project — the arrangement in LilyPond and the MIDI swing hack (written in Scheme). In doing so, I hope everyone finds a useful stocking stuffer. Ho ho ho!

# LilyPond

Created by two Dutch musicians in 1996, GNU [LilyPond](https://lilypond.org) is one of my favorite FOSS projects.  It is currently maintained by a passionate and vibrant community of musicians and music enthusiasts.

LilyPond has a similar markdown language to LaTeX.  In _Let It Snow!_, for example, the following input syntax:

```latex
gis8 e \times 2/3 { gis b cis } b cis4 b8
```

generates the following result in measure 52, voice two of the PDF:

![An example of LilyPond notation](https://thepracticaldev.s3.amazonaws.com/i/f2c1g72jtumhetusowjf.png)


The other elements of the syntax are all explained in LilyPond's amazing [documentation](http://lilypond.org/manuals.html), which exists mostly due to a heroic effort by Graham Percival. For example, Let It Snow! contains [key signatures](https://github.com/Meeshkan/let-it-snow/blob/ebc4702e8f7cd1f6d3a80d4dc4fbab632ed56d77/let-it-snow.ly#L14), [tempo indications](https://github.com/Meeshkan/let-it-snow/blob/ebc4702e8f7cd1f6d3a80d4dc4fbab632ed56d77/let-it-snow.ly#L15), [final bar lines](https://github.com/Meeshkan/let-it-snow/blob/ebc4702e8f7cd1f6d3a80d4dc4fbab632ed56d77/let-it-snow.ly#L95), [slurs](https://github.com/Meeshkan/let-it-snow/blob/ebc4702e8f7cd1f6d3a80d4dc4fbab632ed56d77/let-it-snow.ly#L28), and [partial measures](https://medium.com/r/?url=https%3A%2F%2Fgithub.com%2FMeeshkan%2Flet-it-snow%2Fblob%2Febc4702e8f7cd1f6d3a80d4dc4fbab632ed56d77%2Flet-it-snow.ly%23L10). I have yet to run into something that LilyPond cannot do with some finagling.

The top-level organization of my LilyPond files tends to be like this:

```latex
\version "2.19.83" % version number, required
voiceOne = \relative c' {
  % some music
}
myScore = \new ChoralStaff << % or PianoStaff, or whatever
  \new Staff \new Voice \voiceOne
>>
\header { %{ title, composer, etc %} }
\score { \layout { \myScore %{ some options for typesetting %} } }
\score { \midi { \myScore %{ some options for the midi %} } }
% various hacks
```

Start with a version number, then the music and optionally lyrics, then smoosh everything together into a score, then provide options for typesetting and for the MIDI if needed. Even though LilyPond's documentation is second to none, top-level organization of LilyPond files is a pain for newbies, and I find that pilfering other people's stuff is the best way to avoid tedious gotchyas and get that "wow" effect of a score on first compile. To see a few more use cases in vocal music, you can check out the repo for [Sit Ozfårs Wysr](https://github.com/mikesol/saw). If you're a pianist, Google Keith O'Hara. If you're doing orchestral music, check out Werner Lemberg. Contemporary music? [Trevor Bača](http://abjad.mbrsi.org/). Check out these people's open-source scores, use them to make your own, and write great things!


# It Don't Mean a Thing If It Ain't Got That…

Swing.

LilyPond, without any coaxing, will generate a MIDI in straight-eighths and no swing, which is great for Bach, Buxtehude, Berstein, Beethoven, Brahms, Bruckner, and Bellini but not so great for Basie, Baker and  Brubeck. There are many tricks one can use to make Lily swing, but they tend to be all-or-nothing, meaning that they will act on the global tempo map, which means that unswung parts will be ignored. This is particularly annoying when working with jazz arrangements that contain tuplets, which should never be swung.

To get around this, I wrote an ugly [hack](https://github.com/Meeshkan/let-it-snow/blob/ebc4702e8f7cd1f6d3a80d4dc4fbab632ed56d77/let-it-snow.ly#L849). But unlike many of my other hacks, this one _works_. My initial goal was to write it in a functional style, but for some reason that didn't pan out, so I used global variables to store tempo information. If anyone can see why the `fold` command isn't folding durations properly, please let me know. With that caveat, let's see how the sausage is made!

First, for anyone doing wholesale music manipulation in LilyPond, start by [repurposing the naturalizeMusic example on this page](http://lilypond.org/doc/v2.18/Documentation/notation/changing-multiple-pitches
). I've copied it below as well. It is stable, well written, and provides a useful template for most tweaking you'll need to do on a score.

```scheme
#(define (naturalize-pitch p)
   (let ((o (ly:pitch-octave p))
         (a (* 4 (ly:pitch-alteration p)))
         ;; alteration, a, in quarter tone steps,
         ;; for historical reasons
         (n (ly:pitch-notename p)))
     (cond
      ((and (> a 1) (or (eq? n 6) (eq? n 2)))
       (set! a (- a 2))
       (set! n (+ n 1)))
      ((and (< a -1) (or (eq? n 0) (eq? n 3)))
       (set! a (+ a 2))
       (set! n (- n 1))))
     (cond
      ((> a 2) (set! a (- a 4)) (set! n (+ n 1)))
      ((< a -2) (set! a (+ a 4)) (set! n (- n 1))))
     (if (< n 0) (begin (set! o (- o 1)) (set! n (+ n 7))))
     (if (> n 6) (begin (set! o (+ o 1)) (set! n (- n 7))))
     (ly:make-pitch o n (/ a 4))))

#(define (naturalize music)
   (let ((es (ly:music-property music 'elements))
         (e (ly:music-property music 'element))
         (p (ly:music-property music 'pitch)))
     (if (pair? es)
         (ly:music-set-property!
          music 'elements
          (map (lambda (x) (naturalize x)) es)))
     (if (ly:music? e)
         (ly:music-set-property!
          music 'element
          (naturalize e)))
     (if (ly:pitch? p)
         (begin
           (set! p (naturalize-pitch p))
           (ly:music-set-property! music 'pitch p)))
     music))

naturalizeMusic =
#(define-music-function (parser location m)
   (ly:music?)
   (naturalize m))
```

In LilyPond, a score is represented as a Lisp list containing an arboreal structure of musical information. In the example above, `naturalizeMusic` is the top-level entry point that behaves like a LaTeX macro. Then, the function `naturalize` is a recursive function that acts on lists of elements, individual notes, and individual pitches of notes, drilling down through the tree until it gets to pitches. In the case of _Let It Snow!_, I do the same thing with [rhythms](https://github.com/Meeshkan/let-it-snow/blob/ebc4702e8f7cd1f6d3a80d4dc4fbab632ed56d77/let-it-snow.ly#L884). You can use the same strategy it with articulations, dynamics, or slurs, and the general pattern will always be the same. Lastly, `naturalize-pitch` actually does the heavy lifting on the pitches. In my version, the [`swing-duration`](https://github.com/Meeshkan/let-it-snow/blob/ebc4702e8f7cd1f6d3a80d4dc4fbab632ed56d77/let-it-snow.ly#L851) function acts on a single duration, making it swing if it is contains an eighth note and otherwise leaving it untouched. The result is unswung tuplets and swung eighth notes coexisting in the same MIDI. w00t!

# Parting Shot

Enjoy _Let It Snow!_ The supporting materials talked about in this article are for anyone wishing to do their own arranging, coding, singing, or mixing. A big thank you to Timo Mäkelä for the editing and mixing, [Jiffel](https://www.jiffel.com/) for the facility, [Bill Hare](http://billhare.tv) for mixing and mastering, Juuso Westerlund, and shout outs to Gustav Schulman, Maria Schulman and Matti Kari for helping find great locations for filming. I wish you all Happy Holidays and a Happy Roaring 20s!
