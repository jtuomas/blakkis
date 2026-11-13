/* globals describe, it */
'use strict';

const assert = require('assert');
const heatmap = require('../../app/lib/heatmap.js');
const chartdata = require('../../app/lib/chartdata.js');

function drinkers(count, nick) {
  const byUser = {};
  for (let i = 0; i < count; i += 1) {
    byUser['u' + i] = {
      userid: 'u' + i,
      nick: nick || 'Juoja' + i,
      weight: 80,
      gender: 'mies',
      height: 180,
      drinks: [1 + (i % 3), 0.5].map(hoursAgo => ({
        alcohol: 14000,
        created: new Date(Date.now() - hoursAgo * 3600 * 1000),
      })),
    };
  }
  return byUser;
}

function draw(count, nick) {
  const { rows, nowIndex } = chartdata.getRows(drinkers(count, nick), 24, 12);
  return heatmap.getHeatmapBuffer(rows, nowIndex, 'Testikartta');
}

const size = buffer => ({ width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) });
const channels = color => color.match(/\d+/g).map(Number);

describe('heatmap.js', function() {
  describe('heatmap.getColor()', function() {
    it('should get darker the more permilles there are', function() {
      const brightness = permilles => channels(heatmap.getColor(permilles)).reduce((a, b) => a + b);
      assert(brightness(0) > brightness(0.5));
      assert(brightness(0.5) > brightness(1));
      assert(brightness(1) > brightness(1.5));
      assert(brightness(1.5) > brightness(2));
    });

    it('should stay within the scale', function() {
      assert.equal(heatmap.getColor(7), heatmap.getColor(2));
      assert.equal(heatmap.getColor(-1), heatmap.getColor(0));
    });
  });

  describe('heatmap.getHeatmapBuffer()', function() {
    this.slow(300);

    it('should return a png image', function() {
      const buffer = draw(3);
      assert(buffer instanceof Buffer);
      assert.equal(buffer.slice(1, 4).toString(), 'PNG');
    });

    it('should make the image taller with more people but not wider', function() {
      const few = size(draw(5));
      const many = size(draw(50));
      assert.equal(few.width, many.width);
      assert(many.height > few.height + 40 * 20, few.height + ' ' + many.height);
    });

    it('should draw at most maxRows people', function() {
      const capped = size(draw(heatmap.maxRows + 20));
      const exact = size(draw(heatmap.maxRows));
      assert.equal(capped.height, exact.height);
    });

    it('should cope with a very long nickname', function() {
      assert(draw(2, 'Hyvin pitkä nimimerkki joka ei mahdu nimisarakkeeseen millään'));
    });
  });
});
