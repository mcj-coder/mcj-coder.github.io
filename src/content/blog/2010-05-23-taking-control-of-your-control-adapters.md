---
title: Taking Control of Your Control Adapters
description: 'An HttpModule that lets you selectively disable or inject ASP.NET Control Adapters per URL using whitelist, blacklist, and injection rules in web.config.'
pubDate: 2010-05-23
tags: ['aspnet']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/05/taking-control-of-your-control-adapters.html'
heroImage: ../../assets/blog/hero-images/2010-05-23-taking-control-of-your-control-adapters.jpg
---

I was recently put in a difficult position when I was attempting to integrate some of our reliable, established Control Adapters into a new Ektron project. When the Ektron workarea controls were 'adapted' (in this case a checkbox) it broke some supporting JQuery statements. So the quandary I found myself in was, do I amend the workarea code to add the control attribute to 'opt-out' of using the adapter, or modify the control adapters (and all of their dependent projects) to use an 'opt-in' attribute instead? Both would involve a lot of work either now (amending existing code) or later (migrating patches to the Ektron across upgrades).

My solution was create a new HttpModule that could disable control adapters based on the request url – the AdvancedControlAdapterModule!

This module allows you to disable Control Adapters using a whitelist (disallow all, apart from those listed) black list (disallow all control adapters listed) and also to inject a control adapter into a specific control.

#### How To Use

To use the AdvancedControlAdapterModule you first need to register a Custom Configuration Section and add HttpModule registration entries into your applications web.config:

```xml
<?xml version="1.0"?>
<configuration>
    <configSections>
    <!-- Other Sections Should be Registered Here -->
    <section name="controlAdapters"
                         type="MartinOnDotNet.ControlAdapters.AdvancedControlAdapterSection"/>
    </configSections>
    <controlAdapters configSource="Configs\\ControlAdapters.config"/>
    <appSettings />
    <connectionStrings />
    <!-- Module Registration -->

    <!-- IIS 6/7+ Classic Pipeline -->
    <system.web>
        <httpModules>
            <add name="AdvancedControlAdapterModule" type="MartinOnDotNet.ControlAdapters.AdvancedControlAdapterModule"/>
        </httpModules>
    </system.web>
    <!-- IIS 7+ Integrated Pipeline -->
    <system.webServer>
        <modules>
            <add name="AdvancedControlAdapterModule" preCondition="integratedMode" type="MartinOnDotNet.ControlAdapters.AdvancedControlAdapterModule"/>
        </modules>
    </system.webServer>
</configuration>
```

You can now define the rules for manipulating the control adapters (_for the example above this would go in 'Configs\ControlAdapters.config' but you can populate the 'controlAdapters' element in the web.config as well_):

```xml
<?xml version="1.0"?>
<controlAdapters>
  <paths>
    <clear />
    <add path="~/Disabled.aspx">
      <blacklist>
        <add controlAdapterType="MartinOnDotNet.BasicControlAdapter.CheckBoxControlAdapter" />
      </blacklist>
    </add>
    <add path="~/Disabled/Injected.aspx">
      <blacklist>
        <add controlAdapterType="MartinOnDotNet.BasicControlAdapter.CheckBoxControlAdapter" />
      </blacklist>
      <injections>
        <add controlAdapterType="MartinOnDotNet.BasicControlAdapter.CheckBoxControlAdapter, BasicControlAdapter" targetControlType="System.Web.UI.WebControls.CheckBox" targetControlId="^AdaptedCheckbox$" />
      </injections>
    </add>
    <add path="~/Disabled/">
      <whitelist>
        <!-- To Disable All Control Adapters -->
        <add controlAdapterType="Disable All" />
      </whitelist>
    </add>
  </paths>
</controlAdapters>
```

A few pointers on the rules:

- The path rules will be iterated in order and the settings for the first match used for the request, there's no configuration inheritance to avoid whitelist/blacklist conflicts.
- The match is made after any url rewriting has taken place.
- The ControlAdapterType is matched using a case insensitive string comparison on the control adapter types FullName property.
- A path with no whitelist or blacklist will do nothing but stop further processing of other rules.
- Any injections occur after whitelist/blacklist processing.
- The injection targetControlId is a regular expression which can be used to match multiple controls if required.

#### How It Works

The AdvancedControlAdapterModule intercepts every request just before whatever HttpHandler is assigned to serve the content is executed, it checks to see if it's an aspx page (derived from System.Web.UI.Page) and then hooks into the pages 'PreRenderComplete' event. This event is called after the pages control tree is fully populated and any processing for the request is finished with the only thing left, is to render the output.

```csharp
private static AdvancedControlAdapterSection ControlAdapterConfig = System.Configuration.ConfigurationManager.GetSection("controlAdapters") as AdvancedControlAdapterSection;

/// <summary>
/// Initializes a module and prepares it to handle requests.
/// </summary>
/// <param name="context">An <see cref="T:System.Web.HttpApplication"/> that provides access to the methods, properties, and events common to all application objects within an ASP.NET application</param>
public void Init(HttpApplication context)
{
    if (ControlAdapterConfig==null) return;
    context.PreRequestHandlerExecute += new EventHandler(OnPreRequestHandlerExecute);
}


private void OnPreRequestHandlerExecute(object sender, EventArgs e)
{

    HttpContext current = HttpContext.Current;
    Page page = current.CurrentHandler as Page;
    if (page != null)
    {
        page.PreRenderComplete += new EventHandler(OnPreRenderComplete);
    }
}


private void OnPreRenderComplete(object sender, EventArgs e)
{
   // Control Adapter Magic Required
}
```

