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

```csharp
xml version="1.0"?>
```

```csharp
configuration>
```

```csharp
configSections>
```

```csharp



```csharp
section name="controlAdapters"
```

```csharp
type="MartinOnDotNet.ControlAdapters.AdvancedControlAdapterSection"/>
```

```csharp
configSections>
```

```csharp
controlAdapters configSource="Configs\ControlAdapters.config"/>
```

```csharp
appSettings />
```

```csharp
connectionStrings />
```

```csharp



```csharp



```csharp



```csharp
system.web>
```

```csharp
httpModules>
```

```csharp
add name="AdvancedControlAdapterModule" type="MartinOnDotNet.ControlAdapters.AdvancedControlAdapterModule"/>
```

```csharp
httpModules>
```

```csharp
system.web>
```

```csharp



```csharp
system.webServer>
```

```csharp
modules>
```

```csharp
add name="AdvancedControlAdapterModule" preCondition="integratedMode" type="MartinOnDotNet.ControlAdapters.AdvancedControlAdapterModule"/>
```

```csharp
modules>
```

```csharp
system.webServer>
```

```csharp
configuration>
```

You can now define the rules for manipulating the control adapters (*for the example above this would go in ‘Configs\ControlAdapters.config’ but you can populate the ‘controlAdapters’ element in the web.config as well*):

  
```csharp
xml version="1.0"?>
```

```csharp
controlAdapters>
```

```csharp
paths>
```

```csharp
clear />
```

```csharp
add path="~/Disabled.aspx">
```

```csharp
blacklist>
```

```csharp
add controlAdapterType="MartinOnDotNet.BasicControlAdapter.CheckBoxControlAdapter" />
```

```csharp
blacklist>
```

```csharp
add>
```

```csharp
add path="~/Disabled/Injected.aspx">
```

```csharp
blacklist>
```

```csharp
add controlAdapterType="MartinOnDotNet.BasicControlAdapter.CheckBoxControlAdapter" />
```

```csharp
blacklist>
```

```csharp
injections>
```

```csharp
add controlAdapterType="MartinOnDotNet.BasicControlAdapter.CheckBoxControlAdapter, BasicControlAdapter" targetControlType="System.Web.UI.WebControls.CheckBox" targetControlId="^AdaptedCheckbox$" />
```

```csharp
injections>
```

```csharp
add>
```

```csharp
add path="~/Disabled/">
```

```csharp
whitelist>
```

```csharp
-- To Disable All Control Adapters -->
```

```csharp
add controlAdapterType="Disable All" />
```

```csharp
whitelist>
```

```csharp
add>
```

```csharp
paths>
```

```csharp
controlAdapters>
```

A few pointers on the rules:

  * The path rules will be iterated in order and the settings for the first match used for the request, there’s no configuration inheritance to avoid whitelist/blacklist conflicts.  

  * The match is made after an url rewriting has taken place

  * The ControlAdapterType is matched using a case insensitive string comparison on the control adapter types FullName property

  * A path with no whitelist or blacklist will do nothing but stop further processing of other rules

  * Any injections occur after whitelist/blacklist processing

  * The injection targetControlId is a regular expression which can be used to match multiple controls if required

## How It Works

The AdvancedControlAdapterModule intercepts every request just before whatever HttpHandler is assigned to serve the content is executed, it checks to see if it’s an aspx page (derived from System.Web.UI.Page) and then hooks into the pages ‘PreRenderComplete’ event.  This event is called after the pages control tree is fully populated and any processing for the request is finished with the only thing left, is to render the output.

  
```csharp
private static AdvancedControlAdapter
```

```csharp
Section ControlAdapterConfig = System.Configuration.ConfigurationManager.GetSection("controlAdapters") as AdvancedControlAdapterSection;
```

```csharp



```csharp
/// 
```

```csharp
/// Initializes a module and prepares it to handle requests.
```

```csharp
/// 
```

```csharp
/// An  that provides access to the methods, properties, and events common to all application objects within an ASP.NET application
```

```csharp
public void Init(HttpApplication context)
```

```csharp
{
```

```csharp
if (ControlAdapterConfig==null) return;
```

```csharp
context.PreRequestHandlerExecute += new EventHandler(OnPreRequestHandlerExecute);
```

```csharp
}
```

```csharp



```csharp



```csharp
private void OnPreRequestHandlerExecute(object sender, EventArgs e)
```

```csharp
{
```

```csharp



```csharp
HttpContext current = HttpContext.Current;
```

```csharp
Page page = current.CurrentHandler as Page;
```

```csharp
if (page != null)
```

```csharp
{
```

```csharp
page.PreRenderComplete += new EventHandler(OnPreRenderComplete);
```

```csharp
}
```

```csharp
}
```

```csharp



```csharp



```csharp
private void OnPreRenderComplete(object sender, EventArgs e)
```

```csharp
{
```

```csharp
// Control Adapter Magic Required
```

```csharp
}
```

The module gets the relevant configuration for the request and then checks every control adapter against the blacklist and whitelist, to determine if it’s allowed.  This is done using reflection to manipulate the ‘***Adapter***’ internal property( and it’s backing field ***_adapter***) of the System.Web.UI.Control type that every ASP.Net control is derived from. 

 Using [Reflector](http://bit.ly/cUbyio) you can see the implementation of this property isn’t trivial:

  
```csharp
protected ControlAdapter Adapter
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
if (!this.flags[0x8000])
```

```csharp
{
```

```csharp
this._adapter = this.ResolveAdapter();
```

```csharp
this.flags.Set(0x8000);
```

```csharp
}
```

```csharp
return this._adapter;
```

```csharp
}
```

```csharp
}
```

```csharp



