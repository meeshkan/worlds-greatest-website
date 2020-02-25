---
title: Covariance and contravariance in generic types 
description: With Python and corgis.
date: 2020-02-09
author: Kimmo Sääskilahti
authorLink: https://dev.to/ksaaskil
tags:
  - posts
  - python
  - generics
  - corgis
---

Static typing is awesome. It helps to detect bugs, acts as in-code documentation and makes development more enjoyable. Recently I've started to use Python's [typing](https://docs.python.org/3/library/typing.html) module to add static typing to all of my Python projects. Python's typing system may not be as as powerful as one might hope, but I think once you go typed, you don't go back.

It is, however, easy to run into non-intuitive errors when defining types for generic types such as lists and dictionaries. Assume, for example, that a `DogContainer` takes a [List](https://docs.python.org/3/library/typing.html#typing.List) of `Dog`s in the constructor:

```python
from typing import List

class Dog:
    ...

class DogContainer:

    def __init__(self, dogs: List[Dog]):
        self.dogs = dogs
```

Now let's add some corgis to the container:

```python
class Corgi(Dog):
    ...

corgis: List[Corgi] = [Corgi(), Corgi()]
container = DogContainer(dogs=corgis)  # ERROR!
```

Type-checker raises the following error:

> Argument of type 'List[Corgi]' cannot be assigned to parameter 'dogs' of type 'List[Dog]': 'Corgi' is incompatible with 'Dog'.

Why doesn't this work? Surely one can substitute a list of corgis for a list of dogs?

## Covariance

Let's step back and ponder why we think we can substitute `List[Corgi]` for `List[Dog]`. Because `Corgi` is a subtype of `Dog` (we write `Corgi <: Dog`, meaning we can use an instance of `Corgi` wherever an instance of `Dog` is expected), we think it should follow that `List[Corgi] <: List[Dog]`. This property is called _covariance_.

> Generic class `C[T]` is covariant in type variable `T` if the following holds: `A <: B ⇒ C[A] <: C[B]`

We saw above that `List[Corgi]` is not a subtype of `List[Dog]`. Therefore, `List` is _not_ covariant in its type variable.

Why is `List` not covariant? The problem is that one can add new objects to `List`, i.e., it's mutable. Or to put it another way, `List` is not covariant because it acts as a _sink_ of its type variable. Think of the following code:

```python
class StBernard:
    ...

def do_stuff(dogs: List[Dog]) -> None:
    """Function that secretly adds Beethoven to the input list.
    """
    dogs.append(StBernard(name="Beethoven"))

corgis: List[Corgi] = ...
do_stuff(corgis)
last_corgi = corgis.pop()  # BOOM, type-safety broken! You think you have a corgi but you have Beethoven
```

The problem here is the `append` method. What if we removed any methods from `List` that make it mutable? That would essentially give us a `Sequence`, an immutable list.

`Sequence` is different from `List` in that it's a pure _source_ of data. Intuitively, it is clear that any piece of code expecting a source of dogs would be happy to receive a source of corgis instead. Therefore, we can state that

> `A <: B` ⇒ `Sequence[A] <: Sequence[B]`

Therefore, `Sequence[T]` is covariant in `T`. Another example of an immutable container is `Mapping`, a read-only version of `Dict`.

## Pure sources are covariant

Let us generalize the previous discussion to the following rule of thumb:

> If a generic class `C[T]` is a pure source of instances of type `T`, it is covariant in `T`.

Why are sources covariant? Assume you have `A <: B`. Now imagine you have any code that depend on `Source[B]`. Can you substitute `Source[A]`? Yes, because `Source[A]` produces instances of type `A` that are valid instances of `B`.

For example, think of a class `Breeder[T]` that produces dogs of type `T`. Covariance means that `Breeder[Corgi] <: Breeder[Dog]`. In other words, any code expecting a `Breeder[Dog]` would be happy to receive a `Breeder[Corgi]`. This makes sense intuitively.

The following piece of code shows how we could define a `Breeder` class and mark it covariant in its type variable with `covariant=True`:

```python
import abc
from typing import TypeVar

DogType_co = TypeVar('T', bound=Dog, covariant=True)


class Breeder(abc.ABC, Generic[DogType_co]):
    @abc.abstractmethod
    def get(self) -> DogType_co:
        ...


class CorgiBreeder(Breeder[Corgi]):
    def get(self) -> Corgi:
        print("Breeding a corgi")
        return Corgi()


breeder: Breeder[Dog] = CorgiBreeder()  # cast allowed because of covariance
```

## Contravariance

If you look at the code from above where type-safety was broken, you may notice that another way to achieve type-safety would be to prevent reading from `corgis`. In other words, `List` should be _write-only_ or a _sink_.

As a concrete example of a sink, consider the `Photographer` class where the generic type must be a `Dog`:

```python
from typing import Generic,TypeVar

DogType = TypeVar('DogType', bound=Dog)

class Photographer(Generic[DogType_contra]):

    def photograph(self, dog: DogType_co):
        print("Photographing dog")


class CorgiPhotographer(Photographer[Corgi]):
    def photograph(self, corgi: Corgi):
        self.feed_sausage_to(corgi)
        super().photograph(corgi)

    def feed_sausage_to(self, corgi: Corgi):
        print("Feeding sausage to corgi")


class DogPhotographer(Photographer[Dog]):
    def photograph(self, dog: Dog):
        super().photograph(dog)
```

Can we assume `Photographer[Corgi] <: Photographer[Dog]`? This would mean that anywhere we need a dog photographer, we can use a corgi photographer. This is not the case: a corgi photographer cannot photograph a St. Bernard.

However, the inverse does hold: If one needs a photographer of corgis, a photographer of generic dogs definitely can handle the job. Formally, `Photographer[Dog] <: Photographer[Corgi]`.

`Photographer` is an example of a class that is _contravariant_ in its type variable.The formal definition is:

> Generic class `C[T]` is contravariant in type variable `T` if the following holds: `A <: B => C[A] :> C[B]`

The way to mark the class to be contravariant in its type variable is to set `contravariant=True`:

```python
DogType_contra = TypeVar('DogType_contra', bound=Dog, contravariant=True)
```

Thanks to contravariance, we can perform casts as follows:

```python
dog_photographer: Photographer[Corgi] = DogPhotographer()  # Photographer[Dog] <: Photographer[Corgi]
```

## Pure sinks are covariant

`Photographer` is contravariant in its type variable because it's a pure _sink_ for dogs. It does not produce new dogs, but only consumes them (_eww_). We arrive at the following rule of thumb:

> If a generic class `C[T]` is a pure sink of instances of type `T`, it is contravariant in `T`.

Why are sinks covariant? Assume you have `A <: B` and imagine you have any code that depends on `Sink[A]`. Can you substitute a `Sink[B]`? Yes, because `Sink[B]` is prepared to consume any `B` and, because `A` is a subtype of `B`, it can also consume instances of type `A`.

## Invariant types

Generic types that are neither covariant nor contravariant are _invariant_ in their type variables. We saw above that `List` is an example of an invariant generic type.

As another example of an invariant generic type, consider a `RescueShelter[D]` class. An instance of `RescueShelter[D]` accepts new poorly treated dogs of type `D` and delivers them to their new homes.

`RescueShelter` is both a source and a sink of dogs, so it's neither contravariant nor covariant. One cannot substitute `RescueShelter[Corgi]` for `RescueShelter[Dog]`, because `RescueShelter[Corgi]` does not accept dogs other than corgis. Similarly, one cannot substitute `RescueShelter[Dog]` for `RescueShelter[Corgi]`, because a person looking for a corgi from rescue shelter would not be happy to get a St Bernard dog.

This example illustrates the danger of relying too much on intuition. Intuitively, it might seem clear that a rescue shelter of corgis "is" a rescue shelter of dogs, and one might substitute the former for the latter. We saw above that this is only true if the rescue shelter only acts as a source of dogs.

## Conclusion

In conclusion, it's generally easier to work with generic types that are either covariant or contravariant. Next time you define a function or data structure depending on `List` or `Dict`, think carefully if you need to mutate the object. If not, you should probably use `Sequence` or `Mapping` instead. Similarly, if you do not need to read from your generic type, you may want to define it as write-only and mark the type variable as contravariant.

Thanks for reading! If there's anything here that seems wrong or inaccurate, please leave a comment.

> Remember to enjoy corgis [responsibly](https://www.reddit.com/r/corgi/comments/4uusll/is_a_corgi_right_for_me/).