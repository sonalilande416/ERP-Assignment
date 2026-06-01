export type Role = "employee" | "manager" | "admin";
export type RequestStatus = "pending" | "approved" | "rejected";

export type Profile = {
  id: string;
  full_name: string;
  role: Role;
  created_at: string;
};

export type InventoryItem = {
  id: string;
  item_name: string;
  category: string;
  total_stock: number;
  available_stock: number;
  created_at: string;
  updated_at: string;
};

export type ResourceRequest = {
  id: string;
  employee_id: string;
  item_id: string;
  status: RequestStatus;
  quantity: number;
  attachment_path: string;
  rejection_reason: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  inventory?: Pick<InventoryItem, "item_name" | "category"> | null;
  profiles?: Pick<Profile, "full_name" | "role"> | null;
};

export type MonthlyReport = {
  generated_at: string;
  from_date: string;
  to_date: string;
  totals: Record<RequestStatus, number>;
  by_category: Array<{
    category: string;
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  }>;
  recent_requests: Array<{
    id: string;
    employee_name: string;
    item_name: string;
    category: string;
    status: RequestStatus;
    quantity: number;
    created_at: string;
  }>;
};
