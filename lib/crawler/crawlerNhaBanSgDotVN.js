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
  
  if (itemUrl.indexOf('https://nhabansg.vn') > -1) {
    itemUrl = itemUrl.replace('https://nhabansg.vn','');
  }

  //Create new model
  var itemData = await OutputModel.validate({});
  return new Promise(async (resolve, reject) => {
    chai
      .request(`https://nhabansg.vn`)
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

          if (childhtml != undefined) {
            var childPage = cheerio.load(childhtml);
            itemData.tinhthanh = 'TP Hồ Chí Minh';
            itemData.nguon = 'nhabansg.vn';
            itemData.loaibds = 'Bán nhà riêng';
            itemData.pageurl = "https://nhabansg.vn" + itemUrl;
  
            childPage('.hinhanh').each(function (index, key) {
              itemData.hinhanh.push(childPage(this).prop('src'));
            });
            itemData.tieude = childPage('h1').text().trim();
            itemData.noidung = childPage('div#columncenter').children('p').text();
            childPage('.bannha').each(function (index, key) {
              var tempInfo = childPage(this).parent().text();
              if (tempInfo.indexOf('Giá') > -1) {
                var tempGia = childPage(this).text();
                if (tempGia.indexOf("tr") > -1) {
                  itemData.gia = (tempGia.replace('tr', '').trim() * 1000000).toString();
                  if (!isNaN(itemData.dientichdat) && itemData.dientichdat * 1 > 0) {
                    itemData.giametvuong = (itemData.gia * 0.1 / itemData.dientichdat / 0.1).toString();
                  }
                } else if (tempGia.indexOf('trăm nghìn/m2') > -1) {
                  itemData.giametvuong = (tempGia.replace('Trăm nghìn/m2', '').trim() * 1000).toString();
                  itemData.gia = (itemData.giametvuong * itemData.dientichdat).toString();
                } else if (tempGia.indexOf('triệu/m²') > -1) {
                  itemData.giametvuong = (tempGia.replace('triệu/m²', '').trim() * 1000000).toString();
                  itemData.gia = (itemData.giametvuong * itemData.dientichdat).toString();
                } else if (tempGia.indexOf('tỷ')) {
                  itemData.gia = (tempGia.replace('tỷ', '').trim() * 1000000000).toString();
                  if (!isNaN(itemData.dientichdat) && itemData.dientichdat * 1 > 0) {
                    itemData.giametvuong = (itemData.gia * 0.1 / itemData.dientichdat / 0.1).toString();
                  }
                } else {
                  itemData.gia = '0';
                  itemData.giametvuong = '0';
                }
              } else if (tempInfo.indexOf('Đ/c') > -1) {
                var tempDiachi = childPage(this).text();
                var newDiaChi = tempDiachi;
                if (newDiaChi.match(/^\d/)) {
                  var indexDiachi = newDiaChi.indexOf(' ');
                  itemData.diachi = newDiaChi;
                }
              } else if (tempInfo.indexOf('DT:') > -1) {
  
                itemData.dientichdat = tempInfo.replace('DT:', '').replace('m²', '').trim();
              }
            });
  
            childPage('tr').each(function (index, key) {
              var tempValue = childPage(this).text().trim();
              if (tempValue.indexOf("Điện thoại") > -1) {
                itemData.sodienthoai = tempValue.replace("Điện thoại", "").replace("\r\n", "");
              } else if (tempValue.indexOf("Ngày đăng") > -1) {
                itemData.ngaydang = tempValue.replace("Ngày đăng", "").replace("\r\n", "");
              } else if (tempValue.indexOf("Tên liên lạc") > -1) {
                itemData.ten = tempValue.replace("Tên liên lạc", "").replace("\r\n", "");
              }
  
            });
            childPage('.breadcrumb').children('li').each(function (index, key) {
              var tempDetailDiachi = childPage(this).children('a').text().trim();
              if (tempDetailDiachi.indexOf("Xã") > -1 || tempDetailDiachi.indexOf("Phường") > -1) {
                itemData.phuongxa = tempDetailDiachi.trim();
              } else if (tempDetailDiachi.indexOf("đường") > -1 || tempDetailDiachi.indexOf("Đường") > -1) {
                itemData.tenduong = tempDetailDiachi.trim();
              } else if (tempDetailDiachi.indexOf("Huyện") > -1) {
                itemData.quanhuyen = tempDetailDiachi.substring(tempDetailDiachi.indexOf('Huyện'), tempDetailDiachi.length).trim();
              } else if (tempDetailDiachi.indexOf("Quận") > -1) {
                itemData.quanhuyen = tempDetailDiachi.substring(tempDetailDiachi.indexOf('Quận'), tempDetailDiachi.length).trim();
              }
            });

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

//"https://m.nhabansg.vn/nha-dat-ban.htm"
function crawlPage(pageUrl) {
  return new Promise(async (resolve, reject) => {
    try {
      var options = {
        url: pageUrl,
        headers: {
          'Host': 'nhabansg.vn',
          'User-Agent': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Safari/537.36',
          // ':authority': 'm.nhabansg.vn',
          // ':method': 'POST',
          // ':path': '/nha-dat-ban.htm',
          // ':scheme': 'https',
          // 'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
          // 'accept-encoding': 'gzip, deflate, br',
          // 'accept-language': 'en-GB,en;q=0.9,vi-VN;q=0.8,vi;q=0.7,en-US;q=0.6',
          // 'content-type': 'application/x-www-form-urlencoded',
          // 'cookie': '_gid=GA1.2.181734187.1630466833; _clck=js5nok|1|eud|0; _fbp=fb.1.1630466833758.179908427; __gads=ID=dfd24ce2b66285c8:T=1630466847:S=ALNI_MYxyuqRP0wPAZagPItc9KF6EWpa6g; psortfilter=1%24afgYRJI2uSWSXQ70P5TjQ%3D%3D; pageviewCount=5; ASP.NET_SessionId=gteia3nfaqjz43gm10mo04x5; x-srversion=136; psortfilter=1$/nha-dat-ban.htm; ats_ads_referrer_history=%5B%22%22%2C%22m.nhabansg.vn%22%5D; pageviewCount=7; _ga_GR5XSQD0XB=GS1.1.1630466832.1.1.1630467049.0; _ga=GA1.2.1407077429.1630466833; _clsk=1h2itrq|1630467050598|7|1|e.clarity.ms/collect; psortfilter=1$/nha-dat-ban.htm',
          // 'sec-ch-ua': `" XiaoMi";v="99", "Chromium";v="90", "Google Chrome";v="90"`,
          // 'sec-ch-ua-mobile': '1',
          // 'sec-fetch-dest': 'document',
          // 'sec-fetch-mode': 'navigate',
          // 'sec-fetch-site': 'same-origin',
          // 'sec-fetch-user': 1,
          // 'upgrade-insecure-requests': 1
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
        var itemList = page('.media-list').children('.row');
        let promiseList = [];
        for (let i = 0; i < itemList.length; i++) {
          //because nhabansg use 2 .row div for 1 item. then we do need to use 1 div to get detail url
          if (i % 2 === 0) {
            const itemUrl = cheerio.load(page(itemList[i]).html())('a').first().prop('href');
            let promise = crawlItem(itemUrl);
            promiseList.push(promise);
            console.log(itemUrl);
          }
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

// crawlPage("https://nhabansg.vn/").then((data) => {
//   console.log(data);
// })

// crawlItem("https://nhabansg.vn/ngop-ngan-hang-ban-gap-nha-hem-dep-duong-18-binh-tan-nha-5-lau-53-ty-nb471039.html").then((data) => {
//   console.log(data);
// });