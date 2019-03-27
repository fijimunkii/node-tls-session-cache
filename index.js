// store tls session tickets for session resumption
// TODO: add redis

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
  const tlsSessionStore = {};
  const tlsSessionList = [];

  server.on('newSession', (id, data, cb) => {
    if (options.maxCachedSessions === 0) {
      return;
    }
    const key = id.toString('hex');
    if (tlsSessionStore[key]) {
      tlsSessionStore[key] = data;
      return;
    }
    if (tlsSessionList.length >= options.maxCachedSessions) {
      const oldKey = tlsSessionList.shift();
      delete tlsSessionStore[oldKey];
    }
    tlsSessionList.push(key);
    tlsSessionStore[key] = data; 
    cb();
  });

  server.on('resumeSession', (id, cb) => {
    cb(null, tlsSessionStore[id.toString('hex')] || null);
  });

};
