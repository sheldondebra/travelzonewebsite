import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      businessId: string | null;
      role?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    businessId: string | null;
    role?: string;
    passwordChangedAt?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email?: string;
    name?: string | null;
    businessId: string | null;
    role?: string;
    passwordChangedAt?: number;
    expired?: boolean;
  }
}
