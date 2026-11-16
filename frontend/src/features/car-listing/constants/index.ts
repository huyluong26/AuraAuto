import { ColorSwatchItem, PhotoSlotItem } from '../types';

export const GUIDED_PHOTO_SLOTS: PhotoSlotItem[] = [
  // Nhóm 1: Ngoại thất (3 góc cốt lõi)
  {
    key: 'front',
    label: 'Đầu xe chính diện',
    description: 'Chụp chính diện góc 0°, thấy rõ ca-lăng, đèn pha và biển số (Ảnh bìa bắt buộc)',
    icon: 'directions_car',
    category: 'exterior',
    isPrimary: true,
  },
  {
    key: 'front_34',
    label: 'Góc nghiêng 3/4 trước',
    description: 'Chụp chéo đầu và sườn xe, thể hiện rõ độ phẳng nước sơn và mâm trước',
    icon: 'crop_free',
    category: 'exterior',
  },
  {
    key: 'rear',
    label: 'Đuôi xe chính diện',
    description: 'Chụp toàn cảnh đuôi xe, cụm đèn LED hậu, ống xả và cốp sau',
    icon: 'pin',
    category: 'exterior',
  },

  // Nhóm 2: Nội thất & Khoang lái (3 góc cốt lõi)
  {
    key: 'cockpit',
    label: 'Khoang lái toàn cảnh',
    description: 'Bao quát taplo, vô-lăng, màn hình trung tâm và cụm điều khiển',
    icon: 'airline_seat_recline_extra',
    category: 'interior',
  },
  {
    key: 'odo',
    label: 'Đồng hồ ODO (AI đọc km)',
    description: 'Bật điện xe, chụp rõ màn hình công-tơ-mét — AI tự động trích xuất số km ODO',
    icon: 'speed',
    category: 'interior',
    aiAssist: true,
  },
  {
    key: 'seats',
    label: 'Hàng ghế ngồi',
    description: 'Chụp độ mới của bề mặt da ghế lái hoặc không gian hàng ghế hành khách',
    icon: 'event_seat',
    category: 'interior',
  },

  // Nhóm 3: Động cơ & Pháp lý (2 góc cốt lõi)
  {
    key: 'engine',
    label: 'Khoang máy động cơ',
    description: 'Mở nắp capo, chụp máy móc, ốc chân máy, khung xương giằng đầu xe',
    icon: 'settings',
    category: 'technical',
  },
  {
    key: 'inspection_sticker',
    label: 'Tem đăng kiểm & Giấy tờ',
    description: 'Tem kiểm định lưu hành trên kính lái hoặc sổ theo dõi bảo dưỡng định kỳ',
    icon: 'verified',
    category: 'technical',
  },
];

export const PHOTO_CATEGORIES = [
  { id: 'all', label: 'Tất cả (8 góc)' },
  { id: 'exterior', label: 'Ngoại thất (3)' },
  { id: 'interior', label: 'Khoang lái (3)' },
  { id: 'technical', label: 'Động cơ & Pháp lý (2)' },
] as const;

export const TRANSMISSION_OPTIONS = [
  { id: 'auto-9g', label: 'Tự động (9G-TRONIC / AT)', value: 'AUTOMATIC' },
  { id: 'dct', label: 'Ly hợp kép DCT', value: 'AUTOMATIC' },
  { id: 'manual-sport', label: 'Số sàn thể thao (MT)', value: 'MANUAL' },
];

export const POWERTRAIN_OPTIONS = [
  { value: 'petrol', label: 'Xăng tăng áp Turbo', dbValue: 'GASOLINE' },
  { value: 'mild-hybrid', label: 'Xăng Mild-Hybrid EQ Boost', dbValue: 'HYBRID' },
  { value: 'phev', label: 'Plug-in Hybrid sạc ngoài', dbValue: 'HYBRID' },
  { value: 'diesel', label: 'Diesel tiết kiệm', dbValue: 'DIESEL' },
  { value: 'ev', label: 'Thuần điện 100% (EV)', dbValue: 'ELECTRIC' },
];

// Gợi ý Kiểu dáng xe (Có thể bấm gợi ý hoặc tự do gõ tay)
export const SUGGESTED_BODY_TYPES = [
  'Sedan',
  'SUV gầm cao',
  'Crossover (CUV)',
  'Hatchback',
  'MPV gia đình',
  'Bán tải (Pickup)',
  'Coupe thể thao',
  'Wagon / Estate',
  'Convertible (Mui trần)',
];

// Gợi ý Hệ thống nhiên liệu & Động lực (Có thể bấm gợi ý hoặc tự do gõ tay)
export const SUGGESTED_POWERTRAINS = [
  'Xăng tăng áp (Turbo)',
  'Xăng hút khí tự nhiên',
  'Diesel (Dầu)',
  'Mild-Hybrid (MHEV)',
  'Hybrid tự sạc (HEV)',
  'Plug-in Hybrid (PHEV)',
  'Thuần điện 100% (EV)',
];

// Gợi ý Hộp số truyền động (Có thể bấm gợi ý hoặc tự do gõ tay)
export const SUGGESTED_TRANSMISSIONS = [
  'Tự động (AT)',
  'Tự động vô cấp (CVT)',
  'Ly hợp kép (DCT / PDK)',
  'Số sàn thể thao (MT)',
  'Tự động 8 cấp Steptronic',
  'Tự động 9G-TRONIC',
  'Số điện tử (Direct Drive EV)',
];

// Gợi ý Hệ dẫn động (Có thể bấm gợi ý hoặc tự do gõ tay)
export const SUGGESTED_DRIVETRAINS = [
  'Cầu trước (FWD)',
  'Cầu sau (RWD)',
  '4 bánh toàn thời gian (AWD)',
  '2 cầu bán thời gian (4WD)',
  'Quattro',
  '4MATIC',
  'xDrive',
];

