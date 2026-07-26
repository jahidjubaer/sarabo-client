import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import useAuth from '../../../hooks/useAuth';
import useRole from '../../../hooks/useRole';
import Loading from '../../../components/Loading/Loading';
import Avatar from '../../../components/Avatar/Avatar';

const roleLabels = { user: 'Customer', rider: 'Technician', admin: 'Admin' };

const Profile = () => {
    const { user, updateUserProfile } = useAuth();
    const { role, roleLoading } = useRole();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user?.displayName || '');
    const [photoFile, setPhotoFile] = useState(null);
    const [saving, setSaving] = useState(false);

    if (roleLoading) {
        return <Loading></Loading>
    }

    const handleSave = async (e) => {
        e.preventDefault();
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

            await updateUserProfile({ displayName: name, photoURL });

            Swal.fire({
                position: "top-end",
                icon: "success",
                title: "Profile updated successfully",
                showConfirmButton: false,
                timer: 1500
            });
            setIsEditing(false);
        } catch {
            Swal.fire({ icon: "error", title: "Could not update profile", text: "Please try again." });
        } finally {
            setSaving(false);
        }
    }

    return (
        <div>
            <h2 className="text-4xl font-bold">My Profile</h2>

            <div className="card bg-base-200 p-6 mt-8 max-w-lg">
                <div className="flex items-center gap-4 mb-6">
                    <Avatar src={user?.photoURL} name={user?.displayName} size="w-20 h-20" />
                    {!isEditing && (
                        <div>
                            <h3 className="text-2xl font-semibold">{user?.displayName}</h3>
                            <p className="opacity-70">{user?.email}</p>
                            <p className="opacity-70">Role: {roleLabels[role] || role}</p>
                        </div>
                    )}
                </div>

                {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="btn btn-primary text-black">Edit Profile</button>
                ) : (
                    <form onSubmit={handleSave}>
                        <label className="label">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="input w-full"
                            placeholder="Your Name" />

                        <label className="label mt-4">Photo</label>
                        <input
                            type="file"
                            onChange={e => setPhotoFile(e.target.files[0])}
                            className="file-input w-full"
                            accept="image/*" />

                        <div className="mt-6 flex gap-2">
                            <button type="submit" disabled={saving} className="btn btn-primary text-black">
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button type="button" onClick={() => setIsEditing(false)} className="btn">Cancel</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Profile;
