const tlsSessionCache = require('../index');
const createCert = require('util').promisify(require('pem').createCertificate);
const https = require('https');
const agent = new https.Agent();
const clientSessions = {};
const PORT = 5555;
const autocannon = require('autocannon');
const autocannonConfig = { url: `https://localhost:${PORT}`, connections: 10, duration: 1 };

function request(url, name) {
  return new Promise(resolve => {
    https.get(`https://localhost:${PORT}${url}`, { agent, rejectUnauthorized: false }, res => {
      clientSessions[name] = res.socket.getSession().toString('hex');
      resolve();
    });
  });
}

module.exports = async t => {

  const httpsConfig = await createCert({ days: 1, selfSigned: true })
    .then(d => { return { key: d.serviceKey, cert: d.certificate }; });
  // Disable TLS session tickets so we can properly test session cache
  httpsConfig.secureOptions = require('constants').SSL_OP_NO_TICKET;

  const httpResponse = (req,res) => {
    const body = 'OK';
    res.writeHead(200, {
      'Content-Length': Buffer.byteLength(body),
      'Content-Type': 'text/plain'
    });
    res.end(body);
  };

  const vanillaServer = https.createServer(httpsConfig, httpResponse);
  const httpsServer = https.createServer(httpsConfig, httpResponse);
  tlsSessionCache(httpsServer);

  t.test('vanilla https server does not reuse tls session', async (t) => {
    vanillaServer.listen(PORT);
    await request('/', 'vanilla-1');
    await request('/', 'vanilla-2');
    t.notEqual(clientSessions['vanilla-1'],clientSessions['vanilla-2']);
    vanillaServer.close();
  });

  t.test('https server does reuse tls session', async (t) => {
    httpsServer.listen(PORT);
    await request('/', 'https-1');
    await request('/', 'https-2');
    t.equal(clientSessions['https-1'],clientSessions['https-2']);
    httpsServer.close();
  });

  t.test('tls server does reuse tls session');

  t.test('load test', async (t) => {
    await new Promise(resolve => {
      httpsServer.listen(PORT);
      autocannon(autocannonConfig, (err, result) => {
        t.notOk(err);
        t.same(result.non2xx, 0);
        t.notEqual(result['2xx'], 0);
        httpsServer.close();
        resolve();
      });
    });
  });

};

if (!module.parent) module.exports(require('tap'));
