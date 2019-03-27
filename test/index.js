const tlsSessionCache = require('../index');
const createCert = require('util').promisify(require('pem').createCertificate);
const https = require('https');
const agent = new https.Agent();
const clientSessions = {};
const PORT = 5555;

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

  const middleware = (req, res) => {
    if (req.url === '/drop-key') {
      server.setTicketKeys(crypto.randomBytes(48));
    }
    res.end('OK');
  };

  const vanillaServer = https.createServer(httpsConfig, middleware);
  const httpsServer = https.createServer(httpsConfig, middleware);
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

};

if (!module.parent) module.exports(require('tap'));
