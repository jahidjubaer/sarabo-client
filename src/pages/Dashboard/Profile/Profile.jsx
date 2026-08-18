import { useState } from 'react';
import { Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Pencil, User as UserIcon, ShieldCheck, ShieldAlert } from 'lucide-react';
import useAuth from '../../../hooks/useAuth';
import useRole from '../../../hooks/useRole';
import { roleKeys } from '../../../hooks/roleKeys';
import { notify } from '../../../lib/notify';
import { Avatar, AvatarImage, AvatarFallback } from '../../../components/ui/avatar';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { FormField } from '../../../components/common/FormField';
import { LoadingButton } from '../../../components/common/LoadingButton';
import { PageHeader } from '../../../components/common/PageHeader';
import { isUserEmailVerified, getVerificationPresentation } from '../../../utils/emailVerification';
import RoleContextCard from './RoleContextCard';
import AccountSecurityCard from './AccountSecurityCard';
import TechnicianProfileCard from './TechnicianProfileCard';

// Formal role wording for this page (deliberately fuller than the navbar's
// compact mapping).
const PROFILE_ROLE_LABELS = { user: 'Customer', rider: 'Technician', admin: 'Administrator' };

function getInitials(name) {
    if (!name) return '';
    return name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]?.toUpperCase()).join('');
}

// My Profile (Phase 7.10: ds-*/Lucide/Toastify; Phase 12: type scale, shared
// PageHeader/Card, and the marigold Save action).
// Editing behavior is preserved exactly - the same updateUserProfile call and
// the same imgbb photo upload; only display name + photo are editable (no
// invented fields, no new personal data collected). Only whitelisted,
// already-available presentation values are rendered (name, email, role label,
// auth method) - never uid, provider tokens, or raw backend objects. No
// completion percentage, membership age, badge or security score exists here,
// because the app has no authoritative source for any of them.
const Profile = () => {
    const { user, updateUserProfile } = useAuth();
    const { role, roleLoading, isError } = useRole();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user?.displayName || '');
    const [photoFile, setPhotoFile] = useState(null);
    const [nameError, setNameError] = useState('');
    const [saving, setSaving] = useState(false);

    const roleKnown = typeof role === 'string';
    const roleDisplayText = roleKnown
        ? (PROFILE_ROLE_LABELS[role] || 'Role unavailable')
        : (roleLoading ? 'Loading role…' : 'Unable to load role');

    const retryRole = () => queryClient.resetQueries({ queryKey: roleKeys.current() });

    // Real, already-available Firebase provider data - not invented.
    const providerId = user?.providerData?.[0]?.providerId;
    const authMethodLabel = providerId === 'google.com' ? 'Google' : providerId === 'password' ? 'Email and password' : 'Not available';

    // Verification status straight from the Firebase user (authority) - Phase 8.1.
    const verified = isUserEmailVerified(user);
    const verification = getVerificationPresentation(user);

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
        <div className="space-y-6">
            <PageHeader
                eyebrow="Account"
                title="My Profile"
                description="Review your account identity and update the basic profile information supported by Sarabo."
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <Card className="p-5 sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <Avatar className="size-20 text-xl">
                                {user?.photoURL ? <AvatarImage src={user.photoURL} alt="" /> : null}
                                <AvatarFallback>{getInitials(user?.displayName) || <UserIcon className="size-7" aria-hidden="true" />}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="min-w-0 break-words text-heading text-ds-foreground">{user?.displayName || 'Unnamed account'}</h2>
                                    {roleKnown && <Badge tone="accent">{roleDisplayText}</Badge>}
                                </div>
                                <p className="mt-1 min-w-0 break-all text-body-sm text-ds-muted-foreground">{user?.email}</p>
                            </div>
                        </div>

                        <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-ds-border pt-6 sm:grid-cols-2">
                            <div className="min-w-0">
                                <dt className="ds-label text-ds-muted-foreground">Email address</dt>
                                <dd className="mt-1.5 min-w-0 break-all text-body-sm text-ds-foreground">{user?.email}</dd>
                            </div>
                            <div className="min-w-0">
                                <dt className="ds-label text-ds-muted-foreground">Role</dt>
                                <dd className="mt-1.5 text-body-sm text-ds-foreground">{roleDisplayText}</dd>
                            </div>
                            <div className="min-w-0">
                                <dt className="ds-label text-ds-muted-foreground">Authentication account</dt>
                                <dd className="mt-1.5 text-body-sm text-ds-foreground">{authMethodLabel}</dd>
                            </div>
                            <div className="min-w-0">
                                <dt className="ds-label text-ds-muted-foreground">Email verification</dt>
                                <dd className="mt-1.5">
                                    <Badge tone={verification.tone} className="gap-1">
                                        {verification.verified
                                            ? <ShieldCheck aria-hidden="true" className="size-3.5" />
                                            : <ShieldAlert aria-hidden="true" className="size-3.5" />}
                                        {verification.label}
                                    </Badge>
                                </dd>
                            </div>
                        </dl>

                        {!verified && (
                            <div className="mt-4 flex flex-col gap-2 rounded-ds border border-ds-warning/30 bg-ds-warning/10 p-3 text-body-sm sm:flex-row sm:items-center sm:justify-between" role="status">
                                <span className="text-ds-foreground">Verify your email to submit repair requests and make payments.</span>
                                <Link to="/verify-email" className="focus-ring shrink-0 rounded-ds font-medium text-ds-primary underline underline-offset-2">Verify email</Link>
                            </div>
                        )}

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
                                        // FormField renders the message as
                                        // `${id}-error` but deliberately leaves the
                                        // association to the caller (it does not own
                                        // the control). Without this the validation
                                        // text is visible but never announced with
                                        // the field.
                                        aria-describedby={nameError ? 'profile-name-error' : undefined}
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
                                        className="focus-ring block w-full rounded-ds text-body-sm text-ds-muted-foreground file:mr-3 file:rounded-ds file:border-0 file:bg-ds-secondary file:px-3 file:py-1.5 file:text-body-sm file:font-medium file:text-ds-secondary-foreground hover:file:bg-ds-secondary/80 disabled:opacity-50"
                                    />
                                </div>
                                {/* Marigold: saving profile changes is the one real
                                    primary action this supporting page offers. */}
                                <div className="flex flex-wrap gap-2">
                                    <LoadingButton type="submit" variant="action" loading={saving} loadingText="Saving…">Save changes</LoadingButton>
                                    <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>Cancel</Button>
                                </div>
                            </form>
                        )}
                    </Card>
                </div>

                {/* Phase 9.2: the technician's real stored professional record.
                    Self-guards on role, so customer/admin profiles are
                    untouched and no request is made for them. */}
                <div className="lg:col-span-2">
                    <TechnicianProfileCard role={role} />
                </div>

                <div className="flex flex-col gap-6 lg:col-span-1">
                    <RoleContextCard
                        role={role}
                        roleLoading={roleLoading && !roleKnown}
                        isError={isError && !roleKnown}
                        onRetry={retryRole}
                    />
                    <AccountSecurityCard />
                </div>
            </div>
        </div>
    );
};

export default Profile;
