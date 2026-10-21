export const AUTH_PROFILE_IDS = ["sales", "billing", "store_manager", "business_owner"] as const;

export type AuthProfileId = (typeof AUTH_PROFILE_IDS)[number];

export const AUTH_PROFILES: Array<{
  id: AuthProfileId;
  slug: string;
  path: string;
  label: string;
  title: string;
  description: string;
  demoEmail: string;
}> = [
  {
    id: "sales",
    slug: "sales",
    path: "/sales/quotes",
    label: "Sales",
    title: "Sales workspace",
    description: "Quotes, orders, and customer follow-up.",
    demoEmail: "sales@rcbsarafa.com",
  },
  {
    id: "billing",
    slug: "billing",
    path: "/dashboard/billing",
    label: "Billing",
    title: "Billing workspace",
    description: "Invoices, receipts, and collections.",
    demoEmail: "billing@rcbsarafa.com",
  },
  {
    id: "store_manager",
    slug: "store-manager",
    path: "/items",
    label: "Store Manager",
    title: "Store workspace",
    description: "Inventory, receiving, and shop floor.",
    demoEmail: "store@rcbsarafa.com",
  },
  {
    id: "business_owner",
    slug: "business-owner",
    path: "/home",
    label: "Business Owner",
    title: "Owner workspace",
    description: "Company-wide controls and oversight.",
    demoEmail: "owner@rcbsarafa.com",
  },
];

export function isAuthProfile(value: string | null | undefined): value is AuthProfileId {
  return AUTH_PROFILE_IDS.includes(value as AuthProfileId);
}

export function profileById(id: string | null | undefined) {
  return AUTH_PROFILES.find((p) => p.id === id);
}

export function profileBySlug(slug: string | null | undefined) {
  return AUTH_PROFILES.find((p) => p.slug === slug);
}

export function postLoginPath(role: string | null | undefined) {
  if (role === "portal") return "/portal";
  if (role === "business_owner" || role === "admin" || role === "accountant") return "/home";
  if (role === "sales") return "/sales/quotes";
  if (role === "store_manager") return "/items";
  return profileById(role)?.path ?? "/home";
}
