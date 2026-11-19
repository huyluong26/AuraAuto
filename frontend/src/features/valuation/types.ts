import { VehicleHistoryState } from '@/features/car-listing/types';

export interface QuickListingData {
  brand: string;
  model: string;
  trim?: string;
  year: number;
  odometerKm: number;
  bodyType: string;
  fuelType: string;
  transmission: string;
  origin: string;
  condition?: string;
  drivetrain?: string;
  engineDisplacement?: string;
  seats?: number;
  doors?: number;
  color?: string;
  interiorColor?: string;
  estimatedPriceVnd: number;
  lowPriceVnd?: number;
  highPriceVnd?: number;
  suggestedTitle?: string;
  suggestedDescription?: string;
  vehicleHistory?: VehicleHistoryState;
}

