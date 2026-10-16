## Background / Problem

QA end-to-end (agent-browser, stack lokal, main 9 Okt 2026) menemukan bahwa `POST /api/v1/enrollments/{id}/cancel` untuk enrollment `pending` milik parent selalu dijawab `409 Enrollment can no longer be cancelled`, padahal enrollment sudah `dropped`, transaksi billing `cancelled`, dan kursi kembali tersedia. Reproduksi dua kali pada enrollment baru dengan hasil sama. Penyebab di academic `internal/usecase/enrollment_usecase.go` `CancelPendingEnrollment`: saat `txManager` ada, closure transaksi mengubah `enrollment.Status` menjadi `dropped`, lalu pengecekan `if enrollment.Status != "pending"` setelah transaksi membaca objek yang sudah diubah, sehingga jalur sukses selalu mengembalikan `ErrInvalidEnrollmentTransition`. `enrollment_cancel_test.go` (`newCancelTestUsecase`) membangun usecase tanpa txManager sehingga jalur produksi tidak teruji. Di web, `CancelEnrollmentButton.tsx` hanya menampilkan pesan error bila state `dialogOpen` bernilai true, tetapi state itu tidak pernah di-set true (tombol pemicu hanya memanggil `showModal()`), sehingga parent tidak melihat pesan apa pun saat pembatalan gagal dan baris tetap tampil "Menunggu pembayaran".

## Goal

Pembatalan enrollment `pending` yang berhasil dijawab 200 sesuai tabel hasil di ADR 0016, dan parent melihat hasil pembatalan (sukses atau pesan error) di halaman enrollments tanpa reload.

## Requirements

- Academic mengembalikan 200 berisi enrollment `dropped` ketika enrollment `pending` milik parent berhasil dibatalkan melalui jalur transaksi (txManager tersedia).
- Enrollment yang sudah `dropped` sebelum request tetap dijawab 409 setelah withdrawal tetap dicoba, sesuai tabel ADR 0016.
- Enrollment `active`, `suspended`, dan `completed` tetap 409 sebelum ada pemanggilan billing; invoice yang sudah `paid`/`refunded` tetap 409 tanpa perubahan apa pun.
- Web menampilkan pesan error pembatalan (role=alert) di dialog ketika action mengembalikan error, dan menampilkan status sukses lalu memperbarui baris setelah pembatalan berhasil.
- Kontrak HTTP, urutan billing-lalu-academic, dan pesan error yang ada tidak berubah.

## Acceptance Criteria

- [ ] Membatalkan enrollment `pending` dengan invoice belum dibayar menghasilkan 200, enrollment `dropped`, transaksi `cancelled`, dan kursi kembali tersedia.
- [ ] Di `/dashboard/parent/enrollments`, setelah konfirmasi "Ya, batalkan" berhasil, status enrollment tidak lagi tampil sebagai menunggu pembayaran tanpa perlu reload manual.
- [ ] Ketika pembatalan ditolak (mis. 409), pesan error terlihat di dialog.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Kebenaran urutan dan idempotensi dijelaskan di kelolakelas-docs ADR 0016 (`docs/adr/0016-cancel-pending-enrollment.md`); keputusan itu tidak berubah. `ReleaseEnrollment` di file yang sama memakai pola transaksi serupa tetapi menganggap `dropped` sebagai hasil idempoten sehingga tidak terdampak. Test usecase perlu fake TransactionManager agar jalur transaksi produksi teruji. Risiko utama: mengubah pengecekan status tanpa merusak penolakan 409 untuk enrollment yang sudah `dropped` sebelumnya. Perbarui kelolakelas-docs (`docs/components/academic-service.md` atau `web.md`) bila perilaku yang terdokumentasi berubah.

Relevant areas:

- `kelolakelas-academic-service/internal/usecase/enrollment_usecase.go`
- `kelolakelas-academic-service/internal/usecase/enrollment_cancel_test.go`
- `kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments/_components/CancelEnrollmentButton.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments/_actions/actions.ts`
- `kelolakelas-web/lib/enrollment-cancellation.ts`

## Edge Cases

- Dua request pembatalan bersamaan untuk enrollment yang sama: tepat satu 200, yang lain 409.
- Callback release dari billing tiba sebelum transaksi academic: hasil akhir tetap `dropped` dan request pertama tidak salah dijawab.
- Enrollment `pending` tanpa transaksi billing (invoice tidak pernah dibuat) tetap 200.
- Sesi parent kedaluwarsa saat konfirmasi pembatalan.

## Testing / Validation

