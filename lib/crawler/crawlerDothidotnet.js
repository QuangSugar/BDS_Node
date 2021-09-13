var request = require('request');
const chai = require('chai');
const chaiHttp = require('chai-http');
var cheerio = require('cheerio');
var common = require('../common');
const OutputModel = require('../outputmodel');

chai.should();
chai.use(chaiHttp);

const ERROR_REQUEST_FAILED = "Request error";

module.exports = {
  crawlItem,
  crawlPage,
};

async function crawlItem(itemUrl) {

  //Create new model
  var itemData = await OutputModel.validate({});

  return new Promise(async (resolve, reject) => {
    chai
      .request(`https://dothi.net`)
      .get(`${itemUrl}`)
      .set('User-Agent', 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Safari/537.36')
      .end((err, res) => {
        try {
          if (err) {
            common.addLog(`crawlItem ${ERROR_REQUEST_FAILED} ${itemUrl}`);
            common.addLog('Error in request ' + err);
            resolve(itemData);
            return;
          }
          let childhtml = res.text;

          if (childhtml !== undefined) {
            var childPage = cheerio.load(childhtml);
            let pageItem = childPage('.product-detail');
            itemData.nguon = 'dothi.net';
            itemData.pageurl = "https://dothi.net" + itemUrl;

            itemData.tieude = pageItem.children('h1').text().replace('\r\n', '').replace('\r\n', '').trim();
            var tempDiachi = pageItem.children('.pd-location').text().trim();

            var resDiachi = tempDiachi.split("-");
            for (var i = 0; i < resDiachi.length; i++) {
              if (resDiachi[i].indexOf('Đường') > -1) {
                itemData.tenduong = resDiachi[i].substring(resDiachi[i].indexOf('Đường'), resDiachi[i].length).trim();
              } else if (resDiachi[i].indexOf('Huyện') > -1) {
                itemData.quanhuyen = resDiachi[i].substring(resDiachi[i].indexOf('Huyện'), resDiachi[i].length).trim();
              } else if (resDiachi[i].indexOf('Quận') > -1) {
                itemData.quanhuyen = resDiachi[i].substring(resDiachi[i].indexOf('Quận'), resDiachi[i].length).trim();
              } else if (resDiachi[i].indexOf('Phường') > -1) {
                itemData.phuongxa = resDiachi[i].substring(resDiachi[i].indexOf('Phường'), resDiachi[i].length).trim();
              } else if (resDiachi[i].indexOf('Xã') > -1) {
                itemData.phuongxa = resDiachi[i].substring(resDiachi[i].indexOf('Xã'), resDiachi[i].length).trim();
              }
            }
            itemData.tinhthanh = resDiachi[resDiachi.length - 1];

            if (pageItem.children('.pd-price').children().length > 0) {
              itemData.gia = childPage('.pd-price').children().first().text().trim();
            }
            if (pageItem.children('.pd-price').children().length > 1) {
              itemData.dientichdat = childPage('.pd-price').children().last().text().replace('m²','').trim();
            }

            var tempImageListObj = childPage('.pd-slide').children('ul');
            if (tempImageListObj != undefined) {
              tempImageListObj.children().each(function (index, key) {
                itemData.hinhanh.push(childPage(this).children('img').prop('src'));
              });
            }

            itemData.noidung = pageItem.children('.pd-desc').children('.pd-desc-content').text().trim();

            let bdsProperties = childPage('.pd-dacdiem').children('table').children().children();
            for (let i = 0; i < bdsProperties.length; i++) {
              const element = bdsProperties[i];
              var tempInfo = childPage(element).text();
              if (tempInfo.indexOf('Diện tích') > -1) {
                var tempDienTich = childPage(element).text();
                itemData.dientichdat = tempDienTich.replace('Diện tích', '').trim().replace('m²', '').trim();
              } else if (tempInfo.indexOf('Hướng nhà') > -1) {
                itemData.huongnha = tempInfo.replace('Hướng nhà', '').trim();
              } else if (tempInfo.indexOf('Ngày đăng tin') > -1) {
                itemData.ngaydang = tempInfo.replace('Ngày đăng tin', '').replace('/', '-').replace('/', '-').trim();
              } else if (tempInfo.indexOf('Đường vào') > -1) {
                itemData.duongvao = tempInfo.replace('Đường vào', '').replace('m', '').trim();
              } else if (tempInfo.indexOf('Mặt tiền') > -1) {
                itemData.mattien = tempInfo.replace('Mặt tiền', '').replace('m', '').trim();
              } else if (tempInfo.indexOf('Nội thất') > -1) {
                itemData.noithat = tempInfo.replace('Nội thất', '').trim();
              } else if (tempInfo.indexOf('Số tầng') > -1) {
                itemData.sotang = tempInfo.replace('Số tầng', '').trim();
              } else if (tempInfo.indexOf('Số phòng') > -1) {
                itemData.sophongngu = tempInfo.replace('Số phòng', '').trim();
              } else if (tempInfo.indexOf('Số toilet') > -1) {
                itemData.sotoilet = tempInfo.replace('Số toilet', '').trim();
              } else if (tempInfo.indexOf('Loại tin rao') > -1) {
                itemData.loaibds = tempInfo.replace('Loại tin rao', '').trim();
              }
            }

            var tempGia = itemData.gia;
            if (tempGia.indexOf("Triệu") > -1) {
              itemData.gia = (tempGia.replace('Triệu', '').trim() * 1000000).toString();
              if (!isNaN(itemData.dientichdat) && itemData.dientichdat * 1 > 0) {
                itemData.giametvuong = (itemData.gia * 0.1 / itemData.dientichdat / 0.1).toString();
              }
            } else if (tempGia.indexOf('Trăm nghìn/m²') > -1) {
              itemData.giametvuong = (tempGia.replace('Trăm nghìn/m²', '').trim() * 1000).toString();
              itemData.gia = (itemData.giametvuong * itemData.dientichdat).toString();
            } else if (tempGia.indexOf('Triệu/m²') > -1) {
              itemData.giametvuong = (tempGia.replace('Triệu/m²', '').trim() * 1000000).toString();
              itemData.gia = (itemData.giametvuong * itemData.dientichdat).toString();
            } else if (tempGia.indexOf('Tỷ')) {
              itemData.gia = (tempGia.replace('Tỷ', '').trim() * 1000000000).toString();
              if (!isNaN(itemData.dientichdat) && itemData.dientichdat * 1 > 0) {
                itemData.giametvuong = (itemData.gia * 0.1 / itemData.dientichdat / 0.1).toString();
              }
            } else {
              itemData.gia = '0';
              itemData.giametvuong = '0';
            }

            let contactproperties = childPage('.pd-contact').children('table').children();
            for (let i = 0; i < contactproperties.length; i++) {
              const element = contactproperties[i];
              var tempInfo = childPage(element).text();
              if (tempInfo.indexOf('Tên liên lạc') > -1) {
                itemData.ten = tempInfo.replace('Tên liên lạc', '').trim();
              } else if (tempInfo.indexOf('Di động') > -1) {
                itemData.sodienthoai = tempInfo.replace('Di động', '').trim();
              } else if (tempInfo.indexOf('Điện thoại') > -1) {
                itemData.sodienthoai = tempInfo.replace('Điện thoại', '').trim();
              } else if (tempInfo.indexOf('Email') > -1) {
                var tempEmail = childPage(element).html();
                if (tempEmail != null && tempEmail.length > 0) {
                  tempEmail = tempEmail.substr(tempEmail.indexOf(".write("), tempEmail.length - tempEmail.indexOf(".write("));
                  tempEmail = tempEmail.substr(0, tempEmail.indexOf(");"));
                  tempEmail = tempEmail.replace('.write("', '');
                  tempEmail = tempEmail.replace('"', '');
                  itemData.email = common.decodeEntities(tempEmail);
                }
              }
            }

            itemData = common.validateOutput(itemData);
          }
          resolve(itemData);
        } catch (e) {
          common.addLog(`crawlItem ${ERROR_REQUEST_FAILED} ${itemUrl}`);
          common.addLog(e);
          resolve(itemData);
        }
      });
  });
}

//"https://m.dothi.net/nha-dat-ban.htm"
function crawlPage(pageUrl) {
  return new Promise(async (resolve, reject) => {
    try {
      var options = {
        url: pageUrl,
        headers: {
          'Host': 'dothi.net',
          'User-Agent': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Safari/537.36',
          // ':authority': 'm.dothi.net',
          // ':method': 'POST',
          // ':path': '/nha-dat-ban.htm',
          // ':scheme': 'https',
          // 'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
          // 'accept-encoding': 'gzip, deflate, br',
          // 'accept-language': 'en-GB,en;q=0.9,vi-VN;q=0.8,vi;q=0.7,en-US;q=0.6',
          'content-type': 'application/x-www-form-urlencoded',
          'cookie': '_gid=GA1.2.181734187.1630466833; _clck=js5nok|1|eud|0; _fbp=fb.1.1630466833758.179908427; __gads=ID=dfd24ce2b66285c8:T=1630466847:S=ALNI_MYxyuqRP0wPAZagPItc9KF6EWpa6g; psortfilter=1%24afgYRJI2uSWSXQ70P5TjQ%3D%3D; pageviewCount=5; ASP.NET_SessionId=gteia3nfaqjz43gm10mo04x5; x-srversion=136; psortfilter=1$/nha-dat-ban.htm; ats_ads_referrer_history=%5B%22%22%2C%22m.dothi.net%22%5D; pageviewCount=7; _ga_GR5XSQD0XB=GS1.1.1630466832.1.1.1630467049.0; _ga=GA1.2.1407077429.1630466833; _clsk=1h2itrq|1630467050598|7|1|e.clarity.ms/collect; psortfilter=1$/nha-dat-ban.htm',
          'sec-ch-ua': `" XiaoMi";v="99", "Chromium";v="90", "Google Chrome";v="90"`,
          'sec-ch-ua-mobile': '1',
          'sec-fetch-dest': 'document',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-site': 'same-origin',
          'sec-fetch-user': 1,
          'upgrade-insecure-requests': 1
        },
        jar: true
      };

      request(options, function (err, response, html) {
        if (err) {
          common.addLog('Error in request ' + err);
          reject(`crawlPage ${ERROR_REQUEST_FAILED} ${pageUrl}`);
          return;
        }

        var page = cheerio.load(html);
        var itemList = page('.listProduct').children('ul').first().children();
        let promiseList = [];
        for (let i = 0; i < itemList.length; i++) {
          const itemUrl = page(itemList[i]).children('a').first().prop('href');
          let promise = crawlItem(itemUrl);
          promiseList.push(promise);
          console.log(itemUrl);
        }

        Promise.all(promiseList).then((values) => {
          resolve(values);
        });
      });
    } catch (e) {
      reject(`crawlPage ${ERROR_REQUEST_FAILED} ${pageUrl}`);
    }
  });
}