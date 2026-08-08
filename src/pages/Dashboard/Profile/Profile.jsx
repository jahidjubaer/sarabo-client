import { useState } from 'react';
import axios from 'axios';
import { Pencil, User as UserIcon } from 'lucide-react';
import useAuth from '../../../hooks/useAuth';
import useRole from '../../../hooks/useRole';
import { notify } from '../../../lib/notify';
import { Avatar, AvatarImage, AvatarFallback } from '../../../components/ui/avatar';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { FormField } from '../../../components/common/FormField';
import { LoadingButton } from '../../../components/common/LoadingButton';
import RoleContextCard from './RoleContextCard';
import AccountSecurityCard from './AccountSecurityCard';

// Formal role wording for this page (deliberately fuller than the navbar's
// compact mapping).
const PROFILE_ROLE_LABELS = { user: 'Customer', rider: 'Technician', admin: 'Administrator' };

function getInitials(name) {
    if (!name) return '';
    return name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]?.toUpperCase()).join('');
}

// My Profile (Phase 7.10: redesigned to ds-*/Lucide, Toastify, ds primitives).
// Editing behavior is preserved exactly - the same updateUserProfile call and
// the same imgbb photo upload; only display name + photo are editable (no
// invented fields). Only whitelisted, already-available presentation values
// are rendered (name, email, role label, auth method) - never uid, provider
// tokens, or raw backend objects.
const Profile = () => {
    const { user, updateUserProfile } = useAuth();
    const { role, roleLoading, isError } = useRole();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user?.displayName || '');
    const [photoFile, setPhotoFile] = useState(null);
    const [nameError, setNameError] = useState('');
    const [saving, setSaving] = useState(false);

    const roleKnown = !roleLoading && !isError;
    const roleDisplayText = roleKnown
        ? (PROFILE_ROLE_LABELS[role] || 'Role unavailable')
        : (roleLoading ? 'Loading role…' : 'Unable to load role');

    // Real, already-available Firebase provider data - not invented.
    const providerId = user?.providerData?.[0]?.providerId;
    const authMethodLabel = providerId === 'google.com' ? 'Google' : providerId === 'password' ? 'Email and password' : 'Not available';

    const startEditing = () => {
        setName(user?.displayName || '');
        setNameError('');
        setIsEditing(true);
    };

    const handleCancel = () => {
        setName(user?.displayName || '');
        setPhotoFile(null);
        setNameError('');
        setIsEditing(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (saving) return;

        const trimmedName = name.trim();
        if (!trimmedName) {
            setNameError('Display name is required.');
            return;
        }
        setNameError('');

        // Nothing changed - avoid an unnecessary Firebase write.
        if (trimmedName === (user?.displayName || '') && !photoFile) {
            setIsEditing(false);
            return;
        }

        setSaving(true);
        try {
            let photoURL = user?.photoURL;
            if (photoFile) {
                const formData = new FormData();
                formData.append('image', photoFile);
                const image_API_URL = `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_image_host_key}`;
                const res = await axios.post(image_API_URL, formData);
                photoURL = res.data.data.url;
            }

            await updateUserProfile({ displayName: trimmedName, photoURL });

            setName(trimmedName);
            setPhotoFile(null);
            notify.success('Profile updated successfully');
            setIsEditing(false);
        } catch {
            // Edit mode stays open on failure so nothing typed is lost.
            notify.error('Could not update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-ds-foreground sm:text-3xl">My Profile</h1>
            <p className="mt-2 max-w-2xl text-sm text-ds-muted-foreground">
                Review your account identity and update the basic profile information supported by Sarabo.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <div className="rounded-ds-lg border border-ds-border bg-ds-card p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <Avatar className="size-20 text-xl">
                                {user?.photoURL ? <AvatarImage src={user.photoURL} alt="" /> : null}
                                <AvatarFallback>{getInitials(user?.displayName) || <UserIcon className="size-7" aria-hidden="true" />}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-xl font-semibold text-ds-foreground">{user?.displayName || 'Unnamed account'}</h2>
                                    {roleKnown && <Badge tone="accent">{roleDisplayText}</Badge>}
                                </div>
                                <p className="truncate text-sm text-ds-muted-foreground" title={user?.email}>{user?.email}</p>
                            </div>
                        </div>

                        <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-ds-border pt-6 sm:grid-cols-2">
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-wide text-ds-muted-foreground">Email address</dt>
                                <dd className="mt-1 truncate text-sm text-ds-foreground" title={user?.email}>{user?.email}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-wide text-ds-muted-foreground">Role</dt>
                                <dd className="mt-1 text-sm text-ds-foreground">{roleDisplayText}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-wide text-ds-muted-foreground">Authentication account</dt>
                                <dd className="mt-1 text-sm text-ds-foreground">{authMethodLabel}</dd>
                            </div>
                        </dl>

                        {!isEditing ? (
                            <Button onClick={startEditing} className="mt-6"><Pencil aria-hidden="true" /> Edit profile</Button>
                        ) : (
                            <form onSubmit={handleSave} className="mt-6 space-y-4 border-t border-ds-border pt-6" noValidate>
                                <FormField id="profile-name" label="Name" required error={nameError}>
                                    <Input
                                        id="profile-name"
                                        value={name}
                                        onChange={(e) => { setName(e.target.value); if (nameError) setNameError(''); }}
                                        placeholder="Your name"
                                        autoFocus
                                        disabled={saving}
                                        aria-invalid={!!nameError}
                                    />
                                </FormField>
                                <div className="space-y-1.5">
                                    <Label htmlFor="profile-photo">Photo</Label>
                                    <input
                                        id="profile-photo"
                                        type="file"
                                        accept="image/*"
                                        disabled={saving}
                                        onChange={(e) => setPhotoFile(e.target.files[0])}
                                        className="focus-ring block w-full text-sm text-ds-muted-foreground file:mr-3 file:rounded-ds file:border-0 file:bg-ds-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ds-primary-foreground hover:file:bg-ds-primary/90 disabled:opacity-50"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <LoadingButton type="submit" loading={saving} loadingText="Saving…">Save</LoadingButton>
                                    <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>Cancel</Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-6 lg:col-span-1">
                    <RoleContextCard role={role} roleLoading={roleLoading} isError={isError} />
                    <AccountSecurityCard />
                </div>
            </div>
        </div>
    );
};

export default Profile;
