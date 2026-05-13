export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff'
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  email?: string;
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  category?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  hsnCode?: string;
  name: string;
  sku?: string;
  barcode?: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  category?: string;
  unitType?: string;
  vendorId?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Purchase {
  id: string;
  productId: string;
  vendorId?: string;
  units: number;
  cost: number;
  amount: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  productId: string;
  customerId?: string;
  units: number;
  price: number;
  amount: number;
  discount?: number;
  date: string;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  createdAt: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
