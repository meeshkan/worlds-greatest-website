---
title: Word embeddings with code2vec, GloVe and spaCy
description: How to choose a word embeddings algorithm based on your use case.
author: Maria Malitckaya
authorLink: https://medium.com/@maria.malitckaya
canonicalURL: https://towardsdatascience.com/word-embeddings-with-code2vec-glove-and-spacy-5b26420bf632
tags:
  - datascience
  - machinelearning
  - python
---

_This article was originally published in [Towards Data Science]({{ canonicalURL }}) on March 18, 2020._

One powerful way to improve your machine learning model is to use [word embeddings](https://en.wikipedia.org/wiki/Word_embedding). With word embeddings, you're able to capture the context of the word in the document and then find semantic and syntactic similarities.

In this post, we'll cover an unusual application of the word embeddings techniques. We'll try to find the best word embedding techniques for [OpenAPI specifications](https://swagger.io/specification/). As anexample of openAPI specification , we'll use a free source of OpenAPI specifications from [apis-guru](https://apis.guru/)😎.

The biggest challenge is that OpenAPI specifications are neither a natural language or code. But this also means that we're free to use any of the available embeddings models. For this experiment, we'll look into three possible candidates that may work: code2vec, GloVe, and spaCy. 

[code2vec](https://urialon.cswp.cs.technion.ac.il/wp-content/uploads/sites/83/2018/12/code2vec-popl19.pdf) is a neural model that learns analogies relevant to source code. The model was trained on the Java code database but you can apply it to any codebase.

Then there's [GloVe](https://nlp.stanford.edu/projects/glove/). GloVe is a commonly used algorithm for natural language processing (NLP). It was trained on Wikipedia and [Gigawords](https://github.com/harvardnlp/sent-summary). 

Finally, we have [spaCy](https://spacy.io/usage/vectors-similarity). While spaCy was only recently developed, the algorithm already has a reputation for being the fastest word embedding in the world. 

Let's see which of these algorithms is better for OpenAPI datasets and which one works faster for OpenAPI specifications👀. I divided this post into seven sections, each of them will contain code examples and some tips for future use, plus a conclusion.

1. [Download the dataset](#1-download-the-dataset)
2. [Download vocabularies](#2-download-vocabularies)
3. [Extract the field names](#3-extract-the-field-names)
4. [Tokenize keys](#4-tokenize-keys)
5. [Create a dataset of the field names](#5-create-a-dataset-of-the-field-names)
6. [Test embeddings](#6-test-embeddings)
7. [Conclusion](#conclusion)

Now, we can start.

<a name="1-download-the-dataset"></a>
## 1. Download the dataset✅

First, we'll need to download the whole [apis-guru](https://apis.guru/) database. 

You'll notice that most of the apis-guru specifications are in the Swagger 2.0 format. But.. the latest version of OpenAPI specification is [OpenAPI 3.0](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.3.md). So let's convert the whole dataset to this format by using Unmock scripts! You can follow the instructions for how to complete this on the [unmock-openapi-scripts README](https://github.com/meeshkan/unmock-openapi-scripts/blob/master/README.md).

This may take a while (you won’t become 🧓, but we’re talking hours ⏰) and in the end, you will get a big dataset with various specifications🎓. 

<a name="2-download-vocabularies"></a>
## 2. Download vocabularies✅

### code2vec
1. Download [Code2vec](https://github.com/tech-srl/code2vec) model from their github page. Follow instructions in README.md in the section Quickstart and then export trained tokens.
2. Load by using the [gensim](https://pypi.org/project/gensim/) library.

```python
model = word2vec.load_word2vec_format(vectors_text_path, binary=False)
```
### GloVe
1. Download one of the [GloVe](https://nlp.stanford.edu/projects/glove/) vocabularies from the website. We took the largest one because then there's a higher chance of it finding all of our words. You can choose where you want to download it but, for convenience, it's better to store it in the working directory. 
2. Load GloVe vocabulary manually.
```python
embeddings_dict = {}
with open("../glove/glove.6B.300d.txt", 'r', encoding="utf-8") as f:
    for line in f:
        values = line.split()
        word = values[0]
        vector = np.asarray(values[1:], "float32")
        embeddings_dict[word] = vector
```
### spaCy
Load the large [spaCy](https://spacy.io/usage/vectors-similarity) vocabulary:
```python
nlp = spacy.load('en_core_web_lg').
```

<a name="3-extract-the-field-names"></a>
## 3. Extract the field names✅

The whole list of OpenAPI specification names can be obtained from the `scripts/fetch-list.sh` file or by using the following function (for Windows):
```python
def getListOfFiles(dirName):
    listOfFile = os.listdir(dirName)
    allFiles = list()
    for entry in listOfFile:
        fullPath = posixpath.join(dirName, entry)
        if posixpath.isdir(fullPath):
            allFiles = allFiles + getListOfFiles(fullPath)
        else:
            allFiles.append(fullPath)
                
    return allFiles
```
Another big deal is to get the field names out of our OpenAPI specifications. For this purpose, we'll use [openapi-typed library](https://pypi.org/project/openapi-typed-2/). 

Let's define a `get_fields` function that takes the OpenAPI specification and returns a list of field names:
```python
def get_fields_from_schema(o: Schema) -> Sequence[str]:
    return [
        *(o['properties'].keys() if ('properties' in o) and (type(o['properties']) == type({})) else []),
        *(sum([
            get_fields_from_schema(schema) for schema in o['properties'].values() if not ('$ref' in schema) and type(schema) == type({})], []) if ('properties' in o) and ($        *(get_fields_from_schema(o['additionalProperties']) if ('additionalProperties' in o) and (type(o['additionalProperties']) == type({})) else []),
        *(get_fields_from_schema(o['items']) if ('items' in o) and  (type(o['items'] == type({}))) else []),
    ]

def get_fields_from_schemas(o: Mapping[str, Union[Schema, Reference]]) -> Sequence[str]:
    return sum([get_fields_from_schema(cast(Schema, maybe_schema)) for maybe_schema in o.values() if not ('$ref' in maybe_schema) and (type(maybe_schema) == type({}))], [])


def get_fields_from_components(o: Components) -> Sequence[str]:
    return [
        *(get_fields_from_schemas(o['schemas']) if 'schemas' in o else []),
            ]                                                                                                                                                                       

def get_fields(o: OpenAPIObject) -> Sequence[str]:
    return [
        *(get_fields_from_components(o['components']) if 'components' in o else []),
    ] 
```

<a name="4-tokenize-keys"></a>
Congrats! Now our dataset is ready .

##  4. Tokenize keys✅
The field names may contain punctuation, such as `_` and `-` symbols, or camel case words. We can chop these words up into pieces called tokens.  

The following `camel-case` function identifies these camel case words. First, it checks if there's any punctuation. If yes, then it's not a camel case. Then, it checks if there are any capital letters inside the word (excluding the first and last characters).

```python
def camel_case(example):      
    if  any(x in example for x  in string.punctuation)==True:
        return False
    else:
        if any(list(map(str.isupper, example[1:-1])))==True:
            return True
        else:
            return False
```
The next function (`camel_case_split`) splits the camel case word into pieces. For this purpose, we should identify the upper case and mark places where the case changes. The function returns a list of the words after splitting. For example, the field name `BodyAsJson` transforms to a list `['Body', 'As', 'Json']`. 
```python
def camel_case_split(word):
    idx = list(map(str.isupper, word))
    case_change = [0]
    for (i, (x, y)) in enumerate(zip(idx, idx[1:])):
        if x and not y:  
            case_change.append(i)
        elif not x and y:  
            case_change.append(i+1)
    case_change.append(len(word))
    return [word[x:y] for x, y in zip(case_change, case_change[1:]) if x < y]
```
This `camel_case_split` function is then used in the following tokenization algorithm. Here, we first check if there's punctuation in the word. Then, we split the word into pieces. There's a chance that these pieces are camel case words. If this is the case, we can split it into smaller pieces. Finally, after splitting each element, the entire list is converted to lower case. 

```python
def tokenizer(mylist):
    tokenized_list=[]
    for word in mylist:

        if '_'  in word:
            splitted_word=word.split('_')
            for elem in splitted_word:
                if camel_case(elem):
                    elem=camel_case_split(elem)
                    for el1 in elem:
                        tokenized_list.append(el1.lower())
                else:    
                    tokenized_list.append(elem.lower())
        elif '-' in word:
            hyp_word=word.split('-')
            for i in hyp_word:
                if camel_case(i):
                    i=camel_case_split(i)
                    for el2 in i:
                        tokenized_list.append(el2.lower())
                else: 
                    tokenized_list.append(i.lower())
        elif camel_case(word):
            word=camel_case_split(word)
            for el in word:
                tokenized_list.append(el.lower())
        else:
            tokenized_list.append(word.lower())
    return(tokenized_list)
tokenizer(my_word)

```

<a name="5-create-a-dataset-of-the-field-names"></a>

## 5. Create a dataset of the field names✅

Now, let's create a big dataset with fields name from all the specifications. 

The following  `dict_dataset` function takes a list of the file's name and path and opens each specification file.  For each file, the `get_field` function returns a list of the field names. Some of the field names may repeat in one specification. To get rid of this repetition, let's convert the list of field names from the list to the dictionary and back by using `list(dict.fromkeys(col))`.Then we can tokenize the list. In the end, we create a dictionary with a file name as a key and list of field names as a value. 

```python
def dict_dataset(datasets):
    dataset_dict={}
    for i in datasets:
        with open(i, 'r') as foo:
            col=algo.get_fields(yaml.safe_load(foo.read()))
            if col:
                mylist = list(dict.fromkeys(col))
                tokenized_list=tokenizer(mylist)
                dataset_dict.update({i: tokenized_list})
            else:
                continue
    return (dataset_dict)
```

<a name="6-test-embeddings"></a>

## 6. Test embeddings✅
### code2vec and GloVe

Now we can find out-of-vocabulary words(not_identified_c2v) and count the percentage of these words for code2vec vocabulary.
```python
not_identified_c2v=[]
count_not_indent=[]
total_number=[]

for ds in test1:
    count=0
    for i in data[ds]:
        if not i in model:
            not_identified_c2v.append(i)
            count+=1
    count_not_indent.append(count)
    total_number.append(len(data[ds]))

total_code2vec=sum(count_not_indent)/sum(total_number)*100
```
The previous code will also work for GloVe. 
### spaCy

spaCy vocabulary is different, so we need to modify our code accordingly:
```python
not_identified_sp=[]
count_not_indent=[]
total_number=[]

for ds in test1:
    count=0
    for i in data[ds]:
        f not i in nlp.vocab:
                count+=1
                not_identified_sp.append(i)
    count_not_indent.append(count)
    total_number.append(len(data[ds]))

#    print(ds, count, len(data[ds]))
        
total_spacy=sum(count_not_indent)/sum(total_number)*100
```
The resulting percentages of not identified words are `3.39, 2.33, 2.09` for code2vec, GloVe, and spaCy, respectively. Since the percentages are relatively small and similar for each algorithm, we can make another test.

First, let's create a test dictionary with the words that should be similar across all API specifications:
```python
test_dictionary={'host': 'server',
'pragma': 'cache',
'id': 'uuid',
'user': 'client',
'limit': 'control',
'balance': 'amount',
'published': 'date',
'limit': 'dailylimit',
'ratelimit': 'rate',
'start': 'display',
'data': 'categories'}  
```
For GloVe and code2vec, we can use the `similar_by_vector` method provided by the gensim library. spaCy doesn't implement this method yet - but we can find the most similar words on our own. 

To do this, we need to format the input vector for use in the distance function. We'll create each key in the dictionary and check whether the corresponding value is in the 100 most similar words. To start, we'll format the vocabulary for use in a `distance.cdist` function. This is the function that computes the distance between each pair of vectors in the vocabulary. Then, we'll sort the list from the smallest distance to largest and take the first 100 words.

```python
from scipy.spatial import distance

for k, v in test_dictionary.items():
    input_word = k
    p = np.array([nlp.vocab[input_word].vector])
    closest_index = distance.cdist(p, vectors)[0].argsort()[::-1][-100:]
    word_id = [ids[closest_ind] for closest_ind in closest_index]
    output_word = [nlp.vocab[i].text for i in word_id]
    #output_word
    list1=[j.lower() for j in output_word]
    mylist = list(dict.fromkeys(list1))[:50]
    count=0
    if test_dictionary[k] in mylist:
        count+=1
        print(k,count, 'yes')
    else:
        print(k, 'no')
```
The results are summarized in the following table. spaCy shows that the word ‘client’ is in the first 100 most similar words for the word ‘user’. It is useful for almost all of the OpenAPI specifications and can be used for the future analysis of OpenAPI specification similarity. The vector for the word ‘balance’ is close to the vector for the word ‘amount’. We find it especially useful for payment API.

<a name="conclusion"></a>

## Conclusion

We've tried three different word embeddings algorithms for OpenAPI specification. Despite the fact that all three perform quite well on this dataset, an extra comparison of the most similar words shows that spaCy works better for our case. 

spaCy is faster than other algorithms. The spaCy vocabulary can be upload five times faster in comparison to GloVe or code2vec vocabularies. However, the lack of built-in functions - such as `similar_by_vector` and `similar_word` - is an obstacle when using this algorithm.

Also, the fact that spaCy works well with our dataset doesn't mean that spaCy will be better for every dataset in the world. So, feel free to try different word embeddings for your own dataset and let us know which one works better for you in the comments!

Thanks for reading! 
