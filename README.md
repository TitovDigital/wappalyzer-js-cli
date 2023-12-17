# Wappalyzer JS Driver and CLI

This is a Wappalyzer JS Driver and CLI forked from the last public release of the
[wappalyzer module](https://www.npmjs.com/package/wappalyzer/v/6.10.66?activeTab=code)
6.10.66 made on 14/08/2023 under GPL 3.0 license.

This repository doesn't have it's own database and is designed to be used
in conjunction with [enthec/webappanalyzer](https://github.com/enthec/webappanalyzer).
`cli.js` expects the `webappanalyzer` to be cloned alongside `wappalyzer-js-cli`.
When used as a package, the main entry point `driver.js` needs technologies
and categories to be specified explicitly (see example below).

## Command line

### Usage

```
node cli.js <url> [options]
```

#### Options

```
-b, --batch-size=...       Process links in batches
-d, --debug                Output debug messages
-t, --delay=ms             Wait for ms milliseconds between requests
-h, --help                 This text
-H, --header               Extra header to send with requests
--html-max-cols=...        Limit the number of HTML characters per line processed
--html-max-rows=...        Limit the number of HTML lines processed
-D, --max-depth=...        Don't analyse pages more than num levels deep
-m, --max-urls=...         Exit when num URLs have been analysed
-w, --max-wait=...         Wait no more than ms milliseconds for page resources to load
-p, --probe=[basic|full]   Perform a deeper scan by performing additional requests and inspecting DNS records
-P, --pretty               Pretty-print JSON output
--proxy=...                Proxy URL, e.g. 'http://user:pass@proxy:8080'
-r, --recursive            Follow links on pages (crawler)
-a, --user-agent=...       Set the user agent string
-n, --no-scripts           Disabled JavaScript on web pages
-N, --no-redirect          Disable cross-domain redirects
-e, --extended             Output additional information
--local-storage=...        JSON object to use as local storage
--session-storage=...      JSON object to use as session storage
--defer=ms                 Defer scan for ms milliseconds after page load

```


## Dependency

### Installation

```shell
$ npm i wappalyzer
```

### Usage

```javascript
const fs = require('fs')
const path = require('path')

const Wappalyzer = require('wappalyzer') // driver.js

const url = 'https://www.wappalyzer.com'

const options = {
  debug: false,
  delay: 500,
  headers: {},
  maxDepth: 3,
  maxUrls: 10,
  maxWait: 5000,
  recursive: true,
  probe: true,
  proxy: false,
  userAgent: 'Wappalyzer',
  htmlMaxCols: 2000,
  htmlMaxRows: 2000,
  noScripts: false,
  noRedirect: false,
};

const wappalyzer = new Wappalyzer(options)

const categories = JSON.parse(
  fs.readFileSync(path.resolve(`${__dirname}/../webappanalyzer/src/categories.json`))
)

let technologies = {}

for (const index of Array(27).keys()) {
  const character = index ? String.fromCharCode(index + 96) : '_'

  technologies = {
    ...technologies,
    ...JSON.parse(
      fs.readFileSync(
        path.resolve(`${__dirname}/../webappanalyzer/src/technologies/${character}.json`)
      )
    ),
  }
}

wappalyzer.setTechnologies(technologies)
wappalyzer.setCategories(categories)

;(async function() {
  try {
    await wappalyzer.init()

    // Optionally set additional request headers
    const headers = {}

    // Optionally set local and/or session storage
    const storage = {
      local: {},
      session: {}
    }

    const site = await wappalyzer.open(url, headers, storage)

    // Optionally capture and output errors
    site.on('error', console.error)

    const results = await site.analyze()

    console.log(JSON.stringify(results, null, 2))
  } catch (error) {
    console.error(error)
  }

  await wappalyzer.destroy()
})()
```

Multiple URLs can be processed in parallel:

```javascript
const Wappalyzer = require('wappalyzer');

const urls = ['https://www.wappalyzer.com', 'https://www.example.com']

const wappalyzer = new Wappalyzer()

;(async function() {
  try {
    await wappalyzer.init()

    const results = await Promise.all(
      urls.map(async (url) => {
        const site = await wappalyzer.open(url)

        const results = await site.analyze()

        return { url, results }
      })
    )

    console.log(JSON.stringify(results, null, 2))
  } catch (error) {
    console.error(error)
  }

  await wappalyzer.destroy()
})()
```

### Events

Listen to events with `site.on(eventName, callback)`. Use the `page` parameter to access the Puppeteer page instance ([reference](https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#class-page)).

| Event       | Parameters                     | Description                              |
|-------------|--------------------------------|------------------------------------------|
| `log`       | `message`, `source`            | Debug messages                           |
| `error`     | `message`, `source`            | Error messages                           |
| `request`   | `page`, `request`              | Emitted at the start of a request        |
| `response`  | `page`, `request`              | Emitted upon receiving a server response |
| `goto`      | `page`, `url`, `html`, `cookies`, `scriptsSrc`, `scripts`, `meta`, `js`, `language` `links` | Emitted after a page has been analysed |
| `analyze`   | `urls`, `technologies`, `meta` | Emitted when the site has been analysed |
