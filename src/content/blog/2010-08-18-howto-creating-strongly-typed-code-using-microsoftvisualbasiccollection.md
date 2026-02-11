---
title: "HowTo: Creating Strongly Typed Code Using Microsoft.VisualBasic.Collection"
description: "Technical blog post from 2010-08-18"
pubDate: 2010-08-18
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

One of the 3rd Party CMS’s that I frequently work with ([Ektron](http://bit.ly/d0YHh7)) has a lot of legacy API code that uses [Microsoft.VisualBasic.Collection](http://bit.ly/dC9IbU)s ( from hereon referred to as ***C***ollection) to pass data into the database.  These API’s methods are slowly being replaced with strongly typed entity style methods, but the most stable and reliable methods use Collections.

  There are many reasons to dislike Collections, but my top ones are:

     * You can’t see the key’s of the values inside – this often leads to Exception led logic     * Weakly Typed    
## What’s in the Box?
  Not being able to see what keys are in a collection is a killer fault, but it’s not too hard to workaround.   Since the Collection class is simply a wrapper for a generic Dictionary (and a couple of ArrayLists – which I’m not particularly bothered about), we can simply use Reflection to crack open the shell and access the sweet Dictionary goodness inside.  

  My preferred method for this is an Extension Method, but a static method will work just as well:

```csharp
private static FieldInfo KeyNodeHash = typeof(Microsoft.VisualBasic.Collection).GetField("m_KeyedNodesHash", BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.IgnoreCase);
```

```csharp



```csharp
/// 
```

```csharp
/// Converts the  instance to a Dictionary
```

```csharp
/// 
```

```csharp
/// The collection.
```

```csharp
/// 
```

```csharp
public static IDictionarystring, object> ToDictionary(this Microsoft.VisualBasic.Collection collection)
```

```csharp
{
```

```csharp
if (collection == null) throw new ArgumentNullException("collection");
```

```csharp
if (KeyNodeHash == null) throw new NotSupportedException("Expected to find private field m_KeyedNodesHash within Collection implementation");
```

```csharp
IDictionary internalDictionary = KeyNodeHash.GetValue(collection) as IDictionary;
```

```csharp
if (internalDictionary == null) throw new NotSupportedException("Expected private field m_KeyedNodesHash to implement IDictionary");
```

```csharp
Dictionarystring, object> mapped = new Dictionarystring, object>();
```

```csharp
foreach (string key in internalDictionary.Keys)
```

```csharp
{
```

```csharp
object value = internalDictionary[key];
```

```csharp
if (value == null)
```

```csharp
{
```

```csharp
mapped[key] = null;
```

```csharp
}
```

```csharp
else
```

```csharp
{
```

```csharp
mapped[key] = value.GetType()
```

```csharp
.GetField("m_Value", BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.IgnoreCase)
```

```csharp
.GetValue(value);
```

```csharp
}
```

```csharp
}
```

```csharp
return mapped;
```

```csharp



```csharp
}
```

```csharp



```csharp
/* You'll need the following using statements
```

```csharp
using System;
```

```csharp
using System.Collections;
```

```csharp
using System.Collections.Generic;
```

```csharp
using System.Reflection;
```

```csharp
*/
```

**Word of Warning**: this technique relies on the internal implementation of the Collection class remaining the same as in .Net 3.5.  Future (or Past) versions of .Net may need amending – [*Reflector*](http://bit.ly/cUbyio)* is your friend*.

To use the code simply make sure the Extension’s hosting class (Non-Generic and static) is included in the available namespaces for your code, and call:

  
```csharp
Microsoft.VisualBasic.Collection coll = GetCollectionFromSomewhere();
```

```csharp
IDictionarystring, object> dict = coll.ToDictionary();
```

```csharp
foreach (string key in dict.Keys)
```

```csharp
{
```

```csharp
System.Diagnostics.Debug.WriteLine(string.Format(CultureInfo.InvariantCulture, "@{0} = '{1}'", key,dict[key]));
```

```csharp
}
```

## Casting Call

Getting the keys in the dictionary is good, but what about making the Collection strongly typed?   Not much I can do about that, I’m afraid.  But I can create a simple(ish) mechanism to map my strongly typed entity (in this case an entity is a simple class made up of methods…also called a DTO) to a collection (and vice-versa) without having to code masses of conversions.

The secret is to create a Custom Attribute which you can use to decorate your entities properties with the collection key value.   We can then use a bit more reflection to automatically populate Collections correctly or create new entity objects from a Collection.

The required Custom Attribute is pretty simple:

  
```csharp
using System;
```

```csharp



```csharp
namespace MartinOnDotNet.Helpers.Ektron
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// Allows DTO's to be tagged up with the Collection Key
```

```csharp
/// 
```

```csharp
[AttributeUsage(AttributeTargets.Property)]
```

```csharp
public sealed class CollectionItemAttribute : System.Attribute
```

```csharp
{
```

```csharp
/// 
```

```csharp
/// Initializes a new instance of the  class.
```

```csharp
/// 
```

```csharp
/// The collection key.
```

```csharp
public CollectionItemAttribute(string collectionKey):this(collectionKey,null,false)
```

```csharp
{}
```

```csharp



```csharp
/// 
```

```csharp
/// Initializes a new instance of the  class.
```

```csharp
/// 
```

```csharp
/// The collection key.
```

```csharp
/// The default value.
```

```csharp
public CollectionItemAttribute(string collectionKey, object defaultValue)
```

```csharp
: this(collectionKey, defaultValue, false)
```

```csharp
{ }
```

```csharp



```csharp
/// 
```

```csharp
/// Initializes a new instance of the  class.
```

```csharp
/// 
```

```csharp
/// The collection key.
```

```csharp
/// The default value.
```

```csharp
/// if set to true [suppress if null].
```

```csharp
public CollectionItemAttribute(string collectionKey, object defaultValue, bool suppressIfNull)
```

```csharp
{
```

```csharp
CollectionKey = collectionKey;
```

```csharp
DefaultValue = defaultValue;
```

```csharp
SuppressItemIfNull = suppressIfNull;
```

```csharp
}
```

```csharp



```csharp



```csharp
/// 
```

```csharp
/// Gets or sets the default.
```

```csharp
/// 
```

```csharp
/// The default.
```

```csharp
public object DefaultValue { get; set; }
```

```csharp



```csharp
/// 
```

```csharp
/// Gets or sets the collection key.
```

```csharp
/// 
```

```csharp
/// The collection key.
```

```csharp
public string CollectionKey { get; set; }
```

```csharp



```csharp
/// 
```

```csharp
/// Gets or sets a value indicating whether [suppress item if null].
```

```csharp
/// 
```

```csharp
/// true if [suppress item if null]; otherwise, false.
```

```csharp
public bool SuppressItemIfNull { get; set; }
```

```csharp



```csharp
}
```

```csharp
}
```

*Note the AttributeUsage attribute on the class which limits its scope to properties.*

This can be added to your entities simply as:

  
```csharp
[CollectionItem("MetaTypeName")]
```

```csharp
public string Name { get; set; }
```

If you need to do some fancy type conversions on the item then an internal/private property can be used:

  
```csharp
public MetadataTagType TagType { get; set; } //Custom enum of valid values
```

```csharp



```csharp
[CollectionItem("MetaTagType")]
```

```csharp
private long EkTagType
```

```csharp
{
```

```csharp
get
```

```csharp
{
```

```csharp
return (long)TagType;
```

```csharp
}
```

```csharp
set
```

```csharp
{
```

```csharp
TagType = (MetadataTagType)value;
```

```csharp
}
```

```csharp
}
```

The mapping magic is done using reflection (again with the Extension Methods!):

  
```csharp
/// 
```

```csharp
/// Creates the collection.
```

```csharp
/// 
```

```csharp
/// The entity.
```

```csharp
/// 
```

```csharp
public static Microsoft.VisualBasic.Collection CreateCollection(this object entity)
```

```csharp
{
```

```csharp
if (entity == null) throw new ArgumentNullException("entity");
```

```csharp
Microsoft.VisualBasic.Collection collection = new Microsoft.VisualBasic.Collection();
```

```csharp
foreach (PropertyInfo pi in entity.GetType()
```

```csharp
.GetProperties(BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public))
```

```csharp
{
```

```csharp
foreach (CollectionItemAttribute ia in pi.GetCustomAttributes(typeof(CollectionItemAttribute), true)
```

```csharp
.OfType().Take(1))
```

```csharp
{
```

```csharp
object value = pi.GetValue(entity, null);
```

```csharp
if (value != null || !ia.SuppressItemIfNull)
```

```csharp
{
```

```csharp
value = value ?? ia.DefaultValue;
```

```csharp
collection.Add(value, ia.CollectionKey, null, null);
```

```csharp
}
```

```csharp
}
```

```csharp
}
```

```csharp
return collection;
```

```csharp



```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Creates from collection.
```

```csharp
/// 
```

```csharp
/// 
```

```csharp
/// The collection.
```

```csharp
/// 
```

```csharp
public static T CreateFromCollection(this Microsoft.VisualBasic.Collection collection) where T : class, new()
```

```csharp
{
```

```csharp
if (collection == null) throw new ArgumentNullException("collection");
```

```csharp
T newT = new T();
```

```csharp



```csharp
foreach (PropertyInfo pi in typeof(T)
```

```csharp
.GetProperties(BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public))
```

```csharp
{
```

```csharp
foreach (CollectionItemAttribute ia in pi.GetCustomAttributes(typeof(CollectionItemAttribute), true)
```

```csharp
.OfType().Take(1))
```

```csharp
{
```

```csharp
if (collection.Contains(ia.CollectionKey))
```

```csharp
{
```

```csharp
pi.SetValue(newT, collection[ia.CollectionKey], null);
```

```csharp
}
```

```csharp
else
```

```csharp
{
```

```csharp
System.Diagnostics.Trace.TraceWarning("Expected Collection to Contain key '{0}'", ia.CollectionKey);
```

```csharp
}
```

```csharp
}
```

```csharp
}
```

```csharp
return newT;
```

```csharp
}
```

```csharp



```csharp
/* Required using statements:
```

```csharp
using System;
```

```csharp
using System.Collections;
```

```csharp
using System.Collections.Generic;
```

```csharp
using System.Linq;
```

```csharp
using System.Reflection;
```

```csharp
*/
```

These thinly veiled factory methods can be called inline whenever the 3rd Party API exposes (or requires) a Collection object and converts it into a strongly typed entity with a minimal amount of mapping code:

  
```csharp
public EktronMetadata GetMetadataType(long id, int cultureLcid)
```

```csharp
{
```

```csharp
global::Ektron.Cms.ContentAPI api = new global::Ektron.Cms.ContentAPI();
```

```csharp
using (new ElevatedPermissionScope(api))
```

```csharp
{
```

```csharp
api.ContentLanguage = cultureLcid;
```

```csharp
return api.EkContentRef.GetMetadataTypeByID(id)
```

```csharp
.CreateFromCollection();
```

```csharp
}
```

```csharp
}
```
  
```csharp
Microsoft.VisualBasic.Collection menuCollection = updatedMenu.CreateCollection(); //replaces ~30 lines of mapping code!
```

```csharp
api.EkContentRef.UpdateMenu(menuCollection);
```

Much Neater.

## Entity?  What Entity?

Of course, if you don’t want/need to map to entity classes then some simpler Extension Methods can be used:

  
```csharp
/// 
```

```csharp
/// Adds the specified item to the collection.
```

```csharp
/// 
```

```csharp
/// 
```

```csharp
/// The collection.
```

```csharp
/// The key.
```

```csharp
/// The value.
```

```csharp
public static void Add(this Microsoft.VisualBasic.Collection collection, string key, T value)
```

```csharp
{
```

```csharp
if (collection == null) throw new ArgumentNullException("collection");
```

```csharp
if (string.IsNullOrEmpty(key)) throw new ArgumentNullException("key");
```

```csharp
collection.Add(value, key, null, null);
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Gets the specified value from the collection.
```

```csharp
/// 
```

```csharp
/// 
```

```csharp
/// The collection.
```

```csharp
/// The key.
```

```csharp
/// 
```

```csharp
public static T Get(this Microsoft.VisualBasic.Collection collection, string key)
```

```csharp
{
```

```csharp
if (collection == null) throw new ArgumentNullException("collection");
```

```csharp
if (string.IsNullOrEmpty(key)) throw new ArgumentNullException("key");
```

```csharp
return (T)collection[key];
```

```csharp
}
```

```csharp



```csharp
/// 
```

```csharp
/// Removes the specified item from the collection.
```

```csharp
/// 
```

```csharp
/// The collection.
```

```csharp
/// The key.
```

```csharp
public static void Remove(this Microsoft.VisualBasic.Collection collection, string key)
```

```csharp
{
```

```csharp
if (collection == null) throw new ArgumentNullException("collection");
```

```csharp
if (string.IsNullOrEmpty(key)) throw new ArgumentNullException("key");
```

```csharp
if (collection.Contains(key))
```

```csharp
collection.Remove(key);
```

```csharp
}
```