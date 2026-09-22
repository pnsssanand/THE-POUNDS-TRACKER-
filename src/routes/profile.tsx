import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getUserProfile, updateUserProfile, getSettings, updateSettings } from "../services/userService";
import { uploadProfileImage } from "../services/cloudinaryService";
import type { UserProfile, UserSettings } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { User as UserIcon, Upload, Loader2, Save } from "lucide-react";
import { toast } from "sonner"; // Using sonner if it exists, otherwise just console

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user: authUser } = useAuth();
  const uid = authUser?.uid;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [monthlyHoursTarget, setMonthlyHoursTarget] = useState("");
  const [monthlyEarningsTarget, setMonthlyEarningsTarget] = useState("");
  const [preferredPaymentMode, setPreferredPaymentMode] = useState<"cash" | "card">("cash");
  const [preferredBank, setPreferredBank] = useState("");

  useEffect(() => {
    if (!uid) return;
    
    Promise.all([
      getUserProfile(uid),
      getSettings(uid)
    ]).then(([p, s]) => {
      setProfile(p);
      setSettings(s);
      
      if (p) {
        setDisplayName(p.displayName || "");
        setPhoneNumber(p.phoneNumber || "");
      }
      if (s) {
        setMonthlyHoursTarget(s.monthlyHoursTarget?.toString() || "0");
        setMonthlyEarningsTarget(s.monthlyEarningsTarget?.toString() || "0");
        setPreferredPaymentMode(s.preferredPaymentMode || "cash");
        setPreferredBank(s.preferredBank || "");
      }
      setLoading(false);
    }).catch(console.error);
  }, [uid]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uid) return;

    setIsUploading(true);
    try {
      const result = await uploadProfileImage(file);
      await updateUserProfile(uid, {
        photoURL: result.secureUrl,
        photoPublicId: result.publicId
      });
      setProfile(prev => prev ? { ...prev, photoURL: result.secureUrl, photoPublicId: result.publicId } : null);
      if (window.toast) toast.success("Profile picture updated!");
      else alert("Profile picture updated!");
    } catch (err: any) {
      console.error(err);
      if (window.toast) toast.error(err.message || "Failed to upload image");
      else alert(err.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    
    setIsSaving(true);
    try {
      await Promise.all([
        updateUserProfile(uid, {
          displayName,
          phoneNumber
        }),
        updateSettings(uid, {
          monthlyHoursTarget: parseFloat(monthlyHoursTarget) || 0,
          monthlyEarningsTarget: parseFloat(monthlyEarningsTarget) || 0,
          preferredPaymentMode,
          preferredBank: preferredPaymentMode === "card" ? preferredBank : ""
        })
      ]);
      setProfile(prev => prev ? { ...prev, displayName, phoneNumber } : null);
      if (window.toast) toast.success("Profile saved successfully");
      else alert("Profile saved successfully");
    } catch (err) {
      console.error(err);
      if (window.toast) toast.error("Failed to save profile");
      else alert("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !profile || !settings) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
        <p className="text-zinc-500 mt-1">Manage your account and monthly targets.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-sm">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-zinc-900 shadow-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  {profile.photoURL ? (
                    <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-12 h-12 text-zinc-400" />
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-full shadow-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                />
              </div>
              <div>
                <h3 className="font-bold text-xl">{profile.displayName || profile.username}</h3>
                <p className="text-zinc-500 text-sm">{profile.email}</p>
                <span className="inline-block mt-2 text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-full uppercase tracking-wider font-semibold">
                  {profile.role}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input value={profile.username} disabled className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={profile.email} disabled className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+44 7700 900077" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-l-4 border-l-emerald-500">
              <CardHeader>
                <CardTitle>Monthly Goals</CardTitle>
                <CardDescription>Set targets to track on your dashboard.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hours Target</Label>
                    <Input type="number" min="0" value={monthlyHoursTarget} onChange={e => setMonthlyHoursTarget(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Earnings Target (£)</Label>
                    <Input type="number" min="0" step="0.01" value={monthlyEarningsTarget} onChange={e => setMonthlyEarningsTarget(e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Default settings for data entry.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Preferred Payment Method</Label>
                    <Select value={preferredPaymentMode} onValueChange={(v: any) => setPreferredPaymentMode(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {preferredPaymentMode === "card" && (
                    <div className="space-y-2">
                      <Label>Preferred Bank</Label>
                      <Input value={preferredBank} onChange={e => setPreferredBank(e.target.value)} placeholder="e.g. Barclays" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