The module gets the relevant configuration for the request and then checks every control adapter against the blacklist and whitelist, to determine if it's allowed. This is done using reflection to manipulate the '**_Adapter_**' internal property (and its backing field **_\_adapter_**) of the System.Web.UI.Control type that every ASP.Net control is derived from.

Using Reflector you can see the implementation of this property isn't trivial:

```csharp
protected ControlAdapter Adapter
{
    get
    {
        if (!this.flags[0x8000])
        {
            this._adapter = this.ResolveAdapter();
            this.flags.Set(0x8000);
        }
        return this._adapter;
    }
}
```

To successfully replace \_adapter we will need to trick the classes internal logic into thinking it's already resolved the adapter. This was easily done by invoking the property using reflection which causes all flags to be correctly set.

```csharp
private static void ProcessControlAdapters(Page page, AdvancedControlAdapterPathElement path)
{
    PropertyInfo pi = typeof(Control).GetProperty("Adapter", BindingFlags.NonPublic | BindingFlags.Instance);
    FieldInfo fi = typeof(Control).GetField("_adapter", BindingFlags.NonPublic | BindingFlags.Instance);
    foreach (Control c in page.GetAllChildControlsOfType<Control>())
    {
        ControlAdapter ca = pi.GetValue(c, null) as ControlAdapter; // resolve Control Adapter
        if (ca != null)
        {
            bool allowed = IsControlAdapterAllowed(path, ca.GetType());
            if (!allowed) fi.SetValue(c, null); // disable
        }
    }
}

private static bool IsControlAdapterAllowed(AdvancedControlAdapterPathElement path, Type adapterType)
{
    foreach (AdvancedControlAdapterRegistrationElement blacklisted in path.Blacklist)
    {
        if (
                string.Equals(adapterType.FullName, blacklisted.ControlAdapterType, StringComparison.OrdinalIgnoreCase)
                ||
                string.Equals(adapterType.Name, blacklisted.ControlAdapterType, StringComparison.OrdinalIgnoreCase)
            )
        {
            return false; //not allowed
        }
    }
    return path.Whitelist.Count > 0 && (path.Whitelist[adapterType.FullName] != null || path.Whitelist[adapterType.Name] != null);
}
```

The process for injecting a control adapter is a little more complicated as we need to dynamically construct the control adapter using reflection and assign its Control property as well as assign it to the matching control:

```csharp
private static void InjectControlAdapters(Page page, AdvancedControlAdapterPathElement path)
{
    PropertyInfo pi = typeof(Control).GetProperty("Adapter", BindingFlags.NonPublic | BindingFlags.Instance);
    FieldInfo fi = typeof(Control).GetField("_adapter", BindingFlags.NonPublic | BindingFlags.Instance);
    FieldInfo fiControl = typeof(ControlAdapter).GetField("_control", BindingFlags.NonPublic | BindingFlags.Instance);
    foreach (AdvancedControlAdapterRegistrationElement inject in path.Injections)
    {
        foreach (Control c in page.GetAllChildControlsOfType<Control>())
        {
            if (
                (
                    string.IsNullOrEmpty(inject.TargetControlType)
                    ||
                    string.Equals(c.GetType().FullName, inject.TargetControlType, StringComparison.OrdinalIgnoreCase)
                    ||
                    string.Equals(c.GetType().Name, inject.TargetControlType, StringComparison.OrdinalIgnoreCase)
                 )
                &&
                    Regex.IsMatch(c.ClientID, inject.TargetControlId, RegexOptions.CultureInvariant | RegexOptions.IgnoreCase | RegexOptions.IgnorePatternWhitespace)
                )
            {
                ControlAdapter ca = pi.GetValue(c, null) as ControlAdapter; //bait ...
                Type t = Type.GetType(inject.ControlAdapterType);
                ControlAdapter injectCa = t.GetConstructor(Type.EmptyTypes).Invoke(null) as ControlAdapter;
                fiControl.SetValue(injectCa, c);
                fi.SetValue(c, injectCa);// ...and switch
            }
        }
    }
}
```

#### Seeing It In Action

I've constructed a basic example demonstrating the functionality, included a very basic control adapter for the CheckBox control. The adapter suppresses the enclosing **_span_** which the default ASP.Net rendering injects when a CssClass is applied (but not when CssClass is blank). The difference in markup is quite basic:

```html
<!-- This checkbox is rendered by standard ASP.Net-->
<span class="PrettyMeUp">
  <input id="UnAdaptedCheckBox" type="checkbox" name="UnAdaptedCheckBox" />
  <label for="UnAdaptedCheckBox">Unadapted</label>
</span>

<!-- This checkbox is rendered by MartinOnDotNet.BasicControlAdapter.CheckBoxControlAdapter -->
<input class="PrettyMeUp" id="AdaptedCheckbox" name="AdaptedCheckbox" type="checkbox" />
<label class="PrettyMeUp" for="AdaptedCheckbox">Adapted</label>
```

All of the source code for the Module, Adapter and Demo website are in the accompanying zip file.

[Download the AdvancedControlAdapter source code](/downloads/2010-05-23-taking-control-of-your-control-adapters/AdvancedControlAdapter.zip)