// Gợi ý Xuất xứ nguồn gốc (Có thể bấm gợi ý hoặc tự do gõ tay)
export const SUGGESTED_ORIGINS = [
  'Lắp ráp trong nước (CKD)',
  'Nhập khẩu nguyên chiếc (CBU)',
  'Nhập khẩu Thái Lan',
  'Nhập khẩu Indonesia',
  'Nhập khẩu Nhật Bản',
  'Nhập khẩu Đức',
  'Nhập khẩu Mỹ',
  'Nhập khẩu Hàn Quốc',
];

// Gợi ý Tình trạng sử dụng (Có thể bấm gợi ý hoặc tự do gõ tay)
export const SUGGESTED_CONDITIONS = [
  'Đã qua sử dụng (Xe lướt)',
  'Xe mới 100% (Chưa lăn bánh)',
  'Xe trưng bày đại lý',
  'Xe cá nhân chính chủ',
];

// Gợi ý Số chỗ ngồi (Có thể bấm gợi ý hoặc tự gõ số)
export const SUGGESTED_SEATS = [2, 4, 5, 7, 8, 9, 16];

// Gợi ý Số cửa (Có thể bấm gợi ý hoặc tự gõ số)
export const SUGGESTED_DOORS = [2, 3, 4, 5];

export const BODY_TYPES = [
  { value: 'SEDAN', label: 'Sedan' },
  { value: 'SUV', label: 'SUV gầm cao' },
  { value: 'CROSSOVER', label: 'Crossover' },
  { value: 'HATCHBACK', label: 'Hatchback' },
  { value: 'MPV', label: 'MPV 7 chỗ' },
  { value: 'PICKUP', label: 'Bán tải (Pickup)' },
  { value: 'COUPE', label: 'Coupe thể thao' },
];

export const PROVINCE_COORDINATES: Record<
  string,
  { lat: number; lng: number; name: string; region: string; keywords: string[] }
