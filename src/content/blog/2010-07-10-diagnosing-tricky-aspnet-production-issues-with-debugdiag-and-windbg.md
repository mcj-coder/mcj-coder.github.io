---
title: "Diagnosing Tricky ASP.Net Production Issues with DebugDiag and winDbg"
description: "Technical blog post from 2010-07-10"
pubDate: 2010-07-10
tags: ["dotnet", "aspnet", "blogging"]
source: "blogger"
originalUrl: "https://martinondotnet.blogspot.com/"
---

Issues that (appear to) occur only in production can be very frustrating.  Recently, I’ve had difficulty with a ‘normal’ product upgrade introducing several features and fixes… the code base worked in development, passed QA and passed UAT in the staging environment.  

  However, 5 minutes after deploying to live the w3wp process crashes, shortly followed by the other servers in the cluster.

  Bugger.

  A quick look in the event logs show no unusual errors logged by the application, but the Application log records this:

     Faulting application w3wp.exe, version 7.0.6002.18005, time stamp 0x49e023cf, faulting module kernel32.dll, version 6.0.6002.18005, time stamp 0x49e037dd, exception code 0xe053534f, fault offset 0x0003fbae, process id 0x%9, application start time 0x%10.

   Fecking awesome, no quick fix help here.   After rolling the site back to the previous version, a bit of Googling reveals that exception code 0xe053534f (catchy) is a StackOverflowException.  

  This is one of those lovely exceptions (like OutOfMemoryException) which you can’t really recover from (or indeed catch!), as the CLR will simply halt executing any of your code whilst it cleans up the mess and then roll over and die.  

  What I need is something that can detect the error, stop the CLR, and give me a ice cube in hell’s chance of seeing what’s up. What I need is a debugger.

  But You Can’t Hook Up VS to a Production Website!  If this was happing on my local environment, VS is clearly the tool of choice.  But for hermetically-sealed, locked down environments like Production – Remote Debugging just ain’t gonna happen.

  Shockingly, it seems I’m not the only (or even the first) developer to have deployed code with a bug in.  Fortunately, this means there’s already some tools out there to help, enter [DebugDiag](http://bit.ly/cn9qXV).  

  First, a bit of preparation… I pick a sacrificial server to host the debugger process and the faulty code and remove it from the public facing cluster.

  After installing and running the app you’re faced with a simple wizard for defining what you want to hook into:

  [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEisUZ74H8wysYqPoYfvbbtugWE3J2TtKnf3CXxh5OUYeVOgPoJ-BcjG8u6LoQjmxb5tdEC2jR3KpSH_uOcCAzwKVUkQW6Wm3X5M3FrZdDDYTtQlSfDzFrJ89FRreJBt_H5yW_6C6-gp/s1600-h/image%5B2%5D.png) 

  It’s pretty self-explanatory you pick from Crash (App be Bust), IIS Hang (Web App be Slow) or Memory and Handle Leak (App be Greedy).  

  I’ll be wanting ‘**Crash**’.

  Next, you need to pick what you’re trying to debug:

  [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhYB2ukoF_lWvWGuK209bNA8Ll49Uf6Gqcc0eSGT29kMLjtkvy5Dg1O7IuoRHx7InHVbgwsN_LGhFd_nkbfoqM3pQ9TmZl0q2NNdq2hO5pKaQJ4wTve_ZAllKI51_-puH1RFymJBM7-/s1600-h/image%5B5%5D.png) 

  

  Again, it’s pretty obvious.  As I’m not looking to borrow trouble from other applications, I’m just interesting in what’s going wrong with w3wp.  So ‘**A Specific Process**’ it is.

  [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiVcJIi5zNmNk6sFXSjN1SzTopBtNEVaGmovJgkC0C2caUAmBw8D6fckl3Rr-OWAXYpTi0D9j2Sd4fLtZTjiZAvvytusU_pZYLC4Uo_xa5W5YNSEO-wtpHbdpD7V61Yh-qrvmLVR3Qb/s1600-h/image%5B8%5D.png) 

  Selecting the Process Name ‘**w3wp.exe’** means that debugger will hook into any and all w3wp processes that it can find.  Checking the ‘This process instance only’ will limit it to just that Process ID ( I don’t want this).

  And now for ‘**Advance Configuration**’

  [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhOQ5udcR692Pzf5oxNUaIl09EHbvX3RGc5Uexv12tzVSap9FFiQeZ12vPa2O_0DYul8lvxG_S6e5dng4HMpkZlqG_urVVQHzpKmt1_8meC6gqgjvqW_ZuJH_3LlN4-RGycFEKnDIk7/s1600-h/image%5B11%5D.png) 

  If I just wanted to capture a dump when a crash occurs, I could just click ‘Next’.  But right now I’m after a specific exception (0xe053534f ).  If the application crashes after that’s sorted then I’ll just have to repeat the process.  So click the ‘Exceptions’ button:

  [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjn_e1ocI9ky4xMf339ycZEirubJEBVNJ6riDp3KFbps3FgaKEXoprwwbMicSPcy9r7VVTgfjwQ1ui8_dNRMP9N7MvOZ80wCgEAq7laY4d3C5iZsFjzXOA2k70opOxFnMqzwIqgi4EN/s1600-h/image%5B14%5D.png) 

  Now, it’s just a case of filling in the Hex Error Code from the Application Log  (**e053534f**) and selecting ‘**Full Userdump**’ and set the Action Limit to ‘**1**’.  This will halt the process when the first matching exception is recorded and grab everything it can, ready for diagnosis.

  There aren’t any more exceptions that I want to add, so I can just continue through the wizard and save the rule when prompted (*taking a note of where the logs will be stored*):

  [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgQ4dei6XmQ5c6zzWkcpMqR9DRHO2AfKiXo5hqg9clFAcLgDcB6TUhUw0vxr9HUs-GFiHZ-j_xKeejPBA6k_yLUNPVdcLRxWHmKAU-9D6ZgJHH8HR7nTqWc0t6CKvHz0RnVlDAeOWKr/s1600-h/image%5B17%5D.png) 

  And **Activate** the rule.

  [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj8EzeuMcjy5JnzWPX3lBcX8tHnGx0Bd73c8AtBVUUa1OriS-fvkkvZocLv76h1rTWhh9yj-9xu9VNJB4N2T-WMCVZ9-JfF2A1klAijdMYNwWdEmbJneyUEzPy84dLL6fU3EI41rrjN/s1600-h/image%5B20%5D.png) 

  Now for the bit I hope the client never finds out about….knowingly exposing the public to faulty code! 

  In order to identify the issue, I need to capture the the event. So, with the rule active in DebugDiag, I re-add the sacrificial server back to the public facing cluster and wait for the error to occur…

  [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiTp8lniGEbd1e3t21vplBs2gCA69gy4uQz5J-_bqRU7KEtXsQhTR0rPtWU7TtoOHJhKDscI2BMd4JbVnOv9JWMx-YMJgG0PyT4X595KGseUzPiTjJqeGCMVKYuRoY3Wsn2YyF_00vs/s1600-h/image%5B23%5D.png) 

  Thankfully, it’s simply a case of monitoring the Userdump count for the rule on the DebugDiag window.  When that hit’s 1, I can remove the server from the cluster again.

  Analysing the Crash Dump and Identifying the Issue  Ok, I’ve captured the exception and dropped the sacrificial server from the cluster again and transferred the dump to my development machine.  Let’s take a look at what DebugDiag found.

  Switch to the ‘Advanced Analysis’ tab, select the ‘Crash/Hang Analyzers’ script and the dump data file and click ‘Start Analysis’

  [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgeIH06CQ2bJxtXPkqe6zySZhaTsKLA4ZAEMY2LLGkDdBmnj5gk6V_LGey4BtmHfdQD5-Lzmo7V7uVvgeHPMcn9BaorA5kBVYPZoXAoRJDxrnLsOPbtrmVPboE_hgOfIT0chN8UJX0t/s1600-h/image%5B26%5D.png) 

  After a few seconds an IE window pops up with the findings:

  [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiT0FKL09-2qHLuJXm01CSiYAFIqFb870s5GoDEOB6zdl8CDadHgi_VeY8cgiE2xf34Z5FpjvNVBR7OmUxuRvqUUYkWKNwzSzPPm7738zvM82Vh_4cElGhvOJFERws6OTh9Ftqo97zj/s1600-h/image%5B29%5D.png) 

  Errrk, the recommendation mentions a fault with **mscorwks.dll**.  Not to worry, I happen to know that all Out of Memory and Stack Overflow originate from this library…it’s where they’re detected and raised!  Not the root cause, for that I need to look further into the stacktrace:

  [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiWPj5p8ix8rN5jYg7oti8SH9ufzCDWxCIA7sZz8v09T9KA2xzXYnEbIU0wWb8SZG4kvwJb4O4lYOLUdwS5TvzESTQ7BUgbQcM138TIG3mLx5YfxjOxBV_ohdFz7y4VWQgblQlIF0qr/s1600-h/image%5B32%5D.png) 

  Wow, a crystal clear view what was occurring on the the thread when the stack overflow occurred – if you’re a sodding machine.  This is the native code view of the compiled managed code, so it’s been doubly mangled.  I need a translator….[WinDbg](Hyperlink...)

  So, open the DebugDiag crash dump in [WinDbg](Hyperlink...) 

  [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhao5HZULZm9tJ_ios5Za9lDNxvcA4jkIwn5iL2deQI1aG8JchFl9C0YkCN-f8VqzYfd-F0FuVEMy39hxxdBL8vwtUiPticF6KYIZO5B8xk7WIgxllbI4UtXvZRjw5ReaexqEAFa7iF/s1600-h/image%5B35%5D.png) 

  And you’ll get a nice little terminal window

  [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg1JhJ9B3wegdndisTKNYBSuWVQ35llO7jk3EjIMP1UKVXdX-daEMoB22u2JOPpzOqoeRlK4s_9Zq-k2-kMHCAiQgLbDBhk4zOMdxWGfLwuyTdCdPZE3DL-LFqfLAIXpV0bNffBgYnb/s1600-h/image%5B38%5D.png) 

  All very well and good, but not exactly helpful.  So we need to tell it to analyse the dump with it’s .Net goggles on.   This can be done by entering these commands into the command line at the bottom of the screen:

     * .loadby sos mscorwks    * !clrstack   This should now give a much more readable and understandable stack trace:

  [](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiFioyPsNrZbo4tyUDJTsdLVS1RvgVRejHDPZRc8YzqraxXRhY9x3U98EnbrIhDB50kDXEDU24MSmGOhzGtjGbiDMUiIK63krznc-u7YUxhio1BGGGBF1EimdGjB7uQK2Sry8ny8T3n/s1600-h/image%5B41%5D.png) 

  (*Code blacked out to protect the guilty…even if it is me!*)

  By reviewing the stack trace you should be able to work out the code that’s trapped in a recursive loop (a repeating set of lines towards the top) and also it’s entry point (towards the bottom).

  Now it’s back to the usual replicate/fix/test bug fixing process.
