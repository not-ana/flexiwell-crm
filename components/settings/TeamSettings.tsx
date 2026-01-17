"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui";
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalTitle, ModalDescription } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { showToast } from "./shared";

// ============================================================================
// Types
// ============================================================================

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Teacher" | "Receptionist";
  status: "Active" | "Pending";
}

interface InviteFormData {
  name: string;
  email: string;
  role: TeamMember["role"];
}

// ============================================================================
// Constants
// ============================================================================

const INITIAL_FORM_DATA: InviteFormData = {
  name: "",
  email: "",
  role: "Teacher",
};

const ROLE_OPTIONS = [
  { value: "Admin", label: "Admin" },
  { value: "Teacher", label: "Teacher" },
  { value: "Receptionist", label: "Receptionist" },
];

// ============================================================================
// Translations
// ============================================================================

const TRANSLATIONS = {
  title: { "pt-BR": "Equipe", "en-US": "Team" },
  description: { "pt-BR": "Gerencie o acesso e permissões da equipe.", "en-US": "Manage team access and permissions." },
  inviteMember: { "pt-BR": "Convidar Membro", "en-US": "Invite Member" },
  fullName: { "pt-BR": "Nome Completo", "en-US": "Full Name" },
  email: { "pt-BR": "E-mail", "en-US": "Email" },
  role: { "pt-BR": "Função", "en-US": "Role" },
  enterFullName: { "pt-BR": "Digite o nome completo", "en-US": "Enter full name" },
  invitationEmailTitle: { "pt-BR": "E-mail de Convite", "en-US": "Invitation Email" },
  invitationEmailDesc: {
    "pt-BR": "O membro da equipe receberá um e-mail para configurar sua conta e senha.",
    "en-US": "The team member will receive an email to set up their account and password.",
  },
  cancel: { "pt-BR": "Cancelar", "en-US": "Cancel" },
  addMember: { "pt-BR": "Adicionar Membro", "en-US": "Add Member" },
  adding: { "pt-BR": "Adicionando...", "en-US": "Adding..." },
  editMember: { "pt-BR": "Editar Membro", "en-US": "Edit Member" },
  resendInvite: { "pt-BR": "Reenviar Convite", "en-US": "Resend Invite" },
  removeMember: { "pt-BR": "Remover Membro", "en-US": "Remove Member" },
  removeTeamMember: { "pt-BR": "Remover Membro da Equipe", "en-US": "Remove Team Member" },
  cannotBeUndone: { "pt-BR": "Esta ação não pode ser desfeita", "en-US": "This action cannot be undone" },
  confirmRemove: {
    "pt-BR": (name: string) => `Tem certeza que deseja remover ${name} da equipe? Ele perderá o acesso ao sistema imediatamente.`,
    "en-US": (name: string) => `Are you sure you want to remove ${name} from the team? They will lose access to the system immediately.`,
  },
  fillNameEmail: { "pt-BR": "Preencha nome e e-mail", "en-US": "Please fill in name and email" },
  invalidEmail: { "pt-BR": "Por favor, insira um e-mail válido", "en-US": "Please enter a valid email address" },
  memberAddedSuccess: {
    "pt-BR": (name: string) => `Membro ${name} adicionado com sucesso`,
    "en-US": (name: string) => `Team member ${name} added successfully`,
  },
  failedToAdd: { "pt-BR": "Falha ao adicionar membro", "en-US": "Failed to add team member" },
  editComingSoon: {
    "pt-BR": (name: string) => `Editar ${name} - em breve`,
    "en-US": (name: string) => `Edit functionality for ${name} - coming soon`,
  },
  inviteSent: {
    "pt-BR": (email: string) => `Convite reenviado para ${email}`,
    "en-US": (email: string) => `Invitation reminder sent to ${email}`,
  },
  memberRemoved: {
    "pt-BR": (name: string) => `${name} foi removido da equipe`,
    "en-US": (name: string) => `${name} has been removed from the team`,
  },
  failedToRemove: { "pt-BR": "Falha ao remover membro", "en-US": "Failed to remove team member" },
} as const;

