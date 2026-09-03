import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import {
  getStudentPortalUrl,
  generateQrDataUrl,
  downloadQrCodeImage,
  downloadStudentBadgeCard,
} from '../utils/qrHelper';
import { StudentAvatar } from './StudentAvatar';
import {
  X,
  QrCode,
  Copy,
  Check,
  Download,
  Printer,
  ExternalLink,
  Sparkles,
  Star,
  Share2,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';

interface StudentQrModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenBatchPrint?: () => void;
}

export const StudentQrModal: React.FC<StudentQrModalProps> = ({
  student,
  isOpen,
  onClose,
  onOpenBatchPrint,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!student || !isOpen) {
      setQrDataUrl('');
      return;
    }

    const portalUrl = getStudentPortalUrl(student.id);
    generateQrDataUrl(portalUrl, {
      width: 420,
      margin: 2,
      darkColor: '#120524',
      lightColor: '#ffffff',
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR:', err));
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  const portalUrl = getStudentPortalUrl(student.id);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadQrOnly = async () => {
    try {
      setIsDownloading(true);
      await downloadQrCodeImage(student);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadBadgeCard = async () => {
    try {
      setIsDownloading(true);
      await downloadStudentBadgeCard(student);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintSingle = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-[#180b2d] border border-purple-500/30 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden relative my-auto">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-900/80 via-[#231042] to-indigo-950/80 px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-white text-base leading-tight">
                QR Code ประจำตัวนักเรียน
              </h3>
              <p className="text-[11px] text-purple-200">
                สำหรับสแกนเข้าสู่ Student Portal (/portal/{student.id})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Printable Preview Card */}
          <div
            id={`printable-single-card-${student.id}`}
            className="bg-gradient-to-b from-[#210d3e] to-[#120524] rounded-2xl border border-purple-500/30 p-5 text-center relative overflow-hidden shadow-inner"
          >
            {/* Background Glow */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

            {/* Student Info Pill */}
            <div className="flex items-center justify-center gap-3 mb-3">
              <StudentAvatar
                name={student.name}
                avatarUrl={student.avatarUrl}
                size="md"
                className="border-2 border-amber-400/40 shadow-md"
              />
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-base">{student.name}</span>
                  {student.nickname && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                      น้อง{student.nickname}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-purple-200 mt-0.5">
                  <span>ห้อง {student.classroom}</span>
                  {student.studentCode && (
                    <span className="text-slate-400 font-mono">#{student.studentCode}</span>
                  )}
                  <span className="text-amber-400 font-bold flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {student.stars} ดาว
                  </span>
                </div>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="my-3 p-3.5 bg-white rounded-2xl inline-block shadow-2xl border-4 border-amber-400/30">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code สำหรับ ${student.name}`}
                  className="w-48 h-48 sm:w-52 sm:h-52 mx-auto block"
                />
              ) : (
                <div className="w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center text-slate-400 text-xs animate-pulse">
                  กำลังสร้าง QR Code...
                </div>
              )}
            </div>

            {/* Instruction badge */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-amber-300/90 font-medium">
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>ใช้กล้องมือถือหรือแอป LINE สแกนเปิดดูคะแนนได้ทันที</span>
            </div>

            {/* Direct URL Box */}
            <div className="mt-3 text-[11px] text-purple-300 font-mono break-all bg-black/40 p-2.5 rounded-xl border border-white/10 flex items-center justify-between gap-2">
              <span className="truncate">{portalUrl}</span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="shrink-0 text-amber-400 hover:text-amber-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="คัดลอกลิงก์"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
              </button>
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleDownloadBadgeCard}
              disabled={isDownloading}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลดการ์ดสะสมดาว (PNG)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadQrOnly}
              disabled={isDownloading}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 border border-white/10 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-purple-300" />
              <span>ดาวน์โหลดเฉพาะภาพ QR Code</span>
            </button>

            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 border border-purple-500/30 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-purple-300" />
              <span>ทดลองเปิดดูหน้าพอร์ทัล</span>
            </a>

            {onOpenBatchPrint && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBatchPrint();
                }}
                className="px-4 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 border border-emerald-500/30 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>พิมพ์ QR ทั้งห้องเรียน (A4)</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#120524] px-6 py-3.5 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-[11px] text-purple-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>ลิงก์สำหรับดูข้อมูลอย่างเดียว ปลอดภัยต่อนักเรียน</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
