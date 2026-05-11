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
    badge: "The payment rail of the all-island economy",
    headline: "Cross-border payments,",
    headlineAccent: "simplified.",
    subtitle:
      "Border Pay is a dual-rails payments company connecting GBP and EUR — fast, low-cost settlement across the all-island economy.",
    stat1Value: "<30s",
    stat1Label: "Settlement time",
    stat2Value: "0.3–0.5%",
    stat2Label: "All-in fees",
    stat3Value: "£14.6B",
    stat3Label: "All-island corridor volume",
  },
  problem: {
    tagline: "The Problem",
    headline: "Cross-border payments are broken",
    subtitle:
      "Northern Ireland and Ireland SMEs trading across the all-island economy bear a disproportionate cost burden — despite operating across the world's most integrated cross-border corridor.",
  },
  solution: {
    tagline: "The Solution",
    headline: "Dual-rails payments for the all-island economy",
    subtitle:
      "Border Pay runs payment rails on both GBP and EUR — pay or get paid in your local currency with FX, settlement, and compliance handled end-to-end. The payment rail of the all-island economy.",
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
