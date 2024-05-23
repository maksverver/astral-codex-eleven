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

  - Full precision timestamp shown when hovering over/focusing on the post date.


## Installation

Chrome extension: https://chromewebstore.google.com/detail/astral-codex-eleven/lmdipmgaknhfbndeaibopjnlckgghemn

Firefox add-on: https://addons.mozilla.org/firefox/addon/astral-codex-eleven/


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

Performance could be improved further by only populating part of the DOM tree
and adding links to "load more comments" on demand, but I'm not sure it's worth
the effort. This also has downsides, like requiring more user action to view all
comments, and making it more difficult to search through all comments.


## Limitations

  - The current version doesn't change comment deeplinks.

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
    related logic in [main-script.js](extension/js/main-script.js)).


## Alternatives

  - [ACX Reader](https://acxreader.github.io/) contains static HTML copies of
    the posts only.
    Those pages load extremely fast because they cut out all the Substack crap, but
    they lack the comments, which are often just as interesting as the posts
    themselves.

  - A Chrome extension called
    [acx-tweaks](https://chromewebstore.google.com/detail/acx-tweaks/jdpghojhfigbpoeiadalafcmohaekglf),
    which adds a ton of cool features, some of which I also have (like keyboard
    navigation and being able to view the full comment timestamp) but it does not
    speed up comment loading, unfortunately, which was the main problem I tried to
    fix. In an ideal world, our extensions would be combined into one.

  - A Firefox add-on called
    [Astral Codex Ten Speedifier](https://addons.mozilla.org/en-US/firefox/addon/astral-codex-ten-speedifier/),
    which re-renders the comments, much like my extension does. It does work,
    and is quite fast, but it's very basic: it disables all Javascript
    (breaking most of Substack's functionality), it doesn't support
    adding/editing/deleting comments, it doesn't work when accessing posts
    through the home page, it doesn't support collapsing comments, it renders
    deeply nested comments with a very narrow width, etc. It's also available
    for Firefox only. Overall, I think my extension offers a much more
    featureful and polished experience.


## Local development

### Running tests

Tests require [Node.js](https://nodejs.org/) to be installed. Run them with:

```
make test
```

### Manually testing the comments widget

Manual testing of the comments widget is facilitated by
[demo.html](demo/demo.html).

To use it, a set of comments in JSON format must be downloaded first.
For example, to download the (large) set of comments from the post
“Ivermectin: Much More Than You Wanted To Know”, run:

```
% curl -o demo/ivermectin-comments.json 'https://www.astralcodexten.com/api/v1/post/43667275/comments?token=&all_comments=true&sort=oldest_first&last_comment_at'
```

Or download a smaller set of comments for faster loading. You can find the
post id by opening a blog post and evaluating _preloads.post.id, or by logging
the network request made.

To view the comments, open demo.html in a browser and select the downloaded
json file.

The demo page looks very ugly, but the functionality should be comparable to
the live extension. Note that the demo only covers the comments widget
([ext-comments.js](extension/js/ext-comments.js)), not the main extension code
([astral-codex-eleven.js](extension/js/astral-codex-eleven.js),
[main-script.js](extension/js/main-script.js)), so the demo is not a complete
substitute for live testing.
