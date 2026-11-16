// ========================================================
// TOÀN BỘ CÁC HÃNG XE TRÊN THẾ GIỚI (ALL WORLD CAR BRANDS)
// ========================================================
export const ALL_WORLD_CAR_BRANDS = [
  // Châu Á & Phổ biến tại Việt Nam
  'Toyota',
  'Hyundai',
  'Mazda',
  'Kia',
  'Honda',
  'Ford',
  'VinFast',
  'Mitsubishi',
  'Nissan',
  'Suzuki',
  'Isuzu',
  'Subaru',
  'Lexus',
  'Infiniti',
  'Acura',
  'Daihatsu',
  'Hino',
  'Mitsuoka',

  // Châu Âu: Đức & lân cận
  'Mercedes-Benz',
  'BMW',
  'Audi',
  'Porsche',
  'Volkswagen',
  'Maybach',
  'Smart',
  'Alpina',
  'Opel',
  'Ruf',

  // Châu Âu: Anh Quốc
  'Land Rover',
  'Jaguar',
  'Bentley',
  'Rolls-Royce',
  'Aston Martin',
  'McLaren',
  'Lotus',
  'Mini',
  'MG',
  'Vauxhall',
  'Morgan',
  'Caterham',

  // Châu Âu: Ý
  'Ferrari',
  'Lamborghini',
  'Maserati',
  'Alfa Romeo',
  'Fiat',
  'Pagani',
  'Abarth',
  'Lancia',

  // Châu Âu: Pháp, Thụy Điển & Khác
  'Peugeot',
  'Renault',
  'Citroën',
  'DS Automobiles',
  'Bugatti',
  'Alpine',
  'Volvo',
  'Koenigsegg',
  'Polestar',
  'Saab',
  'Škoda',
  'SEAT',
  'Cupra',
  'Dacia',
  'Rimac',

  // Châu Mỹ (Hoa Kỳ)
  'Tesla',
  'Chevrolet',
  'Cadillac',
  'GMC',
  'Buick',
  'Jeep',
  'Dodge',
  'Ram',
  'Chrysler',
  'Lincoln',
  'Rivian',
  'Lucid',
  'Fisker',
  'Hummer',
  'Pontiac',
  'Saturn',
  'Oldsmobile',
  'Plymouth',
  'Mercury',
  'Saleen',
  'Hennessey',
  'Shelby',

  // Hàn Quốc khác
  'Genesis',
  'KG Mobility',
  'SsangYong',
  'Daewoo',
  'Renault Korea',

  // Trung Quốc (EV & Xăng mới nổi)
  'BYD',
  'Geely',
  'Chery',
  'Haval',
  'Great Wall (GWM)',
  'Changan',
  'SAIC',
  'Dongfeng',
  'BAIC',
  'Wuling',
  'Zeekr',
  'Lynk & Co',
  'Omoda',
  'Jaecoo',
  'Hongqi (Hồng Kỳ)',
  'XPeng',
  'NIO',
  'Li Auto (Lixiang)',
  'GAC',
  'Aion',
  'Haima',
  'Zotye',
  'Brilliance',
  'Foton',
  'Maxus',
  'JAC',
  'Roewe',
  'Tank',
  'Ora',
  'Leapmotor',
  'Voyah',
  'Avatr',
  'Yangwang',
  'Fangchengbao',
  'Jetour',
  'Exeed',
  'Xiaomi',

  // Ấn Độ, Malaysia & Khác
  'Tata',
  'Mahindra',
  'Proton',
  'Perodua',
  'Lada',
  'Aurus',
  'Luxgen',
];

// Comprehensive Brand & Model Dictionary
export const BRAND_MODEL_CATALOG: Record<
  string,
  {
    models: string[];
    defaultBody?: string;
    defaultFuel?: string;
  }
