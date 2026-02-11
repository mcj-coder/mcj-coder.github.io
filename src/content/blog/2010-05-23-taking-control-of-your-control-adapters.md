---
title: "Taking Control of Your Control Adapters"
description: "Technical blog post from 2010-05-23"
pubDate: 2010-05-23
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

I was recently put in a difficult position when I was attempting to integrate some of our reliable, established Control Adapters into a new [Ektron](http://bit.ly/d0YHh7) project.   When the Ektron workarea controls were ‘adapted’ (in this case a checkbox) it broke some supporting [JQuery](http://bit.ly/aTz5zA) statements.  So the quandary I found my self in was, so I amend the workarea code to add the control attribute to ‘opt-out’ of using the adapter, or modify the control adapters (and all of their dependent projects) to use an ‘opt-in’ attribute instead?  Both would involve a lot of work either now (amended existing code) or later (migrating patches to the Ektron across upgrades).  

  My solution was create  new HttpModule that could disable control adapters based on the request url – the AdvancedControlAdapterModule!  

  This module allows you to disable Control Adapters using a whitelist (disallow all, apart from those listes) black list (disallow all control adapters listed) and also to inject a control adapter into a specific control.

  
## How To Use
  To use the AdvancedControlAdapterModule you first need to register a Custom Configuration Section and add HttpModule registration entries  into your applications web.config:

             1: xml version="1.0"?>

       2: configuration>

       3:     configSections>

       4:     

       5:     section name="controlAdapters"

       6:                          type="MartinOnDotNet.ControlAdapters.AdvancedControlAdapterSection"/>

       7:     configSections>

       8:     controlAdapters configSource="Configs\ControlAdapters.config"/>

       9:     appSettings />

      10:     connectionStrings />

      11:     

      12:  

      13:     

      14:     system.web>

      15:         httpModules>

      16:             add name="AdvancedControlAdapterModule" type="MartinOnDotNet.ControlAdapters.AdvancedControlAdapterModule"/>

      17:         httpModules>

      18:     system.web>

      19:     

      20:     system.webServer>

      21:         modules>

      22:             add name="AdvancedControlAdapterModule" preCondition="integratedMode" type="MartinOnDotNet.ControlAdapters.AdvancedControlAdapterModule"/>

      23:         modules>

      24:     system.webServer>

      25: configuration>

You can now define the rules for manipulating the control adapters (*for the example above this would go in ‘Configs\ControlAdapters.config’ but you can populate the ‘controlAdapters’ element in the web.config as well*):

  
       1: xml version="1.0"?>

       2: controlAdapters>

       3:   paths>

       4:     clear />

       5:     add path="~/Disabled.aspx">

       6:       blacklist>

       7:         add controlAdapterType="MartinOnDotNet.BasicControlAdapter.CheckBoxControlAdapter" />

       8:       blacklist>

       9:     add>

      10:     add path="~/Disabled/Injected.aspx">

      11:       blacklist>

      12:         add controlAdapterType="MartinOnDotNet.BasicControlAdapter.CheckBoxControlAdapter" />

      13:       blacklist>

      14:       injections>

      15:         add controlAdapterType="MartinOnDotNet.BasicControlAdapter.CheckBoxControlAdapter, BasicControlAdapter" targetControlType="System.Web.UI.WebControls.CheckBox" targetControlId="^AdaptedCheckbox$" />

      16:       injections>

      17:     add>

      18:     add path="~/Disabled/">

      19:       whitelist>

      20:         -- To Disable All Control Adapters -->

      21:         add controlAdapterType="Disable All" />

      22:       whitelist>

      23:     add>

      24:   paths>

      25: controlAdapters>

A few pointers on the rules:

  * The path rules will be iterated in order and the settings for the first match used for the request, there’s no configuration inheritance to avoid whitelist/blacklist conflicts.  

  * The match is made after an url rewriting has taken place

  * The ControlAdapterType is matched using a case insensitive string comparison on the control adapter types FullName property

  * A path with no whitelist or blacklist will do nothing but stop further processing of other rules

  * Any injections occur after whitelist/blacklist processing

  * The injection targetControlId is a regular expression which can be used to match multiple controls if required

## How It Works

The AdvancedControlAdapterModule intercepts every request just before whatever HttpHandler is assigned to serve the content is executed, it checks to see if it’s an aspx page (derived from System.Web.UI.Page) and then hooks into the pages ‘PreRenderComplete’ event.  This event is called after the pages control tree is fully populated and any processing for the request is finished with the only thing left, is to render the output.

  
       1: private static AdvancedControlAdapter

       2:     Section ControlAdapterConfig = System.Configuration.ConfigurationManager.GetSection("controlAdapters") as AdvancedControlAdapterSection;

       3:  

       4: /// 

       5: /// Initializes a module and prepares it to handle requests.

       6: /// 

       7: /// An  that provides access to the methods, properties, and events common to all application objects within an ASP.NET application

       8: public void Init(HttpApplication context)

       9: {

      10:     if (ControlAdapterConfig==null) return;

      11:     context.PreRequestHandlerExecute += new EventHandler(OnPreRequestHandlerExecute);

      12: }

      13:  

      14:  

      15: private void OnPreRequestHandlerExecute(object sender, EventArgs e)

      16: {

      17:  

      18:     HttpContext current = HttpContext.Current;

      19:     Page page = current.CurrentHandler as Page;

      20:     if (page != null)

      21:     {

      22:         page.PreRenderComplete += new EventHandler(OnPreRenderComplete);

      23:     }

      24: }

      25:  

      26:  

      27: private void OnPreRenderComplete(object sender, EventArgs e)

      28: {

      29:    // Control Adapter Magic Required

      30: }

The module gets the relevant configuration for the request and then checks every control adapter against the blacklist and whitelist, to determine if it’s allowed.  This is done using reflection to manipulate the ‘***Adapter***’ internal property( and it’s backing field ***_adapter***) of the System.Web.UI.Control type that every ASP.Net control is derived from. 

 Using [Reflector](http://bit.ly/cUbyio) you can see the implementation of this property isn’t trivial:

  
       1: protected ControlAdapter Adapter

       2: {

       3:     get

       4:     {

       5:         if (!this.flags[0x8000])

       6:         {

       7:             this._adapter = this.ResolveAdapter();

       8:             this.flags.Set(0x8000);

       9:         }

      10:         return this._adapter;

      11:     }

      12: }

      13:  

To successfully, replace _adapter we will need to trick the classes internal logic into thinking it’s already resolved the adapter.  This was easily done by invoking the property using reflection which causes all flags to be correctly set.

  
       1: private static void ProcessControlAdapters(Page page, AdvancedControlAdapterPathElement path)

       2: {

       3:     PropertyInfo pi = typeof(Control).GetProperty("Adapter", BindingFlags.NonPublic | BindingFlags.Instance);

       4:     FieldInfo fi = typeof(Control).GetField("_adapter", BindingFlags.NonPublic | BindingFlags.Instance);

       5:     foreach (Control c in page.GetAllChildControlsOfType())

       6:     {

       7:         ControlAdapter ca = pi.GetValue(c, null) as ControlAdapter; // resolve Control Adapter

       8:         if (ca != null)

       9:         {

      10:             bool allowed = IsControlAdapterAllowed(path, ca.GetType());

      11:             if (!allowed) fi.SetValue(c, null); // disable

      12:         }

      13:     }

      14: }

      15:  

      16: private static bool IsControlAdapterAllowed(AdvancedControlAdapterPathElement path, Type adapterType)

      17: {

      18:     foreach (AdvancedControlAdapterRegistrationElement blacklisted in path.Blacklist)

      19:     {

      20:         if (

      21:                 string.Equals(adapterType.FullName, blacklisted.ControlAdapterType, StringComparison.OrdinalIgnoreCase)

      22:                 ||

      23:                 string.Equals(adapterType.Name, blacklisted.ControlAdapterType, StringComparison.OrdinalIgnoreCase)

      24:             )

      25:         {

      26:             return false; //not allowed

      27:         }

      28:     }

      29:     return path.Whitelist.Count > 0 && (path.Whitelist[adapterType.FullName] != null || path.Whitelist[adapterType.Name] != null);

      30: }

The process for injecting a control adapter is a little more complicated as we need to dynamically construct the control adapter using reflection and assign its Control property as well as assign it to the matching control:

  
       1: private static void InjectControlAdapters(Page page, AdvancedControlAdapterPathElement path)

       2: {

       3:     PropertyInfo pi = typeof(Control).GetProperty("Adapter", BindingFlags.NonPublic | BindingFlags.Instance);

       4:     FieldInfo fi = typeof(Control).GetField("_adapter", BindingFlags.NonPublic | BindingFlags.Instance);

       5:     FieldInfo fiControl = typeof(ControlAdapter).GetField("_control", BindingFlags.NonPublic | BindingFlags.Instance);

       6:     foreach (AdvancedControlAdapterRegistrationElement inject in path.Injections)

       7:     {

       8:         foreach (Control c in page.GetAllChildControlsOfType())

       9:         {

      10:             if (

      11:                 (

      12:                     string.IsNullOrEmpty(inject.TargetControlType)

      13:                     ||

      14:                     string.Equals(c.GetType().FullName, inject.TargetControlType, StringComparison.OrdinalIgnoreCase)

      15:                     ||

      16:                     string.Equals(c.GetType().Name, inject.TargetControlType, StringComparison.OrdinalIgnoreCase)

      17:                  )

      18:                 &&

      19:                     Regex.IsMatch(c.ClientID, inject.TargetControlId, RegexOptions.CultureInvariant | RegexOptions.IgnoreCase | RegexOptions.IgnorePatternWhitespace)

      20:                 )

      21:             {

      22:                 ControlAdapter ca = pi.GetValue(c, null) as ControlAdapter; //bait ...

      23:                 Type t = Type.GetType(inject.ControlAdapterType);

      24:                 ControlAdapter injectCa = t.GetConstructor(Type.EmptyTypes).Invoke(null) as ControlAdapter;

      25:                 fiControl.SetValue(injectCa, c);

      26:                 fi.SetValue(c, injectCa);// ...and switch

      27:             }

      28:         }

      29:     }

      30: }

## Seeing It In Action

I’ve constructed a basic example demonstrating the functionality, included a very basic control adapter for the CheckBox control.  The adapter suppresses the enclosing ***span*** which the default ASP.Net rendering injects when a CssClass is applied (but not when CssClass is blank).  The difference in mark up is quite basic:

  
       1: 

       2: span class="PrettyMeUp">

       3:     input id="UnAdaptedCheckBox" type="checkbox" name="UnAdaptedCheckBox" />

       4:     label for="UnAdaptedCheckBox">Unadaptedlabel>

       5: span>

       6:  

       7: 

       8:     input class="PrettyMeUp" id="AdaptedCheckbox" name="AdaptedCheckbox" type="checkbox" />

       9:     label class="PrettyMeUp" for="AdaptedCheckbox">Adaptedlabel>

All of the source code for the Module, Adapter and Demo website are in the accompanying zip file.

**Attachment:  **[**AdvancedControlAdapter.zip**](http://bit.ly/aixAkF)
