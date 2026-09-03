import QRCode from 'qrcode';
import { Student } from '../types';

export interface QrOptions {
  width?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * Returns the absolute URL for a student's portal page
 */
export function getStudentPortalUrl(studentId: string): string {
  if (typeof window === 'undefined') {
    return `/portal/${studentId}`;
  }
  const origin = window.location.origin;
  return `${origin}/portal/${studentId}`;
}

/**
 * Generates a high-quality QR code data URL (PNG)
 */
export async function generateQrDataUrl(
  text: string,
  options: QrOptions = {}
): Promise<string> {
  const {
    width = 360,
    margin = 2,
    darkColor = '#0f071a',
    lightColor = '#ffffff',
    errorCorrectionLevel = 'H',
  } = options;

  try {
    return await QRCode.toDataURL(text, {
      width,
      margin,
      color: {
        dark: darkColor,
        light: lightColor,
      },
      errorCorrectionLevel,
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw err;
  }
}

/**
 * Downloads a single QR code image as PNG file
 */
export async function downloadQrCodeImage(student: Student, filename?: string) {
  const url = getStudentPortalUrl(student.id);
  const dataUrl = await generateQrDataUrl(url, { width: 600, margin: 2 });
  
  const link = document.createElement('a');
  link.href = dataUrl;
  const cleanName = (student.nickname || student.name).replace(/[^a-zA-Z0-9ก-๙_-]/g, '_');
  link.download = filename || `QR_Portal_${student.classroom}_${cleanName}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Downloads a styled student badge card as PNG
 */
export async function downloadStudentBadgeCard(student: Student) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = 800;
  const height = 1100;
  canvas.width = width;
  canvas.height = height;

  // Background Gradient
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#1c0c36');
  grad.addColorStop(0.5, '#120524');
  grad.addColorStop(1, '#090312');
  ctx.fillStyle = grad;
  ctx.roundRect(0, 0, width, height, 40);
  ctx.fill();

  // Border
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
  ctx.lineWidth = 6;
  ctx.roundRect(10, 10, width - 20, height - 20, 32);
  ctx.stroke();

  // Header Title
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 36px "Kanit", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✨ STAR ACADEMY ✨', width / 2, 85);

  ctx.fillStyle = '#e9d5ff';
  ctx.font = '24px "Noto Sans Thai", sans-serif';
  ctx.fillText('สมุดสะสมดาวความดีประจำตัวนักเรียน', width / 2, 125);

  // Student Info Box
  ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.roundRect(50, 160, width - 100, 160, 24);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Student Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px "Kanit", sans-serif';
  ctx.fillText(student.name, width / 2, 220);

  // Nickname & Class
  const subText = `${student.nickname ? `น้อง${student.nickname} • ` : ''}ห้อง ${student.classroom} ${student.studentCode ? `(เลขประจำตัว: ${student.studentCode})` : ''}`;
  ctx.fillStyle = '#fcd34d';
  ctx.font = 'bold 26px "Noto Sans Thai", sans-serif';
  ctx.fillText(subText, width / 2, 265);

  ctx.fillStyle = '#a855f7';
  ctx.font = '22px "Noto Sans Thai", sans-serif';
  ctx.fillText(`คะแนนดาวสะสมปัจจุบัน: ⭐ ${student.stars} ดวง`, width / 2, 300);

  // Generate and draw QR Code
  const qrUrl = getStudentPortalUrl(student.id);
  const qrDataUrl = await generateQrDataUrl(qrUrl, { width: 500, margin: 2 });
  const qrImg = new Image();
  await new Promise((resolve, reject) => {
    qrImg.onload = resolve;
    qrImg.onerror = reject;
    qrImg.src = qrDataUrl;
  });

  // White background for QR code
  const qrSize = 440;
  const qrX = (width - qrSize) / 2;
  const qrY = 360;
  ctx.fillStyle = '#ffffff';
  ctx.roundRect(qrX - 16, qrY - 16, qrSize + 32, qrSize + 32, 24);
  ctx.fill();

  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  // Instruction Bottom Box
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px "Noto Sans Thai", sans-serif';
  ctx.fillText('📱 ใช้กล้องโทรศัพท์มือถือ หรือ LINE สแกน', width / 2, 900);

  ctx.fillStyle = '#c084fc';
  ctx.font = '22px "Noto Sans Thai", sans-serif';
  ctx.fillText('เพื่อดูประวัติความดี ดาวสะสม และของรางวัลที่แลกได้', width / 2, 940);

  // URL text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '18px monospace';
  const shortUrl = qrUrl.length > 55 ? qrUrl.substring(0, 52) + '...' : qrUrl;
  ctx.fillText(shortUrl, width / 2, 1020);

  // Trigger Download
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  const cleanName = (student.nickname || student.name).replace(/[^a-zA-Z0-9ก-๙_-]/g, '_');
  link.download = `StarCard_${student.classroom}_${cleanName}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
