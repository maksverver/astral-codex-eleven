# ACX Comment Viewer extension

This Chrome browser extension improves loading time for Scott Alexander's blog
[Astral Codex Ten](https://www.astralcodexten.com/) (ACX).


## Background

ACX is hosted on blogging platform [Substack](https://substack.com/Substack).
Substack blogs contain a lot of Javascript that makes loading pages relatively
slow, but what really kills performance for ACX is the comment section under
each post.

Unlike most Substack blogs, comments on ACX posts are loaded all at once, and
since ACX is very popular (the most popular posts have over 2,000 comments),
some pages can take several minutes (!) to load on some devices.

Example of a very slow post with over 2500 comments:
[Ivermectin: Much More Than You Wanted To Know](https://www.astralcodexten.com/p/ivermectin-much-more-than-you-wanted).


## Method of operation

This extension speeds up page load by rewriting the comments section. It works
as follows:

  1. Prevent the Substack scripts from loading the JSON comments (see:
[filter-rules.json](./filter-rules.json) and
[filter-rules.txt](./filter-rules.txt)). Blocking access only to this file
allows the other scripts to work normally, while preventing the comments to be
populated in the normal way, which we know is slow.

  2. Hide the now-useless Substack comments widget, which would otherwise show 0
     comments.

  3. Add a manually reimplemented comments widget.
     I didn't do anything too clever to make this especially fast; I just
     materialized the entire DOM tree from the comments JSON file. This seems
     fast enough even for posts with many comments.


## Bugs

  - It seems like the comments don't always load because the extension code is
    never run. I have no idea why this happens! When this happens, there should
    be a single comment visible that reads “Comments have been filtered out by
    the Astral Codex Ten Comment Viewer extension.” It can usually be fixed
    by reloading the page. If anyone knows how to fix this properly, please let
    me know!


## Limitations

  - Comments are currently **read-only**: replying is not supported, even if you
    are logged in! (I would like to fix this.)

    However, the current version doesn't change comment deeplinks, so you can
    click on a comment's date to open the original thread, and reply from there.
    (I realize this makes it difficult to add a toplevel reply.)

  - A lot of comment metadata is still missing:
      - profile links
      - “User was banned for this post”
      - edited timestamp
      - user icons (might never happen; these add a lot of overhead, while
        adding little value)
      - share links (will probably not happen; I doubt many people use these,
        and you can just copy the comment link if you really want to)

## Alternatives

https://acxreader.github.io/ contains static HTML copies of the posts only.
Those pages load extremely fast because they cut out all the Substack crap, but
they lack the comments, which are often just as interesting as the posts
themselves.