> = {
  Toyota: {
    models: ['Vios', 'Camry', 'Corolla Cross', 'Fortuner', 'Innova', 'Raize', 'Veloz Cross', 'Yaris', 'Hilux', 'Land Cruiser', 'Prado', 'Corolla Altis', 'Wigo', 'Rush', 'Alphard', 'Prius', 'Crown', 'Sienna', 'Highlander', 'RAV4', 'Avalon', 'Supra', 'GR86', 'bZ4X', 'Granvia', 'Hiace'],
  },
  Mazda: {
    models: ['CX-5', 'Mazda 3', 'Mazda 6', 'CX-8', 'Mazda 2', 'BT-50', 'CX-3', 'CX-30', 'CX-90', 'CX-60', 'MX-5 Miata', 'RX-8'],
  },
  Hyundai: {
    models: ['Accent', 'Grand i10', 'SantaFe', 'Tucson', 'Elantra', 'Creta', 'Kona', 'Palisade', 'Stargazer', 'Custin', 'Ioniq 5', 'Ioniq 6', 'Venue', 'Genesis', 'Sonata', 'Avante', 'Getz'],
  },
  Kia: {
    models: ['Morning', 'K3', 'Cerato', 'Seltos', 'Carnival', 'Sedona', 'Sorento', 'Sonet', 'K5', 'Soluto', 'Carens', 'Sportage', 'EV6', 'Rondo', 'Forte', 'Optima', 'Rio'],
  },
  Honda: {
    models: ['City', 'CR-V', 'Civic', 'HR-V', 'Brio', 'Accord', 'BR-V', 'Jazz', 'Odyssey', 'Pilot'],
  },
  Ford: {
    models: ['Ranger', 'Everest', 'Explorer', 'Territory', 'Ranger Raptor', 'EcoSport', 'Transit', 'Focus', 'Fiesta', 'Escape', 'Mustang', 'F-150', 'Bronco'],
  },
  'Mercedes-Benz': {
    models: ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'GLS', 'C200', 'C300', 'E200', 'E300', 'S450', 'S500', 'GLC 200', 'GLC 300', 'GLE 450', 'GLS 450', 'G63 AMG', 'Maybach S680', 'Maybach GLS', 'CLA', 'GLA', 'GLB', 'EQS', 'EQE'],
  },
  BMW: {
    models: ['3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X6', 'X7', '4 Series', '320i', '330i', '520i', '530i', '730Li', '740Li', 'Z4', 'M3', 'M4', 'M5', 'i4', 'iX', 'i7'],
  },
  VinFast: {
    models: ['VF 3', 'VF 5', 'VF 6', 'VF 7', 'VF 8', 'VF 9', 'VF e34', 'Fadil', 'Lux A2.0', 'Lux SA2.0', 'President'],
  },
  Mitsubishi: {
    models: ['Xpander', 'Xforce', 'Outlander', 'Attrage', 'Triton', 'Pajero Sport', 'Xpander Cross', 'Grandis', 'Pajero'],
  },
  Lexus: {
    models: ['RX 350', 'RX 500h', 'ES 250', 'ES 300h', 'LX 570', 'LX 600', 'NX 350', 'GX 460', 'GX 550', 'LS 500', 'IS 300', 'LM 350', 'LM 500h'],
  },
  Porsche: {
    models: ['Macan', 'Cayenne', 'Panamera', '911 Carrera', 'Taycan', '718 Boxster', '718 Cayman'],
  },
  Audi: {
    models: ['A4', 'A6', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron GT', 'A3', 'A5', 'A7'],
  },
  'Land Rover': {
    models: ['Range Rover', 'Defender', 'Discovery', 'Range Rover Sport', 'Range Rover Evoque', 'Range Rover Velar'],
  },
  Volvo: {
    models: ['XC60', 'XC90', 'S90', 'XC40', 'V60', 'V90', 'EX30', 'EX90'],
  },
  Nissan: {
    models: ['Navara', 'Almera', 'Kicks', 'X-Trail', 'Terra', 'Sunny', 'Teana', 'Murano'],
  },
  Subaru: {
    models: ['Forester', 'Outback', 'WRX', 'BRZ', 'Crosstrek'],
  },
  Peugeot: {
    models: ['2008', '3008', '5008', '408', '308', '508', 'Traveller'],
  },
  Suzuki: {
    models: ['XL7', 'Ertiga', 'Swift', 'Jimny', 'Ciaz', 'Blind Van', 'Carry'],
  },
  Chevrolet: {
    models: ['Colorado', 'Trailblazer', 'Cruze', 'Spark', 'Captiva', 'Orlando', 'Aveo', 'Corvette', 'Camaro', 'Tahoe', 'Suburban'],
  },
  Volkswagen: {
    models: ['Teramont', 'Teramont X', 'Tiguan', 'Touareg', 'Viloran', 'Passat', 'Polo', 'T-Cross', 'Virtus', 'Golf', 'Beetle'],
  },
  Jeep: {
    models: ['Wrangler', 'Gladiator', 'Grand Cherokee', 'Compass', 'Renegade'],
  },
  MG: {
    models: ['MG5', 'ZS', 'HS', 'MG4 EV', 'Cyberster', 'RX5'],
  },
  BYD: {
    models: ['Atto 3', 'Dolphin', 'Seal', 'Han', 'Tang', 'Song Plus', 'Seagull', 'Yangwang U8'],
  },
  Haval: {
    models: ['H6 HEV', 'Jolion'],
  },
  'Lynk & Co': {
    models: ['01', '03', '05', '06', '08', '09'],
  },
  Wuling: {
    models: ['Hongguang Mini EV', 'Bingo', 'Baojun'],
  },
  Chery: {
    models: ['Omoda 5', 'Jaecoo 7', 'Tiggo 7', 'Tiggo 8'],
  },
  'Hongqi (Hồng Kỳ)': {
    models: ['H9', 'E-HS9', 'H5', 'HS5'],
  },
  Tesla: {
    models: ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck'],
  },
  Mini: {
    models: ['Cooper', 'Cooper S', 'Countryman', 'Clubman', 'One'],
  },
  Bentley: {
    models: ['Continental GT', 'Flying Spur', 'Bentayga', 'Mulsanne'],
  },
  'Rolls-Royce': {
    models: ['Phantom', 'Ghost', 'Cullinan', 'Wraith', 'Dawn', 'Spectre'],
  },
  Maserati: {
    models: ['Ghibli', 'Levante', 'Quattroporte', 'Grecale', 'MC20'],
  },
  Ferrari: {
    models: ['488', 'F8 Tributo', 'Roma', '296 GTB', 'SF90 Stradale', 'Portofino', '812 Superfast', 'Purosangue'],
  },
  Lamborghini: {
    models: ['Urus', 'Huracan', 'Aventador', 'Revuelto'],
  },
  Cadillac: {
    models: ['Escalade', 'CT5', 'CT6', 'XT4', 'XT5', 'XT6', 'Lyriq'],
  },
  'Aston Martin': {
    models: ['DB11', 'DBX', 'Vantage', 'DBS'],
  },
  Genesis: {
    models: ['G70', 'G80', 'G90', 'GV70', 'GV80'],
  },
  Isuzu: {
    models: ['D-Max', 'Mu-X'],
  },
};

// Master list of all unique models across catalogs
export const MASTER_ALL_MODELS: string[] = Array.from(
  new Set(Object.values(BRAND_MODEL_CATALOG).flatMap((entry) => entry.models))
);

// Danh sách các năm sản xuất từ 2026 xuống 1990
export const ALL_YEARS: string[] = Array.from({ length: 2026 - 1990 + 1 }, (_, i) => String(2026 - i));

export const TRIM_SUGGESTIONS: string[] = [
  '1.5G CVT',
  '1.5E MT',
  '2.0 Premium',
  '2.5Q',
  'C200 Exclusive',
  'C300 AMG',
  'Wildtrak 4x4',
  'EcoBoost Titanium',
  'Bản Cao Cấp (Premium)',
  'Bản Tiêu Chuẩn (Standard)',
  'Bản Đặc Biệt (Special)',
  'Base',
  'Luxury',
  'Sport',
];
