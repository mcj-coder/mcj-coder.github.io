---
title: "HowTo: Creating Strongly Typed Code Using Microsoft.VisualBasic.Collection"
description: ""
pubDate: 2010-08-18
updatedDate: 2010-08-20
tags: ["ektron", "tips"]
source: hugo
originalUrl: "https://codifice.dev/posts/2010-08-18-howto-creating-strongly-typed-code/"
---

One of the 3rd Party CMS’s that I frequently work with (Ektron) has a lot of legacy API code that uses Microsoft.VisualBasic.Collections ( from hereon referred to as ***C***ollection) to pass data into the database.  These API’s methods are slowly being replaced with strongly typed entity style methods, but the most stable and reliable methods use Collections.

  There are many reasons to dislike Collections, but my top ones are:

     * You can’t see the key’s of the values inside – this often leads to Exception led logic 
    * Weakly Typed 
   #### What’s in the Box?  Not being able to see what keys are in a collection is a killer fault, but it’s not too hard to workaround.   Since the Collection class is simply a wrapper for a generic Dictionary (and a couple of ArrayLists – which I’m not particularly bothered about), we can simply use Reflection to crack open the shell and access the sweet Dictionary goodness inside.  

  My preferred method for this is an Extension Method, but a static method will work just as well:

  
```
 
```

**Word of Warning**: this technique relies on the internal implementation of the Collection class remaining the same as in .Net 3.5.  Future (or Past) versions of .Net may need amending – *Reflector** is your friend*.

To use the code simply make sure the Extension’s hosting class (Non-Generic and static) is included in the available namespaces for your code, and call:

```
IDictionary<string, object> dict = coll.ToDictionary();
```

#### Casting Call

Getting the keys in the dictionary is good, but what about making the Collection strongly typed?   Not much I can do about that, I’m afraid.  But I can create a simple(ish) mechanism to map my strongly typed entity (in this case an entity is a simple class made up of methods…also called a DTO) to a collection (and vice-versa) without having to code masses of conversions.

The secret is to create a Custom Attribute which you can use to decorate your entities properties with the collection key value.   We can then use a bit more reflection to automatically populate Collections correctly or create new entity objects from a Collection.

The required Custom Attribute is pretty simple:

```
 
```

*Note the AttributeUsage attribute on the class which limits its scope to properties.*

This can be added to your entities simply as:

```
public string Name { get; set; }
```

If you need to do some fancy type conversions on the item then an internal/private property can be used:

```
 
```

The mapping magic is done using reflection (again with the Extension Methods!):

```
/// Creates the collection.
```

These thinly veiled factory methods can be called inline whenever the 3rd Party API exposes (or requires) a Collection object and converts it into a strongly typed entity with a minimal amount of mapping code:

```
{
```

```
Microsoft.VisualBasic.Collection menuCollection = updatedMenu.CreateCollection(); //replaces ~30 lines of mapping code!
```

Much Neater.

#### Entity?  What Entity?

Of course, if you don’t want/need to map to entity classes then some simpler Extension Methods can be used:

```
/// <summary>
```