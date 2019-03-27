# node-tls-session-cache
Enable TLS Session resumption (caching) on your Node server

[![License: ISC](https://img.shields.io/npm/l/tls-session-cache.svg)](https://opensource.org/licenses/ISC)

This will allow a regular node https or tls server to resume tls sessions using caching

There are two methods for tls session resumption. Node has *tickets* ready out of the box. The other, which you may be failing on your [Qualys SSL Report](https://www.ssllabs.com/ssltest/analyze.html), is *caching*. 

Just pass in your server to get running:

```js
const server = require('https').createServer(httpsConfig, (req,res) => res.end('OK'));
server.listen(5555);

require('tls-session-cache')(server);
```

Server can be https, tls

All available options:
```js
require('tls-session-cache')(server, {
  maxCachedSessions = 555 // number of sessions to hold in cache (default 100)
});
```

## Authors

fijimunkii

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE.txt) file for details.