type TranslationKey = keyof typeof TRANSLATIONS;

// ============================================================================
// Hook: useTeamTranslations
// ============================================================================

function useTeamTranslations() {
  // Force English for this component
  const lang = "en-US";

  const t = (key: TranslationKey): string => {
    const translation = TRANSLATIONS[key];
    if (typeof translation === "object" && lang in translation) {
      const value = translation[lang as keyof typeof translation];
      return typeof value === "string" ? value : "";
    }
    return key;
  };

  const getMessage = (key: "memberAddedSuccess" | "editComingSoon" | "inviteSent" | "memberRemoved" | "confirmRemove", param: string): string => {
    const translation = TRANSLATIONS[key];
    const fn = translation[lang];
    return fn(param);
  };

  return { t, getMessage };
}

// ============================================================================
// Icons
// ============================================================================

const EditIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const DotsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-5 h-5 text-blue-500 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

const WarningIcon = () => (
  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

// ============================================================================
// Sub-components
// ============================================================================

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("");
}

function getRoleBadgeClass(role: TeamMember["role"]): string {
  switch (role) {
    case "Admin":
      return "bg-primary-100 text-primary-700";
    case "Teacher":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getStatusBadgeClass(status: TeamMember["status"]): string {
  return status === "Active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700";
}

interface MemberActionMenuProps {
  member: TeamMember;
  onEdit: () => void;
  onResendInvite: () => void;
  onRemove: () => void;
  t: (key: TranslationKey) => string;
}

function MemberActionMenu({ member, onEdit, onResendInvite, onRemove, t }: MemberActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <DotsIcon />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            <button
              onClick={() => {
                onEdit();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <EditIcon />
              {t("editMember")}
            </button>
            {member.status === "Pending" && (
              <button
                onClick={() => {
                  onResendInvite();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <MailIcon />
                {t("resendInvite")}
              </button>
            )}
            <button
              onClick={() => {
                onRemove();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <TrashIcon />
              {t("removeMember")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

interface MemberCardProps {
  member: TeamMember;
  onEdit: () => void;
  onResendInvite: () => void;
  onRemove: () => void;
  t: (key: TranslationKey) => string;
}

function MemberCard({ member, onEdit, onResendInvite, onRemove, t }: MemberCardProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
        <span className="text-sm font-semibold text-primary-700">{getInitials(member.name)}</span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{member.name}</p>
        <p className="text-sm text-gray-500">{member.email}</p>
      </div>
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeClass(member.role)}`}>
        {member.role}
      </span>
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(member.status)}`}>
        {member.status}
      </span>
      <MemberActionMenu
        member={member}
        onEdit={onEdit}
        onResendInvite={onResendInvite}
        onRemove={onRemove}
        t={t}
      />
    </div>
  );
}

type GetMessageFn = (key: "memberAddedSuccess" | "editComingSoon" | "inviteSent" | "memberRemoved" | "confirmRemove", param: string) => string;

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  t: (key: TranslationKey) => string;
  getMessage: GetMessageFn;
}

function InviteMemberModal({ isOpen, onClose, onSuccess, t, getMessage }: InviteMemberModalProps) {
  const [formData, setFormData] = useState<InviteFormData>(INITIAL_FORM_DATA);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      showToast(t("fillNameEmail"), "error");
      return;
    }

    // Validate email format
    if (!formData.email.includes("@") || !formData.email.includes(".")) {
      showToast(t("invalidEmail"), "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role.toLowerCase(),
        }),
      });
      if (res.ok) {
        showToast(getMessage("memberAddedSuccess", formData.name));
        setFormData(INITIAL_FORM_DATA);
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        showToast(data.error || t("failedToAdd"), "error");
      }
    } catch (error) {
      console.error("Add member error:", error);
      showToast(t("failedToAdd"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFormData(INITIAL_FORM_DATA);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalHeader onClose={handleClose}>
        <ModalTitle>{t("inviteMember")}</ModalTitle>
      </ModalHeader>
      <ModalBody className="space-y-4">
        <FormField
          label={`${t("fullName")} *`}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={t("enterFullName")}
        />

        <FormField
          label={`${t("email")} *`}
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="email@example.com"
        />

        <FormField
          as="select"
          label={`${t("role")} *`}
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value as TeamMember["role"] })}
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </FormField>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex gap-3">
            <InfoIcon />
            <div>
              <p className="text-sm font-medium text-blue-900">{t("invitationEmailTitle")}</p>
              <p className="text-sm text-blue-700 mt-1">{t("invitationEmailDesc")}</p>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={handleClose} disabled={saving}>
          {t("cancel")}
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? t("adding") : t("addMember")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

interface RemoveMemberModalProps {
  member: TeamMember | null;
  onClose: () => void;
  onConfirm: () => void;
  isRemoving: boolean;
  t: (key: TranslationKey) => string;
  getMessage: GetMessageFn;
}

function RemoveMemberModal({ member, onClose, onConfirm, isRemoving, t, getMessage }: RemoveMemberModalProps) {
  if (!member) return null;

  const confirmText = getMessage("confirmRemove", member.name);

  return (
    <Modal isOpen={!!member} onClose={onClose} size="sm">
      <ModalBody className="pt-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <WarningIcon />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{t("removeTeamMember")}</h3>
            <p className="text-sm text-gray-500">{t("cannotBeUndone")}</p>
          </div>
        </div>
        <p className="text-gray-600 mb-6">{confirmText}</p>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={isRemoving}>
          {t("cancel")}
        </Button>
        <button
          onClick={onConfirm}
          disabled={isRemoving}
          className="px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isRemoving && <SpinnerIcon />}
          {t("removeMember")}
        </button>
      </ModalFooter>
    </Modal>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function TeamSettings() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const { t, getMessage } = useTeamTranslations();

  // Load team members from API
  const loadTeamMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/staff");
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(
          data.staff?.map(
            (s: {
              _id: { toString: () => string };
              name: string;
              email: string;
              role: string;
              status: string;
            }) => ({
              id: s._id?.toString() || "",
              name: s.name,
              email: s.email,
              role: (s.role.charAt(0).toUpperCase() + s.role.slice(1)) as TeamMember["role"],
              status: s.status === "active" ? "Active" : "Pending",
            })
          ) || []
        );
      }
    } catch (error) {
      console.error("Failed to load team members:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeamMembers();
  }, [loadTeamMembers]);

  const handleEditMember = (member: TeamMember) => {
    showToast(getMessage("editComingSoon", member.name));
  };

  const handleResendInvite = (member: TeamMember) => {
    showToast(getMessage("inviteSent", member.email));
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;

    setIsRemoving(true);
    try {
      const res = await fetch(`/api/staff/${memberToRemove.id}`, { method: "DELETE" });
      if (res.ok) {
        setTeamMembers((prev) => prev.filter((m) => m.id !== memberToRemove.id));
        showToast(getMessage("memberRemoved", memberToRemove.name));
        setMemberToRemove(null);
      } else {
        showToast(t("failedToRemove"), "error");
      }
    } catch (error) {
      console.error("Remove member error:", error);
      showToast(t("failedToRemove"), "error");
    } finally {
      setIsRemoving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-gray-600 mt-1">{t("description")}</p>
        </div>
        <Button onClick={() => setShowInviteModal(true)}>{t("inviteMember")}</Button>
      </div>

      {/* Team Members List */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="space-y-4">
          {teamMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onEdit={() => handleEditMember(member)}
              onResendInvite={() => handleResendInvite(member)}
              onRemove={() => setMemberToRemove(member)}
              t={t}
            />
          ))}
        </div>
      </div>

      {/* Modals */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={loadTeamMembers}
        t={t}
        getMessage={getMessage}
      />

      <RemoveMemberModal
        member={memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={confirmRemoveMember}
        isRemoving={isRemoving}
        t={t}
        getMessage={getMessage}
      />
    </div>
  );
}
