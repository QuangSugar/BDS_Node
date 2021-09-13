
'use strict';
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var common = require('./common');
const crawlerDoThiDotNet = require('./crawler/crawlerDothidotnet');
const crawlerNhaBanSgDotVN = require('./crawler/crawlerNhaBanSgDotVN');
const crawlerBanNhaSgDotCOM = require('./crawler/crawlerBanNhaSgDotCOM');

app.use(bodyParser.json());

app.get('/HealthCheck', function(req, res){
  res.status(200).send(`HealthCheck ok ${new Date()}`);
});

app.get('/getitemdothi', async function(req, res){
  var start = new Date() - 1;
  crawlerDoThiDotNet.crawlPage("https://m.dothi.net/nha-dat-ban.htm").then((data) => {
    res.status(200).send(data);
    common.addLog('Execution time: ' + (start - (new Date() - 1)) + 'ms');
  });
});

app.get('/getitemnhabansg', function(req, res){
  var start = new Date() - 1;
  crawlerNhaBanSgDotVN.crawlPage("https://nhabansg.vn/").then((data) => {
    res.status(200).send(data);
    common.addLog('Execution time: ' + (start - (new Date() - 1)) + 'ms');
  });
});

app.get('/getitembannhasg', function(req, res){
  var start = new Date() - 1;
  crawlerBanNhaSgDotCOM.crawlPage("https://m.bannhasg.com/nha-dat-ban-tp-hcm.htm").then((data) => {
    res.status(200).send(data);
    common.addLog('Execution time: ' + (start - (new Date() - 1)) + 'ms');
  });
});

var port = process.env.PORT || 8000;
app.listen(port, function () {
  console.log(`start listen at 0.0.0.0:${port}`);
})
