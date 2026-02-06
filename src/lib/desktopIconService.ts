import { supabase } from '@/integrations/supabase/client';

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

export async function insertDesktopIcon(data: IconInsertData) {
  const { data: maxSort } = await supabase
    .from('desktop_icons')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSort = (maxSort?.sort_order ?? 0) + 1;

  const { data: inserted, error } = await supabase
    .from('desktop_icons')
    .insert({
      ...data,
      icon_type: 'program',
      sort_order: nextSort,
      position_x_mobile: data.position_x,
      position_y_mobile: data.position_y,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  return inserted;
}

export async function updateDesktopIcon(id: string, data: IconUpdateData) {
  const { error } = await supabase
    .from('desktop_icons')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteDesktopIcon(id: string) {
  const { error } = await supabase
    .from('desktop_icons')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function updateIconPosition(id: string, x: number, y: number) {
  const { error } = await supabase
    .from('desktop_icons')
    .update({
      position_x: x,
      position_y: y,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}
