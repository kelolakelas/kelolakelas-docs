# Discovery — Testing 16 Oktober 2026

## Baseline dan batasan

MODE incremental; FOKUS: sembilan temuan testing terbaru pengguna mengenai lifecycle kelas, voucher datetime, jadwal, chat tenant, dan Owner Account Request. MAKS_ISSUE default 8. Permintaan terbaru menggantikan contoh/requests lama di prompt, sehingga embedded checkout/private-flow requests tidak dimasukkan kembali.

Baseline dibuat melalui `planning.mjs init`; previousRun `2026-10-14_1328`; cutoff Linear `2026-10-14T06:28:20.018Z`. Previous discovery/backlog membahas KEL-129 saja, bukan bukti implementasi scope ini. Baseline tidak diubah.

Fetch berhasil setelah network escalation; main bersih seluruh tujuh repository di-fast-forward-only pull dan sudah up-to-date pada sinkronisasi berhasil. Pembacaan awal identity sebelum retry menunjukkan `docs/platform-factor-key-env`; saat sinkronisasi berikutnya dan baseline branch sudah `main` tanpa checkout oleh run ini. Hasil sesudah fetch: identity HEAD identik origin/main (ahead/behind 0/0). Semua worktree awal bersih. Discovery relevan dilakukan paralel oleh Explore web, academic, gateway, docs dan Linear; billing/identity/chat source dilewati karena tidak diperlukan untuk perubahan UI dan flow yang terbukti. Tidak membaca/mengubah orchestrator kecuali schema/example dan eksekusi schema/validator read-only.

| Repository | Range | Branch |
| --- | --- | --- |
| kelolakelas-web | `b2d8b8c2e1a1..2c4bfe214bba` | `main` |
| kelolakelas-api-gateway | `2f69ab40e022..622e61d835e8` | `main` |
| kelolakelas-identity-service | `0b12aed7e12d..b03a6140eb03` | `main` |
| kelolakelas-academic-service | `e4a67b9168f1..c1ea23e81e54` | `main` |
| kelolakelas-billing-service | `2b2344c7d7a7..2b2344c7d7a7` | `main` |
| kelolakelas-chat-service | `ebaf42b9a69e..4a3f9d6b6bdf` | `main` |
| kelolakelas-docs | `c2f6fed1dd40..844f34b16dfa` | `main` |

Lampiran: catatan testing lengkap dibaca dari pesan pengguna; `LINEAR_PLANNING_PROMPT.md` dibaca. URL localhost Classes, Chat, Members dipakai sebagai identitas halaman dan dipetakan ke source; runtime browser/screenshot tidak tersedia dan URL tidak direproduksi. Karena itu akar modal close dan penilaian styling belum diverifikasi runtime. Laporan pengguna dan source cukup untuk draft gap terarah.

Konflik tooling: prompt workspace secara eksplisit meminta YAML/contracts/render, tetapi docs planning README dan `planning.mjs` kini memakai Markdown-only dan render retired. Instruksi user yang menunjuk prompt didahulukan untuk run ini; tooling repo tidak diubah. Original render gagal retired; npm intake:validate tidak dapat berjalan karena tsx belum terpasang. `render-compat.mjs` memvalidasi actual planning-contract.ts menggunakan native TypeScript Node dengan zod existing milik web, lalu replay renderer historis `ba4f3af` in-memory. `backlog.yaml` memakai JSON subset YAML; `validation.json` mencatat provenance. Ini tidak membuktikan Hermes runtime berjalan atau menerima pekerjaan.

## Coverage dan temuan

| Area | Status current state | Bukti | Gap/peluang | Catatan duplikasi |
| --- | --- | --- | --- | --- |
| Kategori dalam create wizard | Implemented | web CategoryForm.tsx:55; classes/_actions/classActions.ts:189; ClassCreationWizard.tsx:93 | Mutasi terlalu awal; intended advance callback ada, akar modal close Unknown | KEL-190 Done hanya category identity pada list, bukan wizard |
| Class sebelum jadwal | Implemented | web ClassForm.tsx:55; ClassCreationWizard.tsx:98; academic class_creation_usecase.go:53 | Aggregate transaction hanya class+teachers; tidak menerima draft kategori/schedules | Tidak ada issue aktif overlap |
| Aggregate category/class/schedule final | Not found | academic internal/domain/class.go:79; schedule_usecase.go:237 | Kontrak/transaction perlu diperluas; group sessions ikut rollback | Draft API lalu wizard |
| Private create | Implemented | web ClassCreationWizard.tsx:14/:201; academic schedule_usecase.go:277 | Pertahankan tanpa initial timetable karena enrollment required | Bukan gap private scheduling baru |
| Edit kelas | Implemented, parsial | web ClassEditForm.tsx:48/:75; academic class_usecase.go:112/:158; schedule_dto.go:47/:72 | Editor belum mencakup jadwal; capacity/location edit contract terbatas | Tipe immutable adalah constraint, bukan bug |
| Hapus kelas | Implemented backend; Not found UI | academic class_usecase.go:69; class_handler.go:158; web ClassListTable.tsx:249/:326 | Web action/confirmation; preserve 409 enrollment aktif | Backend tests delete_usecase_test.go:252 tersedia |
| Add Schedule | Implemented | web ClassListTable.tsx:250/:327; docs/components/web.md:134 | Hapus setelah editor menggantikan capability | Gabung issue edit agar tidak ada gap akses |
| Schedule form layout | Implemented; visual defect reported | web ScheduleForm.tsx:553/:556/:576/:590 | Alignment/responsive/label association | KEL-193 Done teacher picker; pertahankan |
| Voucher datetime | Implemented; requested defaults Not found | web VoucherForm.tsx:19/:60/:229/:246; voucherActions.ts:59 | Default awal/akhir hari, detik dan timezone roundtrip | KEL-191 Done hanya explanatory copy |
| Tenant chat | Implemented | tenant/chat/page.tsx:6/:34; parent/chat/_components/ChatInbox.tsx:192-203 | Styling shared component; cek regresi parent | KEL-123 Done realtime, bukan styling |
| Creator Request | Implemented di global layout | tenant/layout.tsx:15/:36; tenant/members/page.tsx:70; creator-requests/page.tsx:9 | Visible copy dan tenant placement hanya Members | Platform review tetap dibutuhkan; backend role/API tidak diubah |
| Gateway routes | Implemented | gateway internal/delivery/http/router.go:185-187/:205-210; proxy_handler.go:119/:186/:194 | Existing proxy forwards body; tidak perlu perubahan gateway bila route dipakai ulang | Integration verification saja |
| Docs | Implemented dengan batasan | docs/components/web.md:134/:140/:215; flows/academic.md:23/:27/:31; api/academic.md:241/:243 | Update bersama issue; executive summary/chat component mengandung klaim lama | Klaim CI/chat docs yang stale di luar scope run |

