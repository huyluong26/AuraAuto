export type CarListingStep = 1 | 2 | 3 | 4 | 5;

export type PhotoCategory = 'exterior' | 'interior' | 'technical';

export type PhotoSlotKey =
  | 'front'
  | 'front_34'
  | 'rear'
  | 'cockpit'
  | 'odo'
  | 'seats'
  | 'engine'
  | 'inspection_sticker';

export interface PhotoSlotItem {
  key: PhotoSlotKey;
  label: string;
  description: string;
  icon: string;
  category: PhotoCategory;
  isPrimary?: boolean;
  aiAssist?: boolean;
}

export interface BrandItem {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

export interface ModelItem {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  body_type: string;
}

export interface CommitmentsState {
  isOwner: boolean;
  maintenanceHistory: boolean;
  noAccidentFlood: boolean;
  readyInspection: boolean;
}

export interface VehicleHistoryState {
  accidentStatus: 'UNKNOWN' | 'NONE' | 'MINOR' | 'MAJOR';
  floodStatus: 'UNKNOWN' | 'NONE' | 'SUSPECTED' | 'CONFIRMED';
  serviceHistory: 'UNKNOWN' | 'NONE' | 'PARTIAL' | 'FULL';
  ownerCount: number;
  repaintedPartsCount: number;
  replacedParts: string;
  engineRepaired: boolean;
  transmissionRepaired: boolean;
}

export interface TradeOptionsState {
  negotiable: boolean;
  tradeSuv: boolean;
}

export interface SlotPhotoState {
  file: File;
  previewUrl: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ColorSwatchItem {
  name: string;
  hex: string;
  border?: boolean;
}
