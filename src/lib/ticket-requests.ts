export type TicketRequestStatus = "pending" | "quoted" | "booked" | "cancelled";

export type TripType = "one-way" | "round-trip";

export type CabinClass = "economy" | "premium-economy" | "business" | "first";

export type TicketRequest = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  tripType: TripType;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass: CabinClass;
  flexibleDates: boolean;
  notes?: string;
  status: TicketRequestStatus;
  createdAt: string;
};

export type TicketRequestInput = {
  fullName: string;
  email: string;
  phone: string;
  tripType: TripType;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass: CabinClass;
  flexibleDates: boolean;
  notes?: string;
};

export type TicketRequestResult =
  | { success: true; requestId: string }
  | { success: false; error: string };

export const tripTypes = [
  { value: "one-way" as const, label: "One way" },
  { value: "round-trip" as const, label: "Round trip" },
];

export const cabinClasses = [
  { value: "economy" as const, label: "Economy" },
  { value: "premium-economy" as const, label: "Premium economy" },
  { value: "business" as const, label: "Business" },
  { value: "first" as const, label: "First class" },
];

export function getTripTypeLabel(value: TripType) {
  return tripTypes.find((item) => item.value === value)?.label ?? value;
}

export function getCabinClassLabel(value: CabinClass) {
  return cabinClasses.find((item) => item.value === value)?.label ?? value;
}

export function getTicketRequestStatusLabel(value: TicketRequestStatus) {
  switch (value) {
    case "pending":
      return "Pending review";
    case "quoted":
      return "Quote sent";
    case "booked":
      return "Booked";
    case "cancelled":
      return "Cancelled";
    default:
      return value;
  }
}
