# Astral Codex Eleven

Astral Codex Eleven is a browser extension for Chrome and Firefox that speeds up
Scott Alexander's blog [Astral Codex Ten](https://www.astralcodexten.com/) (ACX)
by reimplementing the comment section.

It also adds some quality-of-life improvements:

  - Fix the main menu to the top of the page.

  - Keyboard navigation:

      - `Enter`: collapse/expand comment
      - `h`: move to parent comment
      - `j`: move to next comment
      - `k`: move to previous comment
      - `shift` + `h`: move to toplevel comment
      - `shift` + `j`: move to next sibling comment
      - `shift` + `k`: move to previous sibling comment

  - Full precision timestamp shown when hovering over the post date.


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


## Mode of operation

This extension speeds up page load by rewriting the comments section. It works
as follows:

  1. Prevent the Substack scripts from loading the JSON comments (see:
[filter-rules.json](extension/filter-rules.json) and
[filter-rules.txt](extension/filter-rules.txt)).
Blocking access only to this file allows the other scripts to work normally,
while preventing the comments to be populated in the normal way, which we know
is slow.

  2. Hide the now-useless Substack comments widget, which would otherwise show
     no comments.

  3. Add a manually reimplemented comments widget.
     I didn't do anything too clever to make this especially fast; I just
     materialized the entire DOM tree from the comments JSON file. This seems
     fast enough even for posts with many comments.

## Limitations

  - Comments are currently **read-only**: replying is not supported, even if you
    are logged in! (I would like to fix this.)

    However, the current version doesn't change comment deeplinks, so you can
    click on a comment's date to open the original thread, and reply from there.
    To make a toplevel reply, click the comment icon on top of the post. (Note
    that you then have to deal with the usual slowness.)

  - A lot of comment metadata is still missing:
      - “User is banned”
      - “User was banned for this post”
      - User icons (may never happen; these add a lot of overhead, while adding
        little value)
      - Share links (will probably not happen; I doubt many people use these,
        and you can just copy the comment link if you really want to)

  - Page navigation is somewhat slower than before.

    Background: Substack blogs are partially single-page applications. If you
    visit the homepage and click on a linked post, the page doesn't fully
    reload, but instead loads the post into the existing DOM tree dynamically.
    This makes navigation from the homepage slightly faster, but it also makes
    it difficult to execute the extension code in response to page changes.
    (It's only partially a single-page application, since many links do cause a
    full page reload, like for example clicking the blog title on top of a post
    page to return to the homepage.)

    My current solution to this problem is to block the dynamic loading of
    pages. Whenever the document URL changes, I force a regular page reload, so
    that the extension script triggers properly. (See the `pushState()`
    related logic in [main-script.js](extension/main-script.js)).


## Alternatives

https://acxreader.github.io/ contains static HTML copies of the posts only.
Those pages load extremely fast because they cut out all the Substack crap, but
they lack the comments, which are often just as interesting as the posts
themselves.
