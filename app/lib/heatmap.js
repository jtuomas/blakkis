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
    heatmap.js
    Draws the heat map of /lampokartta: one row per person, one cell per hour, the color tells
    the permilles. Everyone fits on one picture however many people there are, because the
    color tells the value and not the person.
*/

'use strict';

const { createCanvas } = require('canvas');
const chartdata = require('./chartdata.js');

const heatmap = (module.exports = {});

const HOUR = 60 * 60 * 1000;
const ROW_HEIGHT = 24;
const LABEL_WIDTH = 170;
const RIGHT_WIDTH = 90;
const TOP = 120;
const BOTTOM = 100;
const PADDING = 20;
const GRID_WIDTH = 780; // the hour cells share this width
const LEGEND_WIDTH = 300;
const SCALE_MAX = 2; // permilles where the color scale tops out

// Telegram accepts photos up to 10000 pixels of width + height
heatmap.maxRows = 100;

// One hue from light to dark red, so that darker always means more
const STOPS = [
  [0, [240, 240, 240]],
  [0.3, [254, 230, 170]],
  [0.8, [253, 174, 97]],
  [1.3, [215, 48, 39]],
  [SCALE_MAX, [103, 0, 13]],
];

heatmap.getColor = function(permilles) {
  const value = Math.max(0, Math.min(SCALE_MAX, permilles));
  for (let i = 1; i < STOPS.length; i += 1) {
    if (value <= STOPS[i][0]) {
      const [from, fromColor] = STOPS[i - 1];
      const [to, toColor] = STOPS[i];
      const share = (value - from) / (to - from);
      return (
        'rgb(' +
        fromColor.map((part, k) => Math.round(part + (toColor[k] - part) * share)).join(',') +
        ')'
      );
    }
  }
};

const formatPermilles = permilles => permilles.toFixed(2).replace('.', ',');

// Shorten the text with an ellipsis so that it fits the width
function fit(g, text, maxWidth) {
  if (g.measureText(text).width <= maxWidth) {
    return text;
  }
  let shortened = text;
  while (shortened.length > 1 && g.measureText(shortened + '…').width > maxWidth) {
    shortened = shortened.slice(0, -1);
  }
  return shortened + '…';
}

// rows and nowIndex come from chartdata.getRows(), the highest peak first
heatmap.getHeatmapBuffer = function(rows, nowIndex, title, now) {
  now = now === undefined ? Date.now() : now;
  const shown = rows.slice(0, heatmap.maxRows);
  const count = shown.length;
  const columns = shown.length > 0 ? shown[0].values.length : 1;
  const cellWidth = Math.max(1, Math.floor(GRID_WIDTH / columns));
  const left = PADDING + LABEL_WIDTH;
  const gridWidth = columns * cellWidth;
  const gridBottom = TOP + count * ROW_HEIGHT;
  const width = left + gridWidth + RIGHT_WIDTH + PADDING;
  const height = gridBottom + BOTTOM;

  const canvas = createCanvas(width, height);
  const g = canvas.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, width, height);

  g.textAlign = 'left';
  g.fillStyle = '#222';
  g.font = 'bold 22px sans-serif';
  g.fillText(fit(g, title, width - 2 * PADDING), PADDING, 34);
  g.fillStyle = '#555';
  g.font = '14px sans-serif';
  g.fillText(
    'Yksi rivi per henkilö, suurin huippu ylhäällä. Väri kertoo promillet.',
    PADDING,
    58,
  );
  g.fillText('Viivoitettu osa on ennuste, joka olettaa ettei juoda enempää.', PADDING, 78);

  // Hour labels, every other column
  g.textAlign = 'center';
  g.fillStyle = '#444';
  g.font = '12px sans-serif';
  if (count > 0) {
    shown[0].series.forEach((hour, i) => {
      if (i % 2 === 0) {
        g.fillText(chartdata.formatTime(hour.time), left + (i + 0.5) * cellWidth, TOP - 12);
      }
    });
  }
  g.textAlign = 'left';
  g.font = 'bold 13px sans-serif';
  g.fillStyle = '#222';
  g.fillText('Huippu', left + gridWidth + 8, TOP - 12);

  shown.forEach((row, r) => {
    const y = TOP + r * ROW_HEIGHT;
    row.values.forEach((permilles, i) => {
      g.fillStyle = heatmap.getColor(permilles);
      g.fillRect(left + i * cellWidth, y, cellWidth - 1, ROW_HEIGHT - 1);
    });
    g.fillStyle = '#222';
    g.font = '13px sans-serif';
    g.textAlign = 'right';
    g.fillText(fit(g, row.nick, LABEL_WIDTH - 12), left - 8, y + ROW_HEIGHT - 8);
    g.textAlign = 'left';
    g.fillText(formatPermilles(row.peak) + ' ‰', left + gridWidth + 8, y + ROW_HEIGHT - 8);
  });

  // The forecast is hatched, so the colors stay true, and the moment now is marked
  const nowX = left + (nowIndex + (now % HOUR) / HOUR + 0.5) * cellWidth;
  const gridHeight = count * ROW_HEIGHT;
  g.save();
  g.beginPath();
  g.rect(nowX, TOP, left + gridWidth - nowX, gridHeight);
  g.clip();
  g.strokeStyle = 'rgba(255,255,255,0.7)';
  g.lineWidth = 2;
  for (let k = -gridHeight; k < gridWidth; k += 8) {
    g.beginPath();
    g.moveTo(nowX + k, gridBottom);
    g.lineTo(nowX + k + gridHeight, TOP);
    g.stroke();
  }
  g.restore();
  g.strokeStyle = '#222';
  g.lineWidth = 2;
  g.setLineDash([5, 4]);
  g.beginPath();
  g.moveTo(nowX, TOP - 4);
  g.lineTo(nowX, gridBottom);
  g.stroke();
  g.setLineDash([]);
  g.fillStyle = '#222';
  g.font = 'bold 13px sans-serif';
  g.textAlign = 'right';
  g.fillText('nyt', nowX - 6, TOP - 28);
  g.textAlign = 'left';
  g.font = '12px sans-serif';
  g.fillStyle = '#666';
  g.fillText('ennuste →', nowX + 6, TOP - 28);

  // Color scale
  const legendY = gridBottom + 36;
  for (let i = 0; i < LEGEND_WIDTH; i += 1) {
    g.fillStyle = heatmap.getColor((i / LEGEND_WIDTH) * SCALE_MAX);
    g.fillRect(left + i, legendY, 1, 16);
  }
  g.fillStyle = '#333';
  g.font = '12px sans-serif';
  g.textAlign = 'center';
  [0, 0.5, 1, 1.5, 2].forEach(value => {
    const label = value === SCALE_MAX ? SCALE_MAX + '+' : String(value).replace('.', ',');
    g.fillText(label, left + (value / SCALE_MAX) * LEGEND_WIDTH, legendY + 32);
  });
  g.textAlign = 'left';
  g.fillText('‰', left + LEGEND_WIDTH + 12, legendY + 13);

  return canvas.toBuffer('image/png');
};
