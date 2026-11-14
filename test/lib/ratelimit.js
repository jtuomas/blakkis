/* globals describe, it, beforeEach, afterEach */
'use strict';

const assert = require('assert');
const ratelimit = require('../../app/lib/ratelimit.js');
const settings = require('../../app/settings.js');

describe('ratelimit.js', function() {
  let originalLimit;
  const MINUTE = 60 * 1000;

  beforeEach(function() {
    originalLimit = settings.rate_limit_per_minute;
    settings.rate_limit_per_minute = 3;
    ratelimit.reset();
  });

  afterEach(function() {
    settings.rate_limit_per_minute = originalLimit;
    ratelimit.reset();
  });

  it('should allow messages up to the limit', function() {
    for (let i = 0; i < 3; i++) {
      assert.equal(ratelimit.check(1, 1000 + i), ratelimit.ALLOW);
    }
  });

  it('should notify once when the limit is exceeded and then drop silently', function() {
    for (let i = 0; i < 3; i++) {
      ratelimit.check(1, 1000 + i);
    }
    assert.equal(ratelimit.check(1, 1010), ratelimit.NOTIFY);
    assert.equal(ratelimit.check(1, 1011), ratelimit.DROP);
    assert.equal(ratelimit.check(1, 1012), ratelimit.DROP);
  });

  it('should allow messages again once they fall out of the window', function() {
    for (let i = 0; i < 4; i++) {
      ratelimit.check(1, 1000 + i);
    }
    assert.equal(ratelimit.check(1, 1000 + MINUTE + 10), ratelimit.ALLOW);
  });

  it('should count every user separately', function() {
    for (let i = 0; i < 4; i++) {
      ratelimit.check(1, 1000 + i);
    }
    assert.equal(ratelimit.check(2, 1010), ratelimit.ALLOW);
  });

  it('should never limit any admin in admin_ids', function() {
    const originalAdmins = settings.admin_ids;
    settings.admin_ids = [42, 43];
    try {
      for (let i = 0; i < 10; i++) {
        assert.equal(ratelimit.check(42, 1000 + i), ratelimit.ALLOW);
        assert.equal(ratelimit.check(43, 1000 + i), ratelimit.ALLOW);
      }
    } finally {
      settings.admin_ids = originalAdmins;
    }
  });
});
