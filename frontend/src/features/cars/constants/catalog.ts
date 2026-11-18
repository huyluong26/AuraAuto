export const BRANDS = [
  'Tất cả',
  'Mercedes-Benz',
  'BMW',
  'Porsche',
  'Toyota',
  'Mitsubishi',
  'Mazda',
  'Hyundai',
  'Kia',
  'Ford',
  'VinFast',
  'Audi',
  'Lexus',
  'Honda',
  'Land Rover',
  'Bentley',
];

export const PROVINCES = [
  { label: 'Tất cả khu vực (Toàn quốc)', code: '' },
  { label: 'Hà Nội', code: '01' },
  { label: 'TP. Hồ Chí Minh', code: '79' },
  { label: 'Bắc Ninh', code: '27' },
  { label: 'Hải Phòng', code: '31' },
  { label: 'Đà Nẵng', code: '48' },
  { label: 'Bình Dương', code: 'BD' },
  { label: 'Cần Thơ', code: '92' },
];

export const PRICE_RANGES = [
  { label: 'Tất cả mức giá', min: undefined, max: undefined },
  { label: 'Dưới 500 triệu', min: undefined, max: 500_000_000 },
  { label: '500 - 800 triệu', min: 500_000_000, max: 800_000_000 },
  { label: '800 triệu - 1.2 tỷ', min: 800_000_000, max: 1_200_000_000 },
  { label: '1.2 - 2 tỷ', min: 1_200_000_000, max: 2_000_000_000 },
  { label: 'Trên 2 tỷ', min: 2_000_000_000, max: undefined },
];

export const YEAR_RANGES = [
  { label: 'Tất cả năm sản xuất', min: undefined, max: undefined },
  { label: '2022 - 2025 (Siêu lướt)', min: 2022, max: 2025 },
  { label: '2019 - 2021 (Đời gần)', min: 2019, max: 2021 },
  { label: '2015 - 2018 (Đời trung)', min: 2015, max: 2018 },
  { label: 'Trước 2015 (Đời sâu)', min: undefined, max: 2014 },
];

export const BODY_TYPES = [
  { label: 'Tất cả kiểu dáng', value: '' },
  { label: 'Sedan', value: 'SEDAN' },
  { label: 'SUV gầm cao', value: 'SUV' },
  { label: 'Hatchback', value: 'HATCHBACK' },
  { label: 'Bán tải (Pickup)', value: 'PICKUP' },
  { label: 'MPV đa dụng', value: 'MPV' },
];

export const TRANSMISSIONS = [
  { label: 'Tất cả hộp số', value: '' },
  { label: 'Tự động (AT)', value: 'AUTOMATIC' },
  { label: 'Số sàn (MT)', value: 'MANUAL' },
];

export const FUEL_TYPES = [
  { label: 'Tất cả nhiên liệu', value: '' },
  { label: 'Xăng', value: 'GASOLINE' },
  { label: 'Dầu Diesel', value: 'DIESEL' },
  { label: 'Xe điện (EV)', value: 'ELECTRIC' },
];

export const ODO_RANGES = [
  { label: 'Tất cả số km', max: undefined },
  { label: 'Dưới 15.000 km (Siêu lướt)', max: 15_000 },
  { label: 'Dưới 30.000 km', max: 30_000 },
  { label: 'Dưới 60.000 km', max: 60_000 },
  { label: 'Dưới 100.000 km', max: 100_000 },
];

export const CARS_PER_ROW = 4;
export const ROWS_PER_PAGE = 8;
export const PAGE_SIZE = CARS_PER_ROW * ROWS_PER_PAGE; // 32

export function getPaginationItems(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
}