> = {
  // --- THÀNH PHỐ TRỰC THUỘC TRUNG ƯƠNG ---
  '01': {
    lat: 21.0285,
    lng: 105.8542,
    name: 'Hà Nội',
    region: 'Thành phố trực thuộc Trung ương',
    keywords: ['hà nội', 'hanoi', 'hn', 'cầu giấy', 'thanh xuân', 'hoàn kiếm', 'ba đình', 'đống đa', 'hai bà trưng', 'hoàng mai', 'long biên', 'tây hồ', 'nam từ liêm', 'bắc từ liêm', 'hà đông', 'gia lâm', 'đông anh', 'sóc sơn', 'hoài đức', 'thường tín'],
  },
  '79': {
    lat: 10.7769,
    lng: 106.7009,
    name: 'TP. Hồ Chí Minh',
    region: 'Thành phố trực thuộc Trung ương',
    keywords: ['hồ chí minh', 'hcm', 'tp.hcm', 'tphcm', 'sài gòn', 'saigon', 'thủ đức', 'bình thạnh', 'quận 1', 'quận 2', 'quận 3', 'quận 4', 'quận 5', 'quận 6', 'quận 7', 'quận 8', 'quận 9', 'quận 10', 'quận 11', 'quận 12', 'tân bình', 'tân phú', 'gò vấp', 'phú nhuận', 'bình tân', 'củ chi', 'hóc môn', 'bình chánh', 'nhà bè'],
  },
  '31': {
    lat: 20.8449,
    lng: 106.6881,
    name: 'Hải Phòng',
    region: 'Thành phố trực thuộc Trung ương',
    keywords: ['hải phòng', 'hai phong', 'ngô quyền', 'lê chân', 'hồng bàng', 'hải an', 'đồ sơn', 'thủy nguyên', 'kiến an', 'an dương', 'kiến thụy', 'an lão'],
  },
  '48': {
    lat: 16.0544,
    lng: 108.2022,
    name: 'Đà Nẵng',
    region: 'Thành phố trực thuộc Trung ương',
    keywords: ['đà nẵng', 'da nang', 'hải châu', 'sơn trà', 'thanh khê', 'ngũ hành sơn', 'liên chiểu', 'cẩm lệ', 'hòa vang'],
  },
  '92': {
    lat: 10.0452,
    lng: 105.7469,
    name: 'Cần Thơ',
    region: 'Thành phố trực thuộc Trung ương',
    keywords: ['cần thơ', 'can tho', 'ninh kiều', 'cái răng', 'bình thủy', 'ô môn', 'thốt nốt', 'phong điền'],
  },
  '46': {
    lat: 16.4637,
    lng: 107.5909,
    name: 'Huế (Thừa Thiên Huế)',
    region: 'Thành phố trực thuộc Trung ương',
    keywords: ['thừa thiên huế', 'thua thien hue', 'tp huế', 'tp hue', 'huế', 'hue', 'hương thủy', 'hương trà', 'phong điền', 'phú vang', 'phú lộc'],
  },

  // --- MIỀN BẮC ---
  '24': {
    lat: 21.2731,
    lng: 106.1947,
    name: 'Bắc Giang',
    region: 'Miền Bắc',
    keywords: ['bắc giang', 'bac giang', 'việt yên', 'hiệp hòa', 'lạng giang', 'lục nam', 'lục ngạn'],
  },
  '06': {
    lat: 22.1469,
    lng: 105.8344,
    name: 'Bắc Kạn',
    region: 'Miền Bắc',
    keywords: ['bắc kạn', 'bac kan', 'chợ đồn', 'ba bể', 'bạch thông'],
  },
  '27': {
    lat: 21.1861,
    lng: 106.0764,
    name: 'Bắc Ninh',
    region: 'Miền Bắc',
    keywords: ['bắc ninh', 'bac ninh', 'từ sơn', 'thuận thành', 'quế võ', 'yên phong', 'tiên du'],
  },
  '04': {
    lat: 22.6667,
    lng: 106.2500,
    name: 'Cao Bằng',
    region: 'Miền Bắc',
    keywords: ['cao bằng', 'cao bang', 'trùng khánh', 'hòa an', 'quảng hòa'],
  },
  '11': {
    lat: 21.3869,
    lng: 103.0231,
    name: 'Điện Biên',
    region: 'Miền Bắc',
    keywords: ['điện biên', 'dien bien', 'mường thanh', 'điện biên phủ', 'mường nhé'],
  },
  '02': {
    lat: 22.8233,
    lng: 104.9839,
    name: 'Hà Giang',
    region: 'Miền Bắc',
    keywords: ['hà giang', 'ha giang', 'đồng văn', 'mèo vạc', 'vị xuyên', 'bắc quang'],
  },
  '35': {
    lat: 20.5456,
    lng: 105.9128,
    name: 'Hà Nam',
    region: 'Miền Bắc',
    keywords: ['hà nam', 'ha nam', 'phủ lý', 'đồng văn', 'duy tiên', 'thanh liêm', 'kim bảng'],
  },
  '30': {
    lat: 20.9406,
    lng: 106.3331,
    name: 'Hải Dương',
    region: 'Miền Bắc',
    keywords: ['hải dương', 'hai duong', 'chí linh', 'kinh môn', 'cẩm giàng', 'nam sách', 'kim thành'],
  },
  '17': {
    lat: 20.8172,
    lng: 105.3381,
    name: 'Hòa Bình',
    region: 'Miền Bắc',
    keywords: ['hòa bình', 'hoa binh', 'lương sơn', 'kỳ sơn', 'kim bôi', 'lạc thủy', 'mai châu'],
  },
  '33': {
    lat: 20.6500,
    lng: 106.0500,
    name: 'Hưng Yên',
    region: 'Miền Bắc',
    keywords: ['hưng yên', 'hung yen', 'mỹ hào', 'văn giang', 'văn lâm', 'khoái châu', 'yên mỹ'],
  },
  '12': {
    lat: 22.3967,
    lng: 103.4689,
    name: 'Lai Châu',
    region: 'Miền Bắc',
    keywords: ['lai châu', 'lai chau', 'tam đường', 'mường tè', 'phong thổ'],
  },
  '20': {
    lat: 21.8533,
    lng: 106.7617,
    name: 'Lạng Sơn',
    region: 'Miền Bắc',
    keywords: ['lạng sơn', 'lang son', 'đồng đăng', 'hữu lũng', 'chi lăng', 'cao lộc'],
  },
  '10': {
    lat: 22.4856,
    lng: 103.9707,
    name: 'Lào Cai',
    region: 'Miền Bắc',
    keywords: ['lào cai', 'lao cai', 'sa pa', 'sapa', 'bát xát', 'bảo thắng'],
  },
  '36': {
    lat: 20.4200,
    lng: 106.1683,
    name: 'Nam Định',
    region: 'Miền Bắc',
    keywords: ['nam định', 'nam dinh', 'hải hậu', 'giao thủy', 'nghĩa hưng', 'ý yên', 'vụ bản'],
  },
  '37': {
    lat: 20.2539,
    lng: 105.9750,
    name: 'Ninh Bình',
    region: 'Miền Bắc',
    keywords: ['ninh bình', 'ninh binh', 'tam điệp', 'hoa lư', 'gia viễn', 'yên khánh', 'kim sơn'],
  },
  '25': {
    lat: 21.3228,
    lng: 105.3283,
    name: 'Phú Thọ',
    region: 'Miền Bắc',
    keywords: ['phú thọ', 'phu tho', 'việt trì', 'thị xã phú thọ', 'lâm thao', 'phù ninh', 'thanh ba'],
  },
  '22': {
    lat: 20.9505,
    lng: 107.0734,
    name: 'Quảng Ninh',
    region: 'Miền Bắc',
    keywords: ['quảng ninh', 'quang ninh', 'hạ long', 'ha long', 'cẩm phả', 'uông bí', 'móng cái', 'đông triều', 'quảng yên', 'vân đồn'],
  },
  '14': {
    lat: 21.3283,
    lng: 103.9144,
    name: 'Sơn La',
    region: 'Miền Bắc',
    keywords: ['sơn la', 'son la', 'mộc châu', 'mai sơn', 'sông mã', 'thuận châu'],
  },
  '34': {
    lat: 20.4500,
    lng: 106.3333,
    name: 'Thái Bình',
    region: 'Miền Bắc',
    keywords: ['thái bình', 'thai binh', 'tiền hải', 'thụy anh', 'hưng hà', 'đông hưng', 'vũ thư', 'quỳnh phụ'],
  },
  '19': {
    lat: 21.5942,
    lng: 105.8481,
    name: 'Thái Nguyên',
    region: 'Miền Bắc',
    keywords: ['thái nguyên', 'thai nguyen', 'sông công', 'phổ yên', 'đại từ', 'phú bình', 'đồng hỷ'],
  },
  '08': {
    lat: 21.8233,
    lng: 105.2181,
    name: 'Tuyên Quang',
    region: 'Miền Bắc',
    keywords: ['tuyên quang', 'tuyen quang', 'sơn dương', 'yên sơn', 'chiêm hóa', 'hàm yên'],
  },
  '26': {
    lat: 21.3089,
    lng: 105.6047,
    name: 'Vĩnh Phúc',
    region: 'Miền Bắc',
    keywords: ['vĩnh phúc', 'vinh phuc', 'vĩnh yên', 'phúc yên', 'bình xuyên', 'mê linh', 'vĩnh tường'],
  },
  '15': {
    lat: 21.7167,
    lng: 104.8833,
    name: 'Yên Bái',
    region: 'Miền Bắc',
    keywords: ['yên bái', 'yen bai', 'nghĩa lộ', 'mù cang chải', 'trấn yên', 'văn chấn', 'lục yên'],
  },

  // --- MIỀN TRUNG & TÂY NGUYÊN ---
  '38': {
    lat: 19.8067,
    lng: 105.7852,
    name: 'Thanh Hóa',
    region: 'Miền Trung & Tây Nguyên',
    keywords: ['thanh hóa', 'thanh hoa', 'sầm sơn', 'bỉm sơn', 'nghi sơn', 'tĩnh gia', 'quảng xương', 'hoằng hóa', 'thọ xuân'],
  },
  '40': {
    lat: 18.6734,
    lng: 105.6813,
    name: 'Nghệ An',
    region: 'Miền Trung & Tây Nguyên',
    keywords: ['nghệ an', 'nghe an', 'tp vinh', 'cửa lò', 'hoàng mai', 'thái hòa', 'diễn châu', 'quỳnh lưu', 'nghi lộc'],
  },
  '42': {
    lat: 18.3428,
    lng: 105.9058,
    name: 'Hà Tĩnh',
    region: 'Miền Trung & Tây Nguyên',
    keywords: ['hà tĩnh', 'ha tinh', 'hồng lĩnh', 'kỳ anh', 'thạch hà', 'cẩm xuyên', 'nghi xuân'],
  },
  '44': {
    lat: 17.4694,
    lng: 106.6231,
    name: 'Quảng Bình',
    region: 'Miền Trung & Tây Nguyên',
    keywords: ['quảng bình', 'quang binh', 'đồng hới', 'ba đồn', 'bố trạch', 'lệ thủy', 'quảng trạch'],
  },
  '45': {
    lat: 16.8167,
    lng: 107.1000,
    name: 'Quảng Trị',
    region: 'Miền Trung & Tây Nguyên',
    keywords: ['quảng trị', 'quang tri', 'đông hà', 'quảng trị', 'vĩnh linh', 'gio linh', 'hướng hóa'],
  },
  '49': {
    lat: 15.5667,
    lng: 108.4833,
    name: 'Quảng Nam',
    region: 'Miền Trung & Tây Nguyên',
    keywords: ['quảng nam', 'quang nam', 'hội an', 'tam kỳ', 'điện bàn', 'núi thành', 'duy xuyên', 'thăng bình'],
  },
  '51': {
    lat: 15.1167,
    lng: 108.8000,
    name: 'Quảng Ngãi',
    region: 'Miền Trung & Tây Nguyên',
    keywords: ['quảng ngãi', 'quang ngai', 'đức phổ', 'bình sơn', 'tư nghĩa', 'mộ đức'],
  },
  '52': {
    lat: 13.7833,
    lng: 109.2167,
    name: 'Bình Định',
    region: 'Miền Trung & Tây Nguyên',
    keywords: ['bình định', 'binh dinh', 'quy nhơn', 'an nhơn', 'hoài nhơn', 'tây sơn', 'phù cát'],
  },
  '54': {
    lat: 13.0833,
    lng: 109.3000,
    name: 'Phú Yên',
    region: 'Miền Trung & Tây Nguyên',
    keywords: ['phú yên', 'phu yen', 'tuy hòa', 'sông cầu', 'đông hòa', 'tây hòa'],
  },
  '56': {
    lat: 12.2388,
    lng: 109.1967,
    name: 'Khánh Hòa',
    region: 'Miền Trung & Tây Nguyên',
    keywords: ['khánh hòa', 'khanh hoa', 'nha trang', 'cam ranh', 'ninh hòa', 'vạn ninh', 'diên khánh'],
  },
  '58': {
    lat: 11.5667,
    lng: 108.9833,
    name: 'Ninh Thuận',
    region: 'Miền Trung & Tây Nguyên',
    keywords: ['ninh thuận', 'ninh thuan', 'phan rang', 'tháp chàm', 'ninh hải', 'ninh phước'],
  },
  '60': {
    lat: 10.9333,
    lng: 108.1000,
    name: 'Bình Thuận',
    region: 'Miền Trung & Tây Nguyên',
    keywords: ['bình thuận', 'binh thuan', 'phan thiết', 'la gi', 'hàm tân', 'bắc bình', 'hàm thuận'],
  },
  '62': {
    lat: 14.3500,
    lng: 108.0000,
    name: 'Kon Tum',
    region: 'Miền Trung & Tây Nguyên',
    keywords: ['kon tum', 'kontum', 'đắk hà', 'ngọc hồi', 'sa thầy', 'măng đen'],
  },
  '64': {
    lat: 13.9833,
    lng: 108.0000,
    name: 'Gia Lai',
    region: 'Miền Trung & Tây Nguyên',
    keywords: ['gia lai', 'pleiku', 'an khê', 'ayun pa', 'chư prông', 'đắk đoa'],
  },
  '66': {
    lat: 12.6667,
    lng: 108.0500,
    name: 'Đắk Lắk',
    region: 'Miền Trung & Tây Nguyên',
    keywords: ['đắk lắk', 'dak lak', 'đắc lắc', 'buôn ma thuột', 'buon ma thuot', 'bmt', 'buôn hồ', 'cư mgar'],
  },
  '67': {
    lat: 12.0000,
    lng: 107.6833,
    name: 'Đắk Nông',
    region: 'Miền Trung & Tây Nguyên',
    keywords: ['đắk nông', 'dak nong', 'đắc nông', 'gia nghĩa', 'đắk mil', 'cư jút'],
  },
  '68': {
    lat: 11.9404,
    lng: 108.4583,
    name: 'Lâm Đồng',
    region: 'Miền Trung & Tây Nguyên',
    keywords: ['lâm đồng', 'lam dong', 'đà lạt', 'da lat', 'bảo lộc', 'đức trọng', 'đơn dương', 'di linh'],
  },

  // --- MIỀN NAM ---
  '70': {
    lat: 11.5333,
    lng: 106.8833,
    name: 'Bình Phước',
    region: 'Miền Nam',
    keywords: ['bình phước', 'binh phuoc', 'đồng xoài', 'chơn thành', 'bình long', 'phước long'],
  },
  '72': {
    lat: 11.3000,
    lng: 106.1000,
    name: 'Tây Ninh',
    region: 'Miền Nam',
    keywords: ['tây ninh', 'tay ninh', 'trảng bàng', 'hòa thành', 'gò dầu', 'tân châu'],
  },
  '74': {
    lat: 10.9804,
    lng: 106.6519,
    name: 'Bình Dương',
    region: 'Miền Nam',
    keywords: ['bình dương', 'binh duong', 'thủ dầu một', 'thu dau mot', 'dĩ an', 'di an', 'thuận an', 'thuan an', 'bến cát', 'tân uyên', 'bàu bàng'],
  },
  '75': {
    lat: 10.9439,
    lng: 106.8164,
    name: 'Đồng Nai',
    region: 'Miền Nam',
    keywords: ['đồng nai', 'dong nai', 'biên hòa', 'bien hoa', 'long khánh', 'long thành', 'nhơn trạch', 'trảng bom', 'vĩnh cửu'],
  },
  '77': {
    lat: 10.3460,
    lng: 107.0843,
    name: 'Bà Rịa - Vũng Tàu',
    region: 'Miền Nam',
    keywords: ['bà rịa', 'vũng tàu', 'ba ria', 'vung tau', 'phú mỹ', 'long điền', 'xuyên mộc', 'châu đức'],
  },
  '80': {
    lat: 10.5333,
    lng: 106.4000,
    name: 'Long An',
    region: 'Miền Nam',
    keywords: ['long an', 'tân an', 'bến lức', 'đức hòa', 'cần giuộc', 'cần đước', 'châu thành'],
  },
  '82': {
    lat: 10.3500,
    lng: 106.3500,
    name: 'Tiền Giang',
    region: 'Miền Nam',
    keywords: ['tiền giang', 'tien giang', 'mỹ tho', 'gò công', 'cai lậy', 'châu thành', 'chợ gạo'],
  },
  '83': {
    lat: 10.2333,
    lng: 106.3833,
    name: 'Bến Tre',
    region: 'Miền Nam',
    keywords: ['bến tre', 'ben tre', 'châu thành', 'chợ lách', 'mỏ cày', 'ba tri', 'bình đại'],
  },
  '84': {
    lat: 9.9333,
    lng: 106.3333,
    name: 'Trà Vinh',
    region: 'Miền Nam',
    keywords: ['trà vinh', 'tra vinh', 'duyên hải', 'càng long', 'tiểu cần', 'châu thành'],
  },
  '86': {
    lat: 10.2500,
    lng: 105.9667,
    name: 'Vĩnh Long',
    region: 'Miền Nam',
    keywords: ['vĩnh long', 'vinh long', 'bình minh', 'long hồ', 'tam bình', 'mang thít'],
  },
  '87': {
    lat: 10.4500,
    lng: 105.6333,
    name: 'Đồng Tháp',
    region: 'Miền Nam',
    keywords: ['đồng tháp', 'dong thap', 'cao lãnh', 'sa đéc', 'hồng ngự', 'lấp vò', 'lai vung'],
  },
  '89': {
    lat: 10.3833,
    lng: 105.4167,
    name: 'An Giang',
    region: 'Miền Nam',
    keywords: ['an giang', 'long xuyên', 'châu đốc', 'tân châu', 'thoại sơn', 'chợ mới', 'tri tôn'],
  },
  '91': {
    lat: 10.0167,
    lng: 105.0833,
    name: 'Kiên Giang',
    region: 'Miền Nam',
    keywords: ['kiên giang', 'kien giang', 'rạch giá', 'hà tiên', 'phú quốc', 'phu quoc', 'hòn đất', 'kiên lương'],
  },
  '93': {
    lat: 9.7833,
    lng: 105.4667,
    name: 'Hậu Giang',
    region: 'Miền Nam',
    keywords: ['hậu giang', 'hau giang', 'vị thanh', 'ngã bảy', 'long mỹ', 'châu thành'],
  },
  '94': {
    lat: 9.6000,
    lng: 105.9667,
    name: 'Sóc Trăng',
    region: 'Miền Nam',
    keywords: ['sóc trăng', 'soc trang', 'ngã năm', 'vĩnh châu', 'mỹ xuyên', 'trần đề'],
  },
  '95': {
    lat: 9.2833,
    lng: 105.7167,
    name: 'Bạc Liêu',
    region: 'Miền Nam',
    keywords: ['bạc liêu', 'bac lieu', 'giá rai', 'hòa bình', 'vĩnh lợi', 'phước long'],
  },
  '96': {
    lat: 9.1833,
    lng: 105.1500,
    name: 'Cà Mau',
    region: 'Miền Nam',
    keywords: ['cà mau', 'ca mau', 'năm căn', 'đầm dơi', 'thới bình', 'u minh', 'trần văn thời'],
  },
};

