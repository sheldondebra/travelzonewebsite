declare module "@paystack/inline-js" {
  type PaystackCallbacks = {
    onSuccess?: (response: { reference: string; message: string }) => void;
    onCancel?: () => void;
    onError?: (error: { message: string }) => void;
  };

  export default class PaystackPop {
    resumeTransaction(accessCode: string, callbacks?: PaystackCallbacks): unknown;
  }
}
