import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canShowDashboardRoute,
  getTenantContextState,
  PLATFORM_OFFICE_SLUG,
} from "@/lib/platform/tenant-context";

describe("getTenantContextState", () => {
  it("treats General Office as the default office context", () => {
    const state = getTenantContextState({
      currentBusinessId: "office-id",
      tenants: [
        {
          id: "office-id",
          name: "Tecunit General Office",
          slug: PLATFORM_OFFICE_SLUG,
        },
        { id: "tenant-id", name: "Novasoria", slug: "novasoria" },
      ],
    });

    assert.equal(state.isOfficeContext, true);
    assert.equal(state.canShowTenantMenu, false);
    assert.equal(state.currentBusinessName, "Tecunit General Office");
  });

  it("shows the tenant menu after a non-office business is selected", () => {
    const state = getTenantContextState({
      currentBusinessId: "tenant-id",
      tenants: [
        {
          id: "office-id",
          name: "Tecunit General Office",
          slug: PLATFORM_OFFICE_SLUG,
        },
        { id: "tenant-id", name: "Novasoria", slug: "novasoria" },
      ],
    });

    assert.equal(state.isOfficeContext, false);
    assert.equal(state.canShowTenantMenu, true);
    assert.equal(state.currentBusinessName, "Novasoria");
  });
});

describe("canShowDashboardRoute", () => {
  it("keeps the main dashboard visible in General Office context", () => {
    assert.equal(
      canShowDashboardRoute({
        pathname: "/dashboard",
        isPlatformAdmin: true,
        canShowTenantMenu: false,
      }),
      true,
    );
  });

  it("keeps platform routes visible in General Office context", () => {
    assert.equal(
      canShowDashboardRoute({
        pathname: "/dashboard/platform/communications",
        isPlatformAdmin: true,
        canShowTenantMenu: false,
      }),
      true,
    );
  });

  it("hides tenant routes from platform admins until a tenant is selected", () => {
    assert.equal(
      canShowDashboardRoute({
        pathname: "/dashboard/products",
        isPlatformAdmin: true,
        canShowTenantMenu: false,
      }),
      false,
    );
  });
});
