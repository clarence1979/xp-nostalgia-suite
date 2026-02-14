import { supabase } from '@/integrations/supabase/client';
import { apiKeyStorage } from './apiKeyStorage';

export interface IconInsertData {
  name: string;
  icon: string;
  url: string;
  description: string;
  open_behavior: 'window' | 'new_tab';
  position_x: number;
  position_y: number;
}

export interface IconUpdateData extends Partial<IconInsertData> {
  position_x_mobile?: number | null;
  position_y_mobile?: number | null;
}

function getAuthToken(): string {
  const token = apiKeyStorage.getAuthToken();
  if (!token) {
    throw new Error('No auth token found. Please log in again.');
  }
  return token;
}

export async function insertDesktopIcon(data: IconInsertData) {
  const token = getAuthToken();

  const { data: result, error } = await supabase.rpc('admin_insert_icon', {
    p_token: token,
    p_name: data.name,
    p_icon: data.icon,
    p_description: data.description,
    p_url: data.url,
    p_open_behavior: data.open_behavior,
    p_position_x: data.position_x,
    p_position_y: data.position_y,
  });

  if (error) throw error;
  return result;
}

export async function updateDesktopIcon(id: string, data: IconUpdateData) {
  const token = getAuthToken();

  const { error } = await supabase.rpc('admin_update_icon', {
    p_token: token,
    p_icon_id: id,
    p_name: data.name || null,
    p_icon: data.icon || null,
    p_description: data.description || null,
    p_url: data.url || null,
    p_open_behavior: data.open_behavior || null,
  });

  if (error) throw error;
}

export async function deleteDesktopIcon(id: string) {
  const token = getAuthToken();

  const { error } = await supabase.rpc('admin_delete_icon', {
    p_token: token,
    p_icon_id: id,
  });

  if (error) throw error;
}

export async function updateIconPosition(id: string, x: number, y: number) {
  const token = getAuthToken();

  const { error } = await supabase.rpc('admin_update_icon_position', {
    p_token: token,
    p_icon_id: id,
    p_position_x: x,
    p_position_y: y,
  });

  if (error) throw error;
}
