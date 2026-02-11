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

             1: private static FieldInfo KeyNodeHash = typeof(Microsoft.VisualBasic.Collection).GetField("m_KeyedNodesHash", BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.IgnoreCase);

       2:  

       3: /// 

       4: /// Converts the  instance to a Dictionary

       5: /// 

       6: /// The collection.

       7: /// 

       8: public static IDictionarystring, object> ToDictionary(this Microsoft.VisualBasic.Collection collection)

       9: {

      10:    if (collection == null) throw new ArgumentNullException("collection");

      11:    if (KeyNodeHash == null) throw new NotSupportedException("Expected to find private field m_KeyedNodesHash within Collection implementation");

      12:    IDictionary internalDictionary = KeyNodeHash.GetValue(collection) as IDictionary;

      13:    if (internalDictionary == null) throw new NotSupportedException("Expected private field m_KeyedNodesHash to implement IDictionary");

      14:    Dictionarystring, object> mapped = new Dictionarystring, object>();

      15:    foreach (string key in internalDictionary.Keys)

      16:    {

      17:        object value = internalDictionary[key];

      18:        if (value == null)

      19:        {

      20:            mapped[key] = null;

      21:        }

      22:        else

      23:        {

      24:            mapped[key] = value.GetType()

      25:                .GetField("m_Value", BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.IgnoreCase)

      26:                .GetValue(value);

      27:        }

      28:    }

      29:    return mapped;

      30:  

      31: }

      32:  

      33: /* You'll need the following using statements

      34: using System;

      35: using System.Collections;

      36: using System.Collections.Generic;

      37: using System.Reflection;

      38: */