export const LOCATION_OPTIONS = Object.entries(PROVINCE_COORDINATES).map(([code, val]) => ({
  code,
  name: val.name,
  region: val.region,
}));

// Grouped locations by administrative regions
export const LOCATION_GROUPS = [
  {
    label: 'Thành phố trực thuộc Trung ương',
    options: LOCATION_OPTIONS.filter((loc) => loc.region === 'Thành phố trực thuộc Trung ương'),
  },
  {
    label: 'Đồng bằng sông Hồng & Miền Bắc',
    options: LOCATION_OPTIONS.filter((loc) => loc.region === 'Miền Bắc'),
  },
  {
    label: 'Bắc Trung Bộ, Duyên hải & Tây Nguyên',
    options: LOCATION_OPTIONS.filter((loc) => loc.region === 'Miền Trung & Tây Nguyên'),
  },
  {
    label: 'Đông Nam Bộ & Đồng bằng sông Cửu Long',
    options: LOCATION_OPTIONS.filter((loc) => loc.region === 'Miền Nam'),
  },
];

// Helper to auto-detect province from address string across all 63 provinces
// Sắp xếp các từ khóa dài nhất lên trước để tránh match nhầm từ khóa ngắn
export function detectProvinceFromText(address: string): string | null {
  if (!address || !address.trim()) return null;
  const raw = address.trim().toLowerCase();
  
  // Chuẩn hóa loại bỏ dấu tiếng Việt để đối sánh dự phòng
  const removeDiacritics = (str: string) =>
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');

  const normalized = removeDiacritics(raw);

  // 1. Ưu tiên đối sánh tên tỉnh/thành phố chính thức trước (độ dài giảm dần)
  const provinceNamesList = Object.entries(PROVINCE_COORDINATES).map(([code, item]) => ({
    code,
    name: item.name.toLowerCase(),
    normName: removeDiacritics(item.name.toLowerCase()),
  })).sort((a, b) => b.name.length - a.name.length);

  for (const item of provinceNamesList) {
    if (raw.includes(item.name) || normalized.includes(item.normName)) {
      return item.code;
    }
  }

  // 2. Tiếp theo đối sánh các từ khóa nhận diện đặc trưng (bỏ qua từ ngắn <= 2 ký tự)
  const allKeywords: Array<{ kw: string; normKw: string; code: string }> = [];
  for (const [code, item] of Object.entries(PROVINCE_COORDINATES)) {
    for (const kw of item.keywords) {
      const cleanKw = kw.trim().toLowerCase();
      if (cleanKw.length >= 3 && cleanKw !== 'hn' && cleanKw !== 'an') {
        allKeywords.push({
          kw: cleanKw,
          normKw: removeDiacritics(cleanKw),
          code,
        });
      }
    }
  }

  // Sắp xếp keyword dài nhất lên trước
  allKeywords.sort((a, b) => b.kw.length - a.kw.length);

  for (const item of allKeywords) {
    // Với keyword từ 3-4 ký tự, kiểm tra ranh giới từ để tránh match giữa chừng
    if (item.kw.length <= 4) {
      const regex = new RegExp(`(^|[^a-zA-Z0-9à-ỹÀ-Ỹ])${item.kw}([^a-zA-Z0-9à-ỹÀ-Ỹ]|$)`, 'i');
      if (regex.test(raw)) return item.code;
    } else {
      if (raw.includes(item.kw) || normalized.includes(item.normKw)) {
        return item.code;
      }
    }
  }

  return null;
}

