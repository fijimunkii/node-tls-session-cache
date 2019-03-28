// store tls session tickets for session resumption
// TODO: add redis
const QuickLRU = require('quick-lru');

module.exports = (server, options) => {

  if (!server) {
    throw new Error('Missing server argument - [https,tls].createServer()');
  }
  if (!server._sharedCreds) {
    throw new Error('Server is not TLS');
  }

  options = options || {};
  if (!options.hasOwnProperty('maxCachedSessions')) {
    options.maxCachedSessions = 100;
  }

  const lru = new QuickLRU({maxSize: options.maxCachedSessions});

  server.on('newSession', (id, data, cb) => {
    lru.set(id.toString('hex'),data);
    cb();
  });

  server.on('resumeSession', (id, cb) => {
    cb(null, lru.get(id.toString('hex')) || null);
  });

};
