export type ResumeVersion = {
  id: string;
  name: string;
  target_role?: string | null;
  notes?: string | null;
  file_uri?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  created_at: string;
  updated_at: string;
};

export type ResumeVersionInput = Omit<ResumeVersion, 'id' | 'created_at' | 'updated_at'>;
