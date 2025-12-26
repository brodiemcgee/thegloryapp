// Profile details editor - edit stats, details, looking for, kinks, socials

'use client';

import { useState } from 'react';
import {
  User,
  Position,
  BodyType,
  HostTravel,
  SmokingStatus,
  DrugStatus,
  SaferSex,
  HivStatus,
  LookingFor,
} from '@/types';
import { ChevronLeftIcon } from './icons';

interface ProfileDetailsEditorProps {
  user: Partial<User>;
  onSave: (updates: Partial<User>) => void;
  onBack: () => void;
}

// Common kinks list
const KINKS_LIST = [
  'Bondage', 'Leather', 'Rubber', 'Feet', 'Underwear', 'Jocks',
  'Fisting', 'Watersports', 'Role Play', 'Daddy/Son', 'Group',
  'Oral', 'Rimming', 'Toys', 'Spanking', 'Edging', 'CBT',
  'Muscle Worship', 'Bears', 'Twinks', 'Hairy', 'Smooth',
];

type EditorSection = 'main' | 'stats' | 'details' | 'looking_for' | 'kinks' | 'socials';

export default function ProfileDetailsEditor({ user, onSave, onBack }: ProfileDetailsEditorProps) {
  const [section, setSection] = useState<EditorSection>('main');
  const [formData, setFormData] = useState({
    // Stats
    height_cm: user.height_cm || undefined,
    weight_kg: user.weight_kg || undefined,
    body_type: user.body_type || undefined,
    ethnicity: user.ethnicity || '',

    // Details
    position: user.position || undefined,
    host_travel: user.host_travel || undefined,
    smoker: user.smoker || undefined,
    drugs: user.drugs || undefined,
    safer_sex: user.safer_sex || undefined,
    hiv_status: user.hiv_status || undefined,

    // Looking for
    looking_for: user.looking_for || {},

    // Kinks
    kinks: user.kinks || [],

    // Socials
    instagram_handle: user.instagram_handle || '',
    twitter_handle: user.twitter_handle || '',
  });

  const handleSave = () => {
    const updates: Partial<User> = {
      height_cm: formData.height_cm,
      weight_kg: formData.weight_kg,
      body_type: formData.body_type,
      ethnicity: formData.ethnicity || undefined,
      position: formData.position,
      host_travel: formData.host_travel,
      smoker: formData.smoker,
      drugs: formData.drugs,
      safer_sex: formData.safer_sex,
      hiv_status: formData.hiv_status,
      looking_for: Object.keys(formData.looking_for).length > 0 ? formData.looking_for : undefined,
      kinks: formData.kinks.length > 0 ? formData.kinks : undefined,
      instagram_handle: formData.instagram_handle || undefined,
      twitter_handle: formData.twitter_handle || undefined,
    };
    onSave(updates);
    onBack();
  };

  const toggleKink = (kink: string) => {
    setFormData((prev) => ({
      ...prev,
      kinks: prev.kinks.includes(kink)
        ? prev.kinks.filter((k) => k !== kink)
        : [...prev.kinks, kink],
    }));
  };

  const toggleLookingForPosition = (pos: Position) => {
    const current = formData.looking_for.position || [];
    setFormData((prev) => ({
      ...prev,
      looking_for: {
        ...prev.looking_for,
        position: current.includes(pos)
          ? current.filter((p) => p !== pos)
          : [...current, pos],
      },
    }));
  };

  const toggleLookingForBodyType = (bt: BodyType) => {
    const current = formData.looking_for.body_type || [];
    setFormData((prev) => ({
      ...prev,
      looking_for: {
        ...prev.looking_for,
        body_type: current.includes(bt)
          ? current.filter((b) => b !== bt)
          : [...current, bt],
      },
    }));
  };

  const toggleLookingForHostTravel = (ht: HostTravel) => {
    const current = formData.looking_for.host_travel || [];
    setFormData((prev) => ({
      ...prev,
      looking_for: {
        ...prev.looking_for,
        host_travel: current.includes(ht)
          ? current.filter((h) => h !== ht)
          : [...current, ht],
      },
    }));
  };

  // Render main menu
  if (section === 'main') {
    return (
      <div className="h-full flex flex-col bg-hole-bg">
        <div className="flex items-center gap-3 p-4 border-b border-hole-border">
          <button onClick={onBack} className="p-2 hover:bg-hole-surface rounded-lg">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Edit Profile</h1>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-2">
          <MenuButton
            label="Stats"
            description="Height, weight, body type"
            onClick={() => setSection('stats')}
          />
          <MenuButton
            label="Details"
            description="Position, hosting, lifestyle"
            onClick={() => setSection('details')}
          />
          <MenuButton
            label="Looking For"
            description="What you're into"
            onClick={() => setSection('looking_for')}
          />
          <MenuButton
            label="Kinks"
            description={formData.kinks.length > 0 ? `${formData.kinks.length} selected` : 'Add your kinks'}
            onClick={() => setSection('kinks')}
          />
          <MenuButton
            label="Social Links"
            description="Instagram, X"
            onClick={() => setSection('socials')}
          />
        </div>

        <div className="p-4 border-t border-hole-border">
          <button
            onClick={handleSave}
            className="w-full py-3 bg-hole-accent text-white rounded-lg font-medium"
          >
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  // Render stats editor
  if (section === 'stats') {
    return (
      <div className="h-full flex flex-col bg-hole-bg">
        <div className="flex items-center gap-3 p-4 border-b border-hole-border">
          <button onClick={() => setSection('main')} className="p-2 hover:bg-hole-surface rounded-lg">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Stats</h1>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-6">
          {/* Height */}
          <div>
            <label className="text-sm text-hole-muted mb-2 block">Height (cm)</label>
            <input
              type="number"
              value={formData.height_cm || ''}
              onChange={(e) => setFormData({ ...formData, height_cm: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="175"
              className="w-full bg-hole-surface border border-hole-border rounded-lg p-3 outline-none focus:border-hole-accent"
              min={100}
              max={250}
            />
          </div>

          {/* Weight */}
          <div>
            <label className="text-sm text-hole-muted mb-2 block">Weight (kg)</label>
            <input
              type="number"
              value={formData.weight_kg || ''}
              onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="75"
              className="w-full bg-hole-surface border border-hole-border rounded-lg p-3 outline-none focus:border-hole-accent"
              min={30}
              max={300}
            />
          </div>

          {/* Body Type */}
          <div>
            <label className="text-sm text-hole-muted mb-2 block">Body Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['slim', 'average', 'athletic', 'muscular', 'stocky', 'heavy'] as BodyType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setFormData({ ...formData, body_type: formData.body_type === type ? undefined : type })}
                  className={`py-2 px-3 rounded-lg text-sm capitalize ${
                    formData.body_type === type
                      ? 'bg-hole-accent text-white'
                      : 'bg-hole-surface text-gray-300 hover:bg-hole-border'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Ethnicity */}
          <div>
            <label className="text-sm text-hole-muted mb-2 block">Ethnicity</label>
            <input
              type="text"
              value={formData.ethnicity}
              onChange={(e) => setFormData({ ...formData, ethnicity: e.target.value })}
              placeholder="Optional"
              className="w-full bg-hole-surface border border-hole-border rounded-lg p-3 outline-none focus:border-hole-accent"
            />
          </div>
        </div>
      </div>
    );
  }

  // Render details editor
  if (section === 'details') {
    return (
      <div className="h-full flex flex-col bg-hole-bg">
        <div className="flex items-center gap-3 p-4 border-b border-hole-border">
          <button onClick={() => setSection('main')} className="p-2 hover:bg-hole-surface rounded-lg">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Details</h1>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-6">
          {/* Position */}
          <div>
            <label className="text-sm text-hole-muted mb-2 block">Position</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'top', label: 'Top' },
                { value: 'bottom', label: 'Bottom' },
                { value: 'vers', label: 'Vers' },
                { value: 'vers_top', label: 'Vers Top' },
                { value: 'vers_bottom', label: 'Vers Btm' },
                { value: 'side', label: 'Side' },
              ] as { value: Position; label: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFormData({ ...formData, position: formData.position === opt.value ? undefined : opt.value })}
                  className={`py-2 px-3 rounded-lg text-sm ${
                    formData.position === opt.value
                      ? 'bg-hole-accent text-white'
                      : 'bg-hole-surface text-gray-300 hover:bg-hole-border'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Host/Travel */}
          <div>
            <label className="text-sm text-hole-muted mb-2 block">Host/Travel</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'host', label: 'Can Host' },
                { value: 'travel', label: 'Can Travel' },
                { value: 'both', label: 'Both' },
                { value: 'neither', label: 'Neither' },
              ] as { value: HostTravel; label: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFormData({ ...formData, host_travel: formData.host_travel === opt.value ? undefined : opt.value })}
                  className={`py-2 px-3 rounded-lg text-sm ${
                    formData.host_travel === opt.value
                      ? 'bg-hole-accent text-white'
                      : 'bg-hole-surface text-gray-300 hover:bg-hole-border'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Safer Sex */}
          <div>
            <label className="text-sm text-hole-muted mb-2 block">Safer Sex</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'always', label: 'Always' },
                { value: 'sometimes', label: 'Sometimes' },
                { value: 'never', label: 'Never' },
              ] as { value: SaferSex; label: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFormData({ ...formData, safer_sex: formData.safer_sex === opt.value ? undefined : opt.value })}
                  className={`py-2 px-3 rounded-lg text-sm ${
                    formData.safer_sex === opt.value
                      ? 'bg-hole-accent text-white'
                      : 'bg-hole-surface text-gray-300 hover:bg-hole-border'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* HIV Status */}
          <div>
            <label className="text-sm text-hole-muted mb-2 block">HIV Status</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'negative', label: 'Negative' },
                { value: 'positive', label: 'Positive' },
                { value: 'undetectable', label: 'U=U' },
                { value: 'on_prep', label: 'On PrEP' },
                { value: 'unknown', label: 'Unknown' },
              ] as { value: HivStatus; label: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFormData({ ...formData, hiv_status: formData.hiv_status === opt.value ? undefined : opt.value })}
                  className={`py-2 px-3 rounded-lg text-sm ${
                    formData.hiv_status === opt.value
                      ? 'bg-hole-accent text-white'
                      : 'bg-hole-surface text-gray-300 hover:bg-hole-border'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Smoking */}
          <div>
            <label className="text-sm text-hole-muted mb-2 block">Smoking</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'never', label: 'Never' },
                { value: 'sometimes', label: 'Sometimes' },
                { value: 'often', label: 'Often' },
              ] as { value: SmokingStatus; label: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFormData({ ...formData, smoker: formData.smoker === opt.value ? undefined : opt.value })}
                  className={`py-2 px-3 rounded-lg text-sm ${
                    formData.smoker === opt.value
                      ? 'bg-hole-accent text-white'
                      : 'bg-hole-surface text-gray-300 hover:bg-hole-border'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Drugs */}
          <div>
            <label className="text-sm text-hole-muted mb-2 block">Party</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'never', label: 'Never' },
                { value: 'sometimes', label: 'Sometimes' },
                { value: 'party', label: 'Party' },
              ] as { value: DrugStatus; label: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFormData({ ...formData, drugs: formData.drugs === opt.value ? undefined : opt.value })}
                  className={`py-2 px-3 rounded-lg text-sm ${
                    formData.drugs === opt.value
                      ? 'bg-hole-accent text-white'
                      : 'bg-hole-surface text-gray-300 hover:bg-hole-border'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render looking for editor
  if (section === 'looking_for') {
    return (
      <div className="h-full flex flex-col bg-hole-bg">
        <div className="flex items-center gap-3 p-4 border-b border-hole-border">
          <button onClick={() => setSection('main')} className="p-2 hover:bg-hole-surface rounded-lg">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Looking For</h1>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-6">
          {/* Position preference */}
          <div>
            <label className="text-sm text-hole-muted mb-2 block">Position (select all that apply)</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'top', label: 'Top' },
                { value: 'bottom', label: 'Bottom' },
                { value: 'vers', label: 'Vers' },
                { value: 'vers_top', label: 'Vers Top' },
                { value: 'vers_bottom', label: 'Vers Btm' },
                { value: 'side', label: 'Side' },
              ] as { value: Position; label: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleLookingForPosition(opt.value)}
                  className={`py-2 px-3 rounded-lg text-sm ${
                    formData.looking_for.position?.includes(opt.value)
                      ? 'bg-purple-500 text-white'
                      : 'bg-hole-surface text-gray-300 hover:bg-hole-border'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Body type preference */}
          <div>
            <label className="text-sm text-hole-muted mb-2 block">Body Type (select all that apply)</label>
            <div className="grid grid-cols-3 gap-2">
              {(['slim', 'average', 'athletic', 'muscular', 'stocky', 'heavy'] as BodyType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => toggleLookingForBodyType(type)}
                  className={`py-2 px-3 rounded-lg text-sm capitalize ${
                    formData.looking_for.body_type?.includes(type)
                      ? 'bg-purple-500 text-white'
                      : 'bg-hole-surface text-gray-300 hover:bg-hole-border'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Host/Travel preference */}
          <div>
            <label className="text-sm text-hole-muted mb-2 block">Host/Travel (select all that apply)</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'host', label: 'Can Host' },
                { value: 'travel', label: 'Can Travel' },
                { value: 'both', label: 'Both' },
              ] as { value: HostTravel; label: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleLookingForHostTravel(opt.value)}
                  className={`py-2 px-3 rounded-lg text-sm ${
                    formData.looking_for.host_travel?.includes(opt.value)
                      ? 'bg-purple-500 text-white'
                      : 'bg-hole-surface text-gray-300 hover:bg-hole-border'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Age range */}
          <div>
            <label className="text-sm text-hole-muted mb-2 block">Age Range</label>
            <div className="flex gap-3 items-center">
              <input
                type="number"
                value={formData.looking_for.age_min || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  looking_for: { ...formData.looking_for, age_min: e.target.value ? parseInt(e.target.value) : undefined }
                })}
                placeholder="18"
                className="flex-1 bg-hole-surface border border-hole-border rounded-lg p-3 outline-none focus:border-hole-accent"
                min={18}
                max={99}
              />
              <span className="text-hole-muted">to</span>
              <input
                type="number"
                value={formData.looking_for.age_max || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  looking_for: { ...formData.looking_for, age_max: e.target.value ? parseInt(e.target.value) : undefined }
                })}
                placeholder="99"
                className="flex-1 bg-hole-surface border border-hole-border rounded-lg p-3 outline-none focus:border-hole-accent"
                min={18}
                max={99}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render kinks editor
  if (section === 'kinks') {
    return (
      <div className="h-full flex flex-col bg-hole-bg">
        <div className="flex items-center gap-3 p-4 border-b border-hole-border">
          <button onClick={() => setSection('main')} className="p-2 hover:bg-hole-surface rounded-lg">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Kinks</h1>
          {formData.kinks.length > 0 && (
            <span className="text-sm text-hole-muted ml-auto">{formData.kinks.length} selected</span>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="flex flex-wrap gap-2">
            {KINKS_LIST.map((kink) => (
              <button
                key={kink}
                onClick={() => toggleKink(kink)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  formData.kinks.includes(kink)
                    ? 'bg-pink-500 text-white'
                    : 'bg-hole-surface text-gray-300 hover:bg-hole-border'
                }`}
              >
                {kink}
              </button>
            ))}
          </div>

          {/* Custom kink input */}
          <div className="mt-6">
            <label className="text-sm text-hole-muted mb-2 block">Add custom kink</label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = (e.target as HTMLFormElement).elements.namedItem('customKink') as HTMLInputElement;
                const value = input.value.trim();
                if (value && !formData.kinks.includes(value)) {
                  setFormData({ ...formData, kinks: [...formData.kinks, value] });
                  input.value = '';
                }
              }}
              className="flex gap-2"
            >
              <input
                name="customKink"
                type="text"
                placeholder="Type a kink..."
                className="flex-1 bg-hole-surface border border-hole-border rounded-lg p-3 outline-none focus:border-hole-accent"
              />
              <button
                type="submit"
                className="px-4 bg-hole-accent text-white rounded-lg font-medium"
              >
                Add
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Render socials editor
  if (section === 'socials') {
    return (
      <div className="h-full flex flex-col bg-hole-bg">
        <div className="flex items-center gap-3 p-4 border-b border-hole-border">
          <button onClick={() => setSection('main')} className="p-2 hover:bg-hole-surface rounded-lg">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Social Links</h1>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-6">
          {/* Instagram */}
          <div>
            <label className="text-sm text-hole-muted mb-2 block">Instagram</label>
            <div className="flex items-center bg-hole-surface border border-hole-border rounded-lg overflow-hidden">
              <span className="px-3 text-hole-muted bg-hole-border">@</span>
              <input
                type="text"
                value={formData.instagram_handle}
                onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value.replace('@', '') })}
                placeholder="username"
                className="flex-1 bg-transparent p-3 outline-none"
              />
            </div>
          </div>

          {/* X/Twitter */}
          <div>
            <label className="text-sm text-hole-muted mb-2 block">X (Twitter)</label>
            <div className="flex items-center bg-hole-surface border border-hole-border rounded-lg overflow-hidden">
              <span className="px-3 text-hole-muted bg-hole-border">@</span>
              <input
                type="text"
                value={formData.twitter_handle}
                onChange={(e) => setFormData({ ...formData, twitter_handle: e.target.value.replace('@', '') })}
                placeholder="username"
                className="flex-1 bg-transparent p-3 outline-none"
              />
            </div>
          </div>

          <p className="text-sm text-hole-muted">
            Your social handles will be visible on your profile. Users can tap to open your profiles in the app.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

// Menu button component
function MenuButton({ label, description, onClick }: { label: string; description: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-hole-surface border border-hole-border rounded-lg hover:bg-hole-border transition-colors"
    >
      <div className="text-left">
        <div className="font-medium">{label}</div>
        <div className="text-sm text-hole-muted">{description}</div>
      </div>
      <svg className="w-5 h-5 text-hole-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
