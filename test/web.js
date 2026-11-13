'use strict';

const assert = require('assert');
const http = require('http');
const utils = require('../app/lib/utils.js');
const web = require('../web.js');

describe('web.js', function() {
  let server;
  let port;
  let updates;

  function request(method, path, headers, body) {
    return new Promise((resolve, reject) => {
      const req = http.request(
        { host: '127.0.0.1', port, method, path, headers },
        res => {
          let data = '';
          res.on('data', chunk => (data += chunk));
          res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
        },
      );
      req.on('error', reject);
      req.end(body);
    });
  }

  function postUpdate(headers) {
    return request(
      'POST',
      '/telegram',
      Object.assign({ 'content-type': 'application/json' }, headers),
      JSON.stringify({ update_id: 1 }),
    );
  }

  before(function(done) {
    updates = [];
    const app = web.createApp({ processUpdate: update => updates.push(update) });
    server = http.createServer(app).listen(0, '127.0.0.1', () => {
      port = server.address().port;
      done();
    });
  });

  after(function(done) {
    server.close(done);
  });

  beforeEach(function() {
    updates.length = 0;
  });

  it('should process an update that carries the secret token', function() {
    return postUpdate({ 'x-telegram-bot-api-secret-token': utils.webhookSecret() }).then(res => {
      assert.equal(res.status, 200);
      assert.deepEqual(updates, [{ update_id: 1 }]);
    });
  });

  it('should reject an update without the secret token', function() {
    return postUpdate({}).then(res => {
      assert.equal(res.status, 401);
      assert.equal(updates.length, 0);
    });
  });

  it('should reject an update with a wrong secret token', function() {
    return postUpdate({ 'x-telegram-bot-api-secret-token': 'wrong' }).then(res => {
      assert.equal(res.status, 401);
      assert.equal(updates.length, 0);
    });
  });

  it('should not accept updates on the old token path', function() {
    return request('POST', '/' + process.env.TOKEN, {}, '{}').then(res => {
      assert.equal(res.status, 404);
    });
  });

  it('should not reveal the version or the framework on /', function() {
    return request('GET', '/', {}).then(res => {
      assert.equal(res.status, 200);
      assert.equal(res.body, 'ok');
      assert.equal(res.headers['x-powered-by'], undefined);
    });
  });
});
