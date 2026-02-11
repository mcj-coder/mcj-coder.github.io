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

             1: 'text/javascript'>

       2:         var ChildText = function(nodeList) {

       3:             var text = &#39;&#39;;

       4:             for (var j = nodeList.length - 1; j &gt;= 0; --j) {

       5:                 if (nodeList[j].childNodes.length &gt; 0) {

       6:                     text = ChildText(nodeList[j].childNodes) + text;

       7:                 } else if (nodeList[j].nodeType == 3) {

       8:                     var local= &#39;&#39;;

       9:                     if (nodeList[j].textContent) {

      10:                         local = nodeList[j].textContent;

      11:                     } else {

      12:                         local = nodeList[j].nodeValue;

      13:                     }

      14:                       var div = document.createElement(&quot;div&quot;);

      15:                        var dt = document.createTextNode(local);

      16:                        div.appendChild(dt);

      17:                        text = div.innerHTML + text;

      18:                 }

      19:             }

      20:             return text;

      21:         }

      22:     

      23:         var divs = document.getElementsByTagName(&quot;div&quot;);

      24:         for (var i = 0; i &lt; divs.length; i++) {

      25:             if (divs[i].id === &quot;codeSnippetWrapper&quot;) {

      26:  

      27:                 divs[i].style[&quot;position&quot;] = &quot;relative&quot;;

      28:  

      29:                 var dtxt = document.createElement(&quot;div&quot;);

      30:                 dtxt.setAttribute(&quot;id&quot;, &quot;plaintext&quot;);

      31:                 dtxt.setAttribute(&quot;style&quot;, &quot;display:none;&quot;);

      32:                 var txt = document.createElement(&quot;pre&quot;);

      33:                 dtxt.appendChild(txt);

      34:                 divs[i].appendChild(dtxt);

      35:                 var text = &#39;&#39;;

      36:                 var lines = divs[i].getElementsByTagName(&quot;pre&quot;);

      37:                 for (var j = lines.length - 1; j &gt;= 0; --j) {

      38:                     var cns = lines[j].childNodes;

      39:                     var chd = [];

      40:                     for (var k = 1; k &lt; cns.length; k++)

      41:                         chd[k - 1] = cns[k];

      42:  

      43:                     text = ChildText(chd) + text;

      44:                     if (j &gt; 0) text = &quot;&lt;br /&gt;&quot; + text;

      45:                 }

      46:  

      47:                 txt.innerHTML = text;

      48:  

      49:  

      50:                 var link = document.createElement(&quot;span&quot;);

      51:                 link.setAttribute(&quot;id&quot;, &quot;ptlink&quot;);

      52:                 link.innerHTML = &quot;Plain Text&quot;;

      53:                 link.setAttribute(&quot;style&quot;, &quot;width:10em;height:1.5em;position:absolute;padding:2px;top:-2px;right:10px;border:1px;border-color:#000;background-color:#fff;font-size:0.9em;display:block;color:#000;&quot;);

      54:                 divs[i].appendChild(link);

      55:  

      56:                 link.onclick = function(e) {

      57:                     //If &quot;e&quot; is undefined use the global &quot;event&quot; variable

      58:                     e = e || event;

      59:  

      60:                     var target = (e.srcElement || e.currentTarget).parentNode;

      61:                     var ptxt;

      62:                     var phtml;

      63:                     var plink;

      64:                     var pres = target.childNodes;

      65:                     for (var i = 0; i &lt; pres.length; i++) {

      66:                         if (pres[i].id === &quot;plaintext&quot;) {

      67:                             ptxt = pres[i];

      68:                         } else if (pres[i].id === &quot;codeSnippet&quot;) {

      69:                             phtml = pres[i];

      70:                         } else if (pres[i].id === &quot;ptlink&quot;) {

      71:                             plink = pres[i];

      72:                         }

      73:                     }

      74:  

      75:                     if (ptxt.style[&quot;display&quot;] === &quot;none&quot;) {

      76:                         ptxt.style[&quot;display&quot;] = &quot;block&quot;;

      77:                         phtml.style[&quot;display&quot;] = &quot;none&quot;;

      78:                         plink.innerHTML = &quot;Formatted&quot;;

      79:                     }

      80:                     else {

      81:                         ptxt.style[&quot;display&quot;] = &quot;none&quot;;

      82:                         phtml.style[&quot;display&quot;] = &quot;block&quot;;

      83:                         plink.innerHTML = &quot;Plain Text&quot;;

      84:                         

      85:                     };

      86:  

      87:  

      88:                 };

      89:             }

      90:         }

      91: 

      92:  

Enjoy!
