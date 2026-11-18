export function normalizeAccidentStatus(val?: string): 'UNKNOWN' | 'NONE' | 'MINOR' | 'MAJOR' {
  if (!val) return 'UNKNOWN';
  const u = val.trim().toUpperCase();
  if (['UNKNOWN', 'NONE', 'MINOR', 'MAJOR'].includes(u)) return u as any;
  const l = val.toLowerCase();
  if (
    l.includes('chưa từng') ||
    l.includes('không') ||
    l.includes('chưa va') ||
    l.includes('nguyên bản') ||
    l.includes('zin') ||
    l.includes('none')
  ) {
    return 'NONE';
  }
  if (
    l.includes('nhẹ') ||
    l.includes('xước') ||
    l.includes('quẹt') ||
    l.includes('sát') ||
    l.includes('minor')
  ) {
    return 'MINOR';
  }
  if (
    l.includes('nặng') ||
    l.includes('khung gầm') ||
    l.includes('tai nạn') ||
    l.includes('ảnh hưởng') ||
    l.includes('major')
  ) {
    return 'MAJOR';
  }
  return 'UNKNOWN';
}

export function normalizeFloodStatus(val?: string): 'UNKNOWN' | 'NONE' | 'SUSPECTED' | 'CONFIRMED' {
  if (!val) return 'UNKNOWN';
  const u = val.trim().toUpperCase();
  if (['UNKNOWN', 'NONE', 'SUSPECTED', 'CONFIRMED'].includes(u)) return u as any;
  const l = val.toLowerCase();
  if (
    l.includes('không') ||
    l.includes('cam kết') ||
    l.includes('chưa từng') ||
    l.includes('zin') ||
    l.includes('none')
  ) {
    return 'NONE';
  }
  if (l.includes('nghi ngờ') || l.includes('dấu hiệu') || l.includes('suspect')) {
    return 'SUSPECTED';
  }
  if (l.includes('ngập') || l.includes('thủy kích') || l.includes('confirmed')) {
    return 'CONFIRMED';
  }
  return 'UNKNOWN';
}

export function normalizeServiceHistory(val?: string): 'UNKNOWN' | 'NONE' | 'PARTIAL' | 'FULL' {
  if (!val) return 'UNKNOWN';
  const u = val.trim().toUpperCase();
  if (['UNKNOWN', 'NONE', 'PARTIAL', 'FULL'].includes(u)) return u as any;
  const l = val.toLowerCase();
  if (l.includes('đầy đủ') || l.includes('100%') || l.includes('hãng') || l.includes('full')) {
    return 'FULL';
  }
  if (
    l.includes('một phần') ||
    l.includes('vài') ||
    l.includes('sổ theo dõi') ||
    l.includes('partial')
  ) {
    return 'PARTIAL';
  }
  if (
    l.includes('không có') ||
    l.includes('mất') ||
    l.includes('chưa rõ') ||
    l.includes('none')
  ) {
    return 'NONE';
  }
  return 'UNKNOWN';
}

export function normalizeIntCount(val?: any, minVal = 0, maxVal = 50): number | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  if (typeof val === 'number') {
    if (isNaN(val)) return undefined;
    return Math.max(minVal, Math.min(maxVal, Math.round(val)));
  }
  const match = String(val).match(/\d+/);
  if (match) {
    const parsed = parseInt(match[0], 10);
    if (!isNaN(parsed)) {
      return Math.max(minVal, Math.min(maxVal, parsed));
    }
  }
  return undefined;
}

export function normalizeBodyType(val?: string): string {
  if (!val) return 'SEDAN';
  const u = val.trim().toUpperCase();
  if (u.includes('GẦM CAO') || u.includes('SUV')) return 'SUV';
  if (u.includes('BÁN TẢI') || u.includes('PICKUP')) return 'PICKUP';
  if (u.includes('HATCHBACK')) return 'HATCHBACK';
  if (u.includes('MPV') || u.includes('ĐA DỤNG')) return 'MPV';
  if (u.includes('CROSSOVER') || u.includes('CUV')) return 'CROSSOVER';
  if (u.includes('MUI TRẦN') || u.includes('CONVERTIBLE')) return 'CONVERTIBLE';
  if (u.includes('COUPE')) return 'COUPE';
  return u;
}

export function normalizeFuelType(val?: string): string {
  if (!val) return 'GASOLINE';
  const u = val.trim().toUpperCase();
  if (u.includes('XĂNG') || u.includes('GAS')) return 'GASOLINE';
  if (u.includes('DẦU') || u.includes('DIESEL')) return 'DIESEL';
  if (u.includes('ĐIỆN') || u.includes('ELECTRIC')) return 'ELECTRIC';
  if (u.includes('HYBRID')) return 'HYBRID';
  return u;
}

export function normalizeTransmission(val?: string): string {
  if (!val) return 'AUTOMATIC';
  const u = val.trim().toUpperCase();
  if (u.includes('SÀN') || u.includes('MANUAL')) return 'MANUAL';
  return 'AUTOMATIC';
}
