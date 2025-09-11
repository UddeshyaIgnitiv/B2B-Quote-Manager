// types/quotes.ts

export interface DraftOrder {
  name: string;
  id: string;
  customer: string;
  company?: string;
  totalPrice: string;
  createdAt: string;
  status: string;
}

export interface QuoteDetailsModalProps {
  quoteId: string;
  onCloseAction: () => void;
  onSaveSuccess?: () => void;
}

// -------------------------
// Customer Information
// -------------------------
export interface Customer {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

// -------------------------
// Address Types
// -------------------------
export interface ShippingAndBillingAddress {
  company?: string;
  name?: string;
  address1?: string;
  address2?: string;
  city?: string;
  provinceCode?: string;
  zip?: string;
  country?: string;
  phone?: string;
}

// -------------------------
// Product Line Items
// -------------------------
export interface VariantImage {
  url?: string;
  altText?: string;
}

export interface ProductSearchResult {
  id: string;
  title: string;
  variantId: string;
  image?: VariantImage;
  price: number;
}

export interface LineItem {
  id?: string;
  title: string;
  quantity: number;
  price: number;
  variantId?: string;
  requiresShipping?: boolean;
  taxable?: boolean;
  originalUnitPriceWithCurrency?: {
    amount: string;
    currencyCode: string;
  };
  image?: VariantImage;
  isCustom?: boolean;
}

export interface LineItemExtended extends LineItem {
  requiresShipping?: boolean;
  taxable?: boolean;
}

// -------------------------
// Discounts & Taxes
// -------------------------
export interface AppliedDiscount {
  description?: string;
  value?: string;
  valueType?: 'FIXED_AMOUNT' | 'PERCENTAGE';
}

export interface TaxLine {
  title: string;
  rate: number;
  ratePercentage?: number;
  source?: string;
  price?: number;
  priceSet?: {
    shopMoney: {
      amount: string;
      currencyCode: string;
    };
    presentmentMoney: {
      amount: string;
      currencyCode: string;
    };
  };
}

// -------------------------
// Shipping
// -------------------------
export type ShippingType = 'rate' | 'custom';

export interface ShippingLine {
  title: string;
  price: number;
  type: ShippingType;
  discountedPriceSet?: {
    shopMoney: {
      amount: string;
      currencyCode: string;
    };
  };
}

export type ShippingMethod = {
  type: 'rate' | 'custom';
  name: string;
  price: number;
};

export type PaymentTerms = {
  id: string;
  name: string;
  dueInDays: number;
  translatedName: string;
  // Add more fields if needed
};

// -------------------------
// Quote Object
// -------------------------

export interface PaymentMethod {
  id: string;
  name: string;
  // add any other fields you expect here
}

export interface Quote {
  id: string;
  name: string;
  status?: string;
  createdAt: string;
  customer?: Customer;
  shippingAddress?: ShippingAndBillingAddress;
  billingAddress?: ShippingAndBillingAddress;
  notes?: string;
  lineItems?: LineItem[];
  taxLines: TaxLine[];
  shippingLine: ShippingLine;
  paymentMethod?: PaymentMethod;
  appliedDiscount?: AppliedDiscount | null;
  subtotalPrice?: number;
  totalPrice?: number;
  subtotal: number;
  totalDiscounts?: number;
  discountAmount?: number;
  shippingPrice?: number;
  taxAmount?: number | string;
  note2?: string;
  tags?: string[];
  presentmentCurrencyCode?: string;
  paymentTerms?: PaymentTerms | null;
  companyName?: string;
  locationName?: string;
  discountCode?: string;
  customDiscount?: {
    type: 'fixed' | 'percentage';
    value: number;
    reason?: string;
  };
  shippingMethod?: ShippingMethod;
}

// -------------------------
// EmailPayload Type (For Invoice Modal)
// -------------------------

export interface EmailPayload {
  to: string;
  from: string;  
  subject?: string;
  customMessage?: string;
  cc?: string;
  bcc?: string;
  lockPrices?: boolean;
  allowDiscounts?: boolean;
  quoteStatus?: string;
}

// -------------------------
// SendInvoiceModalProps Type (For Invoice Modal)
// -------------------------

export interface SendInvoiceModalProps {
  onClose: () => void;
  onSend: (email: EmailPayload & { from: string }) => void;
  initialTo?: string;
  initialFrom?: string;
  senderOptions?: string[];
  invoiceSent?: boolean; // indicates if invoice was already sent
  quote:Quote;
}

export type Alert = { message: string; type: 'success' | 'error' };

export interface PaymentDueSectionProps {
  draftOrderId: string;
  currentPaymentTermId?: string | null;
  draftOrderStatus?: string;
}