// Danh sách gợi ý Quận / Huyện / Thị xã phổ biến theo từng Tỉnh / Thành phố
export const COMMON_DISTRICTS_BY_PROVINCE: Record<string, string[]> = {
  '01': [
    'Quận Cầu Giấy',
    'Quận Nam Từ Liêm',
    'Quận Bắc Từ Liêm',
    'Quận Đống Đa',
    'Quận Thanh Xuân',
    'Quận Ba Đình',
    'Quận Hoàn Kiếm',
    'Quận Hai Bà Trưng',
    'Quận Hoàng Mai',
    'Quận Long Biên',
    'Quận Tây Hồ',
    'Quận Hà Đông',
    'Huyện Đông Anh',
    'Huyện Gia Lâm',
    'Huyện Hoài Đức',
  ],
  '79': [
    'Quận 1',
    'Quận 3',
    'Quận 7',
    'TP. Thủ Đức',
    'Quận Bình Thạnh',
    'Quận Tân Bình',
    'Quận Phú Nhuận',
    'Quận Gò Vấp',
    'Quận 10',
    'Quận 2',
    'Quận Bình Tân',
    'Quận Tân Phú',
    'Huyện Bình Chánh',
    'Huyện Nhà Bè',
  ],
  '48': [
    'Quận Hải Châu',
    'Quận Thanh Khê',
    'Quận Sơn Trà',
    'Quận Ngũ Hành Sơn',
    'Quận Cẩm Lệ',
    'Quận Liên Chiểu',
    'Huyện Hòa Vang',
  ],
  '31': [
    'Quận Ngô Quyền',
    'Quận Lê Chân',
    'Quận Hồng Bàng',
    'Quận Hải An',
    'Quận Đồ Sơn',
    'Huyện Thủy Nguyên',
    'Huyện An Dương',
  ],
  '92': [
    'Quận Ninh Kiều',
    'Quận Cái Răng',
    'Quận Bình Thủy',
    'Quận Ô Môn',
    'Huyện Phong Điền',
  ],
  '46': [
    'TP. Huế',
    'Thị xã Hương Thủy',
    'Thị xã Hương Trà',
    'Huyện Phú Vang',
    'Huyện Phú Lộc',
  ],
  '60': [
    'TP. Thủ Dầu Một',
    'TP. Thuận An',
    'TP. Dĩ An',
    'Thị xã Bến Cát',
    'Thị xã Tân Uyên',
  ],
  '75': [
    'TP. Biên Hòa',
    'Huyện Long Thành',
    'Huyện Nhơn Trạch',
    'Huyện Trảng Bom',
    'Thành phố Long Khánh',
  ],
  '77': [
    'TP. Vũng Tàu',
    'TP. Bà Rịa',
    'Thị xã Phú Mỹ',
    'Huyện Long Điền',
  ],
  '56': [
    'TP. Nha Trang',
    'TP. Cam Ranh',
    'Thị xã Ninh Hòa',
    'Huyện Diên Khánh',
  ],
  '68': [
    'TP. Đà Lạt',
    'TP. Bảo Lộc',
    'Huyện Đức Trọng',
  ],
  '22': [
    'TP. Hạ Long',
    'TP. Cẩm Phả',
    'TP. Uông Bí',
    'TP. Móng Cái',
  ],
  '27': [
    'TP. Bắc Ninh',
    'TP. Từ Sơn',
    'Thị xã Thuận Thành',
    'Huyện Yên Phong',
  ],
  '24': [
    'TP. Bắc Giang',
    'Thị xã Việt Yên',
    'Huyện Hiệp Hòa',
  ],
  '40': [
    'TP. Vinh',
    'Thị xã Cửa Lò',
    'Huyện Diễn Châu',
  ],
  '38': [
    'TP. Thanh Hóa',
    'TP. Sầm Sơn',
    'Thị xã Bỉm Sơn',
  ],
};

