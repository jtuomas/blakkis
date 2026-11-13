/*
    Bläkkisvuohi, a Telegram bot to help track estimated blood alcohol concentration.
    Copyright (C) 2017  Joonas Ulmanen

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
    linechart.js
    Library to easily draw linecharts.
*/

'use strict';

const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const log = require('loglevel').getLogger('system');

const linechart = (module.exports = {});

// The legend lists everyone on the right, so the chart gets taller with the number of people.
// Renderers are kept per height and reused, creating one per chart leaks memory.
const WIDTH = 1280;
const HEIGHTS = [728, 1000, 1300, 1500];
const renderers = {};

function getRenderer(people) {
  const needed = 100 + 23 * people;
  const height = HEIGHTS.find(h => h >= needed) || HEIGHTS[HEIGHTS.length - 1];
  if (!renderers[height]) {
    renderers[height] = new ChartJSNodeCanvas({
      width: WIDTH,
      height: height,
      backgroundColour: 'white',
    });
  }
  return renderers[height];
}

function createLineChartConfig(data, title) {
  return {
    type: 'line',
    data: data,
    options: {
      elements: {
        line: {
          tension: 0.4,
          // Smooth without overshooting the real values
          cubicInterpolationMode: 'monotone',
        },
      },
      plugins: {
        legend: {
          position: 'right',
          labels: {
            // The legend shows the marker shape and the color, which together name the line
            usePointStyle: true,
            boxWidth: 9,
            padding: 6,
            font: { size: 12 },
            filter: item => item.text !== '',
          },
        },
        title: {
          display: true,
          text: title,
          font: { size: 18 },
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Aika',
          },
        },
        y: {
          display: true,
          min: 0,
          title: {
            display: true,
            text: 'Promillet',
          },
        },
      },
    },
  };
}

linechart.getLineGraphBuffer = function(data, title) {
  log.debug('Trying to make a line chart from data');
  const people = ((data && data.datasets) || []).filter(dataset => dataset.label !== '').length;
  return getRenderer(people).renderToBuffer(createLineChartConfig(data, title));
};