**Word of Warning**: this technique relies on the internal implementation of the Collection class remaining the same as in .Net 3.5.  Future (or Past) versions of .Net may need amending – [*Reflector*](http://bit.ly/cUbyio)* is your friend*.

To use the code simply make sure the Extension’s hosting class (Non-Generic and static) is included in the available namespaces for your code, and call:

  
       1: Microsoft.VisualBasic.Collection coll = GetCollectionFromSomewhere();

       2: IDictionarystring, object> dict = coll.ToDictionary();

       3: foreach (string key in dict.Keys)

       4: {

       5:     System.Diagnostics.Debug.WriteLine(string.Format(CultureInfo.InvariantCulture, "@{0} = '{1}'", key,dict[key]));

       6: }

## Casting Call

Getting the keys in the dictionary is good, but what about making the Collection strongly typed?   Not much I can do about that, I’m afraid.  But I can create a simple(ish) mechanism to map my strongly typed entity (in this case an entity is a simple class made up of methods…also called a DTO) to a collection (and vice-versa) without having to code masses of conversions.

The secret is to create a Custom Attribute which you can use to decorate your entities properties with the collection key value.   We can then use a bit more reflection to automatically populate Collections correctly or create new entity objects from a Collection.

The required Custom Attribute is pretty simple:

  
       1: using System;

       2:  

       3: namespace MartinOnDotNet.Helpers.Ektron

       4: {

       5:     /// 

       6:     /// Allows DTO's to be tagged up with the Collection Key

       7:     /// 

       8:     [AttributeUsage(AttributeTargets.Property)]

       9:     public sealed class CollectionItemAttribute : System.Attribute

      10:     {

      11:         /// 

      12:         /// Initializes a new instance of the  class.

      13:         /// 

      14:         /// The collection key.

      15:         public CollectionItemAttribute(string collectionKey):this(collectionKey,null,false)

      16:         {}

      17:  

      18:         /// 

      19:         /// Initializes a new instance of the  class.

      20:         /// 

      21:         /// The collection key.

      22:         /// The default value.

      23:         public CollectionItemAttribute(string collectionKey, object defaultValue)

      24:             : this(collectionKey, defaultValue, false)

      25:         { }

      26:  

      27:         /// 

      28:         /// Initializes a new instance of the  class.

      29:         /// 

      30:         /// The collection key.

      31:         /// The default value.

      32:         /// if set to true [suppress if null].

      33:         public CollectionItemAttribute(string collectionKey, object defaultValue, bool suppressIfNull)

      34:         {

      35:             CollectionKey = collectionKey;

      36:             DefaultValue = defaultValue;

      37:             SuppressItemIfNull = suppressIfNull;

      38:         }

      39:  

      40:  

      41:         /// 

      42:         /// Gets or sets the default.

      43:         /// 

      44:         /// The default.

      45:         public object DefaultValue { get; set; }

      46:  

      47:         /// 

      48:         /// Gets or sets the collection key.

      49:         /// 

      50:         /// The collection key.

      51:         public string CollectionKey { get; set; }

      52:  

      53:         /// 

      54:         /// Gets or sets a value indicating whether [suppress item if null].

      55:         /// 

      56:         /// true if [suppress item if null]; otherwise, false.

      57:         public bool SuppressItemIfNull { get; set; }

      58:  

      59:     }

      60: }

*Note the AttributeUsage attribute on the class which limits its scope to properties.*

This can be added to your entities simply as:

  
       1: [CollectionItem("MetaTypeName")]

       2: public string Name { get; set; }

If you need to do some fancy type conversions on the item then an internal/private property can be used:

  
       1: public MetadataTagType TagType { get; set; } //Custom enum of valid values

       2:  

       3: [CollectionItem("MetaTagType")]

       4: private long EkTagType

       5: {

       6:     get

       7:     {

       8:         return (long)TagType;

       9:     }

      10:     set

      11:     {

      12:         TagType = (MetadataTagType)value;

      13:     }

      14: }

The mapping magic is done using reflection (again with the Extension Methods!):

  
       1: /// 

       2: /// Creates the collection.

       3: /// 

       4: /// The entity.

       5: /// 

       6: public static Microsoft.VisualBasic.Collection CreateCollection(this object entity)

       7: {

       8:     if (entity == null) throw new ArgumentNullException("entity");

       9:     Microsoft.VisualBasic.Collection collection = new Microsoft.VisualBasic.Collection();

      10:     foreach (PropertyInfo pi in entity.GetType()

      11:         .GetProperties(BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public))

      12:     {

      13:         foreach (CollectionItemAttribute ia in pi.GetCustomAttributes(typeof(CollectionItemAttribute), true)

      14:             .OfType().Take(1))

      15:         {

      16:             object value = pi.GetValue(entity, null);

      17:             if (value != null || !ia.SuppressItemIfNull)

      18:             {

      19:                 value = value ?? ia.DefaultValue;

      20:                 collection.Add(value, ia.CollectionKey, null, null);

      21:             }

      22:         }

      23:     }

      24:     return collection;

      25:  

      26: }

      27:  

      28: /// 

      29: /// Creates from collection.

      30: /// 

      31: /// 

      32: /// The collection.

      33: /// 

      34: public static T CreateFromCollection(this Microsoft.VisualBasic.Collection collection) where T : class, new()

      35: {

      36:     if (collection == null) throw new ArgumentNullException("collection");

      37:     T newT = new T();

      38:  

      39:     foreach (PropertyInfo pi in typeof(T)

      40:         .GetProperties(BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public))

      41:     {

      42:         foreach (CollectionItemAttribute ia in pi.GetCustomAttributes(typeof(CollectionItemAttribute), true)

      43:             .OfType().Take(1))

      44:         {

      45:             if (collection.Contains(ia.CollectionKey))

      46:             {

      47:                 pi.SetValue(newT, collection[ia.CollectionKey], null);

      48:             }

      49:             else

      50:             {

      51:                 System.Diagnostics.Trace.TraceWarning("Expected Collection to Contain key '{0}'", ia.CollectionKey);

      52:             }

      53:         }

      54:     }

      55:     return newT;

      56: }

      57:  

      58: /* Required using statements:

      59: using System;

      60: using System.Collections;

      61: using System.Collections.Generic;

      62: using System.Linq;

      63: using System.Reflection;

      64: */

These thinly veiled factory methods can be called inline whenever the 3rd Party API exposes (or requires) a Collection object and converts it into a strongly typed entity with a minimal amount of mapping code:

  
       1: public EktronMetadata GetMetadataType(long id, int cultureLcid)

       2: {

       3:     global::Ektron.Cms.ContentAPI api = new global::Ektron.Cms.ContentAPI();

       4:     using (new ElevatedPermissionScope(api))

       5:     {

       6:         api.ContentLanguage = cultureLcid;

       7:         return api.EkContentRef.GetMetadataTypeByID(id)

       8:             .CreateFromCollection();

       9:     }

      10: }

  
       1: Microsoft.VisualBasic.Collection menuCollection = updatedMenu.CreateCollection(); //replaces ~30 lines of mapping code!

       2: api.EkContentRef.UpdateMenu(menuCollection);

Much Neater.

## Entity?  What Entity?

Of course, if you don’t want/need to map to entity classes then some simpler Extension Methods can be used:

  
       1: /// 

       2: /// Adds the specified item to the collection.

       3: /// 

       4: /// 

       5: /// The collection.

       6: /// The key.

       7: /// The value.

       8: public static void Add(this Microsoft.VisualBasic.Collection collection, string key, T value)

       9: {

      10:    if (collection == null) throw new ArgumentNullException("collection");

      11:    if (string.IsNullOrEmpty(key)) throw new ArgumentNullException("key");

      12:    collection.Add(value, key, null, null);

      13: }

      14:  

      15: /// 

      16: /// Gets the specified value from the collection.

      17: /// 

      18: /// 

      19: /// The collection.

      20: /// The key.

      21: /// 

      22: public static T Get(this Microsoft.VisualBasic.Collection collection, string key)

      23: {

      24:    if (collection == null) throw new ArgumentNullException("collection");

      25:    if (string.IsNullOrEmpty(key)) throw new ArgumentNullException("key");

      26:    return (T)collection[key];

      27: }

      28:  

      29: /// 

      30: /// Removes the specified item from the collection.

      31: /// 

      32: /// The collection.

      33: /// The key.

      34: public static void Remove(this Microsoft.VisualBasic.Collection collection, string key)

      35: {

      36:    if (collection == null) throw new ArgumentNullException("collection");

      37:    if (string.IsNullOrEmpty(key)) throw new ArgumentNullException("key");

      38:    if (collection.Contains(key))

      39:        collection.Remove(key);

      40: }
