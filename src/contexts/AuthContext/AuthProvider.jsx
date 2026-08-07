import React, { useEffect, useRef, useState } from 'react';
import { AuthContext } from './AuthContext';
import { createUserWithEmailAndPassword, GoogleAuthProvider, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from 'firebase/auth';
import { auth } from '../../firebase/firebase.init';
import { useQueryClient } from '@tanstack/react-query';
import { notificationKeys } from '../../hooks/notificationKeys';
import { roleKeys } from '../../hooks/roleKeys';
import { damageImageKeys } from '../../hooks/damageImageKeys';
import { inspectionKeys } from '../../hooks/inspectionKeys';
import { quoteKeys } from '../../hooks/quoteKeys';
import { paymentKeys } from '../../hooks/paymentKeys';
import { repairKeys } from '../../hooks/repairKeys';

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
            // Narrow, notification/role-only cache removal on logout or a
            // different authenticated user replacing the previous one -
            // never a blanket queryClient.clear(), which would also wipe
            // unrelated app cache this unit has no mandate to touch. The
            // role query key never carries an email/uid itself (see
            // roleKeys.js), so this explicit removal is what actually
            // prevents a stale previous-account role from ever being read
            // after an account switch. cancelQueries first (not just
            // removeQueries) so a still-in-flight fetch for the previous
            // account can never resolve afterward and repopulate the same
            // key with stale data - removeQueries alone only clears
            // already-settled cache, it doesn't stop a pending request from
            // writing its result in later.
            if (previousUid !== undefined && previousUid !== nextUid) {
                queryClient.cancelQueries({ queryKey: notificationKeys.all });
                queryClient.removeQueries({ queryKey: notificationKeys.all });
                queryClient.cancelQueries({ queryKey: roleKeys.current() });
                queryClient.removeQueries({ queryKey: roleKeys.current() });
                // Damage-image queries carry short-lived signed read URLs
                // (Phase 6.4 Unit 3) - removed on the same account-switch
                // trigger as everything else above, so a cached response
                // fetched under one account can never be read after a
                // different account signs in within the same tab.
                queryClient.cancelQueries({ queryKey: damageImageKeys.all });
                queryClient.removeQueries({ queryKey: damageImageKeys.all });
                // Inspection queries can carry admin/technician-only internal
                // notes (Phase 6.4 Unit 4) - cleared on the same account-switch
                // trigger so one account's inspection data can never be read
                // after a different account signs in within the same tab.
                queryClient.cancelQueries({ queryKey: inspectionKeys.all });
                queryClient.removeQueries({ queryKey: inspectionKeys.all });
                // Quote queries (Phase 6.4 Unit 5) - cleared on the same
                // account-switch trigger, so one account's quote data can never
                // be read after a different account signs in within the tab.
                queryClient.cancelQueries({ queryKey: quoteKeys.all });
                queryClient.removeQueries({ queryKey: quoteKeys.all });
                // Payment-eligibility queries (Phase 6.4 Unit 6) carry a
                // per-request amount and payable state - cleared on the same
                // account-switch trigger so one account's payment state can
                // never be read after a different account signs in within the tab.
                queryClient.cancelQueries({ queryKey: paymentKeys.all });
                queryClient.removeQueries({ queryKey: paymentKeys.all });
                // Repair queries (Phase 6.4 Unit 7) carry progress history and
                // short-lived signed evidence read urls - cleared on the same
                // account-switch trigger so one account's repair data can never
                // be read after a different account signs in within the tab.
                queryClient.cancelQueries({ queryKey: repairKeys.all });
                queryClient.removeQueries({ queryKey: repairKeys.all });
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