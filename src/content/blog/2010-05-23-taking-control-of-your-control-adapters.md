---
title: Taking Control of Your Control Adapters
description: ""
pubDate: 2010-05-23
tags: []
source: hugo
originalUrl: "https://codifice.dev/posts/2010-05-23-taking-control-of-your-control-adapters/"
---

I was recently put in a difficult position when I was attempting to integrate some of our reliable, established Control Adapters into a new Ektron project.   When the Ektron workarea controls were ‘adapted’ (in this case a checkbox) it broke some supporting JQuery statements.  So the quandary I found my self in was, so I amend the workarea code to add the control attribute to ‘opt-out’ of using the adapter, or modify the control adapters (and all of their dependent projects) to use an ‘opt-in’ attribute instead?  Both would involve a lot of work either now (amended existing code) or later (migrating patches to the Ektron across upgrades).  

  My solution was create  new HttpModule that could disable control adapters based on the request url – the AdvancedControlAdapterModule!  

  This module allows you to disable Control Adapters using a whitelist (disallow all, apart from those listes) black list (disallow all control adapters listed) and also to inject a control adapter into a specific control.

  #### How To Use  To use the AdvancedControlAdapterModule you first need to register a Custom Configuration Section and add HttpModule registration entries  into your applications web.config:

  
```
<configuration>
```

You can now define the rules for manipulating the control adapters (*for the example above this would go in ‘Configs\ControlAdapters.config’ but you can populate the ‘controlAdapters’ element in the web.config as well*):

```
<controlAdapters>
```

A few pointers on the rules:

  * The path rules will be iterated in order and the settings for the first match used for the request, there’s no configuration inheritance to avoid whitelist/blacklist conflicts.  

  * The match is made after an url rewriting has taken place

  * The ControlAdapterType is matched using a case insensitive string comparison on the control adapter types FullName property

  * A path with no whitelist or blacklist will do nothing but stop further processing of other rules

  * Any injections occur after whitelist/blacklist processing

  * The injection targetControlId is a regular expression which can be used to match multiple controls if required

#### How It Works

The AdvancedControlAdapterModule intercepts every request just before whatever HttpHandler is assigned to serve the content is executed, it checks to see if it’s an aspx page (derived from System.Web.UI.Page) and then hooks into the pages ‘PreRenderComplete’ event.  This event is called after the pages control tree is fully populated and any processing for the request is finished with the only thing left, is to render the output.

```
Section ControlAdapterConfig = System.Configuration.ConfigurationManager.GetSection("controlAdapters") as AdvancedControlAdapterSection;
```

The module gets the relevant configuration for the request and then checks every control adapter against the blacklist and whitelist, to determine if it’s allowed.  This is done using reflection to manipulate the ‘***Adapter***’ internal property( and it’s backing field ***_adapter***) of the System.Web.UI.Control type that every ASP.Net control is derived from. 

 Using Reflector you can see the implementation of this property isn’t trivial:

```
{
```

To successfully, replace _adapter we will need to trick the classes internal logic into thinking it’s already resolved the adapter.  This was easily done by invoking the property using reflection which causes all flags to be correctly set.

```
{
```

The process for injecting a control adapter is a little more complicated as we need to dynamically construct the control adapter using reflection and assign its Control property as well as assign it to the matching control:

```
{
```

#### Seeing It In Action

I’ve constructed a basic example demonstrating the functionality, included a very basic control adapter for the CheckBox control.  The adapter suppresses the enclosing ***span*** which the default ASP.Net rendering injects when a CssClass is applied (but not when CssClass is blank).  The difference in mark up is quite basic:

```
<span class="PrettyMeUp">
```

All of the source code for the Module, Adapter and Demo website are in the accompanying zip file.

**Attachment:  ****AdvancedControlAdapter.zip**