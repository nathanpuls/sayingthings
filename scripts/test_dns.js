import https from 'https';

async function checkDns(domain, token, customName, provider = 'https://cloudflare-dns.com/dns-query') {
    const hostname = customName || `_built-verify.${domain}`;
    const url = `${provider}?name=${hostname}&type=TXT`;

    console.log(`Checking ${url}...`);

    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'Accept': 'application/dns-json' } }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const json = JSON.parse(data);
                console.log(`Response from ${provider}:`, JSON.stringify(json, null, 2));
                if (json.Answer) {
                    resolve(json.Answer.some((record) => record.data.includes(token)));
                } else {
                    resolve(false);
                }
            });
        }).on('error', reject);
    });
}

const domain = 'sayingthings.com';
const token = 'built-verify-9qzvo';
const customName = '_built-verify.sayingthings.com';

(async () => {
    const cf = await checkDns(domain, token, customName, 'https://cloudflare-dns.com/dns-query');
    console.log('CF Verified:', cf);

    const google = await checkDns(domain, token, customName, 'https://dns.google/resolve');
    console.log('Google Verified:', google);
})();
