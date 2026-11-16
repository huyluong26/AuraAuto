export interface LuxuryCarItem {
  id: string;
  title: string;
  subtitle: string;
  year: number;
  engine?: string;
  odometer: string;
  transmission: string;
  fuel: string;
  priceVnd: number;
  formattedPrice: string;
  location: string;
  marketStatus: string;
  badge1: string;
  badge2: string;
  isFeatured?: boolean;
  featuredTier?: string;
  imageUrl: string;
  detailUrl: string;
}

export interface LuxuryBrand {
  name: string;
  slug: string;
  carCountText: string;
}

export interface SecurityPillar {
  icon: string;
  title: string;
  description: string;
}
