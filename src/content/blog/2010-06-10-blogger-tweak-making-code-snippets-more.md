---
title: 'Blogger Tweak: Making Code Snippets More Usable'
description: 'A Blogger template tweak that adds a plain text/formatted toggle to code snippets, making it easier for readers to copy code from blog posts.'
pubDate: 2010-06-10
tags: ['tips']
source: blogger
originalUrl: 'http://martinondotnet.blogspot.com/2010/06/blogger-tweak-making-code-snippets-more.html'
heroImage: ../../assets/blog/hero-images/2010-06-10-blogger-tweak-making-code-snippets-more.jpg
---

Now that I'm blogging more code snippet heavy content it's becoming apparent that the excellent [Code Snippet Plugin with Windows Live Writer](http://lvildosola.blogspot.com) isn't the most usable for people trying to copy the snippet for their own use. So I've created a Blogger Template tweak to automatically add a 'plain text/formatted' toggle.

To install simply copy the snippet below into your Blogger Template just above the `</body>` tag.

```javascript
var ChildText = function (nodeList) {
  var text = '';
  for (var j = nodeList.length - 1; j >= 0; --j) {
    if (nodeList[j].childNodes.length > 0) {
      text = ChildText(nodeList[j].childNodes) + text;
    } else if (nodeList[j].nodeType == 3) {
      var local = '';
      if (nodeList[j].textContent) {
        local = nodeList[j].textContent;
      } else {
        local = nodeList[j].nodeValue;
      }
      var div = document.createElement('div');
      var dt = document.createTextNode(local);
      div.appendChild(dt);
      text = div.innerHTML + text;
    }
  }
  return text;
};

var divs = document.getElementsByTagName('div');
for (var i = 0; i < divs.length; i++) {
  if (divs[i].id === 'codeSnippetWrapper') {
    divs[i].style['position'] = 'relative';

    var dtxt = document.createElement('div');
    dtxt.setAttribute('id', 'plaintext');
    dtxt.setAttribute('style', 'display:none;');
    var txt = document.createElement('pre');
    dtxt.appendChild(txt);
    divs[i].appendChild(dtxt);
    var text = '';
    var lines = divs[i].getElementsByTagName('pre');
    for (var j = lines.length - 1; j >= 0; --j) {
      var cns = lines[j].childNodes;
      var chd = [];
      for (var k = 1; k < cns.length; k++) chd[k - 1] = cns[k];

      text = ChildText(chd) + text;
      if (j > 0) text = '<br />' + text;
    }

    txt.innerHTML = text;

    var link = document.createElement('span');
    link.setAttribute('id', 'ptlink');
    link.innerHTML = 'Plain Text';
    link.setAttribute(
      'style',
      'width:10em;height:1.5em;position:absolute;padding:2px;top:-2px;right:10px;border:1px;border-color:#000;background-color:#fff;font-size:0.9em;display:block;color:#000;'
    );
    divs[i].appendChild(link);

    link.onclick = function (e) {
      //If "e" is undefined use the global "event" variable
      e = e || event;

      var target = (e.srcElement || e.currentTarget).parentNode;
      var ptxt;
      var phtml;
      var plink;
      var pres = target.childNodes;
      for (var i = 0; i < pres.length; i++) {
        if (pres[i].id === 'plaintext') {
          ptxt = pres[i];
        } else if (pres[i].id === 'codeSnippet') {
          phtml = pres[i];
        } else if (pres[i].id === 'ptlink') {
          plink = pres[i];
        }
      }

      if (ptxt.style['display'] === 'none') {
        ptxt.style['display'] = 'block';
        phtml.style['display'] = 'none';
        plink.innerHTML = 'Formatted';
      } else {
        ptxt.style['display'] = 'none';
        phtml.style['display'] = 'block';
        plink.innerHTML = 'Plain Text';
      }
    };
  }
}
```

Enjoy!