// Bảng màu phổ biến thị trường (Classic Car Colors)
export const UNIVERSAL_CAR_COLORS: ColorSwatchItem[] = [
  { name: 'Trắng Ngọc Trai', hex: '#F8F9FA', border: true },
  { name: 'Đen Ánh Kim', hex: '#1C1917' },
  { name: 'Xám Titan', hex: '#64748B' },
  { name: 'Bạc Ánh Kim', hex: '#CBD5E1' },
  { name: 'Đỏ Ruby', hex: '#DC2626' },
  { name: 'Xanh Cavansite', hex: '#1E3A8A' },
  { name: 'Nâu Cà Phê', hex: '#78350F' },
  { name: 'Vàng Cát', hex: '#D4AF37' },
];

// Bảng màu đặc trưng theo nhận diện từng Hãng xe
export const BRAND_SPECIFIC_COLORS: Record<string, ColorSwatchItem[]> = {
  mercedes: [
    { name: 'Trắng Polar', hex: '#FFFFFF', border: true },
    { name: 'Đen Obsidian', hex: '#111827' },
    { name: 'Xám Selenite', hex: '#4B5563' },
    { name: 'Xanh Cavansite', hex: '#1E3A8A' },
    { name: 'Đỏ Hyacinth', hex: '#991B1B' },
    { name: 'Bạc Iridium', hex: '#E2E8F0' },
  ],
  bmw: [
    { name: 'Trắng Alpine', hex: '#FAFAFA', border: true },
    { name: 'Đen Sapphire', hex: '#0F172A' },
    { name: 'Xanh Phytonic', hex: '#0284C7' },
    { name: 'Xám Dravit', hex: '#334155' },
    { name: 'Đỏ Sunset', hex: '#EA580C' },
    { name: 'Xanh Portimao', hex: '#2563EB' },
  ],
  porsche: [
    { name: 'Trắng Carrara', hex: '#F1F5F9', border: true },
    { name: 'Đen Ánh Kim', hex: '#000000' },
    { name: 'Xám Crayon (Chalk)', hex: '#D1D5DB' },
    { name: 'Xanh Gentian', hex: '#1D4ED8' },
    { name: 'Đỏ Carmine', hex: '#B91C1C' },
    { name: 'Vàng Racing Yellow', hex: '#EAB308' },
  ],
  mazda: [
    { name: 'Đỏ Pha Lê (Soul Red)', hex: '#B91C1C' },
    { name: 'Xám Machine Grey', hex: '#475569' },
    { name: 'Trắng Ngọc Trai (Snowflake)', hex: '#F8FAFC', border: true },
    { name: 'Xanh Đậm (Deep Crystal)', hex: '#1E293B' },
    { name: 'Đen Jet Black', hex: '#18181B' },
    { name: 'Bạch Kim (Platinum Quartz)', hex: '#E5E7EB' },
  ],
  vinfast: [
    { name: 'Trắng Brahminy White', hex: '#FFFFFF', border: true },
    { name: 'Đen Jet Black', hex: '#111827' },
    { name: 'Bạc Desat Silver', hex: '#CBD5E1' },
    { name: 'Xanh Deep Ocean', hex: '#0E7490' },
    { name: 'Đỏ Crimson Red', hex: '#991B1B' },
    { name: 'Xám Neptune Grey', hex: '#64748B' },
  ],
  toyota: [
    { name: 'Trắng Ngọc Trai (070)', hex: '#F8FAFC', border: true },
    { name: 'Đen Ánh Kim (218)', hex: '#0F172A' },
    { name: 'Bạc Cổ Điển (1D4)', hex: '#E2E8F0' },
    { name: 'Đỏ Đô (3T3)', hex: '#831843' },
    { name: 'Nâu Vàng Cát (4R0)', hex: '#A16207' },
    { name: 'Xám Khói (1G3)', hex: '#475569' },
  ],
  lexus: [
    { name: 'Trắng Sonic Quartz', hex: '#FFFFFF', border: true },
    { name: 'Đen Graphite Black', hex: '#18181B' },
    { name: 'Xám Sonic Titanium', hex: '#64748B' },
    { name: 'Xanh Deep Blue Mica', hex: '#1E3A8A' },
    { name: 'Đỏ Red Mica Crystal', hex: '#991B1B' },
    { name: 'Vàng Amber Crystal', hex: '#CA8A04' },
  ],
  hyundai: [
    { name: 'Trắng Tuyết (Polar White)', hex: '#FFFFFF', border: true },
    { name: 'Đen Bóng (Phantom Black)', hex: '#0F172A' },
    { name: 'Đỏ Mận (Fiery Red)', hex: '#B91C1C' },
    { name: 'Xanh Biển (Intense Blue)', hex: '#2563EB' },
    { name: 'Ghi Xám (Starry Night)', hex: '#334155' },
    { name: 'Bạc Ánh Kim (Typhoon Silver)', hex: '#CBD5E1' },
  ],
  ford: [
    { name: 'Trắng Kim Cương (Oxford White)', hex: '#FFFFFF', border: true },
    { name: 'Đen Shadow Black', hex: '#18181B' },
    { name: 'Xám Meteor Grey', hex: '#475569' },
    { name: 'Đỏ Cam (Sedona Orange)', hex: '#C2410C' },
    { name: 'Xanh Blue Panther', hex: '#1D4ED8' },
    { name: 'Bạc Ingot Silver', hex: '#CBD5E1' },
  ],
  audi: [
    { name: 'Trắng Ibis White', hex: '#FFFFFF', border: true },
    { name: 'Đen Mythos Black', hex: '#111827' },
    { name: 'Xám Nardo Grey', hex: '#6B7280' },
    { name: 'Xanh Navarra Blue', hex: '#1E3A8A' },
    { name: 'Đỏ Tango Red', hex: '#B91C1C' },
    { name: 'Bạc Floret Silver', hex: '#E5E7EB' },
  ],
};

