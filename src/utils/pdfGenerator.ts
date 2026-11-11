import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AttendanceRecord, PerformanceSummary, SystemSettings } from '../types';

export function generateMonthlyAttendancePDF({
  monthName,
  year,
  summaries,
  attendances,
  settings,
}: {
  monthName: string;
  year: number;
  summaries: PerformanceSummary[];
  attendances: AttendanceRecord[];
  settings: SystemSettings;
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Header Banner in Kumon Blue (#00A0E9)
  doc.setFillColor(0, 160, 233);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Title in Header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('KUMON JAMBON - LAPORAN PRESENSI HRD', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `Sistem Presensi Real-Time & Validasi GPS 50m | ${settings.centerAddress}`,
    14,
    18
  );
  doc.text(
    `Periode: ${monthName.toUpperCase()} ${year} | Dicetak: ${new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`,
    14,
    24
  );

  // 2. Executive KPI Box
  const totalStaff = summaries.length;
  const avgDiscipline = totalStaff > 0
    ? (summaries.reduce((acc, s) => acc + s.disciplineRate, 0) / totalStaff).toFixed(1)
    : '0';
  const totalLateCases = summaries.reduce((acc, s) => acc + s.lateCount, 0);
  const totalPresent = summaries.reduce((acc, s) => acc + s.presentCount, 0);

  doc.setFillColor(240, 249, 255); // light kumon blue tint
  doc.setDrawColor(186, 230, 253);
  doc.roundedRect(14, 34, pageWidth - 28, 20, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('RINGKASAN KEHADIRAN HRD CABANG:', 18, 41);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Total Staff Aktif: ${totalStaff} Orang`, 18, 48);
  doc.text(`Tingkat Disiplin Rata-rata: ${avgDiscipline}%`, 75, 48);
  doc.text(`Total Presensi: ${totalPresent} Kali`, 135, 48);
  doc.text(`Kasus Terlambat: ${totalLateCases} Kali`, 175, 48);

  // 3. Table of Staff Summaries
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 119, 182);
  doc.text('REKAPITULASI PERFORMA KEHADIRAN INDIVIDU', 14, 60);

  const tableData = summaries.map((s, idx) => [
    String(idx + 1),
    s.userName,
    s.position,
    String(s.onTimeCount),
    String(s.lateCount),
    `${s.totalLateMinutes} mnt`,
    String(s.excusedCount + s.leaveCount),
    `${s.disciplineRate}%`,
    s.disciplineRate >= 90
      ? 'Sangat Baik'
      : s.disciplineRate >= 75
      ? 'Cukup'
      : 'Perlu Pembinaan',
  ]);

  autoTable(doc, {
    startY: 64,
    head: [[
      'No',
      'Nama Karyawan',
      'Jabatan',
      'Tepat',
      'Telat',
      'Tot Telat',
      'Ijin/Cuti',
      'Disiplin',
      'Status HRD',
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 160, 233],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 38 },
      2: { cellWidth: 34 },
      3: { halign: 'center', cellWidth: 14 },
      4: { halign: 'center', cellWidth: 14 },
      5: { halign: 'center', cellWidth: 18 },
      6: { halign: 'center', cellWidth: 16 },
      7: { halign: 'center', fontStyle: 'bold', cellWidth: 18 },
      8: { halign: 'center', cellWidth: 24 },
    },
    margin: { left: 14, right: 14 },
  });

  // 4. Sample Recent Logs / Verification Notes
  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  const finalY = doc.lastAutoTable?.finalY || 180;

  if (finalY < 230) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      '* Catatan HRD: Jam masuk resmi pukul 10:00 WIB (Senin - Sabtu) dengan batas toleransi 15 menit (10:15 WIB).',
      14,
      finalY + 8
    );
    doc.text(
      `* Seluruh data kehadiran telah tervalidasi secara otomatis melalui koordinat GPS radius 50 meter dari Kumon Jambon.`,
      14,
      finalY + 13
    );

    // 5. Signature block
    const sigY = Math.min(finalY + 26, 250);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    doc.text('Diverifikasi oleh,', 25, sigY);
    doc.text('HRD & Operasional Cabang', 25, sigY + 5);
    doc.line(25, sigY + 24, 75, sigY + 24);
    doc.text('( ........................................ )', 25, sigY + 29);

    doc.text('Mengetahui & Menyetujui,', pageWidth - 80, sigY);
    doc.text('Kepala Cabang KUMON JAMBON', pageWidth - 80, sigY + 5);
    doc.line(pageWidth - 80, sigY + 24, pageWidth - 30, sigY + 24);
    doc.text('( ........................................ )', pageWidth - 80, sigY + 29);
  }

  // Save the PDF
  const filename = `Laporan_Presensi_Kumon_Jambon_${monthName}_${year}.pdf`;
  doc.save(filename);
}
