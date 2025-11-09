export interface Customer {
  id: string;
  customerCode: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  address?: Address;
  loyaltyPoints: number;
  loyaltyTier: LoyaltyTier;
  totalPurchases: number;
  totalSpent: number;
  lastPurchaseDate?: Date;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string;
}

export interface CustomerFilter {
  search?: string;
  loyaltyTier?: LoyaltyTier;
  isActive?: boolean;
  minTotalSpent?: number;
  maxTotalSpent?: number;
  hasEmail?: boolean;
  registeredFrom?: Date;
  registeredTo?: Date;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CustomerStatistics {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  totalLoyaltyPoints: number;
  averageSpent: number;
  tierDistribution: TierDistribution[];
}

export interface TierDistribution {
  tier: LoyaltyTier;
  count: number;
  percentage: number;
}

export interface CustomerPurchaseHistory {
  transactionId: string;
  date: Date;
  items: number;
  total: number;
  paymentMethod: string;
  pointsEarned: number;
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  type: 'earned' | 'redeemed' | 'expired' | 'adjusted';
  points: number;
  description: string;
  transactionId?: string;
  createdAt: Date;
}

export interface CustomerFormData {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  address?: Address;
  loyaltyPoints?: number;
  loyaltyTier?: LoyaltyTier;
  notes?: string;
  isActive: boolean;
}

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface LoyaltyProgram {
  id: string;
  name: string;
  pointsPerCurrency: number; // Points earned per LKR spent
  redemptionRate: number; // LKR value per point redeemed
  tierThresholds: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
  tierBenefits: {
    [key in LoyaltyTier]: {
      discountPercentage: number;
      bonusPointsMultiplier: number;
      description: string;
    };
  };
  isActive: boolean;
}

export interface PaginatedCustomers {
  customers: Customer[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
