export type UploadType = 'curriculum_doc' | 'template';
export type ExportFormat = 'docx' | 'pdf' | 'xlsx';
export type Plan = 'free' | 'pro' | 'pro_plus';
export type BillingInterval = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'cancelled' | 'paused' | 'expired' | 'on_trial' | 'inactive';

export type User = {
  id: string;
  email: string;
  name: string;
  default_subject: string | null;
  default_grade: string | null;
  default_curriculum: string | null;
  plan: Plan;
  generation_count: number;
  generation_count_reset_at: string | null;
  onboarding_complete: boolean;
  created_at: string;
}

export type LessonSection = {
  title: string;
  objectives: string[];
  successCriteria: string[];
  keyConcepts: string[];
  hook: string;
  mainActivities: string[];
  guidedPractice: string[];
  independentPractice: string[];
  formativeAssessment: string[];
  differentiation: {
    support: string[];
    extension: string[];
  };
  realWorldConnections: string[];
  plenary: string;
}

export type LessonPlan = {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  grade: string;
  curriculum: string | null;
  duration_minutes: number;
  content: LessonSection;
  model_used: string;
  token_count: number;
  template_path: string | null;
  created_at: string;
  updated_at: string;
}

export type Upload = {
  id: string;
  user_id: string;
  lesson_id: string | null;
  type: UploadType;
  file_name: string;
  storage_path: string;
  parsed_content: Record<string, unknown> | null;
  created_at: string;
}

export type Export = {
  id: string;
  lesson_id: string;
  format: ExportFormat;
  storage_path: string;
  created_at: string;
}

export type Subscription = {
  id: string;
  user_id: string;
  ls_subscription_id: string | null;
  ls_customer_id: string | null;
  ls_order_id: string | null;
  ls_product_id: string | null;
  ls_variant_id: string | null;
  plan: Plan;
  billing_interval: BillingInterval | null;
  status: SubscriptionStatus;
  renews_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}


export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'created_at' | 'generation_count' | 'generation_count_reset_at' | 'onboarding_complete' | 'plan'> & {
          generation_count?: number;
          generation_count_reset_at?: string | null;
          onboarding_complete?: boolean;
          plan?: Plan;
        };
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
        Relationships: [];
      };
      lesson_plans: {
        Row: LessonPlan;
        Insert: Omit<LessonPlan, 'id' | 'created_at' | 'updated_at' | 'token_count'> & {
          id?: string;
          token_count?: number;
        };
        Update: Partial<Omit<LessonPlan, 'id' | 'user_id' | 'created_at'>>;
        Relationships: [];
      };
      uploads: {
        Row: Upload;
        Insert: Omit<Upload, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<Upload, 'id' | 'user_id' | 'created_at'>>;
        Relationships: [];
      };
      exports: {
        Row: Export;
        Insert: Omit<Export, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<Export, 'id' | 'created_at'>>;
        Relationships: [];
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, 'id' | 'created_at' | 'updated_at' | 'cancel_at_period_end' | 'stripe_price_id'> & {
          id?: string;
          stripe_price_id?: string | null;
          cancel_at_period_end?: boolean;
        };
        Update: Partial<Omit<Subscription, 'id' | 'user_id' | 'created_at'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      upload_type: UploadType;
      export_format: ExportFormat;
      plan_type: Plan;
    };
    CompositeTypes: Record<string, never>;
  };
}
