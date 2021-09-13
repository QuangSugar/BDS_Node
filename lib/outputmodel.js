const Joi = require('joi');

var templateData = Joi.object({
  chieudai: Joi.string().allow('').default(''),
  chieurong: Joi.string().allow('').default(''),
  diachi: Joi.string().allow('').default(''),
  dientichdat: Joi.string().allow('').default(''),
  dientichsudung: Joi.string().allow('').default(''),
  dientichxaydung: Joi.string().allow('').default(''),
  duongvao: Joi.string().allow('').default(''),
  email: Joi.string().allow('').default(''),
  gia: Joi.string().allow('').default(''),
  giametvuong: Joi.string().allow('').default(''),
  hinhanh: Joi.array().items(Joi.string()).default([]),
  hinhdangdat: Joi.string().allow('').default(''),
  huongbancong: Joi.string().allow('').default(''),
  huongnha: Joi.string().allow('').default(''),
  loaibds: Joi.string().allow('').default(''),
  loaibaidang: Joi.string().allow('').default(''),
  mattien: Joi.string().allow('').default(''),
  ngaydang: Joi.string().allow('').default(''),
  nguon: Joi.string().allow('').default(''),
  noidung: Joi.string().allow('').default(''),
  noithat: Joi.string().allow('').default(''),
  pageurl: Joi.string().allow('').default(''),
  phaply: Joi.string().allow('').default(''),
  phuongxa: Joi.string().allow('').default(''),
  quanhuyen: Joi.string().allow('').default(''),
  sodienthoai: Joi.string().allow('').default(''),
  sonha: Joi.string().allow('').default(''),
  sophongngu: Joi.string().allow('').default(''),
  sotang: Joi.string().allow('').default(''),
  sotoilet: Joi.string().allow('').default(''),
  ten: Joi.string().allow('').default(''),
  diachinguoidang: Joi.string().allow('').default(''),
  tenduan: Joi.string().allow('').default(''),
  tenduong: Joi.string().allow('').default(''),
  tieude: Joi.string().allow('').default(''),
  tinhthanh: Joi.string().allow('').default(''),
  tongsophong: Joi.string().allow('').default(''),
  vitridat: Joi.string().allow('').default(''),
});

async function validate(data) {
  let validateResult = templateData.validate(data);

  if (validateResult.value === undefined || validateResult.value === null) {
    console.error("Data do not validate");
  }
  return validateResult.value;
}

module.exports = {
  validate
}