// Gợi ý Màu nội thất xe hơi phổ biến
export const POPULAR_INTERIOR_COLORS: ColorSwatchItem[] = [
  { name: 'Đen Da Nappa', hex: '#1F2937' },
  { name: 'Nâu Da Bò (Saddle Brown)', hex: '#78350F' },
  { name: 'Kem / Beige Hoàng Gia', hex: '#FDF6E2', border: true },
  { name: 'Đỏ Rượu / Cognac', hex: '#881337' },
  { name: 'Ghi Sáng (Light Grey)', hex: '#D1D5DB' },
];

export function getBrandColors(brandName: string): ColorSwatchItem[] {
  if (!brandName) return UNIVERSAL_CAR_COLORS;
  const lower = brandName.toLowerCase();
  for (const [key, colors] of Object.entries(BRAND_SPECIFIC_COLORS)) {
    if (lower.includes(key)) {
      return colors;
    }
  }
  return UNIVERSAL_CAR_COLORS;
}


// Tình trạng xe
export const CONDITION_OPTIONS = [
  { value: 'USED', label: 'Đã qua sử dụng (Xe lướt)', desc: 'Xe cá nhân lăn bánh, bảo dưỡng định kỳ' },
  { value: 'NEW', label: 'Xe mới 100% (Chưa lăn bánh)', desc: 'Xe xuất xưởng chưa đăng ký biển' },
];

