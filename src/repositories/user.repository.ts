import { supabase } from '../infrastructure/supabase/supabase-client.js';

export interface UserEntity {
  id: string;
  email: string;
  password_hash: string;
  youtube_channel_id: string | null;
  youtube_channel_url: string | null;
  youtube_channel_name: string | null;
  gmail_access_token: string | null;
  gmail_refresh_token: string | null;
  gmail_expires_at: string | null;
  auto_pitch_enabled: boolean;
  onboarding_completed: boolean;
  onboarding_step: number;
  created_at: string;
  updated_at: string;
}

export class UserRepository {
  async findByEmail(email: string): Promise<UserEntity | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (error || !data) return null;
    return data as UserEntity;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return data as UserEntity;
  }

  async create(userData: { email: string; password_hash: string }): Promise<UserEntity> {
    console.log('[UserRepository] Attempting insert into users table:', { email: userData.email });
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    if (error || !data) {
      console.error('[UserRepository] Insert failed:', error);
      throw new Error(`Error creating user: ${error?.message || 'unknown'}`);
    }
    console.log('[UserRepository] Insert succeeded:', data.id);
    return data as UserEntity;
  }

  async update(id: string, updates: Partial<Omit<UserEntity, 'id' | 'created_at'>>): Promise<UserEntity | null> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error || !data) return null;
    return data as UserEntity;
  }
}

export const userRepository = new UserRepository();