To successfully, replace _adapter we will need to trick the classes internal logic into thinking it’s already resolved the adapter.  This was easily done by invoking the property using reflection which causes all flags to be correctly set.

  
```csharp
private static void ProcessControlAdapters(Page page, AdvancedControlAdapterPathElement path)
```

```csharp
{
```

```csharp
PropertyInfo pi = typeof(Control).GetProperty("Adapter", BindingFlags.NonPublic | BindingFlags.Instance);
```

```csharp
FieldInfo fi = typeof(Control).GetField("_adapter", BindingFlags.NonPublic | BindingFlags.Instance);
```

```csharp
foreach (Control c in page.GetAllChildControlsOfType())
```

```csharp
{
```

```csharp
ControlAdapter ca = pi.GetValue(c, null) as ControlAdapter; // resolve Control Adapter
```

```csharp
if (ca != null)
```

```csharp
{
```

```csharp
bool allowed = IsControlAdapterAllowed(path, ca.GetType());
```

```csharp
if (!allowed) fi.SetValue(c, null); // disable
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



```csharp
private static bool IsControlAdapterAllowed(AdvancedControlAdapterPathElement path, Type adapterType)
```

```csharp
{
```

```csharp
foreach (AdvancedControlAdapterRegistrationElement blacklisted in path.Blacklist)
```

```csharp
{
```

```csharp
if (
```

```csharp
string.Equals(adapterType.FullName, blacklisted.ControlAdapterType, StringComparison.OrdinalIgnoreCase)
```

```csharp
||
```

```csharp
string.Equals(adapterType.Name, blacklisted.ControlAdapterType, StringComparison.OrdinalIgnoreCase)
```

```csharp
)
```

```csharp
{
```

```csharp
return false; //not allowed
```

```csharp
}
```

```csharp
}
```

```csharp
return path.Whitelist.Count > 0 && (path.Whitelist[adapterType.FullName] != null || path.Whitelist[adapterType.Name] != null);
```

```csharp
}
```

The process for injecting a control adapter is a little more complicated as we need to dynamically construct the control adapter using reflection and assign its Control property as well as assign it to the matching control:

  
```csharp
private static void InjectControlAdapters(Page page, AdvancedControlAdapterPathElement path)
```

```csharp
{
```

```csharp
PropertyInfo pi = typeof(Control).GetProperty("Adapter", BindingFlags.NonPublic | BindingFlags.Instance);
```

```csharp
FieldInfo fi = typeof(Control).GetField("_adapter", BindingFlags.NonPublic | BindingFlags.Instance);
```

```csharp
FieldInfo fiControl = typeof(ControlAdapter).GetField("_control", BindingFlags.NonPublic | BindingFlags.Instance);
```

```csharp
foreach (AdvancedControlAdapterRegistrationElement inject in path.Injections)
```

```csharp
{
```

```csharp
foreach (Control c in page.GetAllChildControlsOfType())
```

```csharp
{
```

```csharp
if (
```

```csharp
(
```

```csharp
string.IsNullOrEmpty(inject.TargetControlType)
```

```csharp
||
```

```csharp
string.Equals(c.GetType().FullName, inject.TargetControlType, StringComparison.OrdinalIgnoreCase)
```

```csharp
||
```

```csharp
string.Equals(c.GetType().Name, inject.TargetControlType, StringComparison.OrdinalIgnoreCase)
```

```csharp
)
```

```csharp
&&
```

```csharp
Regex.IsMatch(c.ClientID, inject.TargetControlId, RegexOptions.CultureInvariant | RegexOptions.IgnoreCase | RegexOptions.IgnorePatternWhitespace)
```

```csharp
)
```

```csharp
{
```

```csharp
ControlAdapter ca = pi.GetValue(c, null) as ControlAdapter; //bait ...
```

```csharp
Type t = Type.GetType(inject.ControlAdapterType);
```

```csharp
ControlAdapter injectCa = t.GetConstructor(Type.EmptyTypes).Invoke(null) as ControlAdapter;
```

```csharp
fiControl.SetValue(injectCa, c);
```

```csharp
fi.SetValue(c, injectCa);// ...and switch
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
}
```

## Seeing It In Action

I’ve constructed a basic example demonstrating the functionality, included a very basic control adapter for the CheckBox control.  The adapter suppresses the enclosing ***span*** which the default ASP.Net rendering injects when a CssClass is applied (but not when CssClass is blank).  The difference in mark up is quite basic:

  
```csharp



```csharp
span class="PrettyMeUp">
```

```csharp
input id="UnAdaptedCheckBox" type="checkbox" name="UnAdaptedCheckBox" />
```

```csharp
label for="UnAdaptedCheckBox">Unadaptedlabel>
```

```csharp
span>
```

```csharp



```csharp



```csharp
input class="PrettyMeUp" id="AdaptedCheckbox" name="AdaptedCheckbox" type="checkbox" />
```

```csharp
label class="PrettyMeUp" for="AdaptedCheckbox">Adaptedlabel>
```

All of the source code for the Module, Adapter and Demo website are in the accompanying zip file.

**Attachment:  **[**AdvancedControlAdapter.zip**](http://bit.ly/aixAkF)
