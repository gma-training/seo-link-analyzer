seo-link-analyzer
=================

This repository contains a script that you can use to see how many [internal links] there are to each page on a web site.

[internal links]: https://moz.com/learn/seo/internal-link

Running it
----------

It's a JavaScript application, and requires [Node.js] 18.x or later. Once you've got the `node` command installed you'll be able to install the code like this:

```sh
git clone https://github.com/gma-training/seo-link-analyzer.git
cd seo-link-analyzer
npm install
```

To run it, pass the URL of the website you'd like to analyse to the main script:

```sh
node main.js <url-of-website>
```

If you run it on a large site it could take a while to crawl the site and print a report. When it's finished crawling it prints a report with one line per page, sorted by the number of internal links to each page.

For example, you could find the top 10 most linked-to pages on your site like this:

```sh
node main.js http://nestacms.com | tail -n 10
      82 nestacms.com/articles.xml
      82 nestacms.com/support
      83 nestacms.com/about
      86 nestacms.com/docs/design
      92 nestacms.com/docs/recipes
      93 nestacms.com/docs/creating-content
      97 nestacms.com/blog
     138 nestacms.com/docs
     204 nestacms.com/archives
     254 nestacms.com
```

You may also see a few warnings about links that were excluded from the report. Typically these warnings report links to pages that couldn't be found, or to things that aren't web pages (e.g. PDFs).

You'll be able to improve your visitors' experience (and your SEO) if you fix any "Not Found" errors on your site. Setting up "permanent redirects" for each broken link is a good way way to address these errors.

[Node.js]: https://nodejs.org/

Why I wrote it
--------------

I've switched from working with Rails (a web framework written in Ruby) to using frameworks written in JavaScript (Rails is great, but I think there's some interesting work happening in the JavaScript community, and after over 12 years doing Rails I fancied a change). Demonstrating to clients that I could write good Ruby code was easy; there's [plenty of Ruby] on my GitHub profile.

Unfortunately, most of my JavaScript code is in closed-source products that I can't share publicly, so JavaScript on my GitHub account was a little thin on the ground. I known for a while that it wouldn't hurt to add a few examples.

Then I stumbled across [boot.dev], a training platform for backend developers. People often ask me for good learning resources, so I had a good look to see if it should go on my recommended list. And I have to say, I really like it.

boot.dev teaches the programming principles that you need to write backend code, through Python, JavaScript and Go. As you work through the boot.dev material, acquiring new skills, they ask you to practice what you've learned by building a few projects.

This is the first of their projects that I looked at, and (having spent 4 years working in the SEO industry) it rather appealed. I had some time and thought it'd be fun to knock this out. And it was.

And this is where boot.dev stands out for me — the projects don't involve copying the work of a course tutor. You have to work out how to solve realistic problems yourself, and the **code you end up with is all down to you**. What a great way for new developers to build up a portfolio! I can see myself recommending it to a lot of people.

[plenty of Ruby]: https://github.com/gma?tab=repositories&q=&type=source&language=ruby&sort=
[boot.dev]: https://boot.dev/

How my approach differs
-----------------------

The boot.dev guide to this project gives you some loose guidelines for how to approach it. e.g. "create a function called `crawlPage()` and then make it do the following..."

The first few steps advocated unit testing the code, but when we got to the bit where we were downloading pages from the web, unit testing got dropped. I understand why; testing code that interacts with external systems requires some slightly more adanced techniques.

But I'm a big fan of Test Driven Development (TDD), particularly because it helps ensure my functions and methods are easy to use. So I carried on writing tests, using Jest's mock objects to stub out network requests.

The boot.dev guide suggested displaying error messages that were caught within `crawlPage()` with `console.log()`. Unfortunately these messages don't play nicely with the test runner (they fill your screen in an unhelpful way) so TDD pushed me towards finding another approach. 

The solution was simple; we can inject an error handling function that prints out the error for us. The test suite passes in a function that doesn't print anything. And my production code passes in a (very simple) function that formats the error and writes it out with `console.error()`.

But it could be as simple as this:

```js
function crawlPage(baseUrl, url, { onError = () => {} }) {
  try {
    // risky stuff goes here
  } catch (e) {
    // something's gone wrong
    onError(e.message);
  }
}

// now we can "inject" the appropriate dependency at run time
await crawlPage(baseUrl, url, { onError: console.error });
```

This was a fairly typical win for TDD — the approach it pushed me towards is more flexible, but I only came up with it because it was easier to test.
