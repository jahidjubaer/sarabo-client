import { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import useAuth from '../../../hooks/useAuth';
import useRole from '../../../hooks/useRole';
import Avatar from '../../../components/Avatar/Avatar';
import RoleContextCard from './RoleContextCard';
import AccountSecurityCard from './AccountSecurityCard';

// Exact wording requested for this page - deliberately more formal than
// Navbar's compact "Admin" badge, so this is not a duplicate of that mapping.
const PROFILE_ROLE_LABELS = { user: 'Customer', rider: 'Technician', admin: 'Administrator' };

const Profile = () => {
    const { user, updateUserProfile } = useAuth();
    const { role, roleLoading, isError } = useRole();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user?.displayName || '');
    const [photoFile, setPhotoFile] = useState(null);
    const [nameError, setNameError] = useState('');
    const [saving, setSaving] = useState(false);

    // Identity (avatar/name/email) renders immediately from the already-loaded
    // Firebase user - only the role-dependent text below waits on roleLoading.
    const roleKnown = !roleLoading && !isError;
    const roleDisplayText = roleKnown
        ? (PROFILE_ROLE_LABELS[role] || 'Role unavailable')
        : (roleLoading ? 'Loading role...' : 'Unable to load role');

    // Real, already-available Firebase data - not invented. Google accounts
    // are provider "google.com"; email/password sign-ups are "password".
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

        // Nothing actually changed - avoid an unnecessary Firebase write.
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
            Swal.fire({
                position: "top-end",
                icon: "success",
                title: "Profile updated successfully",
                showConfirmButton: false,
                timer: 1500
            });
            setIsEditing(false);
        } catch {
            // Edit mode stays open on failure so nothing typed is lost.
            Swal.fire({ icon: "error", title: "Could not update profile", text: "Please try again." });
        } finally {
            setSaving(false);
        }
    }

    return (
        <div>
            <h1 className="text-3xl font-bold sm:text-4xl">My Profile</h1>
            <p className="mt-2 max-w-2xl opacity-70">
                Review your account identity and update the basic profile information supported by Sarabo.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <div className="card border border-base-300 bg-base-100 p-6">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                            <Avatar src={user?.photoURL} name={user?.displayName} size="w-20 h-20" />
                            <div className="min-w-0 flex-1">
                                <h2 className="text-2xl font-semibold">{user?.displayName || 'Unnamed Account'}</h2>
                                <p className="truncate opacity-70" title={user?.email}>{user?.email}</p>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-base-300 pt-6 sm:grid-cols-2">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide opacity-60">Email Address</p>
                                <p className="mt-1 truncate" title={user?.email}>{user?.email}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide opacity-60">Role</p>
                                <p className="mt-1">{roleDisplayText}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide opacity-60">Authentication Account</p>
                                <p className="mt-1">{authMethodLabel}</p>
                            </div>
                        </div>

                        {!isEditing ? (
                            <button onClick={startEditing} className="focus-ring btn btn-primary mt-6">Edit Profile</button>
                        ) : (
                            <form onSubmit={handleSave} className="mt-6 border-t border-base-300 pt-6" noValidate>
                                <label htmlFor="profile-name" className="label">Name</label>
                                <input
                                    id="profile-name"
                                    type="text"
                                    value={name}
                                    onChange={e => { setName(e.target.value); if (nameError) setNameError(''); }}
                                    className="input w-full"
                                    placeholder="Your Name"
                                    autoFocus
                                    disabled={saving}
                                    aria-invalid={!!nameError}
                                    aria-describedby={nameError ? 'profile-name-error' : undefined}
                                />
                                {nameError && <p id="profile-name-error" className="mt-1 text-sm text-error">{nameError}</p>}

                                <label htmlFor="profile-photo" className="label mt-4">Photo</label>
                                <input
                                    id="profile-photo"
                                    type="file"
                                    onChange={e => setPhotoFile(e.target.files[0])}
                                    className="file-input w-full"
                                    accept="image/*"
                                    disabled={saving} />

                                <div className="mt-6 flex gap-2">
                                    <button type="submit" disabled={saving} className="focus-ring btn btn-primary">
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                    <button type="button" onClick={handleCancel} disabled={saving} className="focus-ring btn">Cancel</button>
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