- [ ] Unit test academic dengan fake TransactionManager untuk pending → 200, dropped → 409, active → 409, dan billing menolak → 409.
- [ ] Vitest `CancelEnrollmentButton` untuk tampilan pesan error dan sukses.
- [ ] Validasi risiko: reproduksi manual via gateway lokal bahwa pembatalan pending menghasilkan 200 dan pembatalan ulang 409.
- [ ] Existing tests pass, `go test ./...` dan `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual.

## Out of Scope

- Perubahan alur pembatalan billing atau job release kursi.
- Pembatalan enrollment `active` atau refund.

## AI Orchestrator Contract

```json
{
  "draftKey": "cancel-pending-enrollment-409",
  "projectKey": null,
  "title": "Pembatalan enrollment pending oleh parent selalu dijawab 409 padahal pembatalan berhasil",
  "type": "Improvement",
  "priority": "High",
  "estimate": "S",
  "complexity": "medium",
  "labels": [
    "academic",
    "web",
    "ai-ready"
  ],
  "repositories": [
    "academic",
    "web"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "QA end-to-end (agent-browser, stack lokal, main 9 Okt 2026) menemukan bahwa `POST /api/v1/enrollments/{id}/cancel` untuk enrollment `pending` milik parent selalu dijawab `409 Enrollment can no longer be cancelled`, padahal enrollment sudah `dropped`, transaksi billing `cancelled`, dan kursi kembali tersedia. Reproduksi dua kali pada enrollment baru dengan hasil sama. Penyebab di academic `internal/usecase/enrollment_usecase.go` `CancelPendingEnrollment`: saat `txManager` ada, closure transaksi mengubah `enrollment.Status` menjadi `dropped`, lalu pengecekan `if enrollment.Status != \"pending\"` setelah transaksi membaca objek yang sudah diubah, sehingga jalur sukses selalu mengembalikan `ErrInvalidEnrollmentTransition`. `enrollment_cancel_test.go` (`newCancelTestUsecase`) membangun usecase tanpa txManager sehingga jalur produksi tidak teruji. Di web, `CancelEnrollmentButton.tsx` hanya menampilkan pesan error bila state `dialogOpen` bernilai true, tetapi state itu tidak pernah di-set true (tombol pemicu hanya memanggil `showModal()`), sehingga parent tidak melihat pesan apa pun saat pembatalan gagal dan baris tetap tampil \"Menunggu pembayaran\".",
    "goal": "Pembatalan enrollment `pending` yang berhasil dijawab 200 sesuai tabel hasil di ADR 0016, dan parent melihat hasil pembatalan (sukses atau pesan error) di halaman enrollments tanpa reload.",
    "requirements": [
      "Academic mengembalikan 200 berisi enrollment `dropped` ketika enrollment `pending` milik parent berhasil dibatalkan melalui jalur transaksi (txManager tersedia).",
      "Enrollment yang sudah `dropped` sebelum request tetap dijawab 409 setelah withdrawal tetap dicoba, sesuai tabel ADR 0016.",
      "Enrollment `active`, `suspended`, dan `completed` tetap 409 sebelum ada pemanggilan billing; invoice yang sudah `paid`/`refunded` tetap 409 tanpa perubahan apa pun.",
      "Web menampilkan pesan error pembatalan (role=alert) di dialog ketika action mengembalikan error, dan menampilkan status sukses lalu memperbarui baris setelah pembatalan berhasil.",
      "Kontrak HTTP, urutan billing-lalu-academic, dan pesan error yang ada tidak berubah."
    ],
    "acceptanceCriteria": [
      "Membatalkan enrollment `pending` dengan invoice belum dibayar menghasilkan 200, enrollment `dropped`, transaksi `cancelled`, dan kursi kembali tersedia.",
      "Di `/dashboard/parent/enrollments`, setelah konfirmasi \"Ya, batalkan\" berhasil, status enrollment tidak lagi tampil sebagai menunggu pembayaran tanpa perlu reload manual.",
      "Ketika pembatalan ditolak (mis. 409), pesan error terlihat di dialog.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Kebenaran urutan dan idempotensi dijelaskan di kelolakelas-docs ADR 0016 (`docs/adr/0016-cancel-pending-enrollment.md`); keputusan itu tidak berubah. `ReleaseEnrollment` di file yang sama memakai pola transaksi serupa tetapi menganggap `dropped` sebagai hasil idempoten sehingga tidak terdampak. Test usecase perlu fake TransactionManager agar jalur transaksi produksi teruji. Risiko utama: mengubah pengecekan status tanpa merusak penolakan 409 untuk enrollment yang sudah `dropped` sebelumnya. Perbarui kelolakelas-docs (`docs/components/academic-service.md` atau `web.md`) bila perilaku yang terdokumentasi berubah.",
    "relevantAreas": [
      "kelolakelas-academic-service/internal/usecase/enrollment_usecase.go",
      "kelolakelas-academic-service/internal/usecase/enrollment_cancel_test.go",
      "kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments/_components/CancelEnrollmentButton.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments/_actions/actions.ts",
      "kelolakelas-web/lib/enrollment-cancellation.ts"
    ],
    "edgeCases": [
      "Dua request pembatalan bersamaan untuk enrollment yang sama: tepat satu 200, yang lain 409.",
      "Callback release dari billing tiba sebelum transaksi academic: hasil akhir tetap `dropped` dan request pertama tidak salah dijawab.",
      "Enrollment `pending` tanpa transaksi billing (invoice tidak pernah dibuat) tetap 200.",
      "Sesi parent kedaluwarsa saat konfirmasi pembatalan."
    ],
    "testingValidation": [
      "Unit test academic dengan fake TransactionManager untuk pending → 200, dropped → 409, active → 409, dan billing menolak → 409.",
      "Vitest `CancelEnrollmentButton` untuk tampilan pesan error dan sukses.",
      "Validasi risiko: reproduksi manual via gateway lokal bahwa pembatalan pending menghasilkan 200 dan pembatalan ulang 409.",
      "Existing tests pass, `go test ./...` dan `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual."
    ],
    "outOfScope": [
      "Perubahan alur pembatalan billing atau job release kursi.",
      "Pembatalan enrollment `active` atau refund."
    ]
  }
}
```
