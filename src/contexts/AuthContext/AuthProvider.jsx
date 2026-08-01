import React, { useEffect, useRef, useState } from 'react';
import { AuthContext } from './AuthContext';
import { createUserWithEmailAndPassword, GoogleAuthProvider, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from 'firebase/auth';
import { auth } from '../../firebase/firebase.init';
import { useQueryClient } from '@tanstack/react-query';
import { notificationKeys } from '../../hooks/notificationKeys';

const googleProvider = new GoogleAuthProvider();

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const queryClient = useQueryClient();
    // `undefined` (never set) is distinct from `null` (known signed-out) so
    // the very first auth-state callback on app boot - whether it resolves
    // to no user or a restored session - never triggers a needless clear.
    const previousUidRef = useRef(undefined);

    const registerUser = (email, password) => {
        setLoading(true);
        return createUserWithEmailAndPassword(auth, email, password)
    }

    const signInUser = (email, password) => {
        setLoading(true);
        return signInWithEmailAndPassword(auth, email, password)
    }

    const signInGoogle = () => {
        setLoading(true);
        return signInWithPopup(auth, googleProvider);
    }

    const logOut = () => {
        setLoading(true);
        return signOut(auth);
    }

    const updateUserProfile = (profile) =>{
        return updateProfile(auth.currentUser, profile)
    }

    const resetPassword = (email) => {
        return sendPasswordResetEmail(auth, email);
    }

    // observe user state
    useEffect(() => {
        const unSubscribe = onAuthStateChanged(auth, (currentUser) => {
            const previousUid = previousUidRef.current;
            const nextUid = currentUser?.uid ?? null;
            // Narrow, notification-only cache removal on logout or a
            // different authenticated user replacing the previous one -
            // never a blanket queryClient.clear(), which would also wipe
            // unrelated app cache this unit has no mandate to touch.
            if (previousUid !== undefined && previousUid !== nextUid) {
                queryClient.removeQueries({ queryKey: notificationKeys.all });
            }
            previousUidRef.current = nextUid;

            setUser(currentUser);
            setLoading(false);
            // Log only the email, never the full Firebase user object - it
            // carries internal token fields that should never reach the console.
            if (import.meta.env.DEV) console.log('auth state changed:', currentUser?.email ?? null);
        })
        return () => {
            unSubscribe();
        }
    }, [queryClient])

    const authInfo = {
        user,
        loading,
        registerUser,
        signInUser,
        signInGoogle,
        logOut,
        updateUserProfile,
        resetPassword
    }

    return (
        <AuthContext value={authInfo}>
            {children}
        </AuthContext>
    );
};

export default AuthProvider;