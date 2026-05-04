import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserPlus, Shield, Pencil, Trash2 } from "lucide-react";
import { z } from "zod";

const ASSIGNABLE_ROLES: { value: AppRole; label: string; desc: string }[] = [
  { value: "creator", label: "Creator", desc: "Can create/modify payruns but cannot approve" },
  { value: "approver", label: "Approver", desc: "Can create payruns and approve others' (not own)" },
  { value: "readonly", label: "Read Only", desc: "Can view payruns but cannot create or approve" },
  { value: "admin", label: "Admin", desc: "Full access, invite users, assign roles" },
];

interface TeamMember {
  user_id: string;
  email: string;
  display_name: string | null;
  roles: AppRole[];
}

const emailSchema = z.string().trim().email("Enter a valid email address").max(320);

const ROLE_COLORS: Record<AppRole, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  approver: "bg-amber-100 text-amber-800 border-amber-200",
  creator: "bg-blue-100 text-blue-800 border-blue-200",
  readonly: "bg-slate-100 text-slate-700 border-slate-200",
  user: "bg-muted text-muted-foreground border-border",
};

const Team = () => {
  const { user, isAdmin, roles: myRoles } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("creator");
  const [inviting, setInviting] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [editRole, setEditRole] = useState<AppRole>("creator");
  const [saving, setSaving] = useState(false);

  const canManage = isAdmin;

  const refresh = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, email, display_name")
      .order("created_at", { ascending: false });

    const { data: allRoles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    const roleMap = new Map<string, AppRole[]>();
    for (const r of allRoles ?? []) {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role as AppRole);
      roleMap.set(r.user_id, arr);
    }

    setMembers(
      (profiles ?? []).map((p) => ({
        user_id: p.user_id,
        email: p.email,
        display_name: p.display_name,
        roles: roleMap.get(p.user_id) ?? ["user"],
      }))
    );
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleInvite = async () => {
    const parsed = emailSchema.safeParse(inviteEmail);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: { email: parsed.data, role: inviteRole },
      });

      if (error) throw error;

      if (data?.status === "existing") {
        toast.success(`Role "${inviteRole}" assigned to ${parsed.data}`);
      } else if (data?.status === "invited") {
        toast.success(`Invitation sent to ${parsed.data}`, {
          description: "They'll receive an email from hello@borderpay.app to accept the invite.",
          duration: 6000,
        });
      }

      setInviteEmail("");
      setInviteOpen(false);
      refresh();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to invite");
    } finally {
      setInviting(false);
    }
  };

  const openEdit = (member: TeamMember) => {
    setEditMember(member);
    const primaryRole = member.roles.find((r) => r !== "user") ?? "creator";
    setEditRole(primaryRole);
    setEditOpen(true);
  };

  const saveRole = async () => {
    if (!editMember) return;
    setSaving(true);
    try {
      // Remove existing non-user roles, then insert the new one
      // First delete old assignable roles
      for (const role of ["creator", "approver", "readonly", "admin"] as AppRole[]) {
        if (editMember.roles.includes(role) && role !== editRole) {
          await supabase
            .from("user_roles")
            .delete()
            .eq("user_id", editMember.user_id)
            .eq("role", role);
        }
      }
      // Upsert the new role
      const { error } = await supabase
        .from("user_roles")
        .upsert(
          { user_id: editMember.user_id, role: editRole },
          { onConflict: "user_id,role" }
        );
      if (error) throw error;
      toast.success(`Updated ${editMember.email} to ${editRole}`);
      setEditOpen(false);
      refresh();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  const removeRole = async (member: TeamMember, role: AppRole) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", member.user_id)
        .eq("role", role);
      if (error) throw error;
      toast.success(`Removed "${role}" from ${member.email}`);
      refresh();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to remove role");
    }
  };

  return (
    <>
      <Helmet>
        <title>Team | Border Pay</title>
      </Helmet>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Team</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage users and assign roles for payrun workflows.
            </p>
          </div>
          {canManage && (
            <Button onClick={() => setInviteOpen(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Invite user
            </Button>
          )}
        </div>

        {/* Role legend */}
        <Card className="p-4">
          <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" /> Role permissions
          </h2>
          <div className="grid gap-2 text-xs sm:grid-cols-3">
            {ASSIGNABLE_ROLES.map((r) => (
              <div key={r.value} className="flex items-start gap-2">
                <Badge variant="outline" className={`${ROLE_COLORS[r.value]} shrink-0`}>
                  {r.label}
                </Badge>
                <span className="text-muted-foreground">{r.desc}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Members list */}
        <Card className="divide-y">
          {members.map((m) => (
            <div key={m.user_id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{m.display_name ?? m.email}</p>
                <p className="text-xs text-muted-foreground truncate">{m.email}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {m.roles.map((r) => (
                  <Badge key={r} variant="outline" className={ROLE_COLORS[r]}>
                    {r}
                  </Badge>
                ))}
              </div>
              {canManage && m.user_id !== user?.id && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(m)} title="Edit role">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
          {members.length === 0 && (
            <div className="p-6 text-sm text-muted-foreground">No team members yet.</div>
          )}
        </Card>
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a team member</DialogTitle>
            <DialogDescription>
              Enter the user's email and assign a role. If they already have an account, the role is applied immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <span className="flex items-center gap-2">
                        {r.label}
                        <span className="text-xs text-muted-foreground">— {r.desc}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={inviting}>
              {inviting ? "Sending…" : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit role dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit role — {editMember?.display_name ?? editMember?.email}</DialogTitle>
            <DialogDescription>
              Change the primary role for this team member.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Role</Label>
            <Select value={editRole} onValueChange={(v) => setEditRole(v as AppRole)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label} — {r.desc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveRole} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Team;
