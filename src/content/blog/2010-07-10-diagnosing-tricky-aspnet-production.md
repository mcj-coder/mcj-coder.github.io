---
title: Diagnosing Tricky ASP.Net Production Issues with DebugDiag and winDbg
description: ""
pubDate: 2010-07-10
heroImage: "../../assets/blog/diagnosing-tricky-aspnet-production-image_thumb[3].png"
tags: ["troubleshooting"]
source: hugo
originalUrl: "https://codifice.dev/posts/2010-07-10-diagnosing-tricky-aspnet-production/"
---

Issues that (appear to) occur only in production can be very frustrating.  Recently, I’ve had difficulty with a ‘normal’ product upgrade introducing several features and fixes… the code base worked in development, passed QA and passed UAT in the staging environment.  

  However, 5 minutes after deploying to live the w3wp process crashes, shortly followed by the other servers in the cluster.

  Bugger.

  A quick look in the event logs show no unusual errors logged by the application, but the Application log records this:

  >    Faulting application w3wp.exe, version 7.0.6002.18005, time stamp 0x49e023cf, faulting module kernel32.dll, version 6.0.6002.18005, time stamp 0x49e037dd, exception code 0xe053534f, fault offset 0x0003fbae, process id 0x%9, application start time 0x%10.

   Fecking awesome, no quick fix help here.   After rolling the site back to the previous version, a bit of Googling reveals that exception code 0xe053534f (catchy) is a StackOverflowException.  

  This is one of those lovely exceptions (like OutOfMemoryException) which you can’t really recover from (or indeed catch!), as the CLR will simply halt executing any of your code whilst it cleans up the mess and then roll over and die.  

  What I need is something that can detect the error, stop the CLR, and give me a ice cube in hell’s chance of seeing what’s up. What I need is a debugger.

  But You Can’t Hook Up VS to a Production Website!  If this was happing on my local environment, VS is clearly the tool of choice.  But for hermetically-sealed, locked down environments like Production – Remote Debugging just ain’t gonna happen.

  Shockingly, it seems I’m not the only (or even the first) developer to have deployed code with a bug in.  Fortunately, this means there’s already some tools out there to help, enter DebugDiag.  

  First, a bit of preparation… I pick a sacrificial server to host the debugger process and the faulty code and remove it from the public facing cluster.

  After installing and running the app you’re faced with a simple wizard for defining what you want to hook into:

  [](http://lh6.ggpht.com/_Vz_CYzsjR7M/TDiHhPHVIbI/AAAAAAAAAFA/ej0P_qND9H4/s1600-h/image%5B2%5D.png) 

  It’s pretty self-explanatory you pick from Crash (App be Bust), IIS Hang (Web App be Slow) or Memory and Handle Leak (App be Greedy).  

  I’ll be wanting ‘**Crash**’.

  Next, you need to pick what you’re trying to debug:

  [](http://lh6.ggpht.com/_Vz_CYzsjR7M/TDiHiaSMhGI/AAAAAAAAAFI/PYW2qrkODFw/s1600-h/image%5B5%5D.png) 

  

  Again, it’s pretty obvious.  As I’m not looking to borrow trouble from other applications, I’m just interesting in what’s going wrong with w3wp.  So ‘**A Specific Process**’ it is.

  [](http://lh5.ggpht.com/_Vz_CYzsjR7M/TDiHjb4DBoI/AAAAAAAAAFQ/jLie0QY9MlM/s1600-h/image%5B8%5D.png) 

  Selecting the Process Name ‘**w3wp.exe’** means that debugger will hook into any and all w3wp processes that it can find.  Checking the ‘This process instance only’ will limit it to just that Process ID ( I don’t want this).

  And now for ‘**Advance Configuration**’

  [](http://lh5.ggpht.com/_Vz_CYzsjR7M/TDiHkUb_O3I/AAAAAAAAAFY/yuj6_eac5vU/s1600-h/image%5B11%5D.png) 

  If I just wanted to capture a dump when a crash occurs, I could just click ‘Next’.  But right now I’m after a specific exception (0xe053534f ).  If the application crashes after that’s sorted then I’ll just have to repeat the process.  So click the ‘Exceptions’ button:

  [](http://lh5.ggpht.com/_Vz_CYzsjR7M/TDiHlFAYjgI/AAAAAAAAAFg/x5qoZ5zRIAI/s1600-h/image%5B14%5D.png) 

  Now, it’s just a case of filling in the Hex Error Code from the Application Log  (**e053534f**) and selecting ‘**Full Userdump**’ and set the Action Limit to ‘**1**’.  This will halt the process when the first matching exception is recorded and grab everything it can, ready for diagnosis.

  There aren’t any more exceptions that I want to add, so I can just continue through the wizard and save the rule when prompted (*taking a note of where the logs will be stored*):

  [](http://lh4.ggpht.com/_Vz_CYzsjR7M/TDiHmItz-uI/AAAAAAAAAFo/jnGgqb5zByw/s1600-h/image%5B17%5D.png) 

  And **Activate** the rule.

  [](http://lh5.ggpht.com/_Vz_CYzsjR7M/TDiHm_DBH0I/AAAAAAAAAFw/9WoTm4slMQ0/s1600-h/image%5B20%5D.png) 

  Now for the bit I hope the client never finds out about….knowingly exposing the public to faulty code! 

  In order to identify the issue, I need to capture the the event. So, with the rule active in DebugDiag, I re-add the sacrificial server back to the public facing cluster and wait for the error to occur…

  [](http://lh6.ggpht.com/_Vz_CYzsjR7M/TDiHpCpJY0I/AAAAAAAAAF4/ONdP_YDr-6g/s1600-h/image%5B23%5D.png) 

  Thankfully, it’s simply a case of monitoring the Userdump count for the rule on the DebugDiag window.  When that hit’s 1, I can remove the server from the cluster again.

  Analysing the Crash Dump and Identifying the Issue  Ok, I’ve captured the exception and dropped the sacrificial server from the cluster again and transferred the dump to my development machine.  Let’s take a look at what DebugDiag found.

  Switch to the ‘Advanced Analysis’ tab, select the ‘Crash/Hang Analyzers’ script and the dump data file and click ‘Start Analysis’

  [](http://lh4.ggpht.com/_Vz_CYzsjR7M/TDiHqOXPciI/AAAAAAAAAGA/RTHve-d5kxY/s1600-h/image%5B26%5D.png) 

  After a few seconds an IE window pops up with the findings:

  [](http://lh6.ggpht.com/_Vz_CYzsjR7M/TDiHrkjbZDI/AAAAAAAAAGI/wcPRG4jUYxQ/s1600-h/image%5B29%5D.png) 

  Errrk, the recommendation mentions a fault with **mscorwks.dll**.  Not to worry, I happen to know that all Out of Memory and Stack Overflow originate from this library…it’s where they’re detected and raised!  Not the root cause, for that I need to look further into the stacktrace:

  [](http://lh5.ggpht.com/_Vz_CYzsjR7M/TDiHs7R5OkI/AAAAAAAAAGQ/iPW5Mv3MZkI/s1600-h/image%5B32%5D.png) 

  Wow, a crystal clear view what was occurring on the the thread when the stack overflow occurred – if you’re a sodding machine.  This is the native code view of the compiled managed code, so it’s been doubly mangled.  I need a translator….[WinDbg](Hyperlink...)

  So, open the DebugDiag crash dump in [WinDbg](Hyperlink...) 

  [](http://lh6.ggpht.com/_Vz_CYzsjR7M/TDiHuzHm9HI/AAAAAAAAAGY/-2B9pG6awqA/s1600-h/image%5B35%5D.png) 

  And you’ll get a nice little terminal window

  [](http://lh3.ggpht.com/_Vz_CYzsjR7M/TDiHws7g48I/AAAAAAAAAGg/EsRHRgIhbTM/s1600-h/image%5B38%5D.png) 

  All very well and good, but not exactly helpful.  So we need to tell it to analyse the dump with it’s .Net goggles on.   This can be done by entering these commands into the command line at the bottom of the screen:

     * .loadby sos mscorwks
    * !clrstack
   This should now give a much more readable and understandable stack trace:

  [](http://lh4.ggpht.com/_Vz_CYzsjR7M/TDiHyCzXzpI/AAAAAAAAAGo/3mzrhGf14ww/s1600-h/image%5B41%5D.png) 

  (*Code blacked out to protect the guilty…even if it is me!*)

  By reviewing the stack trace you should be able to work out the code that’s trapped in a recursive loop (a repeating set of lines towards the top) and also it’s entry point (towards the bottom).

  Now it’s back to the usual replicate/fix/test bug fixing process.