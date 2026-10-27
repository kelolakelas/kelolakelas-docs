## Background / Problem

Manual testing 25 Oktober 2026 meminta evaluasi UI/UX seluruh page dan improvement bila tampilan kurang baik atau alur kurang praktis. Discovery statis menemukan34 page.tsx:33 halaman nyata dan1 redirect compatibility. Belum ada bukti audit browser seluruh halaman; KEL-202/210/219/220 merupakan perbaikan fokus yang sudah Done.

## Goal

Miliki audit UI/UX berbukti untuk seluruh halaman dan perbaiki temuan web prioritas yang dapat diselesaikan dalam satu batch terbatas, dengan backlog follow-up jelas untuk perubahan lebih besar.

## Requirements

- Inventaris ulang seluruh current routes ketika issue dimulai, termasuk dynamic detail dan redirect. Baseline sekarang: public4, auth5, parent6, tenant14 termasuk redirect, platform5.
- Buat persona/access/state/viewport matrix: public, parent, tenant teacher, tenant admin/Creator, platform admin; loading/empty/success/validation/error/forbidden yang relevan.
- Evaluasi hirarki visual, keterbacaan/copy, konsistensi kontrol, keyboard/focus, feedback, form recovery, navigasi, responsive overflow dan jumlah langkah untuk tugas utama.
- Telusuri perjalanan katalog→student→request/checkout, enrollment/payment, tenant class/schedule/member/chat serta platform operations; halaman privileged diuji dengan fixture/akses yang sah.
- Catat temuan dengan route, persona, langkah, actual/expected, screenshot/evidence, dampak, severity dan rekomendasi.
- Implementasikan batch terbatas maksimal tiga temuan web terpenting yang terbukti, termasuk shared fix bila tepat. Scope fixes dipilih setelah audit dan dicatat sebelum coding; temuan domain/backend/besar menjadi follow-up, bukan redesign diam-diam.
- Jika tidak ditemukan defect baru dalam scope, laporkan bukti coverage dan alasan tanpa mengarang perubahan kosmetik.

## Acceptance Criteria

- [ ] Semua current pages mempunyai entry coverage dengan hasil/evidence atau alasan akses terblokir yang eksplisit; baseline33 surfaces+redirect direkonsiliasi dengan versi aktual.
- [ ] Halaman yang bisa diakses diverifikasi di mobile dan desktop, dengan kondisi/state relevan; redirect lama menuju tujuan yang benar.
- [ ] User journey utama ditelusuri end-to-end, termasuk validasi, error/retry dan empty state tanpa kehilangan data input yang perlu dipertahankan.
- [ ] Temuan diprioritaskan berdasarkan dampak nyata; issue01–07 dan predecessor Done tidak diduplikasi sebagai pekerjaan baru.
- [ ] Hingga tiga temuan web prioritas selesai dengan before/after screenshots dan langkah verifikasi. Jika tidak ada temuan, report evidence menjelaskan hasil tersebut.
- [ ] Keyboard/focus/accessible names dan responsive layout pada komponen berubah diverifikasi; role/permission behavior tetap sama.
- [ ] Temuan besar/blocked/di luar batch didokumentasikan sebagai kandidat follow-up dengan alasan, bukan dinyatakan sudah diperbaiki.

## Technical Notes

Effort L karena breadth coverage, complexity medium karena perubahan implementasi sengaja terbatas pada web. Audit hasil bukan predetermined redesign. Static hints seperti English class editor copy berdampingan Indonesian payment copy hanya kandidat evaluasi, bukan defect visual terkonfirmasi.

Relevant areas:
- kelolakelas-web/app/**/page.tsx — baseline34 routes, lihat lampiran inventaris pada discovery.md.
- kelolakelas-web/app/(dashboard)/dashboard/tenant/creator-requests/page.tsx:4 — compatibility redirect ke Members.
- kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ClassEditForm.tsx:110; ClassConfigurationEditor.tsx:548 — kandidat review language/hierarchy.
- kelolakelas-web/components dan shared form/navigation/chat components.
- kelolakelas-docs/docs/evidence/kel220-public-schedule-controls.md; docs/adr/0077-shared-calendar-date-input.md; docs/components/web.md.

Issue standalone, tidak membuat project satu-issue atau memperluas project khusus parent. Jangan claim audit runtime dari source review. Gunakan akun/fixture lokal yang aman dan screenshot tanpa credentials/production data. Alasan akses blocked disertai prosedur untuk melanjutkan coverage, bukan dianggap lulus. Update docs hanya bila behavior/flow berubah; simpan audit evidence dan follow-up list.

## Edge Cases

- Mobile sempit, content panjang, daftar kosong/besar, loading lambat dan upstream gagal.
- Permission-specific controls, direct URL forbidden, login/factor challenge dan expired session.
- Dynamic IDs, payment return, invitation invalid/expired, redirect compatibility.
- Keyboard-only navigation, focus modal/retry, light/dark bila mode tersebut tersedia.

## Testing / Validation

- [ ] Browser audit seluruh route matrix dengan screenshot/hasil dan batasan environment.
- [ ] Manual representative journey public/parent/teacher/admin/platform sesuai akses sah.
- [ ] Automated checks relevan untuk perubahan behavior/shared component; hindari test kosmetik yang hanya menyalin implementation.
- [ ] Web lint/typecheck/build dan relevant tests lulus; required GitHub PR CI dan review terpenuhi sebelum merge.
- [ ] Bandingkan screenshot desktop/mobile sebelum/sesudah dan cek keyboard/focus pada semua komponen berubah.
- [ ] Dokumentasi/evidence serta follow-up di-update; coverage yang belum dapat diuji tetap dinyatakan terbuka.

## Out of Scope

- Redesign global/brand, penggantian design system/framework atau penambahan fitur domain tanpa bukti.
- Perbaikan backend atau masalah spesifik yang sudah dimiliki issue01–07.
- Mendraft ulang KEL-202/210/219/220 atau menyatakan semua halaman bagus tanpa browser evidence.
