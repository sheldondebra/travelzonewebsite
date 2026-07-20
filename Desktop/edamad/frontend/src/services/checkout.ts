import api, { prepareApiRequest } from "@/lib/api";

export type CheckoutInitializePayload = {
  course_ids: number[];
  payment_method: "momo" | "card";
  billing: {
    name: string;
    email: string;
    phone?: string;
    network?: string;
  };
};

export type CheckoutInitializeResponse = {
  authorization_url: string;
  reference: string;
  access_code: string;
};

export type CheckoutVerifyResponse = {
  status: "success";
  reference: string;
  amount: number;
  currency: string;
  courses: { id: number; slug: string; title: string }[];
};

export async function initializeCheckout(payload: CheckoutInitializePayload) {
  await prepareApiRequest();
  const { data } = await api.post<CheckoutInitializeResponse>("/checkout/initialize", payload);
  return data;
}

export async function verifyCheckout(reference: string) {
  await prepareApiRequest();
  const { data } = await api.get<CheckoutVerifyResponse>(`/checkout/verify/${reference}`);
  return data;
}
