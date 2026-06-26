import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformsApi, authApi } from '../api/client';
import { useAuthStore } from '../store/useStore';
import toast from 'react-hot-toast';
import {
  Facebook, Youtube, Instagram, Music2, Ghost, CheckCircle2,
  XCircle, RefreshCw, Link, Unlink, Save, User, Lock, Shield,
  Smartphone, Eye, EyeOff, Trash2, Download,
} from 'lucide-react';

const PLATFORMS = [
  { id: 'FACEBOOK', label: 'Facebook', icon: Facebook, color: '#1877f2', description: 'Pages, publications, statistiques' },
  { id: 'YOUTUBE', label: 'YouTube', icon: Youtube, color: '#ff0000', description: 'Chaîne, vidéos, analytics' },
  { id: 'INSTAGRAM', label: 'Instagram', icon: Instagram, color: '#e1306c', description: 'Posts, stories, reels' },
  { id: 'TIKTOK', label: 'TikTok', icon: Music2, color: '#010101', description: 'Vidéos, likes, abonnés' },
  { id: 'SNAPCHAT', label: 'Snapchat', icon: Ghost, color: '#efb400', description: 'Snapchat Marketing API' },
];

export default function Settings() {
  const { user, updateUser } = useAuthStore();
  const qc = useQueryClient();
  const [profile, setProfile] = useState({ fullName: user?.fullName || '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);
  const [mfaStep, setMfaStep] = useState('idle'); // idle | setup | verify
  const [mfaData, setMfaData] = useState(null);
  const [totpCode, setTotpCode] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  const { data: platforms } = useQuery({
    queryKey: ['platforms'],
    queryFn: () => platformsApi.getAll().then((r) => r.data),
  });

  const { mutate: disconnect } = useMutation({
    mutationFn: (platform) => platformsApi.disconnect(platform),
    onSuccess: (_, platform) => {
      toast.success(`${platform} déconnecté`);
      qc.invalidateQueries(['platforms']);
    },
    onError: (err) => toast.error(err.message),
  });

  const { mutate: sync } = useMutation({
    mutationFn: (platform) => platformsApi.sync(platform),
    onSuccess: () => {
      toast.success('Synchronisation réussie');
      qc.invalidateQueries(['platforms']);
      qc.invalidateQueries(['dashboard-overview']);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleOAuth = (platformId) => {
    toast('Redirection vers OAuth...');
    window.location.href = `/api/auth/${platformId.toLowerCase()}`;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await authApi.updateProfile({ fullName: profile.fullName });
      updateUser(res.data);
      toast.success('Profil mis à jour');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return toast.error('Les mots de passe ne correspondent pas');
    }
    if (pwForm.newPassword.length < 8) {
      return toast.error('Minimum 8 caractères');
    }
    setSavingPw(true);
    try {
      await authApi.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Mot de passe mis à jour');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setSavingPw(false);
    }
  };

  const handleSetupMFA = async () => {
    try {
      const res = await authApi.setupMFA();
      setMfaData(res.data);
      setMfaStep('setup');
    } catch (err) {
      toast.error('Impossible d\'initier la configuration MFA');
    }
  };

  const handleVerifyMFA = async (e) => {
    e.preventDefault();
    try {
      await authApi.verifyMFA({ token: totpCode });
      updateUser({ ...user, mfaEnabled: true });
      setMfaStep('idle');
      setMfaData(null);
      setTotpCode('');
      toast.success('Authentification à deux facteurs activée');
    } catch (err) {
      toast.error('Code TOTP invalide');
    }
  };

  const handleDisableMFA = async () => {
    if (!window.confirm('Désactiver l\'authentification à deux facteurs ?')) return;
    try {
      await authApi.disableMFA();
      updateUser({ ...user, mfaEnabled: false });
      toast.success('MFA désactivé');
    } catch (err) {
      toast.error('Erreur');
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    try {
      await authApi.deleteAccount({ password: deleteConfirm });
      toast.success('Compte supprimé');
      useAuthStore.getState().logout();
      window.location.href = '/';
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const connectedMap = Object.fromEntries((platforms || []).map((p) => [p.platform, p]));

  const pwStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };
  const strength = pwStrength(pwForm.newPassword);
  const strengthLabel = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'][strength];
  const strengthColor = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-emerald-500'][strength];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Profile */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <User size={16} /> Profil
        </h3>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="label">Nom complet</label>
            <input
              type="text"
              className="input max-w-sm"
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input max-w-sm bg-slate-50 cursor-not-allowed" value={user?.email || ''} disabled />
          </div>
          <div className="flex items-center gap-3">
            <span className="badge bg-primary-50 text-primary-800">Plan {user?.plan}</span>
            <a href="/pricing" className="text-xs text-primary-800 hover:underline">Changer de plan</a>
          </div>
          <button type="submit" disabled={savingProfile} className="btn-primary gap-2">
            <Save size={14} />
            {savingProfile ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Lock size={16} /> Changer le mot de passe
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          {[
            { key: 'currentPassword', label: 'Mot de passe actuel', show: 'current' },
            { key: 'newPassword', label: 'Nouveau mot de passe', show: 'new' },
            { key: 'confirmPassword', label: 'Confirmer le nouveau mot de passe', show: 'confirm' },
          ].map(({ key, label, show }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <div className="relative max-w-sm">
                <input
                  type={showPw[show] ? 'text' : 'password'}
                  className="input pr-10"
                  value={pwForm[key]}
                  onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPw({ ...showPw, [show]: !showPw[show] })}
                >
                  {showPw[show] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {key === 'newPassword' && pwForm.newPassword && (
                <div className="mt-1.5 max-w-sm">
                  <div className="flex gap-1 mb-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? strengthColor : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">{strengthLabel}</p>
                </div>
              )}
            </div>
          ))}
          <button type="submit" disabled={savingPw} className="btn-primary gap-2">
            <Lock size={14} />
            {savingPw ? 'Mise à jour...' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>

      {/* MFA / TOTP */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-2 flex items-center gap-2">
          <Smartphone size={16} /> Authentification à deux facteurs (TOTP)
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Protégez votre compte avec Google Authenticator, Authy ou toute application TOTP compatible.
        </p>

        {user?.mfaEnabled ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-green-700 text-sm font-medium bg-green-50 px-3 py-2 rounded-lg">
              <CheckCircle2 size={16} /> MFA activé
            </div>
            <button onClick={handleDisableMFA} className="btn-secondary text-red-600 border-red-200 hover:bg-red-50">
              Désactiver
            </button>
          </div>
        ) : mfaStep === 'idle' ? (
          <button onClick={handleSetupMFA} className="btn-primary gap-2">
            <Shield size={14} /> Activer la 2FA
          </button>
        ) : mfaStep === 'setup' && mfaData ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              1. Scannez ce QR code avec votre application authenticator :
            </p>
            <div className="bg-white border border-slate-200 rounded-xl p-4 inline-block">
              {mfaData.qrCode ? (
                <img src={mfaData.qrCode} alt="QR Code MFA" className="w-40 h-40" />
              ) : (
                <p className="text-xs font-mono text-slate-600 break-all max-w-xs">{mfaData.secret}</p>
              )}
            </div>
            <p className="text-sm text-slate-600">2. Entrez le code à 6 chiffres :</p>
            <form onSubmit={handleVerifyMFA} className="flex gap-3 items-center">
              <input
                type="text"
                className="input max-w-[140px] text-center text-xl font-mono tracking-[0.4em]"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                autoFocus
              />
              <button type="submit" className="btn-primary">Vérifier</button>
              <button type="button" onClick={() => setMfaStep('idle')} className="btn-secondary">Annuler</button>
            </form>
          </div>
        ) : null}
      </div>

      {/* Platforms */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <Link size={16} /> Réseaux sociaux connectés
        </h3>
        <p className="text-sm text-slate-500 mb-5">
          Connectez vos comptes via OAuth 2.0. Vos tokens sont chiffrés en AES-256.
        </p>
        <div className="space-y-3">
          {PLATFORMS.map(({ id, label, icon: Icon, color, description }) => {
            const connected = connectedMap[id];
            return (
              <div key={id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: color + '18' }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{label}</p>
                    {connected?.isActive ? (
                      <span className="flex items-center gap-1 text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">
                        <CheckCircle2 size={9} /> Connecté
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                        <XCircle size={9} /> Non connecté
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {connected ? `@${connected.platformUsername || 'compte connecté'} · ${(connected.followerCount || 0).toLocaleString()} abonnés` : description}
                  </p>
                  {connected?.lastSyncAt && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Dernière sync: {new Date(connected.lastSyncAt).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {connected?.isActive && (
                    <button onClick={() => sync(id)} className="btn-secondary py-1.5 px-3 text-xs gap-1" title="Synchroniser">
                      <RefreshCw size={12} />
                    </button>
                  )}
                  {connected?.isActive ? (
                    <button onClick={() => disconnect(id)} className="btn-danger py-1.5 px-3 text-xs gap-1">
                      <Unlink size={12} /> Déconnecter
                    </button>
                  ) : (
                    <button onClick={() => handleOAuth(id)} className="btn-primary py-1.5 px-3 text-xs gap-1">
                      <Link size={12} /> Connecter
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security info */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Shield size={16} /> Sécurité & Confidentialité
        </h3>
        <div className="space-y-3 text-sm text-slate-600">
          {[
            'Tokens OAuth chiffrés AES-256-GCM avant stockage',
            'Sessions JWT signées — expiration 24h',
            'Mots de passe hachés bcrypt (cost factor 12)',
            'Transport TLS 1.3 — HTTPS obligatoire',
            'Conformité RGPD — droit à l\'effacement disponible',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-green-500 shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card p-6 border-red-200">
        <h3 className="text-base font-semibold text-red-700 mb-2 flex items-center gap-2">
          <Trash2 size={16} /> Zone de danger
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          La suppression du compte est irréversible. Toutes vos données, connexions et rapports seront définitivement effacés.
        </p>
        {!showDelete ? (
          <button onClick={() => setShowDelete(true)} className="btn-secondary border-red-200 text-red-600 hover:bg-red-50">
            <Trash2 size={14} /> Supprimer mon compte
          </button>
        ) : (
          <form onSubmit={handleDeleteAccount} className="space-y-3 max-w-sm">
            <p className="text-sm text-red-600 font-medium">Entrez votre mot de passe pour confirmer :</p>
            <input
              type="password"
              className="input border-red-200 focus:border-red-400"
              placeholder="Mot de passe"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
            />
            <div className="flex gap-3">
              <button type="submit" className="btn-danger">Supprimer définitivement</button>
              <button type="button" onClick={() => setShowDelete(false)} className="btn-secondary">Annuler</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
