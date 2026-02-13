---
title: 'HowTo: Creating Strongly Typed Code Using Microsoft.VisualBasic.Collection'
description: 'Extension methods and custom attributes to wrap weakly-typed VB.NET Collections with strongly-typed abstractions using reflection and entity mapping in Ektron.'
pubDate: 2010-08-18
updatedDate: 2010-08-20
tags: ['ektron', 'tips']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/08/howto-creating-strongly-typed-code.html'
heroImage: ../../assets/blog/hero-images/2010-08-18-howto-creating-strongly-typed-code.jpg
---

One of the 3rd Party CMS's that I frequently work with (Ektron) has a lot of legacy API code that uses Microsoft.VisualBasic.Collections (from hereon referred to as _Collection_) to pass data into the database. These API methods are slowly being replaced with strongly typed entity style methods, but the most stable and reliable methods use Collections.

There are many reasons to dislike Collections, but my top ones are:

- You can't see the keys of the values inside – this often leads to Exception led logic
- Weakly Typed

#### What's in the Box?

Not being able to see what keys are in a collection is a killer fault, but it's not too hard to work around. Since the Collection class is simply a wrapper for a generic Dictionary (and a couple of ArrayLists – which I'm not particularly bothered about), we can simply use Reflection to crack open the shell and access the sweet Dictionary goodness inside.

My preferred method for this is an Extension Method, but a static method will work just as well:

```csharp
private static FieldInfo KeyNodeHash = typeof(Microsoft.VisualBasic.Collection)
    .GetField("m_KeyedNodesHash",
        BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.IgnoreCase);

public static IDictionary<string, object> ToDictionary(
    this Microsoft.VisualBasic.Collection collection)
{
    if (collection == null) throw new ArgumentNullException("collection");
    if (KeyNodeHash == null)
        throw new NotSupportedException("Expected m_KeyedNodesHash field");

    IDictionary internalDictionary = KeyNodeHash.GetValue(collection) as IDictionary;
    if (internalDictionary == null)
        throw new NotSupportedException("Field must implement IDictionary");

    Dictionary<string, object> mapped = new Dictionary<string, object>();
    foreach (string key in internalDictionary.Keys)
    {
        object value = internalDictionary[key];
        if (value == null)
        {
            mapped[key] = null;
        }
        else
        {
            mapped[key] = value.GetType()
                .GetField("m_Value",
                    BindingFlags.NonPublic | BindingFlags.Instance |
                    BindingFlags.IgnoreCase)
                .GetValue(value);
        }
    }
    return mapped;
}
```

**Word of Warning**: this technique relies on the internal implementation of the Collection class remaining the same as in .Net 3.5. Future (or Past) versions of .Net may need amending – _Reflector is your friend_.

To use the code simply make sure the Extension's hosting class (Non-Generic and static) is included in the available namespaces for your code, and call:

```csharp
Microsoft.VisualBasic.Collection coll = GetCollectionFromSomewhere();
IDictionary<string, object> dict = coll.ToDictionary();
foreach (string key in dict.Keys)
{
    System.Diagnostics.Debug.WriteLine(
        string.Format(CultureInfo.InvariantCulture,
            "@{0} = '{1}'", key, dict[key]));
}
```

#### Casting Call

Getting the keys in the dictionary is good, but what about making the Collection strongly typed? Not much I can do about that, I'm afraid. But I can create a simple(ish) mechanism to map my strongly typed entity (in this case an entity is a simple class made up of properties…also called a DTO) to a collection (and vice-versa) without having to code masses of conversions.

The secret is to create a Custom Attribute which you can use to decorate your entity's properties with the collection key value. We can then use a bit more reflection to automatically populate Collections correctly or create new entity objects from a Collection.

The required Custom Attribute is pretty simple:

```csharp
[AttributeUsage(AttributeTargets.Property)]
public sealed class CollectionItemAttribute : System.Attribute
{
    public CollectionItemAttribute(string collectionKey)
        : this(collectionKey, null, false) { }

    public CollectionItemAttribute(string collectionKey, object defaultValue)
        : this(collectionKey, defaultValue, false) { }

    public CollectionItemAttribute(string collectionKey,
        object defaultValue, bool suppressIfNull)
    {
        CollectionKey = collectionKey;
        DefaultValue = defaultValue;
        SuppressItemIfNull = suppressIfNull;
    }

    public object DefaultValue { get; set; }
    public string CollectionKey { get; set; }
    public bool SuppressItemIfNull { get; set; }
}
```