Path web di tabel relatif ke `kelolakelas-web/app/(dashboard)/dashboard/tenant/` kecuali shared parent chat; path academic usecase/domain relatif `kelolakelas-academic-service/internal/`. Rincian path lengkap terdapat payload issue.

## Linear dan dependency

Team KelolaKelas/KEL (`fa7e083f-279c-4075-b103-76c4ed0a9255`); seluruh 33 project terambil tanpa pagination tersisa. List backlog/unstarted/started ditambah Todo/hold: hanya enam backlog KEL-100/101/102/104/155/156, tidak overlap; tidak ada issue aktif relevan. Tidak ada status blocked khusus yang ditemukan dari issue listing. Done sejak cutoff: 16; canceled/duplicate: 0. Detail/relations hanya diperiksa untuk overlap KEL-193, KEL-190, KEL-123, semuanya Done; tidak menjadi blocker baru. KEL-191/KEL-195 adjacent scope berbeda. Tidak ada unresolved external dependency yang terbukti.

Project fitting existing: P-KEL-7 `tenant-selling-operations` untuk lima issue kelas; P-KEL-10 schedule; P-KEL-23 chat; P-KEL-31 voucher; P-KEL-17 member administration. Payload mereferensikan/rekomendasikan reuse P-KEL-7 tanpa membuat project duplikat. Tiga issue terpisah projectKey null agar run tidak membuat project untuk satu issue kecil; existing project alternatif dicatat untuk penempatan opsional. Tidak mewarisi deferred ownership policy P-KEL-17 sebagai blocker wording. Project description generated adalah draft scope run, bukan otorisasi overwrite description existing.

## Kandidat

| Kandidat | Asal | Type | Dampak | Urgensi | Effort | Complexity | Confidence | Dependency | Keputusan |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| atomic-class-creation-api | request 1+4 | Improvement | Cegah partial data | High | L | high: transaksi multi-entity/izin/retry | High static | - | draft |
| deferred-class-creation-wizard | request 1+4 | Improvement | Satu alur create yang utuh | High | M | medium: state+error+private | High gap, medium root modal | atomic API | draft |
| complete-class-editor | request 7+8 | Improvement | Operasi kelas lengkap | High | L | high: enrolled schedule/history | High | wizard model | draft |
| delete-class-action | request 6 | Improvement | Operasi hapus aman | Medium | S | medium: destructive intent/conflict handling | High | - | draft |
| schedule-form-layout | request 3 | Improvement | Usability+accessibility | Medium | S | low: shared form styling | Medium visual; High markup | editor sequencing | draft |
| voucher-day-boundary-defaults | request 2 | Improvement | Ketepatan rentang voucher | Medium | S | medium: detik/timezone | High | - | draft |
| tenant-chat-layout | request 5 | Improvement | Kenyamanan komunikasi | Medium | M | low: layout shared component | Medium tanpa screenshot | - | draft |
| owner-account-request-members-only | request 9 | Improvement | Kejelasan navigasi request | Medium | S | low: copy/placement/guards | High | - | draft |

## Status setiap permintaan testing

| Request | Status | Bukti | Draft key |
| --- | --- | --- | --- |
| 1. Create Category lanjut, simpan pada final | didraft | CategoryForm/ClassCreationWizard dan aggregate contract | atomic-class-creation-api; deferred-class-creation-wizard |
| 2. Voucher 00:00:00/23:59:59 | didraft | VoucherForm dan voucherActions | voucher-day-boundary-defaults |
| 3. Rapikan schedule day/start/end | didraft | ScheduleForm markup | schedule-form-layout |
| 4. Tidak ada category/class/schedule sebelum submit selesai | didraft | Independent writes dan transaksi terpisah | atomic-class-creation-api; deferred-class-creation-wizard |
| 5. Rapikan tenant chat | didraft | Shared ChatInbox | tenant-chat-layout |
| 6. Tambah tombol hapus kelas | didraft | DELETE existing, UI absent | delete-class-action |
| 7. Edit kelas lengkap seperti create | didraft | Mutable fields + schedule contract gap | complete-class-editor |
| 8. Hapus Add Schedule | didraft | Table/card entry existing | complete-class-editor |
| 9. Owner Account Request hanya Members | didraft | Global layout dan dedicated tenant page | owner-account-request-members-only |

Tidak ada kandidat melebihi kuota atau request yang ditunda. Konversi tipe kelas, redesign chat produk baru, ownership policy dan cleanup data parsial lama tidak ditambahkan karena bukan scope yang disepakati. Pengecekan runtime dan akses localhost bukan prasyarat untuk draft, tetapi harus dilakukan pada implementasi.
