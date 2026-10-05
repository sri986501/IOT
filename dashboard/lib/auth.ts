import { supabase } from './supabase';

export type AuthResult =
  | { status: 'logged_in'; session: any }
  | { status: 'needs_verification'; email: string }
  | { status: 'error'; message: string };

/**
 * Smart Auth:
 * - Existing verified users log in immediately without OTP.
 * - New users or unverified users receive an OTP code to their Gmail.
 */
export async function smartLogin(email: string, password: string): Promise<AuthResult> {
  // Step 1: Try signing in as existing user
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Existing verified user -> Success!
  if (!signInError && signInData.session) {
    return { status: 'logged_in', session: signInData.session };
  }

  // Existing user whose email is not confirmed -> Resend confirmation OTP
  if (signInError?.message.toLowerCase().includes('email not confirmed')) {
    await supabase.auth.resend({
      type: 'signup',
      email,
    });
    return { status: 'needs_verification', email };
  }

  // If user doesn't exist yet, automatically register them as a new user
  if (
    signInError?.message.toLowerCase().includes('invalid login credentials') ||
    signInError?.message.toLowerCase().includes('user not found')
  ) {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      return { status: 'error', message: signUpError.message };
    }

    // If new user needs email verification
    if (signUpData.user && !signUpData.session) {
      return { status: 'needs_verification', email };
    }

    return { status: 'logged_in', session: signUpData.session };
  }

  return { status: 'error', message: signInError?.message || 'Authentication failed' };
}

/**
 * Verify 6-digit OTP code sent to Gmail
 */
export async function verifyNewUserOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup',
  });

  if (error) throw error;
  return data;
}

/**
 * Resend OTP code to user's email
 */
export async function resendVerificationOtp(email: string) {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get current session and user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}