_Note the AttributeUsage attribute on the class which limits its scope to properties._

This can be added to your entities simply as:

```csharp
[CollectionItem("MetaTypeName")]
public string Name { get; set; }
```

If you need to do some fancy type conversions on the item then an internal/private property can be used:

```csharp
public MetadataTagType TagType { get; set; }

[CollectionItem("MetaTagType")]
private long EkTagType
{
    get { return (long)TagType; }
    set { TagType = (MetadataTagType)value; }
}
```

The mapping magic is done using reflection (again with the Extension Methods!):

```csharp
public static Microsoft.VisualBasic.Collection CreateCollection(this object entity)
{
    if (entity == null) throw new ArgumentNullException("entity");

    Microsoft.VisualBasic.Collection collection =
        new Microsoft.VisualBasic.Collection();

    foreach (PropertyInfo pi in entity.GetType()
        .GetProperties(BindingFlags.Instance | BindingFlags.NonPublic |
            BindingFlags.Public))
    {
        foreach (CollectionItemAttribute ia in pi
            .GetCustomAttributes(typeof(CollectionItemAttribute), true)
            .OfType<CollectionItemAttribute>().Take(1))
        {
            object value = pi.GetValue(entity, null);
            if (value != null || !ia.SuppressItemIfNull)
            {
                value = value ?? ia.DefaultValue;
                collection.Add(value, ia.CollectionKey, null, null);
            }
        }
    }
    return collection;
}

public static T CreateFromCollection<T>(
    this Microsoft.VisualBasic.Collection collection) where T : class, new()
{
    if (collection == null) throw new ArgumentNullException("collection");
    T newT = new T();

    foreach (PropertyInfo pi in typeof(T)
        .GetProperties(BindingFlags.Instance | BindingFlags.NonPublic |
            BindingFlags.Public))
    {
        foreach (CollectionItemAttribute ia in pi
            .GetCustomAttributes(typeof(CollectionItemAttribute), true)
            .OfType<CollectionItemAttribute>().Take(1))
        {
            if (collection.Contains(ia.CollectionKey))
            {
                pi.SetValue(newT, collection[ia.CollectionKey], null);
            }
            else
            {
                System.Diagnostics.Trace.TraceWarning(
                    "Expected Collection to contain key '{0}'",
                    ia.CollectionKey);
            }
        }
    }
    return newT;
}
```

These thinly veiled factory methods can be called inline whenever the 3rd Party API exposes (or requires) a Collection object and converts it into a strongly typed entity with a minimal amount of mapping code:

```csharp
public EktronMetadata GetMetadataType(long id, int cultureLcid)
{
    global::Ektron.Cms.ContentAPI api = new global::Ektron.Cms.ContentAPI();
    using (new ElevatedPermissionScope(api))
    {
        api.ContentLanguage = cultureLcid;
        return api.EkContentRef.GetMetadataTypeByID(id)
            .CreateFromCollection<EktronMetadata>();
    }
}
```

```csharp
Microsoft.VisualBasic.Collection menuCollection = updatedMenu.CreateCollection(); //replaces ~30 lines of mapping code!
api.EkContentRef.UpdateMenu(menuCollection);
```

Much Neater.

#### Entity? What Entity?

Of course, if you don't want/need to map to entity classes then some simpler Extension Methods can be used:

```csharp
/// <summary>
/// Adds the specified key.
/// </summary>
public static void Add<T>(this Microsoft.VisualBasic.Collection collection,
    string key, T value)
{
    if (collection == null) throw new ArgumentNullException("collection");
    if (string.IsNullOrEmpty(key)) throw new ArgumentNullException("key");
    collection.Add(value, key, null, null);
}

/// <summary>
/// Gets the value with specified key.
/// </summary>
public static T Get<T>(this Microsoft.VisualBasic.Collection collection,
    string key)
{
    if (collection == null) throw new ArgumentNullException("collection");
    if (string.IsNullOrEmpty(key)) throw new ArgumentNullException("key");
    return (T)collection[key];
}

/// <summary>
/// Removes the specified key.
/// </summary>
public static void Remove(this Microsoft.VisualBasic.Collection collection,
    string key)
{
    if (collection == null) throw new ArgumentNullException("collection");
    if (string.IsNullOrEmpty(key)) throw new ArgumentNullException("key");
    if (collection.Contains(key))
        collection.Remove(key);
}
```
