import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Share2, Download, QrCode, ShieldCheck, Copy, Check } from 'lucide-react';

export const QRProfileScreen: React.FC = () => {
  const { userProfile } = useAuth();
  const { setActiveScreen, showToast } = useTheme();
  const [copied, setCopied] = useState(false);

  if (!userProfile) return null;

  const publicProfileUrl = `${window.location.origin}/u/${userProfile.uid}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicProfileUrl);
    setCopied(true);
    showToast('Profile link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${userProfile.displayName} on HTTP CHAT`,
          text: `Scan or click to connect with ${userProfile.displayName} (@${userProfile.username}) on HTTP CHAT:`,
          url: publicProfileUrl,
        });
      } catch (e) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white min-h-screen">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
        <button
          onClick={() => setActiveScreen('profile')}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold text-sm">Profile</span>
        </button>
        <h1 className="text-base font-bold text-slate-100">My QR Code</h1>
        <button
          onClick={() => setActiveScreen('scan_qr')}
          className="p-2 rounded-xl text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center gap-1.5 text-xs font-bold"
          title="Scan another QR"
        >
          <QrCode className="w-4 h-4" />
          <span>Scan</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center max-w-md mx-auto w-full space-y-6 my-auto">
        {/* QR Card Frame */}
        <div className="w-full bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center space-y-5 relative overflow-hidden">
          {/* Top Decorative Banner */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

          {/* Profile Avatar */}
          <div className="relative mt-2">
            <img
              src={userProfile.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${userProfile.uid}`}
              alt={userProfile.displayName}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-emerald-500/30 shadow-lg"
            />
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full shadow">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          {/* User Information */}
          <div>
            <h2 className="text-xl font-bold text-white leading-snug">{userProfile.displayName}</h2>
            <p className="text-sm font-medium text-emerald-400">@{userProfile.username}</p>
            {userProfile.about && (
              <p className="text-xs text-slate-400 mt-1 max-w-xs line-clamp-2">{userProfile.about}</p>
            )}
          </div>

          {/* QR Code Container */}
          <div className="bg-white p-4 rounded-2xl shadow-inner border border-slate-200">
            <QRCodeSVG
              value={publicProfileUrl}
              size={180}
              bgColor={"#FFFFFF"}
              fgColor={"#0F172A"}
              level={"H"}
              includeMargin={false}
              imageSettings={{
                src: userProfile.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${userProfile.uid}`,
                x: undefined,
                y: undefined,
                height: 32,
                width: 32,
                excavate: true,
              }}
            />
          </div>

          <p className="text-[11px] text-slate-400 max-w-xs">
            Your QR code is private and contains no credentials. Scanning allows other HTTP CHAT users to discover your profile.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full grid grid-cols-2 gap-3">
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs transition-all shadow"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>Share QR Code</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow"
          >
            {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
            <span>{copied ? 'Copied Link' : 'Copy Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
