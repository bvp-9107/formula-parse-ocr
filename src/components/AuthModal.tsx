import React, { useEffect, useState } from 'react';
import { X, Mail, Eye, EyeOff, Lock, UserRound } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthModalProps { isOpen: boolean; onClose: () => void; onSuccess: () => void; scanLimitReached?: boolean; }
type AuthMode = 'signin' | 'signup' | 'reset';
export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, scanLimitReached = false }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState(''); const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false); const [loading, setLoading] = useState(false); const [message, setMessage] = useState('');
  useEffect(() => { if (isOpen) { setMessage(''); setMode('signin'); } }, [isOpen]);
  if (!isOpen) return null;
  const run = async (e: React.FormEvent) => {
    e.preventDefault(); setMessage('');
    if (mode !== 'reset' && password.length < 8) { setMessage('Use a password with at least 8 characters.'); return; }
    if (mode === 'signup' && password !== confirm) { setMessage('Passwords do not match.'); return; }
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error; onSuccess();
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { display_name: displayName.trim() }, emailRedirectTo: window.location.origin } });
        if (error) throw error; setMessage('Account request submitted. Check your email to verify your account if confirmation is enabled.');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error; setMessage('If an account exists for this email, password-reset instructions have been sent.');
      }
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Authentication failed. Check your connection and try again.'); }
    finally { setLoading(false); }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label="Account access">
    <div className="bg-white dark:bg-yt-surface border border-gray-200 dark:border-yt-border w-full max-w-md rounded-2xl p-6 shadow-2xl relative text-gray-900 dark:text-gray-100 max-h-[90vh] overflow-y-auto">
      <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 p-1.5 rounded-full bg-yt-surface text-gray-400"><X className="w-5 h-5"/></button>
      <h2 className="text-2xl font-bold mb-2">{mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Reset password'}</h2>
      <p className="text-xs text-gray-400 mb-5">{scanLimitReached ? 'You have completed 3 free guest scans. Sign in or create an account to continue.' : 'Sign in to your account or create one to keep working.'}</p>
      <div className="text-center text-xs text-gray-500 mb-4">{mode === 'reset' ? 'PASSWORD RECOVERY' : 'EMAIL AND PASSWORD'}</div>
      <form onSubmit={run} className="space-y-3">
        {mode === 'signup' && <div className="relative"><UserRound className="absolute left-3 top-3 w-4 h-4 text-gray-400"/><input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Display name" autoComplete="name" className="w-full pl-10 p-2.5 rounded-xl bg-white dark:bg-black border border-gray-300 dark:border-yt-border text-sm text-gray-900 dark:text-white placeholder:text-gray-400"/></div>}
        <div className="relative"><Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400"/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" autoComplete="email" required className="w-full pl-10 p-2.5 rounded-xl bg-white dark:bg-black border border-gray-300 dark:border-yt-border text-sm text-gray-900 dark:text-white placeholder:text-gray-400"/></div>
        {mode !== 'reset' && <><div className="relative"><Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400"/><input type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password (8+ characters)" autoComplete={mode==='signin'?'current-password':'new-password'} required minLength={8} className="w-full pl-10 pr-10 p-2.5 rounded-xl bg-white dark:bg-black border border-gray-300 dark:border-yt-border text-sm text-gray-900 dark:text-white placeholder:text-gray-400"/><button type="button" aria-label="Toggle password visibility" onClick={()=>setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-400">{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>{mode==='signup' && <input type={showPassword?'text':'password'} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Confirm password" autoComplete="new-password" required className="w-full p-2.5 rounded-xl bg-white dark:bg-black border border-gray-300 dark:border-yt-border text-sm text-gray-900 dark:text-white placeholder:text-gray-400"/>}</>}
        {message && <p role="status" className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-xs text-blue-800 dark:text-blue-200 break-words">{message}</p>}
        <button disabled={loading} className="w-full p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-sm disabled:opacity-50">{loading?'Please wait…':mode==='signin'?'Sign In':mode==='signup'?'Create Account':'Send Reset Link'}</button>
      </form>
      <div className="flex flex-wrap justify-between gap-2 mt-4 text-xs"><button className="text-blue-400" onClick={()=>{setMode(mode==='signin'?'signup':'signin');setMessage('');}}> {mode==='signup'?'Already have an account? Sign in':'New here? Create account'}</button><button className="text-blue-400" onClick={()=>{setMode(mode==='reset'?'signin':'reset');setMessage('');}}>{mode==='reset'?'Back to sign in':'Forgot password?'}</button></div>
    </div></div>;
};
