---
title: "Blogger Tweak:  Making Code Snippets More Usable"
description: "Technical blog post from 2010-06-10"
pubDate: 2010-06-10
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

Now that I’m blogging more code snippet heavy content it’s becoming apparent that the excellent [Code Snippet Plugin with Windows Live Writer](http://bit.ly/b3qMyO+) isn’t the most usable for people trying to copy the snippet for their own use.  So I’ve created a Blogger Template tweak to automatically add a ‘plain text/formatted’ toggle.  

  To install simply copy the snippet below into your Blogger Template just above the  tag.

```csharp
'text/javascript'>
```

```csharp
var ChildText = function(nodeList) {
```

```csharp
var text = &#39;&#39;;
```

```csharp
for (var j = nodeList.length - 1; j &gt;= 0; --j) {
```

```csharp
if (nodeList[j].childNodes.length &gt; 0) {
```

```csharp
text = ChildText(nodeList[j].childNodes) + text;
```

```csharp
} else if (nodeList[j].nodeType == 3) {
```

```csharp
var local= &#39;&#39;;
```

```csharp
if (nodeList[j].textContent) {
```

```csharp
local = nodeList[j].textContent;
```

```csharp
} else {
```

```csharp
local = nodeList[j].nodeValue;
```

```csharp
}
```

```csharp
var div = document.createElement(&quot;div&quot;);
```

```csharp
var dt = document.createTextNode(local);
```

```csharp
div.appendChild(dt);
```

```csharp
text = div.innerHTML + text;
```

```csharp
}
```

```csharp
}
```

```csharp
return text;
```

```csharp
}
```

```csharp



```csharp
var divs = document.getElementsByTagName(&quot;div&quot;);
```

```csharp
for (var i = 0; i &lt; divs.length; i++) {
```

```csharp
if (divs[i].id === &quot;codeSnippetWrapper&quot;) {
```

```csharp



```csharp
divs[i].style[&quot;position&quot;] = &quot;relative&quot;;
```

```csharp



```csharp
var dtxt = document.createElement(&quot;div&quot;);
```

```csharp
dtxt.setAttribute(&quot;id&quot;, &quot;plaintext&quot;);
```

```csharp
dtxt.setAttribute(&quot;style&quot;, &quot;display:none;&quot;);
```

```csharp
var txt = document.createElement(&quot;pre&quot;);
```

```csharp
dtxt.appendChild(txt);
```

```csharp
divs[i].appendChild(dtxt);
```

```csharp
var text = &#39;&#39;;
```

```csharp
var lines = divs[i].getElementsByTagName(&quot;pre&quot;);
```

```csharp
for (var j = lines.length - 1; j &gt;= 0; --j) {
```

```csharp
var cns = lines[j].childNodes;
```

```csharp
var chd = [];
```

```csharp
for (var k = 1; k &lt; cns.length; k++)
```

```csharp
chd[k - 1] = cns[k];
```

```csharp



```csharp
text = ChildText(chd) + text;
```

```csharp
if (j &gt; 0) text = &quot;&lt;br /&gt;&quot; + text;
```

```csharp
}
```

```csharp



```csharp
txt.innerHTML = text;
```

```csharp



```csharp



```csharp
var link = document.createElement(&quot;span&quot;);
```

```csharp
link.setAttribute(&quot;id&quot;, &quot;ptlink&quot;);
```

```csharp
link.innerHTML = &quot;Plain Text&quot;;
```

```csharp
link.setAttribute(&quot;style&quot;, &quot;width:10em;height:1.5em;position:absolute;padding:2px;top:-2px;right:10px;border:1px;border-color:#000;background-color:#fff;font-size:0.9em;display:block;color:#000;&quot;);
```

```csharp
divs[i].appendChild(link);
```

```csharp



```csharp
link.onclick = function(e) {
```

```csharp
//If &quot;e&quot; is undefined use the global &quot;event&quot; variable
```

```csharp
e = e || event;
```

```csharp



```csharp
var target = (e.srcElement || e.currentTarget).parentNode;
```

```csharp
var ptxt;
```

```csharp
var phtml;
```

```csharp
var plink;
```

```csharp
var pres = target.childNodes;
```

```csharp
for (var i = 0; i &lt; pres.length; i++) {
```

```csharp
if (pres[i].id === &quot;plaintext&quot;) {
```

```csharp
ptxt = pres[i];
```

```csharp
} else if (pres[i].id === &quot;codeSnippet&quot;) {
```

```csharp
phtml = pres[i];
```

```csharp
} else if (pres[i].id === &quot;ptlink&quot;) {
```

```csharp
plink = pres[i];
```

```csharp
}
```

```csharp
}
```

```csharp



```csharp
if (ptxt.style[&quot;display&quot;] === &quot;none&quot;) {
```

```csharp
ptxt.style[&quot;display&quot;] = &quot;block&quot;;
```

```csharp
phtml.style[&quot;display&quot;] = &quot;none&quot;;
```

```csharp
plink.innerHTML = &quot;Formatted&quot;;
```

```csharp
}
```

```csharp
else {
```

```csharp
ptxt.style[&quot;display&quot;] = &quot;none&quot;;
```

```csharp
phtml.style[&quot;display&quot;] = &quot;block&quot;;
```

```csharp
plink.innerHTML = &quot;Plain Text&quot;;
```

```csharp



```csharp
};
```

```csharp



```csharp



```csharp
};
```

```csharp
}
```

```csharp
}
```

```csharp



```csharp



Enjoy!
