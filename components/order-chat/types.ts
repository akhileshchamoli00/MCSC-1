export type ChannelType = "CLIENT" | "INTERNAL";

export interface ChatMessage {
  id: number;
  order_number?: string;
  user_id?: number | null;
  sender_id?: number | null;
  sender_name?: string | null;
  sender_role?: string | null;
  sender_email?: string | null;
  sender_photo?: string | null;
  sender_avatar?: string | null;
  message: string;
  channel?: ChannelType;
  is_client?: boolean;
  is_deleted?: boolean;
  is_snippet?: boolean;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_size?: number | null;
  quoted_message_id?: number | null;
  quoted_message_text?: string | null;
  quoted_sender_name?: string | null;
  reactions?: Array<{
    emoji: string;
    users: Array<{ user_id: number; name: string }>;
  }>;
  seen_by?: Array<{
    user_id: number;
    name: string;
    role?: string;
    read_at: string;
  }>;
  created_at: string;
  pending?: boolean;
}

export interface ScopeDeliverable {
  id?: number | string;
  job_title: string;
  job_id?: string;
  description?: string;
  service_instructions?: string;
  notes?: string;
  unit_price?: number;
  total_amount?: number;
  notary_name?: string;
  needs_notary?: boolean;
  needs_gov_officer?: boolean;
  needs_other_vendors?: boolean;
}

export interface AssignedStaff {
  id: number;
  name: string;
  job_title?: string;
  position?: string;
  department?: string;
  role?: string;
  profile_photo?: string | null;
}

export interface AssignedNotary {
  id: number;
  name: string;
  vendor_type?: string;
  is_gov_officer?: boolean;
  is_other_vendor?: boolean;
}

export interface OrderCompanySummary {
  id: number;
  company_name: string;
  company_code?: string;
  tax_number?: string;
  address?: string;
  client_id?: number;
  client?: {
    id: number;
    name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
}

export interface OrderSummaryData {
  id: number;
  order_number: string;
  status: string;
  company?: OrderCompanySummary;
  items?: ScopeDeliverable[];
  consultants?: AssignedStaff[];
  reviewers?: AssignedStaff[];
  notaries?: AssignedNotary[];
  client?: {
    id: number;
    name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  total_amount?: number;
  currency?: string;
  created_at?: string;
  proforma_invoice_url?: string;
  final_invoice_url?: string;
}

export interface TaggableUser {
  id: string | number;
  type: "user" | "team" | "order_team";
  displayName: string;
  subtitle?: string;
  avatar?: string;
  first_name?: string;
  last_name?: string;
  department?: { name: string };
  job_title?: string;
}

export interface MessageGroupData {
  id: string;
  senderKey: string;
  senderName: string;
  senderRole?: string;
  senderPhoto?: string | null;
  isSelf: boolean;
  isClient: boolean;
  timeStr: string;
  fullDateStr: string;
  messages: ChatMessage[];
}
