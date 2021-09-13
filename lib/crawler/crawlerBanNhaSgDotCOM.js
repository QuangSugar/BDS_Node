var request = require('request');
const chai = require('chai');
const chaiHttp = require('chai-http');
var cheerio = require('cheerio');
var common = require('../common');

chai.should();
chai.use(chaiHttp);

const OutputModel = require('../outputmodel');
const emailDecoder = require('./emaildecode');

const ERROR_REQUEST_FAILED = "Request error";

module.exports = {
  crawlItem,
  crawlPage,
};

async function crawlItem(itemUrl) {
  itemUrl = itemUrl.replace('https://bannhasg.com', '');
  itemUrl = itemUrl.replace('https://m.bannhasg.com', '');

  console.log(itemUrl);
  //Create new model
  var itemData = await OutputModel.validate({});

  return new Promise(async (resolve, reject) => {
    chai
      .request(`https://m.bannhasg.com`)
      .post(`${itemUrl}`)
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
            itemData.nguon = 'bannhasg.com';
            itemData.loaibds = 'Bán nhà riêng';
            itemData.pageurl = "https://bannhasg.com" + itemUrl;
            
            let imageList = childPage('.swiper-slide-content');
            for (let i = 0; i < imageList.length; i++) {
              const element = imageList[i];
              var imageUrl = childPage(element).children('img').first().prop('src');
              if(imageUrl) {
                itemData.hinhanh.push(imageUrl);
              }
            }

            itemData.tieude = childPage('h1').text().trim();
            itemData.noidung = childPage('.div-mota').text();
            let properties = childPage('.li-info');
            for (let i = 0; i < properties.length; i++) {
              const element = properties[i];
              var tempInfo = childPage(element).text();
              if (tempInfo.indexOf('Mức giá:') > -1) {
                var tempGia = childPage(element).text().replace('Mức giá:', '').toLowerCase();
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
                } else if (tempGia.indexOf('tỷ') > -1) {
                  itemData.gia = (tempGia.replace('tỷ', '').trim() * 1000000000).toString();
                  if (!isNaN(itemData.dientichdat) && itemData.dientichdat * 1 > 0) {
                    itemData.giametvuong = (itemData.gia * 0.1 / itemData.dientichdat / 0.1).toString();
                  }
                } else {
                  itemData.gia = '0';
                  itemData.giametvuong = '0';
                }
              } else if (tempInfo.indexOf('Đ/c') > -1) {
                var tempDiachi = childPage(element).text();
                var newDiaChi = tempDiachi;
                if (newDiaChi.match(/^\d/)) {
                  var indexDiachi = newDiaChi.indexOf(' ');
                  itemData.diachi = newDiaChi;
                }
              } else if (tempInfo.indexOf('Diện tích:') > -1) {
                itemData.dientichdat = tempInfo.replace('Diện tích:', '').replace('m²', '').trim();
              }
            }

            let properties2 = childPage('.li-more-info-2');
            for (let i = 0; i < properties2.length; i++) {
              const element = properties2[i];
              var tempValue = childPage(element).text().trim();
              if (tempValue.indexOf("Điện thoại") > -1 || tempValue.indexOf("Di động") > -1) {
                itemData.sodienthoai = tempValue.replace("Điện thoại", "").replace("Di động", "").replace("\r\n", "").replace(':','');
              } else if (tempValue.indexOf("Email") > -1) {
                itemData.email = emailDecoder.decode(cheerio.load(childPage(element).html())('.span-2').children('a').first().prop('href'));
                itemData.email = itemData.email.replace("?Subject=Contact", "").replace(':','');
              } else if (tempValue.indexOf("Tên liên lạc") > -1) {
                itemData.ten = tempValue.replace("Tên liên lạc", "").replace("\r\n", "").replace(':','');
              } else if (tempValue.indexOf("Địa chỉ") > -1) {
                itemData.diachinguoidang = tempValue.replace("Địa chỉ", "").replace("\r\n", "").replace(':','');
              }
            };

            let properties1 = childPage('.li-more-info-1');
            for (let i = 0; i < properties1.length; i++) {
              const element = properties1[i];
              var tempValue = childPage(element).text().trim();
              if (tempValue.indexOf("Hướng nhà") > -1) {
                itemData.huongnha = tempValue.replace("Hướng nhà", "").replace(":", "").replace("\r\n", "");
              } else if (tempValue.indexOf("Số phòng") > -1) {
                itemData.sophongngu = tempValue.replace("Số phòng", "").replace(":", "").replace("\r\n", "");
              } else if (tempValue.indexOf("Đường vào") > -1) {
                itemData.duongvao = tempValue.replace("Đường vào", "").replace(":", "").replace("\r\n", "");
              } else if (tempValue.indexOf("Mặt tiền") > -1) {
                itemData.mattien = tempValue.replace("Mặt tiền", "").replace(":", "").replace("\r\n", "");
              } else if (tempValue.indexOf("Hướng ban công") > -1) {
                itemData.huongbancong = tempValue.replace("Hướng ban công", "").replace(":", "").replace("\r\n", "");
              } else if (tempValue.indexOf("Số tầng") > -1) {
                itemData.sotang = tempValue.replace("Số tầng", "").replace(":", "").replace("\r\n", "");
              } else if (tempValue.indexOf("Số toilet") > -1) {
                itemData.sotoilet = tempValue.replace("Số toilet", "").replace(":", "").replace("\r\n", "");
              } else if (tempValue.indexOf("Nội thất") > -1) {
                itemData.noithat = tempValue.replace("Nội thất", "").replace(":", "").replace("\r\n", "");
              }
            };

            var tempDetailDiachi = childPage('.span_title_detail').text().trim();
            tempDetailDiachi = tempDetailDiachi.replace('khu vực:', '');
            tempLoaiBDS = tempDetailDiachi.split('tại');
            if (tempLoaiBDS.length > 1) {
              itemData.loaibds = tempLoaiBDS[0];
            }
            tempDetailDiachi = tempDetailDiachi.replace(itemData.loaibds, '');
            tempDetailDiachi = tempDetailDiachi.split('-');
            for (let i = 0; i < tempDetailDiachi.length; i++) {
              const element = tempDetailDiachi[i].toLowerCase();
              if (element.indexOf("xã") > -1 || tempDetailDiachi.indexOf("phường") > -1) {
                itemData.phuongxa = tempDetailDiachi[i].trim();
              } else if (element.indexOf("đường") > -1) {
                itemData.tenduong = tempDetailDiachi[i].replace('tại', '').trim();
              } else if (element.indexOf("huyện") > -1) {
                itemData.quanhuyen = tempDetailDiachi[i].trim();
              } else if (element.indexOf("quận") > -1) {
                itemData.quanhuyen = tempDetailDiachi[i].trim();
              }
            }
            itemData.tinhthanh = tempDetailDiachi[tempDetailDiachi.length - 1];

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

//"https://m.bannhasg.com/nha-dat-ban.htm"
function crawlPage(pageUrl) {
  return new Promise(async (resolve, reject) => {
    try {
      var options = {
        url: pageUrl,
        headers: {
          'Host': 'bannhasg.com',
          'User-Agent': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Safari/537.36',
          'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundaryyCBwjb6FjNJzQkTV'
          // ':method': 'POST',
          // ':path': '/nha-dat-ban.htm',
          // ':scheme': 'https',
          // 'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
          // 'accept-encoding': 'gzip, deflate, br',
          // 'accept-language': 'en-GB,en;q=0.9,vi-VN;q=0.8,vi;q=0.7,en-US;q=0.6',
          // 'content-type': 'application/x-www-form-urlencoded',
          // 'cookie': '_gid=GA1.2.181734187.1630466833; _clck=js5nok|1|eud|0; _fbp=fb.1.1630466833758.179908427; __gads=ID=dfd24ce2b66285c8:T=1630466847:S=ALNI_MYxyuqRP0wPAZagPItc9KF6EWpa6g; psortfilter=1%24afgYRJI2uSWSXQ70P5TjQ%3D%3D; pageviewCount=5; ASP.NET_SessionId=gteia3nfaqjz43gm10mo04x5; x-srversion=136; psortfilter=1$/nha-dat-ban.htm; ats_ads_referrer_history=%5B%22%22%2C%22m.bannhasg.com%22%5D; pageviewCount=7; _ga_GR5XSQD0XB=GS1.1.1630466832.1.1.1630467049.0; _ga=GA1.2.1407077429.1630466833; _clsk=1h2itrq|1630467050598|7|1|e.clarity.ms/collect; psortfilter=1$/nha-dat-ban.htm',
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
        var itemList = page('.li-title');

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

// crawlPage("https://m.bannhasg.com/nha-dat-ban-tp-hcm.htm").then((data) => {
//   console.log(data);
// })

// crawlItem("https://m.bannhasg.com/ban-nha-mat-pho-duong-le-van-sy-55/ban-nha-mat-tien-duong-le-van-sy-quan-3-dt-76x25m-no-hau-9m-ham-7-lau-gia-69-ty-tl-pr7285272.htm").then((data) => {
//   console.log(data);
// });