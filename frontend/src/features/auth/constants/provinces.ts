export interface ProvinceOption {
  code: string;
  name: string;
  region?: string;
}

export const POPULAR_PROVINCES: ProvinceOption[] = [
  // Thành phố trực thuộc Trung ương (bao gồm cả Huế)
  { code: '01', name: 'Hà Nội' },
  { code: '79', name: 'TP. Hồ Chí Minh' },
  { code: '31', name: 'Hải Phòng' },
  { code: '48', name: 'Đà Nẵng' },
  { code: '92', name: 'Cần Thơ' },
  { code: '46', name: 'Huế (Thừa Thiên Huế)' },

  // Miền Bắc
  { code: '24', name: 'Bắc Giang' },
  { code: '06', name: 'Bắc Kạn' },
  { code: '27', name: 'Bắc Ninh' },
  { code: '04', name: 'Cao Bằng' },
  { code: '11', name: 'Điện Biên' },
  { code: '02', name: 'Hà Giang' },
  { code: '35', name: 'Hà Nam' },
  { code: '30', name: 'Hải Dương' },
  { code: '17', name: 'Hòa Bình' },
  { code: '33', name: 'Hưng Yên' },
  { code: '12', name: 'Lai Châu' },
  { code: '20', name: 'Lạng Sơn' },
  { code: '10', name: 'Lào Cai' },
  { code: '36', name: 'Nam Định' },
  { code: '37', name: 'Ninh Bình' },
  { code: '25', name: 'Phú Thọ' },
  { code: '22', name: 'Quảng Ninh' },
  { code: '14', name: 'Sơn La' },
  { code: '34', name: 'Thái Bình' },
  { code: '19', name: 'Thái Nguyên' },
  { code: '08', name: 'Tuyên Quang' },
  { code: '26', name: 'Vĩnh Phúc' },
  { code: '15', name: 'Yên Bái' },

  // Miền Trung & Tây Nguyên
  { code: '38', name: 'Thanh Hóa' },
  { code: '40', name: 'Nghệ An' },
  { code: '42', name: 'Hà Tĩnh' },
  { code: '44', name: 'Quảng Bình' },
  { code: '45', name: 'Quảng Trị' },
  { code: '49', name: 'Quảng Nam' },
  { code: '51', name: 'Quảng Ngãi' },
  { code: '52', name: 'Bình Định' },
  { code: '54', name: 'Phú Yên' },
  { code: '56', name: 'Khánh Hòa' },
  { code: '58', name: 'Ninh Thuận' },
  { code: '60', name: 'Bình Thuận' },
  { code: '62', name: 'Kon Tum' },
  { code: '64', name: 'Gia Lai' },
  { code: '66', name: 'Đắk Lắk' },
  { code: '67', name: 'Đắk Nông' },
  { code: '68', name: 'Lâm Đồng' },

  // Miền Nam
  { code: '70', name: 'Bình Phước' },
  { code: '72', name: 'Tây Ninh' },
  { code: '74', name: 'Bình Dương' },
  { code: '75', name: 'Đồng Nai' },
  { code: '77', name: 'Bà Rịa - Vũng Tàu' },
  { code: '80', name: 'Long An' },
  { code: '82', name: 'Tiền Giang' },
  { code: '83', name: 'Bến Tre' },
  { code: '84', name: 'Trà Vinh' },
  { code: '86', name: 'Vĩnh Long' },
  { code: '87', name: 'Đồng Tháp' },
  { code: '89', name: 'An Giang' },
  { code: '91', name: 'Kiên Giang' },
  { code: '93', name: 'Hậu Giang' },
  { code: '94', name: 'Sóc Trăng' },
  { code: '95', name: 'Bạc Liêu' },
  { code: '96', name: 'Cà Mau' },
];

export const PROVINCE_MAP: Record<string, string> = {
  'HN': 'Hà Nội',
  'SG': 'TP. Hồ Chí Minh',
  'DN': 'Đà Nẵng',
  'HP': 'Hải Phòng',
  'CT': 'Cần Thơ',
  'BD': 'Bình Dương',
  'ALL': 'Toàn quốc',
};
POPULAR_PROVINCES.forEach((p) => {
  PROVINCE_MAP[p.code] = p.name;
});
