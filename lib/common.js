const OutputModel = require('./outputmodel');

function func_addLog(strLog){
  console.log(strLog);
}

//Remove all /r/n character
function func_repairString(text) {
    var target = text;
    target = target.replace(new RegExp('\r\n', 'g'), '');
    target = target.replace(new RegExp('\r', 'g'), '');
    target = target.replace(new RegExp('\n', 'g'), '');
    target = target.trim();
    return target
};

function func_getValue(crawlVal){
  if (crawlVal === undefined){
    return '';
  }else {
    return crawlVal.toString();
  }
}

function func_decodeEntities(encodedString) {
  var translate_re = /&(nbsp|amp|quot|lt|gt);/g;
  var translate = {
    "nbsp":" ",
    "amp" : "&",
    "quot": "\"",
    "lt"  : "<",
    "gt"  : ">"
  };
  return encodedString.replace(translate_re, function(match, entity) {
    return translate[entity];
  }).replace(/&#(\d+);/gi, function(match, numStr) {
    var num = parseInt(numStr, 10);
    return String.fromCharCode(num);
  });
}

function func_extractPrice(priceString){
  var priceString = priceString.replace(',','.');
  var outputPrice = '0';

  if(priceString.indexOf("Thỏa thuận") > -1){
    outputPrice = '0';
  }else if (priceString.indexOf('tỷ') > -1 && priceString.indexOf('triệu') > -1){
    var tyPrice = priceString.split('tỷ')[0].replace('tỷ','').trim();
    var trieuPrice = priceString.split('tỷ')[1].replace('triệu','').replace('tỷ','').trim();
    outputPrice = (tyPrice * 1000000000 + trieuPrice * 1000000).toString();
  }else if (priceString.indexOf('Tỷ') > -1 && priceString.indexOf('Triệu') > -1){
    var tyPrice = priceString.split('Tỷ')[0].replace('Tỷ','').trim();
    var trieuPrice = priceString.split('Tỷ')[1].replace('Triệu','').replace('Tỷ','').trim();
    outputPrice = (tyPrice * 1000000000 + trieuPrice * 1000000).toString();
  }else if (priceString.indexOf('Tỷ') > -1){
    outputPrice = (priceString.replace('Tỷ','').trim() * 1000000000).toString();
  }else if (priceString.indexOf('tỷ') > -1){
    outputPrice = (priceString.replace('tỷ','').trim() * 1000000000).toString();
  }else if (priceString.indexOf('triệu / m2') > -1){
    outputPrice = (priceString.replace('triệu / m2','').trim() * 1000000).toString();
  }else if (priceString.indexOf('Triệu/m2') > -1){
    outputPrice = (priceString.replace('Triệu/m2','').trim() * 1000000).toString();
  }else if (priceString.indexOf('triệu') > -1){
    outputPrice = (priceString.replace('triệu','').trim() * 1000000).toString();
  }
  return outputPrice;
}

function func_extractMeter(meterString){
  var outputMeter = meterString.replace(',','.');
  outputMeter = outputMeter.replace('m²','');
  outputMeter = outputMeter.replace('m2','');
  outputMeter = outputMeter.replace('m','');
  outputMeter = func_repairString(outputMeter);
  return outputMeter;
}

//Remove all target character
function func_removeAllDot(text) {
    var target = text;
    target = target.replace(new RegExp('[.]', 'g'), '');
    target = target.trim();
    return target
};

//Remove all target character
function func_repairTenDuong(text) {
    var target = text;
    if (target.indexOf('đường') > -1 ){
      target = target.substring(target.indexOf('đường'), target.length).trim();
    }else if(target.indexOf('Đường') > -1){
      target = target.substring(target.indexOf('Đường'), target.length).trim();
    }
    return target
};
//Check all number fields
function func_repairNumber(text) {
  var target = text;
    if (isNaN(target)){
      target = '';
    }
    return target
};

//Check all number fields
function func_repairPrice(text) {
  var target = func_repairNumber(text);
  if (target !== '')  {
    target = BigInt(Math.round(target));
  }
  return target.toString();
};

//Remove all target character
function func_validateOutput(output) {
  var itemData = output;
  itemData.noidung = func_repairString(itemData.noidung);
  itemData.noithat = func_repairString(itemData.noithat);
  itemData.gia = func_repairPrice(itemData.gia);
  itemData.giametvuong = func_repairPrice(itemData.giametvuong);
  itemData.chieudai = func_repairNumber(itemData.chieudai);
  itemData.chieurong = func_repairNumber(itemData.chieurong);
  itemData.dientichdat = func_repairNumber(itemData.dientichdat);
  itemData.dientichsudung = func_repairNumber(itemData.dientichsudung);
  itemData.dientichxaydung = func_repairNumber(itemData.dientichxaydung);
  itemData.duongvao = func_repairNumber(itemData.duongvao);
  itemData.mattien = func_repairNumber(itemData.mattien);
  itemData.sodienthoai = func_repairNumber(itemData.sodienthoai);
  itemData.sophongngu = func_repairNumber(itemData.sophongngu);
  itemData.sotang = func_repairNumber(itemData.sotang);
  itemData.sotoilet = func_repairNumber(itemData.sotoilet);
  itemData.tongsophong = func_repairNumber(itemData.tongsophong);

  OutputModel.validate(itemData);
  return itemData;
};

module.exports = {
  addLog: func_addLog,
  getValue: func_getValue,
  decodeEntities: func_decodeEntities,
  extractPrice: func_extractPrice,
  extractMeter: func_extractMeter,
  repairString: func_repairString,
  repairNumber: func_repairNumber,
  removeAllDot: func_removeAllDot,
  repairTenDuong: func_repairTenDuong,
  validateOutput: func_validateOutput,
};
