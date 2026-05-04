import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAllWebsiteContent, updateSectionContent, type HeroContent, type ProblemContent, type SolutionContent } from "@/hooks/useWebsiteContent";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";

const ALLOWED_EMAIL = "hello@borderpay.app";

const WebsiteContent = () => {
  const { user } = useAuth();
  const { sections, loading, refresh } = useAllWebsiteContent();
  const [saving, setSaving] = useState<string | null>(null);

  const canEdit = user?.email === ALLOWED_EMAIL;

  if (!canEdit) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
        <ShieldAlert size={40} />
        <p className="text-lg font-semibold">Access restricted</p>
        <p className="text-sm">Only {ALLOWED_EMAIL} can edit website content.</p>
      </div>
    );
  }

  if (loading) return <div className="py-10 text-center text-muted-foreground">Loading…</div>;

  const hero = sections.hero as HeroContent;
  const problem = sections.problem as ProblemContent;
  const solution = sections.solution as SolutionContent;

  const save = async (key: string, content: any) => {
    setSaving(key);
    const { error } = await updateSectionContent(key, content, user!.id);
    if (error) toast.error("Failed to save: " + error.message);
    else {
      toast.success("Saved!");
      await refresh();
    }
    setSaving(null);
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Website Content</h1>
        <p className="text-sm text-muted-foreground mt-1">Edit text displayed on the public landing page.</p>
      </div>

      {/* Hero Section */}
      <SectionEditor
        title="Hero Section"
        sectionKey="hero"
        saving={saving}
        onSave={save}
        initialContent={hero}
        fields={[
          { key: "badge", label: "Badge text", type: "input" },
          { key: "headline", label: "Headline", type: "input" },
          { key: "headlineAccent", label: "Headline accent", type: "input" },
          { key: "subtitle", label: "Subtitle", type: "textarea" },
          { key: "stat1Value", label: "Stat 1 value", type: "input" },
          { key: "stat1Label", label: "Stat 1 label", type: "input" },
          { key: "stat2Value", label: "Stat 2 value", type: "input" },
          { key: "stat2Label", label: "Stat 2 label", type: "input" },
          { key: "stat3Value", label: "Stat 3 value", type: "input" },
          { key: "stat3Label", label: "Stat 3 label", type: "input" },
        ]}
      />

      {/* Problem Section */}
      <SectionEditor
        title="Problem Section"
        sectionKey="problem"
        saving={saving}
        onSave={save}
        initialContent={problem}
        fields={[
          { key: "tagline", label: "Tagline", type: "input" },
          { key: "headline", label: "Headline", type: "input" },
          { key: "subtitle", label: "Subtitle", type: "textarea" },
        ]}
      />

      {/* Solution Section */}
      <SectionEditor
        title="Solution Section"
        sectionKey="solution"
        saving={saving}
        onSave={save}
        initialContent={solution}
        fields={[
          { key: "tagline", label: "Tagline", type: "input" },
          { key: "headline", label: "Headline", type: "input" },
          { key: "subtitle", label: "Subtitle", type: "textarea" },
        ]}
      />
    </div>
  );
};

interface FieldDef {
  key: string;
  label: string;
  type: "input" | "textarea";
}

function SectionEditor({
  title,
  sectionKey,
  saving,
  onSave,
  initialContent,
  fields,
}: {
  title: string;
  sectionKey: string;
  saving: string | null;
  onSave: (key: string, content: any) => void;
  initialContent: Record<string, string>;
  fields: FieldDef[];
}) {
  const [values, setValues] = useState<Record<string, string>>({ ...initialContent });

  const update = (key: string, val: string) => setValues((prev) => ({ ...prev, [key]: val }));

  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {fields.map((f) => (
        <div key={f.key}>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">{f.label}</Label>
          {f.type === "textarea" ? (
            <Textarea
              value={values[f.key] ?? ""}
              onChange={(e) => update(f.key, e.target.value)}
              rows={3}
              className="mt-1"
            />
          ) : (
            <Input
              value={values[f.key] ?? ""}
              onChange={(e) => update(f.key, e.target.value)}
              className="mt-1"
            />
          )}
        </div>
      ))}
      <Button onClick={() => onSave(sectionKey, values)} disabled={saving === sectionKey}>
        {saving === sectionKey ? "Saving…" : "Save changes"}
      </Button>
    </Card>
  );
}

export default WebsiteContent;
