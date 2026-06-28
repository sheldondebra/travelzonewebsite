export type BookingStatus = "pending" | "confirmed" | "cancelled";

export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed";

export type TourBooking = {
  id: string;
  tourSlug: string;
  tourTitle: string;
  fullName: string;
  email: string;
  phone: string;
  travelDate: string;
  travelers: number;
  specialRequests?: string;
  estimatedTotal: number;
  currency: "GHS";
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paystackReference?: string;
  paidAmount?: number;
  paidAt?: string;
  createdAt: string;
};

export type BookingInput = {
  tourSlug: string;
  tourTitle: string;
  fullName: string;
  email: string;
  phone: string;
  travelDate: string;
  travelers: number;
  specialRequests?: string;
};

export type BookingResult =
  | {
      success: true;
      authorizationUrl: string;
      accessCode: string;
      reference: string;
      bookingId: string;
    }
  | { success: false; error: string };

export type VerifyPaymentResult =
  | { success: true; bookingId: string; paid: boolean }
  | { success: false; error: string };
