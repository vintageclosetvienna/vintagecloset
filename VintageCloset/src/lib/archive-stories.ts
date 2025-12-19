// Archive Stories Data Layer
import { supabase, isSupabaseConfigured } from './supabase';

export interface ArchiveStory {
  id: string;
  image_url: string;
  title: string;
  location: string;
  tags: string[];
  story_text: string;
  highlight_1_icon: string;
  highlight_1_title: string;
  highlight_1_description: string;
  highlight_2_icon: string;
  highlight_2_title: string;
  highlight_2_description: string;
  highlight_3_icon: string;
  highlight_3_title: string;
  highlight_3_description: string;
  section_header: string;
  section_header_highlight: string;
  sort_order: number;
  is_active: boolean;
}

export async function getActiveArchiveStories(): Promise<ArchiveStory[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('archive_stories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching archive stories:', error);
    return [];
  }

  return (data as ArchiveStory[]) || [];
}

export async function getSectionHeader(): Promise<{ header: string; highlight: string } | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase
    .from('archive_stories')
    .select('section_header, section_header_highlight')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  const typedData = data as { section_header: string; section_header_highlight: string };

  return {
    header: typedData.section_header,
    highlight: typedData.section_header_highlight,
  };
}

