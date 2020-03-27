---
title: TypedDict vs dataclasses in Python — Epic typing BATTLE!
description: Why we migrated from TypedDict to datatypes in our latest project.
author: Mike Solomon
authorLink: https://dev.to/mikesol
tags:
  - python
  - types
  - beginners
---

We recently migrated our [Meeshkan](https://github.com/meeshkan/meeshkan) product from Python [`TypedDict`](https://www.python.org/dev/peps/pep-0589/) to [`dataclasses`](https://docs.python.org/3/library/dataclasses.html). This article explains why. We'll start with a general overview of types in Python. Then, we'll walk through the difference between the two typing strategies with examples. By the end, you should have the information you need to choose the one that's the best fit for your Python project.

## Table of Contents
- [Types in Python](#types-in-python)
- [Classes and `dataclasses`](#classes-and-dataclasses)
  - [Setting up our example](#setting-up-our-example)
  - [Adding type definitions](#adding-type-definitions)
  - [Working with `dataclasses`](#working-with-dataclasses)
- [`TypedDict`](#typeddict)
  - [A brief introduction to duck typing](#a-brief-introduction-to-duck-typing)
  - [Working with `TypedDict`](#working-with-typeddict)
- [Migrating from `TypedDict` to `dataclasses`](migrating-from-typedict-to-dataclasses)
  - [Matching](#matching)
  - [Validation](#validation)
- [Conclusion](#conclusion)

<a name="types-in-python"></a>

## Types in Python

[PEP 484](https://www.python.org/dev/peps/pep-0484/), co-authored by Python's creator Guido van Rossum, gives a rationale for types in Python. He proposes:

> A standard syntax for type annotations, opening up Python code to easier static analysis and refactoring, potential runtime type checking, and (perhaps, in some contexts) code generation utilizing type information.

For me, _static analysis_ is the strongest benefit of types in Python. 

It takes code like this:

```python
# exp.py
def exp(a, b):
 return a ** b

exp(1, "result")
```

Which raises this error at runtime:

```bash
$ python exp.py
  File "./exp.py", line 4, in <module>
    exp(1, "result")
  File "./exp.py", line 2, in exp
    return a ** b
TypeError: unsupported operand type(s) for ** or pow(): 'int' and 'str'
```

And allows you to do this:

```python
# exp.py
def exp(a: int, b: int) -> int:
  return a ** b

exp(1, "result")
```

Which raises this error at _compile time_:

```bash
$ mypy exp.py # pip install mypy to install mypy
exp.py:4: error: Argument 2 to "exp" has incompatible type "str"; expected "int"
Found 1 error in 1 file (checked 1 source file)
```

Types help us catch bugs earlier and reduces the number of unit tests to maintain.

<a name="classes-and-dataclasses"></a>

## Classes and `dataclasses`

Python typing works for classes as well. Let's see how static typing with classes can move two errors from runtime to compile time.

<a name="setting-up-our-example"></a>

### Setting up our example

The following `area.py` file contains a function that calculates the area of a shape using the data provided by two classes:

```python
# area.py
class RangeX:
  left: float
  right: float

class RangeY:
  up: float
  down: float

def area(x, y):
  return (x.right - x.lefft) * (y.right- y.left)

x = RangeX(); x.left = 1; x.right = 4
y = RangeY(); y.down = -3; y.up = 6
print(area(x, y))
```

The first runtime error this produces is:

```bash
$ python area.py
Traceback (most recent call last):
  File "./area.py", line 14, in <module>
    print(area(x, y))
  File "./area.py", line 10, in area
    return (x.right - x.lefft) * (y.right- y.left)
AttributeError: 'RangeX' object has no attribute 'lefft'
```

Yikes! Bitten by a spelling mistake in the `area` function. Let's fix that by changing `lefft` to `left`. 

We run again, and:

```bash
$ python area.py
Traceback (most recent call last):
  File "./area.py", line 14, in <module>
    print(area(x, y))
  File "./area.py", line 10, in area
    return (x.right - x.left) * (y.right- y.left)
AttributeError: 'RangeY' object has no attribute 'right'
```

Oh no! In the definition of `area`, we have used `right` and `left` for y instead of `up` and `down`. This is a common copy-and-paste error. 

Let's change the `area` function again so that the final function reads:

```python
def area(x, y):
  return (x.right - x.left) * (y.up - y.down)
```

After running our code again, we get the result of `27`. This is what we would expect the area of a 9x3 rectangle to be.

<a name="adding-type-definitions"></a>

### Adding type definitions

Now let's see now how Python would have caught _both_ of these errors using types at _compile time_.  

We first add type definitions to the `area` function:

```python
# area.py
class RangeX:
 left: float
 right: float

class RangeY:
 up: float
 down: float

def area(x: RangeX, y: RangeY) -> float:
 return (x.right - x.lefft) * (y.right - y.left)

x = RangeX(); x.left = 1; x.right = 4
y = RangeY(); y.down = -3; y.up = 6
print(area(x, y))
```

Then we can run our `area.py` file using [`mypy`](https://mypy.readthedocs.io/en/stable/), a static type checker for Python:

```bash
$ mypy area.py
area.py:10: error: "RangeX" has no attribute "lefft"; maybe "left"?
area.py:10: error: "RangeY" has no attribute "right"
area.py:10: error: "RangeY" has no attribute "left"
Found 3 errors in 1 file (checked 1 source file)
```

It spots the same three errors before we even run our code.

<a name="working-with-dataclasses"></a>

### Working with `dataclasses`

In our previous example, you'll notice that the assignment of attributes like `x.left` and `x.right` is clunky. Instead, what we'd like to do is `RangeX(left = 1, right = 4)`. The `dataclass` decorator makes this possible. It takes a `class` and turbocharges it with a constructor and several other useful methods. 

Let's take our `area.py` file and use the `dataclass` decorator.

```python
# area.py
from dataclasses import dataclass

@dataclass # <----- check this out
class RangeX:
  left: float
  right: float

@dataclass # <----- and this
class RangeY:
  up: float
  down: float

def area(x: RangeX, y: RangeY) -> float:
  return (x.right - x.left) * (y.up - y.down)

x = RangeX(left = 1, right = 4)
y = RangeY(down = -3, up = 6)

print(area(x, y))
```

According to `mypy`, our file is now error-free:

```bash
$ mypy area.py
Success: no issues found in 1 source file
```

And it gives us the expected result of `27`:

```python
$ python area.py
27
```

`class` and `dataclass` are nice ways to represent objects as types. They suffer from several limitations, though, that `TypedDict` solves.

<a name="typeddict"></a>

## `TypedDict`

But first...

<a name="a-brief-introduction-to-duck-typing"></a>

### A brief introduction to duck typing

In the world of types, there is a notion called [duck typing](https://realpython.com/lessons/duck-typing/). Here's the idea: If an object looks like a duck and quacks like a duck, it's a duck. 

For example, take the following JSON:

```json
{
  "name": "Stacey O'Hara",
  "age": 42,
}
```

In a language with duck typing, we would define a type with the attributes `name` and `age`. Then, _any_ object with these attributes would correspond to the type. 

In Python, classes aren't duck typed, which leads to the following situation:

```python
# person_vs_comet.py
from dataclasses import dataclass

@dataclass
class Person:
  name: str
  age: int

@dataclass
class Comet:
  name: str
  age: int

Person(name="Haley", age=42000) == Comet(name="Haley", age=42000) # False
```

This example should return `False`. But without duck typing, JSON or `dict` versions of `Comet` and `Person` would be the same. 

We can see this when we check our example with [`asdict`](https://docs.python.org/3/library/dataclasses.html#dataclasses.asdict):

```python
from dataclass import asdict

asdict(Person(name="Haley", age=42000)) == asdict(Comet(name="Haley", age=42000)) # True
```

Duck typing helps us encode classes to another format without losing information. That is, we can create a field called `type` that represents a `"person"` or a `"comet"`.

<a name="working-with-typeddict"></a>

### Working with `TypedDict`

`TypedDict` brings duck typing to Python by allowing `dict`s to act as types.

```python
# person_vs_comet.py
from typing import TypedDict

class Person(TypedDict):
  name: str
  age: int

class Comet(TypedDict):
  name: str
  age: int

Person(name="Haley", age=42000) == Comet(name="Haley", age=42000) # True
```

An extra advantage of this approach is that it treats `None` values as optional. 

Let's imagine, for example, that we extended `Person` like so:

```python
# person.py
from dataclasses import dataclass
from typing import Optional

@dataclass
class Person:
  name: str
  age: int
  car: Optional[str] = None
  bike: Optional[str] = None
  bank: Optional[str] = None
  console: Optional[str] = None

larry = Person(name="Larry", age=25, car="Kia Spectra")
print(larry)
```

If we print a `Person`, we'll see that the `None` values are still present: 

```bash
Person(name='Larry', age=25, car='Kia Spectra', bike=None, bank=None, console=None)
```

This feels a bit off - it has lots of explicit `None` fields and gets verbose as you add more optional fields. Duck typing avoids this by only adding existing fields to an object.

So let's rewrite our `person.py` file to use `TypedDict`:

```python
# person.py
from typing import TypedDict

class _Person(TypedDict, total=False):
  car: str
  bike: str
  bank: str
  console: str

class Person(_Person):
  name: str
  age: int

larry: Person = dict(name="Larry", age=25, car="Kia Spectra")
print(larry)
```

Now when we print our `Person`, we only see the fields that exist:

```bash
Person(name='Larry', age=25, car='Kia Spectra')
```
<a name="migrating-from-typeddict-to-dataclasses"></a>

## Migrating from `TypedDict` to `dataclasses`

You may have guessed by now, but generally, we prefer duck typing over classes. For this reason, we're very enthusiastic about `TypedDict`. That said, in [Meeshkan](https://github.com/meeshkan/meeshkan), we migrated from `TypedDict` to `dataclasses` for several reasons. Throughout the rest of this article, we'll explain why we made the move.

The two reasons we migrated from `TypedDict` to `dataclasses` are matching and validation:
- **Matching** means determining an object's class when there's a union of several classes.
- **Validation** means making sure that unknown data structures, like JSON, will map to a class.

<a name="matching"></a>

### Matching

Let's use the `person_vs_comet.py` example from earlier to see why `class` is better at matching in Python.

```python
# person_vs_comet.py
from dataclasses import dataclass
from typing import Union

@dataclass
class Person:
 name: str
 age: int

@dataclass
class Comet:
 name: str
 age: int

def i_am_old(obj: Union[Person, Commet]) -> bool:
  return obj.age > 120 if isinstance(obj, Person) else obj.age > 1000000000

print(i_am_old(Person(name="Spacey", age=1000))) # True
print(i_am_old(Comet(name="Spacey", age=1000))) # False
```

In Python, `isinstance` can discriminate between union types. This is critical for most real-world programs that support several types. 

In [Meeshkan](https://github.com/meeshkan/meeshkan), we work with union types all the time in [OpenAPI](https://www.openapis.org/). For example, most object specifications can be a `Schema` _or_ a `Reference` to a schema. All over our codebase, you'll see `isinstance(r, Reference)` to make this distinction.

`TypedDict` doesn't work with `isinstance` - and for good reason. Under the hood, `isinistance` looks up the class name of the Python object. That's a very fast operation. With duck typing, you'd have to inspect the whole object to see if "it's a duck." While this is fast for small objects, it is too slow for large objects like OpenAPI specifications. The `isinstance` pattern has sped up our code _a lot_.

<a name="validation"></a>

### Validation

Most code receives input from an external source, like a file or an API. In these cases, it's important to verify that the input is usable by the program. This often requires mapping the input to an internal class. With duck typing, after the validation step, this requires a call to `cast`.

The problem with `cast` is that it allows incorrect validation code to slip through. In the following `person.py` example, there is an intentional mistake. It asks if `isinstance(d['age'], str)` even though `age` is an `int`. `cast`, because it's so permissive, won't catch this error:

```python
# person.py
from typing import cast, TypedDict, Optional

class Person(TypedDict):
  name: str
  age: Optional[int]

def to_person(d: dict) -> Person:
  if ('name' in d) and isinstance(d['name'], str) and (('age' not in d) or (( 'age' in d) and (isinstance(d['age'], str))):
    return cast(d, Person) # this will work at runtime even though it shouldn't
  raise ValueError('d is not a Person')
```

However, a `class` will only ever work with a constructor. So this will catch the error at the moment of construction:

```python
# person.py
from typing import Optional
from dataclasses import dataclass

@dataclass
class Person:
 name: str
 age: Optional[int] = None

def to_person(d: dict) -> Person:
  if ('name' in d) and isinstance(d['name'], str) and (('age' not in d) or (( 'age' in d) and (isinstance(d['age'], str))):
   # will raise a runtime error for age when age is a str
   # because it is `int` in `Person` 
   return Person(**to_person)

 raise ValueError('d is not a Person')
```

The above `to_person` will raise an error, whereas the `TypedDict` version won't. This means that, when an error arises, it will happen later down the line. These types of errors are much harder to debug.

When we changed from `TypedDict` to `dataclasses` in [Meeshkan](https://github.com/meeshkan/meeshkan), some tests started to fail. Looking them over, we realized that they never should have succeeded. Their success was due to the use of `cast`, whereas the `class` approach surfaced several bugs.

<a name="conclusion"></a>

## Conclusion

While we love the idea of `TypedDict` and duck typing, it has practical limitations in Python. This makes it a poor choice for most large-scale applications. We would recommend using `TypedDict` in situations where you're already using `dicts`. In these cases, `TypedDict` can add a degree of type safety without having to rewrite your code. For a new project, though, I'd recommend using `dataclasses`. It works better with Python's type system and will lead to more resilient code.

Disagree with us? Are there any strengths or weaknesses of either approach that we're missing? Leave us a comment!