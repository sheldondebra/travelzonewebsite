import {
  createSupplier,
  listSuppliers,
  listSuppliersPaginated,
} from "@/server/services/supplier/create-supplier";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";
import {
  parsePaginationQuery,
  wantsPagination,
} from "@/server/validations/pagination";
import { z } from "zod";

const supplierSchema = z.object({
  name: z.string().min(1),
  contact: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const { searchParams } = new URL(request.url);

    if (wantsPagination(searchParams)) {
      const { page, pageSize } = parsePaginationQuery(searchParams);
      const result = await listSuppliersPaginated(businessId, { page, pageSize });
      return apiSuccess(result, "Suppliers fetched");
    }

    const suppliers = await listSuppliers(businessId);
    return apiSuccess(suppliers, "Suppliers fetched");
  });
}

export async function POST(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const body = await parseJsonBody(request);
    const input = supplierSchema.parse(body);
    const supplier = await createSupplier(businessId, {
      ...input,
      email: input.email || undefined,
    });
    return apiSuccess(supplier, "Supplier created", 201);
  });
}
