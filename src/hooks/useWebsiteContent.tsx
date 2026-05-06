import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HeroContent {
  badge: string;
  headline: string;
  headlineAccent: string;
  subtitle: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
}

export interface ProblemContent {
  tagline: string;
  headline: string;
  subtitle: string;
}

export interface SolutionContent {
  tagline: string;
  headline: string;
  subtitle: string;
}

export type SectionContent = HeroContent | ProblemContent | SolutionContent;

const DEFAULTS: Record<string, SectionContent> = {
  hero: {
    badge: "Pre-launch — Express your interest today",
    headline: "Cross-border payments,",
    headlineAccent: "simplified.",
    subtitle:
      "BDRP is a dual-pegged stablecoin backed by GBP and EUR, powering fast, low-cost settlement across the NI–Ireland corridor 12B.",
    stat1Value: "<30s",
    stat1Label: "Settlement time",
    stat2Value: "<0.5%",
    stat2Label: "All-in fees",
    stat3Value: "£1.5–2B",
    stat3Label: "Corridor 12B volume",
  },
  problem: {
    tagline: "The Problem",
    headline: "Cross-border payments are broken",
    subtitle:
      "Northern Ireland SMEs trading with Ireland bear a disproportionate cost burden — despite operating across the world's most integrated cross-border corridor 12B.",
  },
  solution: {
    tagline: "The Solution",
    headline: "BDRP — the dual-pegged stablecoin",
    subtitle:
      "BDRP is backed by a basket of Euro and British Pound. 1 BDRP = 50% Euro + 50% British Pound — its value stays stable by tracking both currencies together, significantly reducing FX volatility and making cross-border payments fast, low-cost, and predictable.",
  },
};

export function useWebsiteContent<T extends SectionContent>(sectionKey: string): {
  content: T;
  loading: boolean;
} {
  const [content, setContent] = useState<T>(DEFAULTS[sectionKey] as T);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("website_content")
      .select("content")
      .eq("section_key", sectionKey)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.content) setContent(data.content as unknown as T);
        setLoading(false);
      });
  }, [sectionKey]);

  return { content, loading };
}

export function useAllWebsiteContent() {
  const [sections, setSections] = useState<Record<string, SectionContent>>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const { data } = await supabase.from("website_content").select("section_key, content");
    if (data) {
      const map: Record<string, SectionContent> = { ...DEFAULTS };
      data.forEach((row: any) => {
        map[row.section_key] = row.content as SectionContent;
      });
      setSections(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  return { sections, loading, refresh };
}

export async function updateSectionContent(sectionKey: string, content: SectionContent, userId: string) {
  const { error } = await supabase
    .from("website_content")
    .upsert({ section_key: sectionKey, content: content as any, updated_by: userId, updated_at: new Date().toISOString() }, { onConflict: "section_key" });
  return { error };
}