// Xuất xứ
export const ORIGIN_OPTIONS = [
  { value: 'Lắp ráp trong nước', label: 'Lắp ráp trong nước (CKD)' },
  { value: 'Nhập khẩu nguyên chiếc', label: 'Nhập khẩu nguyên chiếc (CBU)' },
];

// Số chỗ ngồi
export const SEATS_OPTIONS = [
  { value: 2, label: '2 chỗ' },
  { value: 4, label: '4 chỗ' },
  { value: 5, label: '5 chỗ' },
  { value: 7, label: '7 chỗ' },
  { value: 8, label: '8 chỗ' },
];

// Số cửa
export const DOORS_OPTIONS = [
  { value: 2, label: '2 cửa (Coupe / Thể thao)' },
  { value: 4, label: '4 cửa (Sedan / Crossover)' },
  { value: 5, label: '5 cửa (Hatchback / SUV / MPV)' },
];

// Hệ dẫn động
export const DRIVETRAIN_OPTIONS = [
  { value: 'FWD', label: 'Cầu trước (FWD)' },
  { value: 'RWD', label: 'Cầu sau (RWD)' },
  { value: 'AWD', label: '4 bánh toàn thời gian (AWD / 4WD)' },
];

// Gợi ý Dung tích động cơ phổ biến
export const COMMON_ENGINE_DISPLACEMENTS = [
  '1.2L',
  '1.5L Turbo',
  '1.8L',
  '2.0L Turbo',
  '2.5L',
  '3.0L V6 Turbo',
  'Động cơ điện (Dual Motor EV)',
];

// Mẫu mô tả xe chuyên nghiệp gợi ý
export const SAMPLE_DESCRIPTIONS = [
  {
    title: 'Xe gia đình giữ gìn',
    text: 'Xe chính chủ gia đình sử dụng, bảo dưỡng định kỳ đầy đủ tại hãng. Sơn zin nguyên bản 98%, nội thất thơm mùi mới, không đâm đụng hay ngập nước. Bao kiểm tra test hãng toàn quốc. Xem xe trực tiếp có bớt lộc thiện chí.',
  },
  {
    title: 'Xe doanh nhân cao cấp',
    text: 'Cần nâng đời xe nên nhượng lại cho người cùng đam mê. Bản full trang bị đầy đủ option cao cấp, ghế da Nappa chỉnh điện, âm thanh vòm, cửa sổ trời, hỗ trợ lái an toàn. Xe đi ít giữ gìn cẩn thận, đã dán phim cách nhiệt và phủ ceramic.',
  },
  {
    title: 'Xe lướt siêu mới',
    text: 'Xe siêu lướt chuẩn ODO, chưa từng va quẹt hay sửa chữa khung gầm máy móc. Còn đầy đủ sổ bảo hành, 2 chìa khóa thông minh và bảo hiểm thân vỏ. Hỗ trợ thủ tục công chứng sang tên và giao lưu xe.',
  },
];
