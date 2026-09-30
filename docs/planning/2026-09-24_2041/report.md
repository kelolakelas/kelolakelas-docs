# Rencana Linear disetujui — Platform admin KelolaKelas

**Ringkasan eksekutif.** Prioritas utama adalah principal platform admin, approval Creator, dan kontrol konfigurasi lintas lima aplikasi. Saat ini role `Creator` adalah role tenant; undangan tenant dapat memberikannya, sedangkan KEL-79 menunda keputusan kebijakan tersebut. Config aplikasi dan secret dibaca dari environment saat startup. Discovery: 20 Linear Project dan 88 Issue tim KEL, current code/docs pada branch lokal `main`; deployment, secret manager, dan data produksi belum diverifikasi. Project dan 12 issue sudah dibuat di Linear setelah persetujuan; kontrak, relasi, label repository, dan label `ai-ready` telah diverifikasi.

## Status pengiriman ke Linear

Project: [P-KEL-21](https://linear.app/farid-zamani/project/kontrol-platform-terpusat-oleh-platform-admin-df045d911207) (Urgent). Issue: KEL-93 sampai KEL-104. [KEL-79](https://linear.app/farid-zamani/issue/KEL-79) telah direvisi agar kebijakan Creator sesuai request dan approval; terkait dengan KEL-94/KEL-95. Payload di bawah tetap baseline planning tanpa field `source`.

## 1. Coverage dan temuan

| Area | Status current state | Bukti | Gap/peluang | Catatan duplikasi |
| --- | --- | --- | --- | --- |
| Tenant RBAC | Implemented | `identity/seeders/000001_default_permissions_and_roles.sql`; `identity/internal/repository/member_repository.go` | Creator tenant dapat meminta, tetapi tidak dapat memberi Creator tambahan langsung | KEL-79 perlu direvisi; KEL-7/20 selesai |
| Platform principal | Not found | `identity/pkg/jwt/jwt.go`; `gateway/internal/delivery/http/middleware/auth_middleware.go` | Assignment dan namespace platform terpisah | Tidak ada issue platform admin aktif |
| Creator request/approval | Not found | `identity/internal/usecase/invitation_usecase.go`; KEL-79 | Approval terikat target/tenant, audit, idempotensi | KEL-79 overlap parsial pada guard, bukan approval |
| Config aplikasi | Configured | `docs/reference/environment-variables.md`; lima loader config | Inventory, desired/applied state, audit, rollback | Pengaturan tenant KEL-34 berbeda scope |
| Fee platform | Implemented | `billing/internal/usecase/transaction_usecase.go` menerima `platform_fee` dari request | Kebijakan biaya perlu ADR sebelum admin mengubahnya | Belum ada issue formula fee |
| Secret dan deployment | Unknown | Config env di layanan; artefak deployment tidak ditemukan | Secret manager, rollout, rotasi, dan rollback | Dependency eksternal eksplisit |
| Dashboard platform | Not found | `web/lib/auth-routing.ts`; `web/proxy.ts` | UI request, approval, dan konfigurasi | Dashboard tenant yang ada berbeda persona |
| AI orchestrator internal | Configured | `ai-orchestrator/orchestrator.config.example.yaml`; planning contract hanya lima label repo | Perlu perluasan kontrak bila konfigurasi tooling ini ikut dikelola UI | Dikeluarkan dari payload v1, dicatat sebagai follow-up |

## 2. Rekomendasi Linear Project

### [PROJECT] Kontrol platform terpusat oleh platform admin

- **Orchestrator key:** `platform-admin-control-plane`
- **Tujuan/outcome:** Platform admin dapat menyetujui penambahan Creator dan mengendalikan konfigurasi aplikasi KelolaKelas lintas layanan, termasuk rotasi secret, melalui alur terotorisasi dan teraudit.
- **Masalah yang diselesaikan:** Belum ada principal platform admin; tenant dapat mengundang Creator; konfigurasi tersebar di environment statis tanpa control plane atau audit.
- **Nilai dan prioritas:** Urgent; menutup eskalasi Creator dan membangun dasar kontrol lintas tenant; confidence tinggi pada gap autentikasi dan Creator, sedang pada katalog setting; effort total L.
- **Scope:** Principal platform admin dan bootstrap terkontrol.; Permintaan Creator oleh Creator tenant dan persetujuan platform admin.; Inventaris dan kontrol konfigurasi bisnis, finansial, dan operasional di lima repository aplikasi.; Rotasi secret melalui secret manager dan deployment terintegrasi.; Dashboard tenant request dan dashboard platform admin.
- **Di luar scope:** Akses bebas ke data siswa dan transaksi tenant atau impersonasi tenant.; AI orchestrator internal, yang repository-nya belum didukung label oleh planning contract v1.; Mengubah secret menjadi teks yang dapat dibaca kembali dari UI.
- **Success metrics:** Tenant tidak dapat memperoleh Creator tambahan tanpa approval platform admin.; Setiap perubahan konfigurasi dan approval memiliki aktor, waktu, nilai lama/baru atau referensi secret, dan status penerapan.; Setiap key konfigurasi aplikasi punya owner, versi desired/applied, audit, dan jalur perubahan atau rotasi yang teruji.; Secret dapat dirotasi tanpa menampilkan kembali nilainya dan dengan rollback teruji.; Tenant dan parent tidak dapat menggunakan endpoint platform.
- **Dependencies/risiko:** KEL-79 perlu direvisi agar guard Creator tenant sesuai kebijakan baru.; KEL-76 dan KEL-80 terkait revokasi keanggotaan dan role.; Topologi deployment dan secret manager belum ditemukan; integrasi rotasi secret menunggu keputusan serta akses yang terverifikasi.; Konfigurasi AI orchestrator internal memerlukan perluasan kontrak planning/label tersendiri bila dimasukkan pada tahap berikutnya.
- **Issue yang diusulkan:** Platform admin dapat masuk dan hanya mengakses route platform; Creator tenant dapat meminta penambahan Creator untuk tenant sendiri; Platform admin dapat menyetujui atau menolak permintaan Creator dengan audit; Platform admin memiliki katalog konfigurasi terpusat dengan audit dan status penerapan; Platform admin dapat membuka dan menutup pendaftaran tenant baru; Platform admin dapat mengatur visibilitas katalog publik secara konsisten; Platform admin dapat menetapkan biaya platform untuk transaksi baru secara aman; Konfigurasi operasional web dan gateway dapat diterapkan dengan rollback; Konfigurasi operasional identity, academic, dan billing dapat diterapkan dengan rollback; Platform admin dapat merotasi secret layanan tanpa menampilkan nilainya kembali; Creator tenant dapat meminta dan platform admin dapat memutuskan Creator tambahan dari web; Platform admin dapat meninjau, mengubah, dan memantau konfigurasi dari dashboard

### AI Orchestrator Project Contract

```json
{
  "key": "platform-admin-control-plane",
  "name": "Kontrol platform terpusat oleh platform admin",
  "outcome": "Platform admin dapat menyetujui penambahan Creator dan mengendalikan konfigurasi aplikasi KelolaKelas lintas layanan, termasuk rotasi secret, melalui alur terotorisasi dan teraudit.",
  "problem": "Belum ada principal platform admin; tenant dapat mengundang Creator; konfigurasi tersebar di environment statis tanpa control plane atau audit.",
  "valueAndPriority": "Urgent; menutup eskalasi Creator dan membangun dasar kontrol lintas tenant; confidence tinggi pada gap autentikasi dan Creator, sedang pada katalog setting; effort total L.",
  "scope": [
    "Principal platform admin dan bootstrap terkontrol.",
    "Permintaan Creator oleh Creator tenant dan persetujuan platform admin.",
    "Inventaris dan kontrol konfigurasi bisnis, finansial, dan operasional di lima repository aplikasi.",
    "Rotasi secret melalui secret manager dan deployment terintegrasi.",
    "Dashboard tenant request dan dashboard platform admin."
  ],
  "outOfScope": [
    "Akses bebas ke data siswa dan transaksi tenant atau impersonasi tenant.",
    "AI orchestrator internal, yang repository-nya belum didukung label oleh planning contract v1.",
    "Mengubah secret menjadi teks yang dapat dibaca kembali dari UI."
  ],
  "successMetrics": [
    "Tenant tidak dapat memperoleh Creator tambahan tanpa approval platform admin.",
    "Setiap perubahan konfigurasi dan approval memiliki aktor, waktu, nilai lama/baru atau referensi secret, dan status penerapan.",
    "Setiap key konfigurasi aplikasi punya owner, versi desired/applied, audit, dan jalur perubahan atau rotasi yang teruji.",
    "Secret dapat dirotasi tanpa menampilkan kembali nilainya dan dengan rollback teruji.",
    "Tenant dan parent tidak dapat menggunakan endpoint platform."
  ],
  "dependenciesAndRisks": [
    "KEL-79 perlu direvisi agar guard Creator tenant sesuai kebijakan baru.",
    "KEL-76 dan KEL-80 terkait revokasi keanggotaan dan role.",
    "Topologi deployment dan secret manager belum ditemukan; integrasi rotasi secret menunggu keputusan serta akses yang terverifikasi.",
    "Konfigurasi AI orchestrator internal memerlukan perluasan kontrak planning/label tersendiri bila dimasukkan pada tahap berikutnya."
  ]
}
```

## 3. Draft Linear Issue

### [FEATURE] Platform admin dapat masuk dan hanya mengakses route platform

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Kontrol platform terpusat oleh platform admin
- **Type:** `Feature`
- **Priority:** `Urgent`
- **Estimate:** `M`
- **Complexity:** `critical`
- **Complexity rationale:** Risiko akses lintas tenant, eskalasi hak, atau financial/secret correctness; perlu matriks otorisasi dan uji rollback.
- **Labels:** `identity`, `api-gateway`, `ai-ready`
- **Dependencies:** Tidak ada yang diketahui

## Background / Problem

Identity hanya memodelkan tenant_members dan token non-parent tanpa tenant ditolak gateway. Role sistem Creator/Teacher adalah template tenant, bukan principal platform. Tidak ada jalur autentikasi platform admin.

## Goal

Principal platform admin yang dibootstrap secara terkontrol dapat masuk dan memakai route platform, tanpa memperoleh akses tenant secara implisit.

## Requirements

- Sediakan assignment platform admin terpisah dari role dan permission tenant serta bootstrap operator yang tidak tersedia lewat registrasi publik.
- Token dan pemeriksaan identitas platform harus membedakan principal platform dari parent dan anggota tenant; verifikasi tetap memakai state assignment saat request sensitif.
- Gateway dan identity mengizinkan principal platform hanya pada namespace route platform yang terlindungi, dan tetap menolak token tanpa tenant pada route tenant biasa.
- Definisikan prosedur pemulihan akses admin tanpa membuat akun platform admin lewat endpoint publik.

## Acceptance Criteria

- [ ] Admin platform yang dibootstrap dapat login dan mengakses endpoint identitas platform.
- [ ] Tenant Creator, role custom, parent, dan token palsu/tidak aktif menerima 403/401 pada route platform.
- [ ] Platform admin tanpa membership tenant tidak dapat memakai route tenant hanya karena berstatus admin.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko utama adalah eskalasi lintas tenant atau lockout semua admin. Jangan menambahkan permission platform ke seed Creator yang CROSS JOIN seluruh permission. Uji matriks principal dan revokasi assignment; dokumentasikan bootstrap serta recovery. Keputusan rinci bentuk tabel/claim mengikuti ADR saat implementasi.

Relevant areas:

- `kelolakelas-identity-service/internal/usecase/auth_usecase.go`
- `kelolakelas-identity-service/pkg/jwt/jwt.go`
- `kelolakelas-identity-service/migrations`
- `kelolakelas-api-gateway/internal/delivery/http/middleware/auth_middleware.go`

## Edge Cases

- Admin kehilangan assignment saat JWT lama masih berlaku.
- Akun yang juga anggota tenant melakukan operasi platform dan tenant.
- Bootstrap dijalankan dua kali atau admin terakhir dinonaktifkan.

## Testing / Validation

- [ ] Mitigasi risiko: test matriks admin, tenant Creator, parent, token lama, dan assignment yang dicabut pada identity dan gateway.
- [ ] Verifikasi bootstrap idempotent dan jalur recovery teruji.
- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Pemberian Creator tambahan dan konfigurasi platform.
- UI admin platform.
- Perubahan permission tenant umum.

## AI Orchestrator Contract

```json
{
  "draftKey": "platform-admin-principal",
  "projectKey": "platform-admin-control-plane",
  "title": "Platform admin dapat masuk dan hanya mengakses route platform",
  "type": "Feature",
  "priority": "Urgent",
  "estimate": "M",
  "complexity": "critical",
  "labels": [
    "identity",
    "api-gateway",
    "ai-ready"
  ],
  "repositories": [
    "identity",
    "api-gateway"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Identity hanya memodelkan tenant_members dan token non-parent tanpa tenant ditolak gateway. Role sistem Creator/Teacher adalah template tenant, bukan principal platform. Tidak ada jalur autentikasi platform admin.",
    "goal": "Principal platform admin yang dibootstrap secara terkontrol dapat masuk dan memakai route platform, tanpa memperoleh akses tenant secara implisit.",
    "requirements": [
      "Sediakan assignment platform admin terpisah dari role dan permission tenant serta bootstrap operator yang tidak tersedia lewat registrasi publik.",
      "Token dan pemeriksaan identitas platform harus membedakan principal platform dari parent dan anggota tenant; verifikasi tetap memakai state assignment saat request sensitif.",
      "Gateway dan identity mengizinkan principal platform hanya pada namespace route platform yang terlindungi, dan tetap menolak token tanpa tenant pada route tenant biasa.",
      "Definisikan prosedur pemulihan akses admin tanpa membuat akun platform admin lewat endpoint publik."
    ],
    "acceptanceCriteria": [
      "Admin platform yang dibootstrap dapat login dan mengakses endpoint identitas platform.",
      "Tenant Creator, role custom, parent, dan token palsu/tidak aktif menerima 403/401 pada route platform.",
      "Platform admin tanpa membership tenant tidak dapat memakai route tenant hanya karena berstatus admin.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko utama adalah eskalasi lintas tenant atau lockout semua admin. Jangan menambahkan permission platform ke seed Creator yang CROSS JOIN seluruh permission. Uji matriks principal dan revokasi assignment; dokumentasikan bootstrap serta recovery. Keputusan rinci bentuk tabel/claim mengikuti ADR saat implementasi.",
    "relevantAreas": [
      "kelolakelas-identity-service/internal/usecase/auth_usecase.go",
      "kelolakelas-identity-service/pkg/jwt/jwt.go",
      "kelolakelas-identity-service/migrations",
      "kelolakelas-api-gateway/internal/delivery/http/middleware/auth_middleware.go"
    ],
    "edgeCases": [
      "Admin kehilangan assignment saat JWT lama masih berlaku.",
      "Akun yang juga anggota tenant melakukan operasi platform dan tenant.",
      "Bootstrap dijalankan dua kali atau admin terakhir dinonaktifkan."
    ],
    "testingValidation": [
      "Mitigasi risiko: test matriks admin, tenant Creator, parent, token lama, dan assignment yang dicabut pada identity dan gateway.",
      "Verifikasi bootstrap idempotent dan jalur recovery teruji.",
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Pemberian Creator tambahan dan konfigurasi platform.",
      "UI admin platform.",
      "Perubahan permission tenant umum."
    ]
  }
}
```

### [FEATURE] Creator tenant dapat meminta penambahan Creator untuk tenant sendiri

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Kontrol platform terpusat oleh platform admin
- **Type:** `Feature`
- **Priority:** `Urgent`
- **Estimate:** `M`
- **Complexity:** `high`
- **Complexity rationale:** Boundary otorisasi atau perubahan perilaku lintas komponen memerlukan uji negatif dan kompatibilitas.
- **Labels:** `identity`, `api-gateway`, `ai-ready`
- **Dependencies:** `platform-admin-principal`

## Background / Problem

KEL-79 menunda kebijakan Creator. Saat ini undangan tenant dapat memilih Creator dan update role dapat menarget Creator, sehingga hak penuh dapat diberikan tanpa review. Arahan baru mensyaratkan permintaan oleh Creator tenant dan persetujuan platform admin.

## Goal

Creator tenant dapat mengajukan permintaan Creator tambahan untuk anggota atau calon anggota tenant sendiri tanpa langsung memberi hak tersebut.

## Requirements

- Tolak target Creator pada invitation dan update role tenant yang ada, termasuk bila caller Creator.
- Sediakan permintaan Creator yang hanya dapat dibuat Creator aktif dari tenant sendiri, dengan target email/user, alasan, dan status pending; pemohon tidak dapat memilih tenant lain.
- Cegah request ganda yang masih pending dan jangan memberi role Creator sebelum persetujuan.
- Pertahankan registrasi tenant yang memberi Creator pertama; revisi requirement Creator pada KEL-79 agar selaras.

## Acceptance Criteria

- [ ] Creator tenant dapat membuat dan melihat permintaan untuk tenant sendiri.
- [ ] Teacher, custom role, parent, dan Creator dari tenant lain tidak dapat mengajukan atau melihat request tersebut.
- [ ] Invitation/update role tenant ke Creator menerima 403 dan tidak mengubah keanggotaan.
- [ ] Request pending tidak mengubah role target.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko utama eskalasi lintas tenant lewat target request atau jalur lama invitation/update role. Guard harus di use case dan transaction boundary, bukan UI. KEL-79 terkait tetapi tidak memuat request/approval platform; revisi KEL-79 sebelum implementasi agar tidak ada requirement bertentangan.

Relevant areas:

- `kelolakelas-identity-service/internal/usecase/invitation_usecase.go`
- `kelolakelas-identity-service/internal/repository/member_repository.go`
- `kelolakelas-identity-service/internal/usecase/member_usecase.go`
- `kelolakelas-api-gateway/internal/delivery/http/router.go`

## Edge Cases

- Target sudah Creator.
- Dua request pending untuk target sama.
- Creator pemohon kehilangan role saat request masih pending.

## Testing / Validation

- [ ] Mitigasi risiko: test matriks principal dan tenant target pada request, invitation, serta update role.
- [ ] Test tidak ada role assignment sebelum approval.
- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Approval dan pemberian Creator oleh platform admin.
- Demosi atau pencabutan Creator.
- Perubahan role Teacher yang tetap pada KEL-79.

## AI Orchestrator Contract

```json
{
  "draftKey": "creator-request",
  "projectKey": "platform-admin-control-plane",
  "title": "Creator tenant dapat meminta penambahan Creator untuk tenant sendiri",
  "type": "Feature",
  "priority": "Urgent",
  "estimate": "M",
  "complexity": "high",
  "labels": [
    "identity",
    "api-gateway",
    "ai-ready"
  ],
  "repositories": [
    "identity",
    "api-gateway"
  ],
  "blockedByDraftKeys": [
    "platform-admin-principal"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "KEL-79 menunda kebijakan Creator. Saat ini undangan tenant dapat memilih Creator dan update role dapat menarget Creator, sehingga hak penuh dapat diberikan tanpa review. Arahan baru mensyaratkan permintaan oleh Creator tenant dan persetujuan platform admin.",
    "goal": "Creator tenant dapat mengajukan permintaan Creator tambahan untuk anggota atau calon anggota tenant sendiri tanpa langsung memberi hak tersebut.",
    "requirements": [
      "Tolak target Creator pada invitation dan update role tenant yang ada, termasuk bila caller Creator.",
      "Sediakan permintaan Creator yang hanya dapat dibuat Creator aktif dari tenant sendiri, dengan target email/user, alasan, dan status pending; pemohon tidak dapat memilih tenant lain.",
      "Cegah request ganda yang masih pending dan jangan memberi role Creator sebelum persetujuan.",
      "Pertahankan registrasi tenant yang memberi Creator pertama; revisi requirement Creator pada KEL-79 agar selaras."
    ],
    "acceptanceCriteria": [
      "Creator tenant dapat membuat dan melihat permintaan untuk tenant sendiri.",
      "Teacher, custom role, parent, dan Creator dari tenant lain tidak dapat mengajukan atau melihat request tersebut.",
      "Invitation/update role tenant ke Creator menerima 403 dan tidak mengubah keanggotaan.",
      "Request pending tidak mengubah role target.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko utama eskalasi lintas tenant lewat target request atau jalur lama invitation/update role. Guard harus di use case dan transaction boundary, bukan UI. KEL-79 terkait tetapi tidak memuat request/approval platform; revisi KEL-79 sebelum implementasi agar tidak ada requirement bertentangan.",
    "relevantAreas": [
      "kelolakelas-identity-service/internal/usecase/invitation_usecase.go",
      "kelolakelas-identity-service/internal/repository/member_repository.go",
      "kelolakelas-identity-service/internal/usecase/member_usecase.go",
      "kelolakelas-api-gateway/internal/delivery/http/router.go"
    ],
    "edgeCases": [
      "Target sudah Creator.",
      "Dua request pending untuk target sama.",
      "Creator pemohon kehilangan role saat request masih pending."
    ],
    "testingValidation": [
      "Mitigasi risiko: test matriks principal dan tenant target pada request, invitation, serta update role.",
      "Test tidak ada role assignment sebelum approval.",
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Approval dan pemberian Creator oleh platform admin.",
      "Demosi atau pencabutan Creator.",
      "Perubahan role Teacher yang tetap pada KEL-79."
    ]
  }
}
```

### [FEATURE] Platform admin dapat menyetujui atau menolak permintaan Creator dengan audit

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Kontrol platform terpusat oleh platform admin
- **Type:** `Feature`
- **Priority:** `Urgent`
- **Estimate:** `M`
- **Complexity:** `critical`
- **Complexity rationale:** Risiko akses lintas tenant, eskalasi hak, atau financial/secret correctness; perlu matriks otorisasi dan uji rollback.
- **Labels:** `identity`, `api-gateway`, `ai-ready`
- **Dependencies:** `creator-request`

## Background / Problem

Permintaan Creator harus diputuskan oleh platform admin; saat ini tidak ada approval state, tindakan lintas tenant, atau audit keputusan untuk pemberian role ini.

## Goal

Hanya platform admin dapat memutuskan permintaan Creator pending dan keputusan yang disetujui memberi role ke target pada tenant yang tepat.

## Requirements

- Platform admin dapat melihat request pending lintas tenant beserta tenant, target, pemohon, alasan, dan waktu.
- Approve/reject mencatat aktor, keputusan, waktu, dan alasan penolakan; approval atomik dengan pemberian Creator.
- Validasi ulang status tenant, target, pemohon, dan request saat keputusan dibuat; keputusan sekali saja dan aman terhadap request serentak.
- Untuk target yang belum menjadi anggota, approval membuat undangan Creator terikat email target; role baru diberikan hanya ketika undangan diterima oleh akun dengan email tersebut.

## Acceptance Criteria

- [ ] Approval admin pada request valid memberi Creator kepada target tepat satu kali dan mencatat audit.
- [ ] Approval untuk email baru menghasilkan undangan terikat email; role Creator baru muncul setelah penerimaan sah.
- [ ] Reject menyimpan alasan dan tidak mengubah role target.
- [ ] Tenant, parent, dan token admin yang dicabut menerima 403.
- [ ] Request usang, terduplikasi, atau target tidak valid tidak menghasilkan assignment Creator.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko utama eskalasi lintas tenant, approval replay, dan role diberikan kepada email yang berubah pemilik. Ikat keputusan pada tenant, target akun/email terverifikasi, status pemohon, serta transaksi/idempotensi. Target belum terdaftar menerima undangan yang dapat ditebus hanya oleh email target; keputusan approved_pending_acceptance belum memberi role. Jangan memberi admin akses tenant umum.

Relevant areas:

- `kelolakelas-identity-service/internal/usecase`
- `kelolakelas-identity-service/internal/repository`
- `kelolakelas-identity-service/migrations`
- `kelolakelas-api-gateway/internal/delivery/http/router.go`

## Edge Cases

- Target mendaftar atau pindah role selama request pending.
- Admin ganda memutuskan request yang sama.
- Tenant dinonaktifkan sebelum approval.

## Testing / Validation

- [ ] Mitigasi risiko: test konkurensi approve/reject serta tenant mismatch dan approval replay.
- [ ] Uji target yang sudah dan belum memiliki akun tanpa pemberian Creator prematur.
- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- UI dashboard approval.
- Pencabutan Creator.
- Pengelolaan tenant sebagai admin umum.

## AI Orchestrator Contract

```json
{
  "draftKey": "creator-approval",
  "projectKey": "platform-admin-control-plane",
  "title": "Platform admin dapat menyetujui atau menolak permintaan Creator dengan audit",
  "type": "Feature",
  "priority": "Urgent",
  "estimate": "M",
  "complexity": "critical",
  "labels": [
    "identity",
    "api-gateway",
    "ai-ready"
  ],
  "repositories": [
    "identity",
    "api-gateway"
  ],
  "blockedByDraftKeys": [
    "creator-request"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Permintaan Creator harus diputuskan oleh platform admin; saat ini tidak ada approval state, tindakan lintas tenant, atau audit keputusan untuk pemberian role ini.",
    "goal": "Hanya platform admin dapat memutuskan permintaan Creator pending dan keputusan yang disetujui memberi role ke target pada tenant yang tepat.",
    "requirements": [
      "Platform admin dapat melihat request pending lintas tenant beserta tenant, target, pemohon, alasan, dan waktu.",
      "Approve/reject mencatat aktor, keputusan, waktu, dan alasan penolakan; approval atomik dengan pemberian Creator.",
      "Validasi ulang status tenant, target, pemohon, dan request saat keputusan dibuat; keputusan sekali saja dan aman terhadap request serentak.",
      "Untuk target yang belum menjadi anggota, approval membuat undangan Creator terikat email target; role baru diberikan hanya ketika undangan diterima oleh akun dengan email tersebut."
    ],
    "acceptanceCriteria": [
      "Approval admin pada request valid memberi Creator kepada target tepat satu kali dan mencatat audit.",
      "Approval untuk email baru menghasilkan undangan terikat email; role Creator baru muncul setelah penerimaan sah.",
      "Reject menyimpan alasan dan tidak mengubah role target.",
      "Tenant, parent, dan token admin yang dicabut menerima 403.",
      "Request usang, terduplikasi, atau target tidak valid tidak menghasilkan assignment Creator.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko utama eskalasi lintas tenant, approval replay, dan role diberikan kepada email yang berubah pemilik. Ikat keputusan pada tenant, target akun/email terverifikasi, status pemohon, serta transaksi/idempotensi. Target belum terdaftar menerima undangan yang dapat ditebus hanya oleh email target; keputusan approved_pending_acceptance belum memberi role. Jangan memberi admin akses tenant umum.",
    "relevantAreas": [
      "kelolakelas-identity-service/internal/usecase",
      "kelolakelas-identity-service/internal/repository",
      "kelolakelas-identity-service/migrations",
      "kelolakelas-api-gateway/internal/delivery/http/router.go"
    ],
    "edgeCases": [
      "Target mendaftar atau pindah role selama request pending.",
      "Admin ganda memutuskan request yang sama.",
      "Tenant dinonaktifkan sebelum approval."
    ],
    "testingValidation": [
      "Mitigasi risiko: test konkurensi approve/reject serta tenant mismatch dan approval replay.",
      "Uji target yang sudah dan belum memiliki akun tanpa pemberian Creator prematur.",
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "UI dashboard approval.",
      "Pencabutan Creator.",
      "Pengelolaan tenant sebagai admin umum."
    ]
  }
}
```

### [FEATURE] Platform admin memiliki katalog konfigurasi terpusat dengan audit dan status penerapan

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Kontrol platform terpusat oleh platform admin
- **Type:** `Feature`
- **Priority:** `Urgent`
- **Estimate:** `L`
- **Complexity:** `very-high`
- **Complexity rationale:** Lintas layanan dan rollout sebagian dapat memecah konsistensi konfigurasi; perlu status per consumer dan rollback.
- **Labels:** `identity`, `api-gateway`, `ai-ready`
- **Dependencies:** `platform-admin-principal`

## Background / Problem

Konfigurasi aplikasi tersebar di environment web, gateway, identity, academic, dan billing. Tidak ada inventory managed settings, API platform, history, atau penanda nilai sudah diterapkan; secret tidak boleh dibaca kembali.

## Goal

Admin platform dapat mengetahui seluruh konfigurasi aplikasi yang didukung, mengajukan perubahan bertipe, serta melihat audit dan status penerapannya.

## Requirements

- Inventaris setiap setting aktif pada lima aplikasi dengan owner, tipe, default, sensitivitas, validasi, dan cara penerapan (dinamis/restart/rotasi), termasuk bootstrap-only yang tetap butuh jalur operator terkontrol.
- Sediakan control plane hanya untuk admin, allowlist key dan typed validation, optimistic versioning, audit aktor dan perubahan; secret hanya metadata/referensi dan never-read-back.
- Bedakan requested, applied, failed, dan rollback state sehingga UI tidak mengklaim nilai aktif sebelum consumer menerapkannya.
- Pertahankan nilai efektif lama selama migrasi; definisikan kontrak konsumsi dan prosedur pemulihan bila control plane tidak tersedia.

## Acceptance Criteria

- [ ] Admin dapat melihat inventory lengkap dan status setiap setting tanpa nilai secret plaintext.
- [ ] Perubahan non-secret yang valid menghasilkan versi dan audit; key tidak dikenal atau nilai invalid ditolak.
- [ ] Konflik versi dan kegagalan penerapan dilaporkan tanpa mengklaim sukses.
- [ ] Tenant dan parent tidak dapat membaca metadata sensitif atau mengubah setting.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko utama control plane menjadi single point of failure dan membuka secret. Pisahkan desired/applied state, gunakan allowlist, redaksi, dan last-known-good untuk consumer sesuai kelas setting. Topologi deployment belum ditemukan, sehingga mekanisme penerapan lintas proses memerlukan ADR dan bukti integrasi sebelum rotasi secret. Inventaris harus dibandingkan dengan docs/reference/environment-variables.md dan source saat implementasi.

Relevant areas:

- `kelolakelas-identity-service/migrations`
- `kelolakelas-identity-service/internal/config/config.go`
- `kelolakelas-api-gateway/internal/delivery/http/router.go`
- `kelolakelas-docs/docs/reference/environment-variables.md`

## Edge Cases

- Dua admin mengubah setting bersamaan.
- Control plane mati ketika service mulai atau berjalan.
- Secret diubah tetapi konsumen belum menerapkan versi baru.

## Testing / Validation

- [ ] Mitigasi risiko: test redaksi secret, akses tenant/parent, version conflict, dan last-known-good.
- [ ] Validasi inventory terhadap seluruh key yang dibaca oleh lima aplikasi.
- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Implementasi adapter consumer per layanan.
- Rotasi secret pada deployment.
- UI pengaturan.

## AI Orchestrator Contract

```json
{
  "draftKey": "platform-config-control-plane",
  "projectKey": "platform-admin-control-plane",
  "title": "Platform admin memiliki katalog konfigurasi terpusat dengan audit dan status penerapan",
  "type": "Feature",
  "priority": "Urgent",
  "estimate": "L",
  "complexity": "very-high",
  "labels": [
    "identity",
    "api-gateway",
    "ai-ready"
  ],
  "repositories": [
    "identity",
    "api-gateway"
  ],
  "blockedByDraftKeys": [
    "platform-admin-principal"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Konfigurasi aplikasi tersebar di environment web, gateway, identity, academic, dan billing. Tidak ada inventory managed settings, API platform, history, atau penanda nilai sudah diterapkan; secret tidak boleh dibaca kembali.",
    "goal": "Admin platform dapat mengetahui seluruh konfigurasi aplikasi yang didukung, mengajukan perubahan bertipe, serta melihat audit dan status penerapannya.",
    "requirements": [
      "Inventaris setiap setting aktif pada lima aplikasi dengan owner, tipe, default, sensitivitas, validasi, dan cara penerapan (dinamis/restart/rotasi), termasuk bootstrap-only yang tetap butuh jalur operator terkontrol.",
      "Sediakan control plane hanya untuk admin, allowlist key dan typed validation, optimistic versioning, audit aktor dan perubahan; secret hanya metadata/referensi dan never-read-back.",
      "Bedakan requested, applied, failed, dan rollback state sehingga UI tidak mengklaim nilai aktif sebelum consumer menerapkannya.",
      "Pertahankan nilai efektif lama selama migrasi; definisikan kontrak konsumsi dan prosedur pemulihan bila control plane tidak tersedia."
    ],
    "acceptanceCriteria": [
      "Admin dapat melihat inventory lengkap dan status setiap setting tanpa nilai secret plaintext.",
      "Perubahan non-secret yang valid menghasilkan versi dan audit; key tidak dikenal atau nilai invalid ditolak.",
      "Konflik versi dan kegagalan penerapan dilaporkan tanpa mengklaim sukses.",
      "Tenant dan parent tidak dapat membaca metadata sensitif atau mengubah setting.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko utama control plane menjadi single point of failure dan membuka secret. Pisahkan desired/applied state, gunakan allowlist, redaksi, dan last-known-good untuk consumer sesuai kelas setting. Topologi deployment belum ditemukan, sehingga mekanisme penerapan lintas proses memerlukan ADR dan bukti integrasi sebelum rotasi secret. Inventaris harus dibandingkan dengan docs/reference/environment-variables.md dan source saat implementasi.",
    "relevantAreas": [
      "kelolakelas-identity-service/migrations",
      "kelolakelas-identity-service/internal/config/config.go",
      "kelolakelas-api-gateway/internal/delivery/http/router.go",
      "kelolakelas-docs/docs/reference/environment-variables.md"
    ],
    "edgeCases": [
      "Dua admin mengubah setting bersamaan.",
      "Control plane mati ketika service mulai atau berjalan.",
      "Secret diubah tetapi konsumen belum menerapkan versi baru."
    ],
    "testingValidation": [
      "Mitigasi risiko: test redaksi secret, akses tenant/parent, version conflict, dan last-known-good.",
      "Validasi inventory terhadap seluruh key yang dibaca oleh lima aplikasi.",
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Implementasi adapter consumer per layanan.",
      "Rotasi secret pada deployment.",
      "UI pengaturan."
    ]
  }
}
```

### [FEATURE] Platform admin dapat membuka dan menutup pendaftaran tenant baru

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Kontrol platform terpusat oleh platform admin
- **Type:** `Feature`
- **Priority:** `Urgent`
- **Estimate:** `M`
- **Complexity:** `high`
- **Complexity rationale:** Boundary otorisasi atau perubahan perilaku lintas komponen memerlukan uji negatif dan kompatibilitas.
- **Labels:** `identity`, `api-gateway`, `ai-ready`
- **Dependencies:** `platform-config-control-plane`

## Background / Problem

POST /tenants/register saat ini publik dan selalu dapat membuat tenant serta Creator pertama. Platform admin belum dapat mengendalikan onboarding tanpa deployment.

## Goal

Setting platform untuk penerimaan tenant baru berlaku pada registrasi dan dapat diamati oleh admin.

## Requirements

- Setting boolean bertipe memiliki default yang mempertahankan registrasi aktif.
- Registrasi memeriksa nilai efektif sebelum membuat user, tenant, wallet, atau Creator.
- Admin melihat desired/applied version dan audit; penolakan registrasi memberi respons domain stabil.
- Login dan bootstrap platform admin tetap tersedia saat registrasi ditutup.

## Acceptance Criteria

- [ ] Saat aktif registrasi tetap berhasil; saat nonaktif respons penolakan jelas tanpa record parsial.
- [ ] Perubahan status tercermin pada versi applied identity.
- [ ] Tenant dan parent tidak dapat mengubah setting.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko utama race saat policy dinonaktifkan dan record parsial. Terapkan pemeriksaan dekat transaksi pendaftaran dan test perubahan serentak; kebijakan outage harus fail-closed untuk registrasi baru.

Relevant areas:

- `kelolakelas-identity-service/internal/usecase/tenant_usecase.go`
- `kelolakelas-identity-service/internal/repository/user_repository.go`
- `kelolakelas-api-gateway/internal/delivery/http/router.go`

## Edge Cases

- Registrasi berlangsung saat admin menutup policy.
- Store config tidak tersedia.
- Admin menutup registrasi ketika belum ada tenant.

## Testing / Validation

- [ ] Mitigasi risiko: test konkurensi perubahan policy dengan registrasi dan rollback tanpa data parsial.
- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Visibilitas katalog.
- Biaya platform.
- Pengubahan tenant yang sudah ada.

## AI Orchestrator Contract

```json
{
  "draftKey": "platform-registration-policy",
  "projectKey": "platform-admin-control-plane",
  "title": "Platform admin dapat membuka dan menutup pendaftaran tenant baru",
  "type": "Feature",
  "priority": "Urgent",
  "estimate": "M",
  "complexity": "high",
  "labels": [
    "identity",
    "api-gateway",
    "ai-ready"
  ],
  "repositories": [
    "identity",
    "api-gateway"
  ],
  "blockedByDraftKeys": [
    "platform-config-control-plane"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "POST /tenants/register saat ini publik dan selalu dapat membuat tenant serta Creator pertama. Platform admin belum dapat mengendalikan onboarding tanpa deployment.",
    "goal": "Setting platform untuk penerimaan tenant baru berlaku pada registrasi dan dapat diamati oleh admin.",
    "requirements": [
      "Setting boolean bertipe memiliki default yang mempertahankan registrasi aktif.",
      "Registrasi memeriksa nilai efektif sebelum membuat user, tenant, wallet, atau Creator.",
      "Admin melihat desired/applied version dan audit; penolakan registrasi memberi respons domain stabil.",
      "Login dan bootstrap platform admin tetap tersedia saat registrasi ditutup."
    ],
    "acceptanceCriteria": [
      "Saat aktif registrasi tetap berhasil; saat nonaktif respons penolakan jelas tanpa record parsial.",
      "Perubahan status tercermin pada versi applied identity.",
      "Tenant dan parent tidak dapat mengubah setting.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko utama race saat policy dinonaktifkan dan record parsial. Terapkan pemeriksaan dekat transaksi pendaftaran dan test perubahan serentak; kebijakan outage harus fail-closed untuk registrasi baru.",
    "relevantAreas": [
      "kelolakelas-identity-service/internal/usecase/tenant_usecase.go",
      "kelolakelas-identity-service/internal/repository/user_repository.go",
      "kelolakelas-api-gateway/internal/delivery/http/router.go"
    ],
    "edgeCases": [
      "Registrasi berlangsung saat admin menutup policy.",
      "Store config tidak tersedia.",
      "Admin menutup registrasi ketika belum ada tenant."
    ],
    "testingValidation": [
      "Mitigasi risiko: test konkurensi perubahan policy dengan registrasi dan rollback tanpa data parsial.",
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Visibilitas katalog.",
      "Biaya platform.",
      "Pengubahan tenant yang sudah ada."
    ]
  }
}
```

### [FEATURE] Platform admin dapat mengatur visibilitas katalog publik secara konsisten

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Kontrol platform terpusat oleh platform admin
- **Type:** `Feature`
- **Priority:** `High`
- **Estimate:** `M`
- **Complexity:** `high`
- **Complexity rationale:** Boundary otorisasi atau perubahan perilaku lintas komponen memerlukan uji negatif dan kompatibilitas.
- **Labels:** `identity`, `academic`, `api-gateway`, `ai-ready`
- **Dependencies:** `platform-config-control-plane`

## Background / Problem

Katalog publik saat ini menampilkan kelas published/open milik tenant aktif, dengan snapshot tenant di academic. Tidak ada sakelar global platform atau status applied lintas list/detail.

## Goal

Admin dapat membuka atau menutup katalog publik tanpa mengubah kelas dan tenant, dengan hasil konsisten pada daftar dan detail.

## Requirements

- Setting boolean bertipe default aktif mempertahankan perilaku katalog saat ini.
- List dan detail katalog memakai kebijakan efektif yang sama; saat ditutup respons publik jelas dan data kelas tetap ada.
- Admin melihat versi applied academic dan dapat rollback.
- Jika konfigurasi tidak dapat dipercaya, jangan bocorkan kelas yang seharusnya tersembunyi.

## Acceptance Criteria

- [ ] Saat aktif list/detail seperti sekarang; saat nonaktif keduanya tidak menampilkan kelas.
- [ ] Kelas dan tenant tidak berubah saat policy ditutup atau dibuka kembali.
- [ ] Versi applied dan audit tersedia untuk admin.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko utama list dan detail berbeda kebijakan atau cache snapshot menampilkan konten lama. Uji kedua route, cache/freshness, dan policy outage. Jangan ubah aturan published/open yang sudah ada.

Relevant areas:

- `kelolakelas-academic-service/internal/usecase/catalog_usecase.go`
- `kelolakelas-academic-service/internal/repository/catalog_repository.go`
- `kelolakelas-identity-service/internal/config/config.go`
- `kelolakelas-api-gateway/internal/delivery/http/router.go`

## Edge Cases

- Setting ditutup di tengah pagination.
- Snapshot tenant masih segar saat policy berubah.
- Control plane tidak tersedia.

## Testing / Validation

- [ ] Mitigasi risiko: test list/detail dan cache saat policy berubah serta saat control plane mati.
- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Moderasi kelas per tenant.
- Pencarian/ranking katalog.
- Harga kelas.

## AI Orchestrator Contract

```json
{
  "draftKey": "platform-catalog-policy",
  "projectKey": "platform-admin-control-plane",
  "title": "Platform admin dapat mengatur visibilitas katalog publik secara konsisten",
  "type": "Feature",
  "priority": "High",
  "estimate": "M",
  "complexity": "high",
  "labels": [
    "identity",
    "academic",
    "api-gateway",
    "ai-ready"
  ],
  "repositories": [
    "identity",
    "academic",
    "api-gateway"
  ],
  "blockedByDraftKeys": [
    "platform-config-control-plane"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Katalog publik saat ini menampilkan kelas published/open milik tenant aktif, dengan snapshot tenant di academic. Tidak ada sakelar global platform atau status applied lintas list/detail.",
    "goal": "Admin dapat membuka atau menutup katalog publik tanpa mengubah kelas dan tenant, dengan hasil konsisten pada daftar dan detail.",
    "requirements": [
      "Setting boolean bertipe default aktif mempertahankan perilaku katalog saat ini.",
      "List dan detail katalog memakai kebijakan efektif yang sama; saat ditutup respons publik jelas dan data kelas tetap ada.",
      "Admin melihat versi applied academic dan dapat rollback.",
      "Jika konfigurasi tidak dapat dipercaya, jangan bocorkan kelas yang seharusnya tersembunyi."
    ],
    "acceptanceCriteria": [
      "Saat aktif list/detail seperti sekarang; saat nonaktif keduanya tidak menampilkan kelas.",
      "Kelas dan tenant tidak berubah saat policy ditutup atau dibuka kembali.",
      "Versi applied dan audit tersedia untuk admin.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko utama list dan detail berbeda kebijakan atau cache snapshot menampilkan konten lama. Uji kedua route, cache/freshness, dan policy outage. Jangan ubah aturan published/open yang sudah ada.",
    "relevantAreas": [
      "kelolakelas-academic-service/internal/usecase/catalog_usecase.go",
      "kelolakelas-academic-service/internal/repository/catalog_repository.go",
      "kelolakelas-identity-service/internal/config/config.go",
      "kelolakelas-api-gateway/internal/delivery/http/router.go"
    ],
    "edgeCases": [
      "Setting ditutup di tengah pagination.",
      "Snapshot tenant masih segar saat policy berubah.",
      "Control plane tidak tersedia."
    ],
    "testingValidation": [
      "Mitigasi risiko: test list/detail dan cache saat policy berubah serta saat control plane mati.",
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Moderasi kelas per tenant.",
      "Pencarian/ranking katalog.",
      "Harga kelas."
    ]
  }
}
```

### [FEATURE] Platform admin dapat menetapkan biaya platform untuk transaksi baru secara aman

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Kontrol platform terpusat oleh platform admin
- **Type:** `Feature`
- **Priority:** `High`
- **Estimate:** `M`
- **Complexity:** `critical`
- **Complexity rationale:** Risiko akses lintas tenant, eskalasi hak, atau financial/secret correctness; perlu matriks otorisasi dan uji rollback.
- **Labels:** `identity`, `billing`, `api-gateway`, `ai-ready`
- **Dependencies:** `platform-config-control-plane`; eksternal: `platform-fee-business-policy`

## Background / Problem

Billing saat ini menerima platform_fee dari request internal dan menghitung net_amount dari nilai tersebut. Belum ada formula atau sumber kebijakan platform yang disetujui.

## Goal

Admin dapat mengubah biaya platform yang hanya berlaku pada transaksi baru menurut kebijakan bisnis yang disetujui, dengan jejak versi.

## Requirements

- Tentukan tipe, batas, dan formula fee dari ADR bisnis; editor hanya menerima nilai valid.
- Billing memakai kebijakan terpusat sebagai sumber otoritatif untuk transaksi baru dan menyimpan versi yang dipakai.
- Invoice/transaksi lama tidak dihitung ulang ketika nilai fee berubah.
- Admin dapat melihat nilai efektif, histori, dan status penerapan billing.

## Acceptance Criteria

- [ ] Transaksi baru memakai fee dan versi policy yang benar.
- [ ] Transaksi lama dan invoice yang sudah dibuat tidak berubah.
- [ ] Input fee invalid atau policy belum applied tidak menghasilkan invoice dengan fee salah.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko utama financial correctness. Formula belum ada dan tidak boleh diasumsikan dari field platform_fee. Issue tidak executable sebelum ADR bisnis disetujui. Uji rounding, batas, perubahan di tengah checkout, dan rollback.

Relevant areas:

- `kelolakelas-billing-service/internal/usecase/transaction_usecase.go`
- `kelolakelas-billing-service/internal/domain/transaction.go`
- `kelolakelas-identity-service/migrations`
- `kelolakelas-api-gateway/internal/delivery/http/router.go`

## Edge Cases

- Checkout dimulai sebelum fee berubah dan selesai sesudahnya.
- Fee melebihi gross amount.
- Subscription renewal memakai versi berbeda dari transaksi awal.

## Testing / Validation

- [ ] Mitigasi risiko: test invoice, callback, renewal, dan rollback pada batas perubahan fee menggunakan contoh ADR.
- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Refund dan settlement otomatis.
- Perubahan harga kelas tenant.
- Kredensial Duitku.

## AI Orchestrator Contract

```json
{
  "draftKey": "platform-fee-policy",
  "projectKey": "platform-admin-control-plane",
  "title": "Platform admin dapat menetapkan biaya platform untuk transaksi baru secara aman",
  "type": "Feature",
  "priority": "High",
  "estimate": "M",
  "complexity": "critical",
  "labels": [
    "identity",
    "billing",
    "api-gateway",
    "ai-ready"
  ],
  "repositories": [
    "identity",
    "billing",
    "api-gateway"
  ],
  "blockedByDraftKeys": [
    "platform-config-control-plane"
  ],
  "externalDependencies": [
    {
      "key": "platform-fee-business-policy",
      "description": "Owner menyetujui basis perhitungan, nilai/rentang, pembulatan, waktu efektif, dan perlakuan invoice lama.",
      "verification": "ADR kebijakan biaya platform disetujui dan memuat contoh invoice sebelum/sesudah perubahan."
    }
  ],
  "body": {
    "backgroundProblem": "Billing saat ini menerima platform_fee dari request internal dan menghitung net_amount dari nilai tersebut. Belum ada formula atau sumber kebijakan platform yang disetujui.",
    "goal": "Admin dapat mengubah biaya platform yang hanya berlaku pada transaksi baru menurut kebijakan bisnis yang disetujui, dengan jejak versi.",
    "requirements": [
      "Tentukan tipe, batas, dan formula fee dari ADR bisnis; editor hanya menerima nilai valid.",
      "Billing memakai kebijakan terpusat sebagai sumber otoritatif untuk transaksi baru dan menyimpan versi yang dipakai.",
      "Invoice/transaksi lama tidak dihitung ulang ketika nilai fee berubah.",
      "Admin dapat melihat nilai efektif, histori, dan status penerapan billing."
    ],
    "acceptanceCriteria": [
      "Transaksi baru memakai fee dan versi policy yang benar.",
      "Transaksi lama dan invoice yang sudah dibuat tidak berubah.",
      "Input fee invalid atau policy belum applied tidak menghasilkan invoice dengan fee salah.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko utama financial correctness. Formula belum ada dan tidak boleh diasumsikan dari field platform_fee. Issue tidak executable sebelum ADR bisnis disetujui. Uji rounding, batas, perubahan di tengah checkout, dan rollback.",
    "relevantAreas": [
      "kelolakelas-billing-service/internal/usecase/transaction_usecase.go",
      "kelolakelas-billing-service/internal/domain/transaction.go",
      "kelolakelas-identity-service/migrations",
      "kelolakelas-api-gateway/internal/delivery/http/router.go"
    ],
    "edgeCases": [
      "Checkout dimulai sebelum fee berubah dan selesai sesudahnya.",
      "Fee melebihi gross amount.",
      "Subscription renewal memakai versi berbeda dari transaksi awal."
    ],
    "testingValidation": [
      "Mitigasi risiko: test invoice, callback, renewal, dan rollback pada batas perubahan fee menggunakan contoh ADR.",
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Refund dan settlement otomatis.",
      "Perubahan harga kelas tenant.",
      "Kredensial Duitku."
    ]
  }
}
```

### [FEATURE] Konfigurasi operasional web dan gateway dapat diterapkan dengan rollback

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Kontrol platform terpusat oleh platform admin
- **Type:** `Feature`
- **Priority:** `High`
- **Estimate:** `L`
- **Complexity:** `high`
- **Complexity rationale:** Boundary otorisasi atau perubahan perilaku lintas komponen memerlukan uji negatif dan kompatibilitas.
- **Labels:** `web`, `api-gateway`, `identity`, `ai-ready`
- **Dependencies:** `platform-config-control-plane`; eksternal: `edge-deployment-topology`

## Background / Problem

Origin web, gateway targets, CORS, rate limit, proxy trust, ukuran body, dan timeout kini dibaca saat startup. Perubahan tidak dapat dikelola atau diverifikasi admin platform.

## Goal

Admin dapat mengelola seluruh setting operasional non-secret web/gateway dari inventory dengan validasi, rollout, status, dan rollback.

## Requirements

- Implementasikan jalur penerapan semua key non-secret web/gateway yang terinventaris; tandai dynamic atau restart-required.
- Validasi dependensi lintas key sebelum rollout, termasuk write timeout > upstream timeout dan trusted-proxy pair.
- Tampilkan desired/applied version per layanan/replika; rollback saat health gagal.
- Pertahankan routing dan rate limit lama hingga versi baru benar-benar applied.

## Acceptance Criteria

- [ ] Semua key web/gateway non-secret dalam inventory punya jalur update dan status penerapan.
- [ ] Nilai invalid atau kombinasi berbahaya ditolak sebelum rollout.
- [ ] Rollout gagal dapat di-rollback dan UI tidak mengklaim versi baru aktif.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko utama gangguan trafik dan spoofing IP karena konfigurasi proxy. Topologi deployment Unknown; jangan mengasumsikan hot reload. Uji staging dan rollback sebelum produksi.

Relevant areas:

- `kelolakelas-web/.env.example`
- `kelolakelas-web/lib/gateway.ts`
- `kelolakelas-api-gateway/internal/config/config.go`
- `kelolakelas-api-gateway/internal/delivery/http/router.go`
- `kelolakelas-identity-service/internal/config/config.go`

## Edge Cases

- Satu replika gateway gagal restart.
- CIDR trusted proxy salah.
- Origin web dan CORS berubah tidak serentak.

## Testing / Validation

- [ ] Mitigasi risiko: canary dan rollback staging untuk URL, CORS, rate limit, dan trusted proxy.
- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Secret dan token signing.
- Aturan billing/academic.
- AI orchestrator internal.

## AI Orchestrator Contract

```json
{
  "draftKey": "platform-edge-config",
  "projectKey": "platform-admin-control-plane",
  "title": "Konfigurasi operasional web dan gateway dapat diterapkan dengan rollback",
  "type": "Feature",
  "priority": "High",
  "estimate": "L",
  "complexity": "high",
  "labels": [
    "web",
    "api-gateway",
    "identity",
    "ai-ready"
  ],
  "repositories": [
    "web",
    "api-gateway",
    "identity"
  ],
  "blockedByDraftKeys": [
    "platform-config-control-plane"
  ],
  "externalDependencies": [
    {
      "key": "edge-deployment-topology",
      "description": "Topologi deployment web dan gateway beserta mekanisme rollout harus diketahui.",
      "verification": "Staging dapat menerapkan dan me-rollback setting web/gateway sambil menampilkan status per replika."
    }
  ],
  "body": {
    "backgroundProblem": "Origin web, gateway targets, CORS, rate limit, proxy trust, ukuran body, dan timeout kini dibaca saat startup. Perubahan tidak dapat dikelola atau diverifikasi admin platform.",
    "goal": "Admin dapat mengelola seluruh setting operasional non-secret web/gateway dari inventory dengan validasi, rollout, status, dan rollback.",
    "requirements": [
      "Implementasikan jalur penerapan semua key non-secret web/gateway yang terinventaris; tandai dynamic atau restart-required.",
      "Validasi dependensi lintas key sebelum rollout, termasuk write timeout > upstream timeout dan trusted-proxy pair.",
      "Tampilkan desired/applied version per layanan/replika; rollback saat health gagal.",
      "Pertahankan routing dan rate limit lama hingga versi baru benar-benar applied."
    ],
    "acceptanceCriteria": [
      "Semua key web/gateway non-secret dalam inventory punya jalur update dan status penerapan.",
      "Nilai invalid atau kombinasi berbahaya ditolak sebelum rollout.",
      "Rollout gagal dapat di-rollback dan UI tidak mengklaim versi baru aktif.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko utama gangguan trafik dan spoofing IP karena konfigurasi proxy. Topologi deployment Unknown; jangan mengasumsikan hot reload. Uji staging dan rollback sebelum produksi.",
    "relevantAreas": [
      "kelolakelas-web/.env.example",
      "kelolakelas-web/lib/gateway.ts",
      "kelolakelas-api-gateway/internal/config/config.go",
      "kelolakelas-api-gateway/internal/delivery/http/router.go",
      "kelolakelas-identity-service/internal/config/config.go"
    ],
    "edgeCases": [
      "Satu replika gateway gagal restart.",
      "CIDR trusted proxy salah.",
      "Origin web dan CORS berubah tidak serentak."
    ],
    "testingValidation": [
      "Mitigasi risiko: canary dan rollback staging untuk URL, CORS, rate limit, dan trusted proxy.",
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Secret dan token signing.",
      "Aturan billing/academic.",
      "AI orchestrator internal."
    ]
  }
}
```

### [FEATURE] Konfigurasi operasional identity, academic, dan billing dapat diterapkan dengan rollback

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Kontrol platform terpusat oleh platform admin
- **Type:** `Feature`
- **Priority:** `High`
- **Estimate:** `L`
- **Complexity:** `very-high`
- **Complexity rationale:** Lintas layanan dan rollout sebagian dapat memecah konsistensi konfigurasi; perlu status per consumer dan rollback.
- **Labels:** `identity`, `academic`, `billing`, `ai-ready`
- **Dependencies:** `platform-config-control-plane`; eksternal: `service-deployment-topology`

## Background / Problem

TTL katalog, timeout gRPC, geocoding, permission flag, interval/enable worker, expiry, serta provider URL non-secret dibaca saat startup dan tidak memiliki control plane.

## Goal

Admin dapat mengelola semua setting operasional non-secret tiga service dari inventory dengan status applied dan rollback aman.

## Requirements

- Implementasikan jalur penerapan semua key non-secret identity/academic/billing dari inventory; tandai dynamic atau restart-required.
- Validasi batas dan dependensi lintas setting, terutama permission flag, expiry, dan worker interval.
- Tampilkan applied version per service/replika dan rollback saat health atau job processing gagal.
- Jaga worker in-flight serta transaksi existing aman ketika setting berubah.

## Acceptance Criteria

- [ ] Seluruh key non-secret tiga service dalam inventory punya jalur update terdokumentasi.
- [ ] Nilai invalid ditolak sebelum memengaruhi job atau catalog.
- [ ] Partial rollout terlihat dan dapat di-rollback tanpa status applied palsu.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko utama job ganda/hilang, permission bypass, dan invoice expiry salah. Beberapa key mengubah state machine dan memerlukan rollout bertahap serta test pada staging; jangan mengasumsikan hot reload.

Relevant areas:

- `kelolakelas-identity-service/internal/config/config.go`
- `kelolakelas-academic-service/internal/config/config.go`
- `kelolakelas-billing-service/internal/config/config.go`
- `kelolakelas-billing-service/internal/usecase/subscription_worker.go`

## Edge Cases

- Worker interval berubah saat job berjalan.
- PERMISSION_REQUIRE_TENANT_ID berubah sebelum client siap.
- Expiry baru diterapkan pada invoice pending lama.

## Testing / Validation

- [ ] Mitigasi risiko: test worker in-flight, compatibility permission flag, dan invoice lama dalam canary/rollback staging.
- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Secret dan credential provider.
- Formula biaya platform.
- AI orchestrator internal.

## AI Orchestrator Contract

```json
{
  "draftKey": "platform-service-config",
  "projectKey": "platform-admin-control-plane",
  "title": "Konfigurasi operasional identity, academic, dan billing dapat diterapkan dengan rollback",
  "type": "Feature",
  "priority": "High",
  "estimate": "L",
  "complexity": "very-high",
  "labels": [
    "identity",
    "academic",
    "billing",
    "ai-ready"
  ],
  "repositories": [
    "identity",
    "academic",
    "billing"
  ],
  "blockedByDraftKeys": [
    "platform-config-control-plane"
  ],
  "externalDependencies": [
    {
      "key": "service-deployment-topology",
      "description": "Topologi deployment identity, academic, billing dan mekanisme worker rollout harus diketahui.",
      "verification": "Staging mendukung rollout serta rollback bertahap tiga service dan status applied per replika."
    }
  ],
  "body": {
    "backgroundProblem": "TTL katalog, timeout gRPC, geocoding, permission flag, interval/enable worker, expiry, serta provider URL non-secret dibaca saat startup dan tidak memiliki control plane.",
    "goal": "Admin dapat mengelola semua setting operasional non-secret tiga service dari inventory dengan status applied dan rollback aman.",
    "requirements": [
      "Implementasikan jalur penerapan semua key non-secret identity/academic/billing dari inventory; tandai dynamic atau restart-required.",
      "Validasi batas dan dependensi lintas setting, terutama permission flag, expiry, dan worker interval.",
      "Tampilkan applied version per service/replika dan rollback saat health atau job processing gagal.",
      "Jaga worker in-flight serta transaksi existing aman ketika setting berubah."
    ],
    "acceptanceCriteria": [
      "Seluruh key non-secret tiga service dalam inventory punya jalur update terdokumentasi.",
      "Nilai invalid ditolak sebelum memengaruhi job atau catalog.",
      "Partial rollout terlihat dan dapat di-rollback tanpa status applied palsu.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko utama job ganda/hilang, permission bypass, dan invoice expiry salah. Beberapa key mengubah state machine dan memerlukan rollout bertahap serta test pada staging; jangan mengasumsikan hot reload.",
    "relevantAreas": [
      "kelolakelas-identity-service/internal/config/config.go",
      "kelolakelas-academic-service/internal/config/config.go",
      "kelolakelas-billing-service/internal/config/config.go",
      "kelolakelas-billing-service/internal/usecase/subscription_worker.go"
    ],
    "edgeCases": [
      "Worker interval berubah saat job berjalan.",
      "PERMISSION_REQUIRE_TENANT_ID berubah sebelum client siap.",
      "Expiry baru diterapkan pada invoice pending lama."
    ],
    "testingValidation": [
      "Mitigasi risiko: test worker in-flight, compatibility permission flag, dan invoice lama dalam canary/rollback staging.",
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Secret dan credential provider.",
      "Formula biaya platform.",
      "AI orchestrator internal."
    ]
  }
}
```

### [FEATURE] Platform admin dapat merotasi secret layanan tanpa menampilkan nilainya kembali

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Kontrol platform terpusat oleh platform admin
- **Type:** `Feature`
- **Priority:** `Urgent`
- **Estimate:** `L`
- **Complexity:** `critical`
- **Complexity rationale:** Risiko akses lintas tenant, eskalasi hak, atau financial/secret correctness; perlu matriks otorisasi dan uji rollback.
- **Labels:** `web`, `api-gateway`, `identity`, `academic`, `billing`, `ai-ready`
- **Dependencies:** `platform-config-control-plane`; eksternal: `secret-manager-and-deployment`

## Background / Problem

JWT_SECRET, DATABASE_URL, kredensial internal, Redis, Resend, Maps, dan Duitku berasal dari environment. Tidak ada secret manager atau deployment topology yang terbukti di repo; memindahkan plaintext ke tabel aplikasi akan meningkatkan risiko kebocoran.

## Goal

Admin dapat memulai dan memantau rotasi setiap secret aplikasi yang terinventaris melalui secret manager dan deployment tanpa pernah membaca kembali nilainya.

## Requirements

- Inventaris secret per layanan dan protokol rotasinya, termasuk secret bersama JWT/internal service serta secret provider tunggal.
- Control plane menyimpan referensi dan status rotasi, bukan plaintext; input sekali pakai, redaksi log/API, otorisasi admin, dan audit wajib.
- Rotasi memakai rollout terkoordinasi, validasi health dan callback/signature, serta rollback; secret lama ditarik setelah konsumen baru siap.
- Jangan mengizinkan rotasi bila secret manager atau deployment integration tidak siap; tampilkan kegagalan jelas.

## Acceptance Criteria

- [ ] Admin dapat memulai rotasi di staging dan melihat status tanpa membaca plaintext secret.
- [ ] Secret lama dan baru ditangani sesuai protokol tanpa memutus login, DB, pembayaran, atau service-to-service.
- [ ] Kegagalan rollout dapat di-rollback dan status/applied version akurat.
- [ ] Tenant/parent tidak dapat memulai atau melihat detail secret.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko utama outage lintas layanan, token tidak valid, database tak terhubung, dan pembayaran gagal. Deployment topology/secret manager Unknown; issue diblokir external dependency sampai ada integrasi staging. Perlu ADR per kelompok secret dan uji rotasi end-to-end; jangan mengklaim dukungan hot reload jika service hanya membaca env saat startup.

Relevant areas:

- `kelolakelas-web/.env.example`
- `kelolakelas-api-gateway/internal/config/config.go`
- `kelolakelas-identity-service/internal/config/config.go`
- `kelolakelas-academic-service/internal/config/config.go`
- `kelolakelas-billing-service/internal/config/config.go`

## Edge Cases

- JWT key dirotasi saat token lama masih berlaku.
- Callback Duitku memakai key lama selama rollout.
- Satu replika gagal setelah secret manager menyimpan versi baru.

## Testing / Validation

- [ ] Mitigasi risiko: rotasi dan rollback staging untuk JWT, DB, internal credential, dan Duitku dengan request nyata.
- [ ] Scan respons/log untuk plaintext secret dan uji akses tenant/parent.
- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Menampilkan nilai secret yang sudah tersimpan.
- Menyimpan secret di database aplikasi.
- Konfigurasi AI orchestrator internal.

## AI Orchestrator Contract

```json
{
  "draftKey": "platform-secret-rotation",
  "projectKey": "platform-admin-control-plane",
  "title": "Platform admin dapat merotasi secret layanan tanpa menampilkan nilainya kembali",
  "type": "Feature",
  "priority": "Urgent",
  "estimate": "L",
  "complexity": "critical",
  "labels": [
    "web",
    "api-gateway",
    "identity",
    "academic",
    "billing",
    "ai-ready"
  ],
  "repositories": [
    "web",
    "api-gateway",
    "identity",
    "academic",
    "billing"
  ],
  "blockedByDraftKeys": [
    "platform-config-control-plane"
  ],
  "externalDependencies": [
    {
      "key": "secret-manager-and-deployment",
      "description": "Secret manager, topologi deployment, dan hak rotasi untuk seluruh aplikasi harus dipilih serta disambungkan.",
      "verification": "Staging memiliki secret manager terhubung, rollout lima aplikasi, rollback, dan bukti akses scoped untuk control plane."
    }
  ],
  "body": {
    "backgroundProblem": "JWT_SECRET, DATABASE_URL, kredensial internal, Redis, Resend, Maps, dan Duitku berasal dari environment. Tidak ada secret manager atau deployment topology yang terbukti di repo; memindahkan plaintext ke tabel aplikasi akan meningkatkan risiko kebocoran.",
    "goal": "Admin dapat memulai dan memantau rotasi setiap secret aplikasi yang terinventaris melalui secret manager dan deployment tanpa pernah membaca kembali nilainya.",
    "requirements": [
      "Inventaris secret per layanan dan protokol rotasinya, termasuk secret bersama JWT/internal service serta secret provider tunggal.",
      "Control plane menyimpan referensi dan status rotasi, bukan plaintext; input sekali pakai, redaksi log/API, otorisasi admin, dan audit wajib.",
      "Rotasi memakai rollout terkoordinasi, validasi health dan callback/signature, serta rollback; secret lama ditarik setelah konsumen baru siap.",
      "Jangan mengizinkan rotasi bila secret manager atau deployment integration tidak siap; tampilkan kegagalan jelas."
    ],
    "acceptanceCriteria": [
      "Admin dapat memulai rotasi di staging dan melihat status tanpa membaca plaintext secret.",
      "Secret lama dan baru ditangani sesuai protokol tanpa memutus login, DB, pembayaran, atau service-to-service.",
      "Kegagalan rollout dapat di-rollback dan status/applied version akurat.",
      "Tenant/parent tidak dapat memulai atau melihat detail secret.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko utama outage lintas layanan, token tidak valid, database tak terhubung, dan pembayaran gagal. Deployment topology/secret manager Unknown; issue diblokir external dependency sampai ada integrasi staging. Perlu ADR per kelompok secret dan uji rotasi end-to-end; jangan mengklaim dukungan hot reload jika service hanya membaca env saat startup.",
    "relevantAreas": [
      "kelolakelas-web/.env.example",
      "kelolakelas-api-gateway/internal/config/config.go",
      "kelolakelas-identity-service/internal/config/config.go",
      "kelolakelas-academic-service/internal/config/config.go",
      "kelolakelas-billing-service/internal/config/config.go"
    ],
    "edgeCases": [
      "JWT key dirotasi saat token lama masih berlaku.",
      "Callback Duitku memakai key lama selama rollout.",
      "Satu replika gagal setelah secret manager menyimpan versi baru."
    ],
    "testingValidation": [
      "Mitigasi risiko: rotasi dan rollback staging untuk JWT, DB, internal credential, dan Duitku dengan request nyata.",
      "Scan respons/log untuk plaintext secret dan uji akses tenant/parent.",
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Menampilkan nilai secret yang sudah tersimpan.",
      "Menyimpan secret di database aplikasi.",
      "Konfigurasi AI orchestrator internal."
    ]
  }
}
```

### [FEATURE] Creator tenant dapat meminta dan platform admin dapat memutuskan Creator tambahan dari web

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Kontrol platform terpusat oleh platform admin
- **Type:** `Feature`
- **Priority:** `High`
- **Estimate:** `M`
- **Complexity:** `high`
- **Complexity rationale:** Boundary otorisasi atau perubahan perilaku lintas komponen memerlukan uji negatif dan kompatibilitas.
- **Labels:** `web`, `ai-ready`
- **Dependencies:** `creator-approval`

## Background / Problem

Web hanya memiliki dashboard tenant dan parent; belum ada permintaan Creator maupun dashboard platform. API approval tanpa UI tidak mendukung alur operator sehari-hari.

## Goal

Creator tenant dapat mengajukan dan melacak request, sementara platform admin meninjau, menyetujui, atau menolak request di area terpisah.

## Requirements

- Tambahkan jalur login/dashboard platform yang hanya mengarahkan principal platform dan tetap memverifikasi di backend.
- Tenant Creator dapat membuat dan melihat request untuk tenant sendiri; tampilkan status, alasan, dan keputusan.
- Platform admin dapat melihat antrian serta approve/reject dengan konfirmasi dan alasan.
- Loading, empty, conflict, forbidden, dan expired-session state jelas; action server tidak mempercayai visibilitas UI sebagai otorisasi.

## Acceptance Criteria

- [ ] Alur request dan approval/reject selesai dari browser dan status terbaru terlihat.
- [ ] Tenant bukan Creator tidak melihat kontrol dan action langsung menerima 403.
- [ ] Admin yang dicabut tidak dapat menyetujui meskipun halaman lama masih terbuka.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko utama action server memanggil API privileged dengan token tenant. Semua tindakan harus memakai token caller yang diverifikasi backend; proxy web hanya optimisasi navigasi. Ikuti web AGENTS.md dan uji akses langsung action.

Relevant areas:

- `kelolakelas-web/proxy.ts`
- `kelolakelas-web/lib/auth-routing.ts`
- `kelolakelas-web/app/(auth)/login/_actions/actions.ts`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/members`

## Edge Cases

- Target request berubah sebelum approval.
- Admin menekan approve dua kali.
- Sesi berakhir saat dialog terbuka.

## Testing / Validation

- [ ] Mitigasi risiko: test server action dengan token tenant/parent/admin dicabut dan verifikasi 403.
- [ ] Uji keyboard, label, konfirmasi, status, dan error state.
- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Editor konfigurasi platform.
- Pencabutan Creator.
- Impersonasi tenant.

## AI Orchestrator Contract

```json
{
  "draftKey": "platform-creator-ui",
  "projectKey": "platform-admin-control-plane",
  "title": "Creator tenant dapat meminta dan platform admin dapat memutuskan Creator tambahan dari web",
  "type": "Feature",
  "priority": "High",
  "estimate": "M",
  "complexity": "high",
  "labels": [
    "web",
    "ai-ready"
  ],
  "repositories": [
    "web"
  ],
  "blockedByDraftKeys": [
    "creator-approval"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Web hanya memiliki dashboard tenant dan parent; belum ada permintaan Creator maupun dashboard platform. API approval tanpa UI tidak mendukung alur operator sehari-hari.",
    "goal": "Creator tenant dapat mengajukan dan melacak request, sementara platform admin meninjau, menyetujui, atau menolak request di area terpisah.",
    "requirements": [
      "Tambahkan jalur login/dashboard platform yang hanya mengarahkan principal platform dan tetap memverifikasi di backend.",
      "Tenant Creator dapat membuat dan melihat request untuk tenant sendiri; tampilkan status, alasan, dan keputusan.",
      "Platform admin dapat melihat antrian serta approve/reject dengan konfirmasi dan alasan.",
      "Loading, empty, conflict, forbidden, dan expired-session state jelas; action server tidak mempercayai visibilitas UI sebagai otorisasi."
    ],
    "acceptanceCriteria": [
      "Alur request dan approval/reject selesai dari browser dan status terbaru terlihat.",
      "Tenant bukan Creator tidak melihat kontrol dan action langsung menerima 403.",
      "Admin yang dicabut tidak dapat menyetujui meskipun halaman lama masih terbuka.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko utama action server memanggil API privileged dengan token tenant. Semua tindakan harus memakai token caller yang diverifikasi backend; proxy web hanya optimisasi navigasi. Ikuti web AGENTS.md dan uji akses langsung action.",
    "relevantAreas": [
      "kelolakelas-web/proxy.ts",
      "kelolakelas-web/lib/auth-routing.ts",
      "kelolakelas-web/app/(auth)/login/_actions/actions.ts",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/members"
    ],
    "edgeCases": [
      "Target request berubah sebelum approval.",
      "Admin menekan approve dua kali.",
      "Sesi berakhir saat dialog terbuka."
    ],
    "testingValidation": [
      "Mitigasi risiko: test server action dengan token tenant/parent/admin dicabut dan verifikasi 403.",
      "Uji keyboard, label, konfirmasi, status, dan error state.",
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Editor konfigurasi platform.",
      "Pencabutan Creator.",
      "Impersonasi tenant."
    ]
  }
}
```

### [FEATURE] Platform admin dapat meninjau, mengubah, dan memantau konfigurasi dari dashboard

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Kontrol platform terpusat oleh platform admin
- **Type:** `Feature`
- **Priority:** `High`
- **Estimate:** `L`
- **Complexity:** `high`
- **Complexity rationale:** Boundary otorisasi atau perubahan perilaku lintas komponen memerlukan uji negatif dan kompatibilitas.
- **Labels:** `web`, `ai-ready`
- **Dependencies:** `platform-registration-policy`, `platform-catalog-policy`, `platform-fee-policy`, `platform-edge-config`, `platform-service-config`, `platform-secret-rotation`

## Background / Problem

Tidak ada UI platform admin untuk inventory setting, versi desired/applied, audit, atau rotasi secret. Konfigurasi tersebar di deployment sehingga operator tidak memiliki satu tampilan yang dapat dipercaya.

## Goal

Admin platform dapat mengelola seluruh setting aplikasi yang terinventaris dari dashboard dan melihat apakah perubahan benar-benar diterapkan.

## Requirements

- Tampilkan inventory berdasarkan domain/layanan, nilai non-secret efektif, status penerapan, versi, serta audit.
- Editor typed mengikuti validasi API; perubahan berisiko memerlukan konfirmasi, alasan, dan umpan balik rollback.
- Secret menggunakan input sekali pakai dan aksi rotasi; tidak ada read-back/plaintext pada UI, cache, atau error.
- Tampilkan kegagalan penerapan, status per layanan, dan langkah pemulihan tanpa mengklaim sukses prematur.

## Acceptance Criteria

- [ ] Admin dapat mengubah setting bisnis/operasional dan memantau desired/applied state.
- [ ] Admin dapat memulai rotasi secret dan melihat status tanpa nilai plaintext.
- [ ] Tenant dan parent tidak dapat mengakses dashboard atau action langsung.
- [ ] Kesalahan validasi, konflik versi, dan rollout gagal muncul jelas.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko utama UI menyatakan perubahan aktif sebelum semua consumer menerapkan dan secret bocor ke browser/log. Gunakan kontrak status backend dan redaksi seluruh jalur render; uji akses langsung action.

Relevant areas:

- `kelolakelas-web/app/(dashboard)`
- `kelolakelas-web/proxy.ts`
- `kelolakelas-web/lib/gateway.ts`

## Edge Cases

- Sebagian layanan masih pada versi lama.
- Admin menutup halaman saat rollout berlangsung.
- Secret input invalid atau rotasi ditolak dependency.

## Testing / Validation

- [ ] Mitigasi risiko: test status pending/partial/failed dan redaksi secret di HTML, action result, serta log.
- [ ] Uji keyboard, aksesibilitas editor, dan error state.
- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Implementasi control plane backend.
- Akses raw secret setelah disimpan.
- Konfigurasi AI orchestrator internal.

## AI Orchestrator Contract

```json
{
  "draftKey": "platform-config-ui",
  "projectKey": "platform-admin-control-plane",
  "title": "Platform admin dapat meninjau, mengubah, dan memantau konfigurasi dari dashboard",
  "type": "Feature",
  "priority": "High",
  "estimate": "L",
  "complexity": "high",
  "labels": [
    "web",
    "ai-ready"
  ],
  "repositories": [
    "web"
  ],
  "blockedByDraftKeys": [
    "platform-registration-policy",
    "platform-catalog-policy",
    "platform-fee-policy",
    "platform-edge-config",
    "platform-service-config",
    "platform-secret-rotation"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Tidak ada UI platform admin untuk inventory setting, versi desired/applied, audit, atau rotasi secret. Konfigurasi tersebar di deployment sehingga operator tidak memiliki satu tampilan yang dapat dipercaya.",
    "goal": "Admin platform dapat mengelola seluruh setting aplikasi yang terinventaris dari dashboard dan melihat apakah perubahan benar-benar diterapkan.",
    "requirements": [
      "Tampilkan inventory berdasarkan domain/layanan, nilai non-secret efektif, status penerapan, versi, serta audit.",
      "Editor typed mengikuti validasi API; perubahan berisiko memerlukan konfirmasi, alasan, dan umpan balik rollback.",
      "Secret menggunakan input sekali pakai dan aksi rotasi; tidak ada read-back/plaintext pada UI, cache, atau error.",
      "Tampilkan kegagalan penerapan, status per layanan, dan langkah pemulihan tanpa mengklaim sukses prematur."
    ],
    "acceptanceCriteria": [
      "Admin dapat mengubah setting bisnis/operasional dan memantau desired/applied state.",
      "Admin dapat memulai rotasi secret dan melihat status tanpa nilai plaintext.",
      "Tenant dan parent tidak dapat mengakses dashboard atau action langsung.",
      "Kesalahan validasi, konflik versi, dan rollout gagal muncul jelas.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko utama UI menyatakan perubahan aktif sebelum semua consumer menerapkan dan secret bocor ke browser/log. Gunakan kontrak status backend dan redaksi seluruh jalur render; uji akses langsung action.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)",
      "kelolakelas-web/proxy.ts",
      "kelolakelas-web/lib/gateway.ts"
    ],
    "edgeCases": [
      "Sebagian layanan masih pada versi lama.",
      "Admin menutup halaman saat rollout berlangsung.",
      "Secret input invalid atau rotasi ditolak dependency."
    ],
    "testingValidation": [
      "Mitigasi risiko: test status pending/partial/failed dan redaksi secret di HTML, action result, serta log.",
      "Uji keyboard, aksesibilitas editor, dan error state.",
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Implementasi control plane backend.",
      "Akses raw secret setelah disimpan.",
      "Konfigurasi AI orchestrator internal."
    ]
  }
}
```

## 4. Urutan eksekusi

| Urutan | Issue | Alasan urutan | Dependency | Outcome setelah selesai |
| --- | --- | --- | --- | --- |
| 1 | Platform admin dapat masuk dan hanya mengakses route platform | Boundary admin dasar | — | Principal platform admin yang dibootstrap secara terkontrol dapat masuk dan memakai route platform, tanpa memperoleh akses tenant secara implisit. |
| 2 | Creator tenant dapat meminta penambahan Creator untuk tenant sendiri | Alur Creator | platform-admin-principal | Creator tenant dapat mengajukan permintaan Creator tambahan untuk anggota atau calon anggota tenant sendiri tanpa langsung memberi hak tersebut. |
| 3 | Platform admin dapat menyetujui atau menolak permintaan Creator dengan audit | Alur Creator | creator-request | Hanya platform admin dapat memutuskan permintaan Creator pending dan keputusan yang disetujui memberi role ke target pada tenant yang tepat. |
| 4 | Platform admin memiliki katalog konfigurasi terpusat dengan audit dan status penerapan | Fondasi konfigurasi | platform-admin-principal | Admin platform dapat mengetahui seluruh konfigurasi aplikasi yang didukung, mengajukan perubahan bertipe, serta melihat audit dan status penerapannya. |
| 5 | Platform admin dapat membuka dan menutup pendaftaran tenant baru | Adapter konfigurasi per domain | platform-config-control-plane | Setting platform untuk penerimaan tenant baru berlaku pada registrasi dan dapat diamati oleh admin. |
| 6 | Platform admin dapat mengatur visibilitas katalog publik secara konsisten | Adapter konfigurasi per domain | platform-config-control-plane | Admin dapat membuka atau menutup katalog publik tanpa mengubah kelas dan tenant, dengan hasil konsisten pada daftar dan detail. |
| 7 | Platform admin dapat menetapkan biaya platform untuk transaksi baru secara aman | Adapter konfigurasi per domain | platform-config-control-plane; platform-fee-business-policy | Admin dapat mengubah biaya platform yang hanya berlaku pada transaksi baru menurut kebijakan bisnis yang disetujui, dengan jejak versi. |
| 8 | Konfigurasi operasional web dan gateway dapat diterapkan dengan rollback | Adapter konfigurasi per domain | platform-config-control-plane; edge-deployment-topology | Admin dapat mengelola seluruh setting operasional non-secret web/gateway dari inventory dengan validasi, rollout, status, dan rollback. |
| 9 | Konfigurasi operasional identity, academic, dan billing dapat diterapkan dengan rollback | Adapter konfigurasi per domain | platform-config-control-plane; service-deployment-topology | Admin dapat mengelola semua setting operasional non-secret tiga service dari inventory dengan status applied dan rollback aman. |
| 10 | Platform admin dapat merotasi secret layanan tanpa menampilkan nilainya kembali | Adapter konfigurasi per domain | platform-config-control-plane; secret-manager-and-deployment | Admin dapat memulai dan memantau rotasi setiap secret aplikasi yang terinventaris melalui secret manager dan deployment tanpa pernah membaca kembali nilainya. |
| 11 | Creator tenant dapat meminta dan platform admin dapat memutuskan Creator tambahan dari web | UI setelah API | creator-approval | Creator tenant dapat mengajukan dan melacak request, sementara platform admin meninjau, menyetujui, atau menolak request di area terpisah. |
| 12 | Platform admin dapat meninjau, mengubah, dan memantau konfigurasi dari dashboard | UI setelah API | platform-registration-policy, platform-catalog-policy, platform-fee-policy, platform-edge-config, platform-service-config, platform-secret-rotation | Admin platform dapat mengelola seluruh setting aplikasi yang terinventaris dari dashboard dan melihat apakah perubahan benar-benar diterapkan. |

## 5. Kandidat yang tidak dibuat

- **Issue baru yang mengulang KEL-79:** ditolak. KEL-79 perlu direvisi agar guard Creator tenant mengikuti kebijakan baru; scope Teacher, self-change, dan delete yang tidak disetujui perlu dipisahkan/ditetapkan sebelum `ai-ready`.
- **Rotasi secret tanpa secret manager/deployment:** ditunda sampai dependency eksternal terverifikasi; issue tetap ada dalam roadmap dengan blocker terstruktur.
- **Konfigurasi AI orchestrator internal:** belum masuk payload karena schema v1 hanya mengizinkan label `web`, `api-gateway`, `academic`, `identity`, `billing`. Perlu issue perubahan planning contract/label sebelum dapat dibuat `ai-ready` secara valid.
- **Impersonasi tenant dan akses lintas data tenant:** tidak dibutuhkan untuk approval Creator atau konfigurasi, dan memperluas hak admin tanpa dasar.

**Usulan pembaruan KEL-79 setelah persetujuan:** ganti aturan “Creator boleh memberikan Creator” dengan “semua jalur tenant menolak pemberian Creator langsung; Creator tenant mengajukan request yang diputuskan platform admin”. Pertahankan pembahasan Teacher dan self-change sebagai scope terpisah; jangan tetapkan aturan demosi/hapus Creator sampai kebijakan disetujui. Tambahkan relasi ke issue `creator-request` dan `creator-approval` setelah dibuat.

## 6. Payload AI Orchestrator

```yaml
{
  "schemaVersion": "kelolakelas.planning-backlog/v1",
  "projects": [
    {
      "key": "platform-admin-control-plane",
      "name": "Kontrol platform terpusat oleh platform admin",
      "outcome": "Platform admin dapat menyetujui penambahan Creator dan mengendalikan konfigurasi aplikasi KelolaKelas lintas layanan, termasuk rotasi secret, melalui alur terotorisasi dan teraudit.",
      "problem": "Belum ada principal platform admin; tenant dapat mengundang Creator; konfigurasi tersebar di environment statis tanpa control plane atau audit.",
      "valueAndPriority": "Urgent; menutup eskalasi Creator dan membangun dasar kontrol lintas tenant; confidence tinggi pada gap autentikasi dan Creator, sedang pada katalog setting; effort total L.",
      "scope": [
        "Principal platform admin dan bootstrap terkontrol.",
        "Permintaan Creator oleh Creator tenant dan persetujuan platform admin.",
        "Inventaris dan kontrol konfigurasi bisnis, finansial, dan operasional di lima repository aplikasi.",
        "Rotasi secret melalui secret manager dan deployment terintegrasi.",
        "Dashboard tenant request dan dashboard platform admin."
      ],
      "outOfScope": [
        "Akses bebas ke data siswa dan transaksi tenant atau impersonasi tenant.",
        "AI orchestrator internal, yang repository-nya belum didukung label oleh planning contract v1.",
        "Mengubah secret menjadi teks yang dapat dibaca kembali dari UI."
      ],
      "successMetrics": [
        "Tenant tidak dapat memperoleh Creator tambahan tanpa approval platform admin.",
        "Setiap perubahan konfigurasi dan approval memiliki aktor, waktu, nilai lama/baru atau referensi secret, dan status penerapan.",
        "Setiap key konfigurasi aplikasi punya owner, versi desired/applied, audit, dan jalur perubahan atau rotasi yang teruji.",
        "Secret dapat dirotasi tanpa menampilkan kembali nilainya dan dengan rollback teruji.",
        "Tenant dan parent tidak dapat menggunakan endpoint platform."
      ],
      "dependenciesAndRisks": [
        "KEL-79 perlu direvisi agar guard Creator tenant sesuai kebijakan baru.",
        "KEL-76 dan KEL-80 terkait revokasi keanggotaan dan role.",
        "Topologi deployment dan secret manager belum ditemukan; integrasi rotasi secret menunggu keputusan serta akses yang terverifikasi.",
        "Konfigurasi AI orchestrator internal memerlukan perluasan kontrak planning/label tersendiri bila dimasukkan pada tahap berikutnya."
      ]
    }
  ],
  "issues": [
    {
      "draftKey": "platform-admin-principal",
      "projectKey": "platform-admin-control-plane",
      "title": "Platform admin dapat masuk dan hanya mengakses route platform",
      "type": "Feature",
      "priority": "Urgent",
      "estimate": "M",
      "complexity": "critical",
      "labels": [
        "identity",
        "api-gateway",
        "ai-ready"
      ],
      "repositories": [
        "identity",
        "api-gateway"
      ],
      "blockedByDraftKeys": [],
      "externalDependencies": [],
      "body": {
        "backgroundProblem": "Identity hanya memodelkan tenant_members dan token non-parent tanpa tenant ditolak gateway. Role sistem Creator/Teacher adalah template tenant, bukan principal platform. Tidak ada jalur autentikasi platform admin.",
        "goal": "Principal platform admin yang dibootstrap secara terkontrol dapat masuk dan memakai route platform, tanpa memperoleh akses tenant secara implisit.",
        "requirements": [
          "Sediakan assignment platform admin terpisah dari role dan permission tenant serta bootstrap operator yang tidak tersedia lewat registrasi publik.",
          "Token dan pemeriksaan identitas platform harus membedakan principal platform dari parent dan anggota tenant; verifikasi tetap memakai state assignment saat request sensitif.",
          "Gateway dan identity mengizinkan principal platform hanya pada namespace route platform yang terlindungi, dan tetap menolak token tanpa tenant pada route tenant biasa.",
          "Definisikan prosedur pemulihan akses admin tanpa membuat akun platform admin lewat endpoint publik."
        ],
        "acceptanceCriteria": [
          "Admin platform yang dibootstrap dapat login dan mengakses endpoint identitas platform.",
          "Tenant Creator, role custom, parent, dan token palsu/tidak aktif menerima 403/401 pada route platform.",
          "Platform admin tanpa membership tenant tidak dapat memakai route tenant hanya karena berstatus admin.",
          "Existing functionality remains unaffected",
          "Error and validation scenarios are handled correctly"
        ],
        "technicalNotes": "Risiko utama adalah eskalasi lintas tenant atau lockout semua admin. Jangan menambahkan permission platform ke seed Creator yang CROSS JOIN seluruh permission. Uji matriks principal dan revokasi assignment; dokumentasikan bootstrap serta recovery. Keputusan rinci bentuk tabel/claim mengikuti ADR saat implementasi.",
        "relevantAreas": [
          "kelolakelas-identity-service/internal/usecase/auth_usecase.go",
          "kelolakelas-identity-service/pkg/jwt/jwt.go",
          "kelolakelas-identity-service/migrations",
          "kelolakelas-api-gateway/internal/delivery/http/middleware/auth_middleware.go"
        ],
        "edgeCases": [
          "Admin kehilangan assignment saat JWT lama masih berlaku.",
          "Akun yang juga anggota tenant melakukan operasi platform dan tenant.",
          "Bootstrap dijalankan dua kali atau admin terakhir dinonaktifkan."
        ],
        "testingValidation": [
          "Mitigasi risiko: test matriks admin, tenant Creator, parent, token lama, dan assignment yang dicabut pada identity dan gateway.",
          "Verifikasi bootstrap idempotent dan jalur recovery teruji.",
          "Relevant unit tests are added or updated",
          "Relevant integration tests are added or updated",
          "Existing tests pass",
          "Lint passes",
          "Type checking passes",
          "Acceptance criteria are manually or automatically verified"
        ],
        "outOfScope": [
          "Pemberian Creator tambahan dan konfigurasi platform.",
          "UI admin platform.",
          "Perubahan permission tenant umum."
        ]
      }
    },
    {
      "draftKey": "creator-request",
      "projectKey": "platform-admin-control-plane",
      "title": "Creator tenant dapat meminta penambahan Creator untuk tenant sendiri",
      "type": "Feature",
      "priority": "Urgent",
      "estimate": "M",
      "complexity": "high",
      "labels": [
        "identity",
        "api-gateway",
        "ai-ready"
      ],
      "repositories": [
        "identity",
        "api-gateway"
      ],
      "blockedByDraftKeys": [
        "platform-admin-principal"
      ],
      "externalDependencies": [],
      "body": {
        "backgroundProblem": "KEL-79 menunda kebijakan Creator. Saat ini undangan tenant dapat memilih Creator dan update role dapat menarget Creator, sehingga hak penuh dapat diberikan tanpa review. Arahan baru mensyaratkan permintaan oleh Creator tenant dan persetujuan platform admin.",
        "goal": "Creator tenant dapat mengajukan permintaan Creator tambahan untuk anggota atau calon anggota tenant sendiri tanpa langsung memberi hak tersebut.",
        "requirements": [
          "Tolak target Creator pada invitation dan update role tenant yang ada, termasuk bila caller Creator.",
          "Sediakan permintaan Creator yang hanya dapat dibuat Creator aktif dari tenant sendiri, dengan target email/user, alasan, dan status pending; pemohon tidak dapat memilih tenant lain.",
          "Cegah request ganda yang masih pending dan jangan memberi role Creator sebelum persetujuan.",
          "Pertahankan registrasi tenant yang memberi Creator pertama; revisi requirement Creator pada KEL-79 agar selaras."
        ],
        "acceptanceCriteria": [
          "Creator tenant dapat membuat dan melihat permintaan untuk tenant sendiri.",
          "Teacher, custom role, parent, dan Creator dari tenant lain tidak dapat mengajukan atau melihat request tersebut.",
          "Invitation/update role tenant ke Creator menerima 403 dan tidak mengubah keanggotaan.",
          "Request pending tidak mengubah role target.",
          "Existing functionality remains unaffected",
          "Error and validation scenarios are handled correctly"
        ],
        "technicalNotes": "Risiko utama eskalasi lintas tenant lewat target request atau jalur lama invitation/update role. Guard harus di use case dan transaction boundary, bukan UI. KEL-79 terkait tetapi tidak memuat request/approval platform; revisi KEL-79 sebelum implementasi agar tidak ada requirement bertentangan.",
        "relevantAreas": [
          "kelolakelas-identity-service/internal/usecase/invitation_usecase.go",
          "kelolakelas-identity-service/internal/repository/member_repository.go",
          "kelolakelas-identity-service/internal/usecase/member_usecase.go",
          "kelolakelas-api-gateway/internal/delivery/http/router.go"
        ],
        "edgeCases": [
          "Target sudah Creator.",
          "Dua request pending untuk target sama.",
          "Creator pemohon kehilangan role saat request masih pending."
        ],
        "testingValidation": [
          "Mitigasi risiko: test matriks principal dan tenant target pada request, invitation, serta update role.",
          "Test tidak ada role assignment sebelum approval.",
          "Relevant unit tests are added or updated",
          "Relevant integration tests are added or updated",
          "Existing tests pass",
          "Lint passes",
          "Type checking passes",
          "Acceptance criteria are manually or automatically verified"
        ],
        "outOfScope": [
          "Approval dan pemberian Creator oleh platform admin.",
          "Demosi atau pencabutan Creator.",
          "Perubahan role Teacher yang tetap pada KEL-79."
        ]
      }
    },
    {
      "draftKey": "creator-approval",
      "projectKey": "platform-admin-control-plane",
      "title": "Platform admin dapat menyetujui atau menolak permintaan Creator dengan audit",
      "type": "Feature",
      "priority": "Urgent",
      "estimate": "M",
      "complexity": "critical",
      "labels": [
        "identity",
        "api-gateway",
        "ai-ready"
      ],
      "repositories": [
        "identity",
        "api-gateway"
      ],
      "blockedByDraftKeys": [
        "creator-request"
      ],
      "externalDependencies": [],
      "body": {
        "backgroundProblem": "Permintaan Creator harus diputuskan oleh platform admin; saat ini tidak ada approval state, tindakan lintas tenant, atau audit keputusan untuk pemberian role ini.",
        "goal": "Hanya platform admin dapat memutuskan permintaan Creator pending dan keputusan yang disetujui memberi role ke target pada tenant yang tepat.",
        "requirements": [
          "Platform admin dapat melihat request pending lintas tenant beserta tenant, target, pemohon, alasan, dan waktu.",
          "Approve/reject mencatat aktor, keputusan, waktu, dan alasan penolakan; approval atomik dengan pemberian Creator.",
          "Validasi ulang status tenant, target, pemohon, dan request saat keputusan dibuat; keputusan sekali saja dan aman terhadap request serentak.",
          "Untuk target yang belum menjadi anggota, approval membuat undangan Creator terikat email target; role baru diberikan hanya ketika undangan diterima oleh akun dengan email tersebut."
        ],
        "acceptanceCriteria": [
          "Approval admin pada request valid memberi Creator kepada target tepat satu kali dan mencatat audit.",
          "Approval untuk email baru menghasilkan undangan terikat email; role Creator baru muncul setelah penerimaan sah.",
          "Reject menyimpan alasan dan tidak mengubah role target.",
          "Tenant, parent, dan token admin yang dicabut menerima 403.",
          "Request usang, terduplikasi, atau target tidak valid tidak menghasilkan assignment Creator.",
          "Existing functionality remains unaffected",
          "Error and validation scenarios are handled correctly"
        ],
        "technicalNotes": "Risiko utama eskalasi lintas tenant, approval replay, dan role diberikan kepada email yang berubah pemilik. Ikat keputusan pada tenant, target akun/email terverifikasi, status pemohon, serta transaksi/idempotensi. Target belum terdaftar menerima undangan yang dapat ditebus hanya oleh email target; keputusan approved_pending_acceptance belum memberi role. Jangan memberi admin akses tenant umum.",
        "relevantAreas": [
          "kelolakelas-identity-service/internal/usecase",
          "kelolakelas-identity-service/internal/repository",
          "kelolakelas-identity-service/migrations",
          "kelolakelas-api-gateway/internal/delivery/http/router.go"
        ],
        "edgeCases": [
          "Target mendaftar atau pindah role selama request pending.",
          "Admin ganda memutuskan request yang sama.",
          "Tenant dinonaktifkan sebelum approval."
        ],
        "testingValidation": [
          "Mitigasi risiko: test konkurensi approve/reject serta tenant mismatch dan approval replay.",
          "Uji target yang sudah dan belum memiliki akun tanpa pemberian Creator prematur.",
          "Relevant unit tests are added or updated",
          "Relevant integration tests are added or updated",
          "Existing tests pass",
          "Lint passes",
          "Type checking passes",
          "Acceptance criteria are manually or automatically verified"
        ],
        "outOfScope": [
          "UI dashboard approval.",
          "Pencabutan Creator.",
          "Pengelolaan tenant sebagai admin umum."
        ]
      }
    },
    {
      "draftKey": "platform-config-control-plane",
      "projectKey": "platform-admin-control-plane",
      "title": "Platform admin memiliki katalog konfigurasi terpusat dengan audit dan status penerapan",
      "type": "Feature",
      "priority": "Urgent",
      "estimate": "L",
      "complexity": "very-high",
      "labels": [
        "identity",
        "api-gateway",
        "ai-ready"
      ],
      "repositories": [
        "identity",
        "api-gateway"
      ],
      "blockedByDraftKeys": [
        "platform-admin-principal"
      ],
      "externalDependencies": [],
      "body": {
        "backgroundProblem": "Konfigurasi aplikasi tersebar di environment web, gateway, identity, academic, dan billing. Tidak ada inventory managed settings, API platform, history, atau penanda nilai sudah diterapkan; secret tidak boleh dibaca kembali.",
        "goal": "Admin platform dapat mengetahui seluruh konfigurasi aplikasi yang didukung, mengajukan perubahan bertipe, serta melihat audit dan status penerapannya.",
        "requirements": [
          "Inventaris setiap setting aktif pada lima aplikasi dengan owner, tipe, default, sensitivitas, validasi, dan cara penerapan (dinamis/restart/rotasi), termasuk bootstrap-only yang tetap butuh jalur operator terkontrol.",
          "Sediakan control plane hanya untuk admin, allowlist key dan typed validation, optimistic versioning, audit aktor dan perubahan; secret hanya metadata/referensi dan never-read-back.",
          "Bedakan requested, applied, failed, dan rollback state sehingga UI tidak mengklaim nilai aktif sebelum consumer menerapkannya.",
          "Pertahankan nilai efektif lama selama migrasi; definisikan kontrak konsumsi dan prosedur pemulihan bila control plane tidak tersedia."
        ],
        "acceptanceCriteria": [
          "Admin dapat melihat inventory lengkap dan status setiap setting tanpa nilai secret plaintext.",
          "Perubahan non-secret yang valid menghasilkan versi dan audit; key tidak dikenal atau nilai invalid ditolak.",
          "Konflik versi dan kegagalan penerapan dilaporkan tanpa mengklaim sukses.",
          "Tenant dan parent tidak dapat membaca metadata sensitif atau mengubah setting.",
          "Existing functionality remains unaffected",
          "Error and validation scenarios are handled correctly"
        ],
        "technicalNotes": "Risiko utama control plane menjadi single point of failure dan membuka secret. Pisahkan desired/applied state, gunakan allowlist, redaksi, dan last-known-good untuk consumer sesuai kelas setting. Topologi deployment belum ditemukan, sehingga mekanisme penerapan lintas proses memerlukan ADR dan bukti integrasi sebelum rotasi secret. Inventaris harus dibandingkan dengan docs/reference/environment-variables.md dan source saat implementasi.",
        "relevantAreas": [
          "kelolakelas-identity-service/migrations",
          "kelolakelas-identity-service/internal/config/config.go",
          "kelolakelas-api-gateway/internal/delivery/http/router.go",
          "kelolakelas-docs/docs/reference/environment-variables.md"
        ],
        "edgeCases": [
          "Dua admin mengubah setting bersamaan.",
          "Control plane mati ketika service mulai atau berjalan.",
          "Secret diubah tetapi konsumen belum menerapkan versi baru."
        ],
        "testingValidation": [
          "Mitigasi risiko: test redaksi secret, akses tenant/parent, version conflict, dan last-known-good.",
          "Validasi inventory terhadap seluruh key yang dibaca oleh lima aplikasi.",
          "Relevant unit tests are added or updated",
          "Relevant integration tests are added or updated",
          "Existing tests pass",
          "Lint passes",
          "Type checking passes",
          "Acceptance criteria are manually or automatically verified"
        ],
        "outOfScope": [
          "Implementasi adapter consumer per layanan.",
          "Rotasi secret pada deployment.",
          "UI pengaturan."
        ]
      }
    },
    {
      "draftKey": "platform-registration-policy",
      "projectKey": "platform-admin-control-plane",
      "title": "Platform admin dapat membuka dan menutup pendaftaran tenant baru",
      "type": "Feature",
      "priority": "Urgent",
      "estimate": "M",
      "complexity": "high",
      "labels": [
        "identity",
        "api-gateway",
        "ai-ready"
      ],
      "repositories": [
        "identity",
        "api-gateway"
      ],
      "blockedByDraftKeys": [
        "platform-config-control-plane"
      ],
      "externalDependencies": [],
      "body": {
        "backgroundProblem": "POST /tenants/register saat ini publik dan selalu dapat membuat tenant serta Creator pertama. Platform admin belum dapat mengendalikan onboarding tanpa deployment.",
        "goal": "Setting platform untuk penerimaan tenant baru berlaku pada registrasi dan dapat diamati oleh admin.",
        "requirements": [
          "Setting boolean bertipe memiliki default yang mempertahankan registrasi aktif.",
          "Registrasi memeriksa nilai efektif sebelum membuat user, tenant, wallet, atau Creator.",
          "Admin melihat desired/applied version dan audit; penolakan registrasi memberi respons domain stabil.",
          "Login dan bootstrap platform admin tetap tersedia saat registrasi ditutup."
        ],
        "acceptanceCriteria": [
          "Saat aktif registrasi tetap berhasil; saat nonaktif respons penolakan jelas tanpa record parsial.",
          "Perubahan status tercermin pada versi applied identity.",
          "Tenant dan parent tidak dapat mengubah setting.",
          "Existing functionality remains unaffected",
          "Error and validation scenarios are handled correctly"
        ],
        "technicalNotes": "Risiko utama race saat policy dinonaktifkan dan record parsial. Terapkan pemeriksaan dekat transaksi pendaftaran dan test perubahan serentak; kebijakan outage harus fail-closed untuk registrasi baru.",
        "relevantAreas": [
          "kelolakelas-identity-service/internal/usecase/tenant_usecase.go",
          "kelolakelas-identity-service/internal/repository/user_repository.go",
          "kelolakelas-api-gateway/internal/delivery/http/router.go"
        ],
        "edgeCases": [
          "Registrasi berlangsung saat admin menutup policy.",
          "Store config tidak tersedia.",
          "Admin menutup registrasi ketika belum ada tenant."
        ],
        "testingValidation": [
          "Mitigasi risiko: test konkurensi perubahan policy dengan registrasi dan rollback tanpa data parsial.",
          "Relevant unit tests are added or updated",
          "Relevant integration tests are added or updated",
          "Existing tests pass",
          "Lint passes",
          "Type checking passes",
          "Acceptance criteria are manually or automatically verified"
        ],
        "outOfScope": [
          "Visibilitas katalog.",
          "Biaya platform.",
          "Pengubahan tenant yang sudah ada."
        ]
      }
    },
    {
      "draftKey": "platform-catalog-policy",
      "projectKey": "platform-admin-control-plane",
      "title": "Platform admin dapat mengatur visibilitas katalog publik secara konsisten",
      "type": "Feature",
      "priority": "High",
      "estimate": "M",
      "complexity": "high",
      "labels": [
        "identity",
        "academic",
        "api-gateway",
        "ai-ready"
      ],
      "repositories": [
        "identity",
        "academic",
        "api-gateway"
      ],
      "blockedByDraftKeys": [
        "platform-config-control-plane"
      ],
      "externalDependencies": [],
      "body": {
        "backgroundProblem": "Katalog publik saat ini menampilkan kelas published/open milik tenant aktif, dengan snapshot tenant di academic. Tidak ada sakelar global platform atau status applied lintas list/detail.",
        "goal": "Admin dapat membuka atau menutup katalog publik tanpa mengubah kelas dan tenant, dengan hasil konsisten pada daftar dan detail.",
        "requirements": [
          "Setting boolean bertipe default aktif mempertahankan perilaku katalog saat ini.",
          "List dan detail katalog memakai kebijakan efektif yang sama; saat ditutup respons publik jelas dan data kelas tetap ada.",
          "Admin melihat versi applied academic dan dapat rollback.",
          "Jika konfigurasi tidak dapat dipercaya, jangan bocorkan kelas yang seharusnya tersembunyi."
        ],
        "acceptanceCriteria": [
          "Saat aktif list/detail seperti sekarang; saat nonaktif keduanya tidak menampilkan kelas.",
          "Kelas dan tenant tidak berubah saat policy ditutup atau dibuka kembali.",
          "Versi applied dan audit tersedia untuk admin.",
          "Existing functionality remains unaffected",
          "Error and validation scenarios are handled correctly"
        ],
        "technicalNotes": "Risiko utama list dan detail berbeda kebijakan atau cache snapshot menampilkan konten lama. Uji kedua route, cache/freshness, dan policy outage. Jangan ubah aturan published/open yang sudah ada.",
        "relevantAreas": [
          "kelolakelas-academic-service/internal/usecase/catalog_usecase.go",
          "kelolakelas-academic-service/internal/repository/catalog_repository.go",
          "kelolakelas-identity-service/internal/config/config.go",
          "kelolakelas-api-gateway/internal/delivery/http/router.go"
        ],
        "edgeCases": [
          "Setting ditutup di tengah pagination.",
          "Snapshot tenant masih segar saat policy berubah.",
          "Control plane tidak tersedia."
        ],
        "testingValidation": [
          "Mitigasi risiko: test list/detail dan cache saat policy berubah serta saat control plane mati.",
          "Relevant unit tests are added or updated",
          "Relevant integration tests are added or updated",
          "Existing tests pass",
          "Lint passes",
          "Type checking passes",
          "Acceptance criteria are manually or automatically verified"
        ],
        "outOfScope": [
          "Moderasi kelas per tenant.",
          "Pencarian/ranking katalog.",
          "Harga kelas."
        ]
      }
    },
    {
      "draftKey": "platform-fee-policy",
      "projectKey": "platform-admin-control-plane",
      "title": "Platform admin dapat menetapkan biaya platform untuk transaksi baru secara aman",
      "type": "Feature",
      "priority": "High",
      "estimate": "M",
      "complexity": "critical",
      "labels": [
        "identity",
        "billing",
        "api-gateway",
        "ai-ready"
      ],
      "repositories": [
        "identity",
        "billing",
        "api-gateway"
      ],
      "blockedByDraftKeys": [
        "platform-config-control-plane"
      ],
      "externalDependencies": [
        {
          "key": "platform-fee-business-policy",
          "description": "Owner menyetujui basis perhitungan, nilai/rentang, pembulatan, waktu efektif, dan perlakuan invoice lama.",
          "verification": "ADR kebijakan biaya platform disetujui dan memuat contoh invoice sebelum/sesudah perubahan."
        }
      ],
      "body": {
        "backgroundProblem": "Billing saat ini menerima platform_fee dari request internal dan menghitung net_amount dari nilai tersebut. Belum ada formula atau sumber kebijakan platform yang disetujui.",
        "goal": "Admin dapat mengubah biaya platform yang hanya berlaku pada transaksi baru menurut kebijakan bisnis yang disetujui, dengan jejak versi.",
        "requirements": [
          "Tentukan tipe, batas, dan formula fee dari ADR bisnis; editor hanya menerima nilai valid.",
          "Billing memakai kebijakan terpusat sebagai sumber otoritatif untuk transaksi baru dan menyimpan versi yang dipakai.",
          "Invoice/transaksi lama tidak dihitung ulang ketika nilai fee berubah.",
          "Admin dapat melihat nilai efektif, histori, dan status penerapan billing."
        ],
        "acceptanceCriteria": [
          "Transaksi baru memakai fee dan versi policy yang benar.",
          "Transaksi lama dan invoice yang sudah dibuat tidak berubah.",
          "Input fee invalid atau policy belum applied tidak menghasilkan invoice dengan fee salah.",
          "Existing functionality remains unaffected",
          "Error and validation scenarios are handled correctly"
        ],
        "technicalNotes": "Risiko utama financial correctness. Formula belum ada dan tidak boleh diasumsikan dari field platform_fee. Issue tidak executable sebelum ADR bisnis disetujui. Uji rounding, batas, perubahan di tengah checkout, dan rollback.",
        "relevantAreas": [
          "kelolakelas-billing-service/internal/usecase/transaction_usecase.go",
          "kelolakelas-billing-service/internal/domain/transaction.go",
          "kelolakelas-identity-service/migrations",
          "kelolakelas-api-gateway/internal/delivery/http/router.go"
        ],
        "edgeCases": [
          "Checkout dimulai sebelum fee berubah dan selesai sesudahnya.",
          "Fee melebihi gross amount.",
          "Subscription renewal memakai versi berbeda dari transaksi awal."
        ],
        "testingValidation": [
          "Mitigasi risiko: test invoice, callback, renewal, dan rollback pada batas perubahan fee menggunakan contoh ADR.",
          "Relevant unit tests are added or updated",
          "Relevant integration tests are added or updated",
          "Existing tests pass",
          "Lint passes",
          "Type checking passes",
          "Acceptance criteria are manually or automatically verified"
        ],
        "outOfScope": [
          "Refund dan settlement otomatis.",
          "Perubahan harga kelas tenant.",
          "Kredensial Duitku."
        ]
      }
    },
    {
      "draftKey": "platform-edge-config",
      "projectKey": "platform-admin-control-plane",
      "title": "Konfigurasi operasional web dan gateway dapat diterapkan dengan rollback",
      "type": "Feature",
      "priority": "High",
      "estimate": "L",
      "complexity": "high",
      "labels": [
        "web",
        "api-gateway",
        "identity",
        "ai-ready"
      ],
      "repositories": [
        "web",
        "api-gateway",
        "identity"
      ],
      "blockedByDraftKeys": [
        "platform-config-control-plane"
      ],
      "externalDependencies": [
        {
          "key": "edge-deployment-topology",
          "description": "Topologi deployment web dan gateway beserta mekanisme rollout harus diketahui.",
          "verification": "Staging dapat menerapkan dan me-rollback setting web/gateway sambil menampilkan status per replika."
        }
      ],
      "body": {
        "backgroundProblem": "Origin web, gateway targets, CORS, rate limit, proxy trust, ukuran body, dan timeout kini dibaca saat startup. Perubahan tidak dapat dikelola atau diverifikasi admin platform.",
        "goal": "Admin dapat mengelola seluruh setting operasional non-secret web/gateway dari inventory dengan validasi, rollout, status, dan rollback.",
        "requirements": [
          "Implementasikan jalur penerapan semua key non-secret web/gateway yang terinventaris; tandai dynamic atau restart-required.",
          "Validasi dependensi lintas key sebelum rollout, termasuk write timeout > upstream timeout dan trusted-proxy pair.",
          "Tampilkan desired/applied version per layanan/replika; rollback saat health gagal.",
          "Pertahankan routing dan rate limit lama hingga versi baru benar-benar applied."
        ],
        "acceptanceCriteria": [
          "Semua key web/gateway non-secret dalam inventory punya jalur update dan status penerapan.",
          "Nilai invalid atau kombinasi berbahaya ditolak sebelum rollout.",
          "Rollout gagal dapat di-rollback dan UI tidak mengklaim versi baru aktif.",
          "Existing functionality remains unaffected",
          "Error and validation scenarios are handled correctly"
        ],
        "technicalNotes": "Risiko utama gangguan trafik dan spoofing IP karena konfigurasi proxy. Topologi deployment Unknown; jangan mengasumsikan hot reload. Uji staging dan rollback sebelum produksi.",
        "relevantAreas": [
          "kelolakelas-web/.env.example",
          "kelolakelas-web/lib/gateway.ts",
          "kelolakelas-api-gateway/internal/config/config.go",
          "kelolakelas-api-gateway/internal/delivery/http/router.go",
          "kelolakelas-identity-service/internal/config/config.go"
        ],
        "edgeCases": [
          "Satu replika gateway gagal restart.",
          "CIDR trusted proxy salah.",
          "Origin web dan CORS berubah tidak serentak."
        ],
        "testingValidation": [
          "Mitigasi risiko: canary dan rollback staging untuk URL, CORS, rate limit, dan trusted proxy.",
          "Relevant unit tests are added or updated",
          "Relevant integration tests are added or updated",
          "Existing tests pass",
          "Lint passes",
          "Type checking passes",
          "Acceptance criteria are manually or automatically verified"
        ],
        "outOfScope": [
          "Secret dan token signing.",
          "Aturan billing/academic.",
          "AI orchestrator internal."
        ]
      }
    },
    {
      "draftKey": "platform-service-config",
      "projectKey": "platform-admin-control-plane",
      "title": "Konfigurasi operasional identity, academic, dan billing dapat diterapkan dengan rollback",
      "type": "Feature",
      "priority": "High",
      "estimate": "L",
      "complexity": "very-high",
      "labels": [
        "identity",
        "academic",
        "billing",
        "ai-ready"
      ],
      "repositories": [
        "identity",
        "academic",
        "billing"
      ],
      "blockedByDraftKeys": [
        "platform-config-control-plane"
      ],
      "externalDependencies": [
        {
          "key": "service-deployment-topology",
          "description": "Topologi deployment identity, academic, billing dan mekanisme worker rollout harus diketahui.",
          "verification": "Staging mendukung rollout serta rollback bertahap tiga service dan status applied per replika."
        }
      ],
      "body": {
        "backgroundProblem": "TTL katalog, timeout gRPC, geocoding, permission flag, interval/enable worker, expiry, serta provider URL non-secret dibaca saat startup dan tidak memiliki control plane.",
        "goal": "Admin dapat mengelola semua setting operasional non-secret tiga service dari inventory dengan status applied dan rollback aman.",
        "requirements": [
          "Implementasikan jalur penerapan semua key non-secret identity/academic/billing dari inventory; tandai dynamic atau restart-required.",
          "Validasi batas dan dependensi lintas setting, terutama permission flag, expiry, dan worker interval.",
          "Tampilkan applied version per service/replika dan rollback saat health atau job processing gagal.",
          "Jaga worker in-flight serta transaksi existing aman ketika setting berubah."
        ],
        "acceptanceCriteria": [
          "Seluruh key non-secret tiga service dalam inventory punya jalur update terdokumentasi.",
          "Nilai invalid ditolak sebelum memengaruhi job atau catalog.",
          "Partial rollout terlihat dan dapat di-rollback tanpa status applied palsu.",
          "Existing functionality remains unaffected",
          "Error and validation scenarios are handled correctly"
        ],
        "technicalNotes": "Risiko utama job ganda/hilang, permission bypass, dan invoice expiry salah. Beberapa key mengubah state machine dan memerlukan rollout bertahap serta test pada staging; jangan mengasumsikan hot reload.",
        "relevantAreas": [
          "kelolakelas-identity-service/internal/config/config.go",
          "kelolakelas-academic-service/internal/config/config.go",
          "kelolakelas-billing-service/internal/config/config.go",
          "kelolakelas-billing-service/internal/usecase/subscription_worker.go"
        ],
        "edgeCases": [
          "Worker interval berubah saat job berjalan.",
          "PERMISSION_REQUIRE_TENANT_ID berubah sebelum client siap.",
          "Expiry baru diterapkan pada invoice pending lama."
        ],
        "testingValidation": [
          "Mitigasi risiko: test worker in-flight, compatibility permission flag, dan invoice lama dalam canary/rollback staging.",
          "Relevant unit tests are added or updated",
          "Relevant integration tests are added or updated",
          "Existing tests pass",
          "Lint passes",
          "Type checking passes",
          "Acceptance criteria are manually or automatically verified"
        ],
        "outOfScope": [
          "Secret dan credential provider.",
          "Formula biaya platform.",
          "AI orchestrator internal."
        ]
      }
    },
    {
      "draftKey": "platform-secret-rotation",
      "projectKey": "platform-admin-control-plane",
      "title": "Platform admin dapat merotasi secret layanan tanpa menampilkan nilainya kembali",
      "type": "Feature",
      "priority": "Urgent",
      "estimate": "L",
      "complexity": "critical",
      "labels": [
        "web",
        "api-gateway",
        "identity",
        "academic",
        "billing",
        "ai-ready"
      ],
      "repositories": [
        "web",
        "api-gateway",
        "identity",
        "academic",
        "billing"
      ],
      "blockedByDraftKeys": [
        "platform-config-control-plane"
      ],
      "externalDependencies": [
        {
          "key": "secret-manager-and-deployment",
          "description": "Secret manager, topologi deployment, dan hak rotasi untuk seluruh aplikasi harus dipilih serta disambungkan.",
          "verification": "Staging memiliki secret manager terhubung, rollout lima aplikasi, rollback, dan bukti akses scoped untuk control plane."
        }
      ],
      "body": {
        "backgroundProblem": "JWT_SECRET, DATABASE_URL, kredensial internal, Redis, Resend, Maps, dan Duitku berasal dari environment. Tidak ada secret manager atau deployment topology yang terbukti di repo; memindahkan plaintext ke tabel aplikasi akan meningkatkan risiko kebocoran.",
        "goal": "Admin dapat memulai dan memantau rotasi setiap secret aplikasi yang terinventaris melalui secret manager dan deployment tanpa pernah membaca kembali nilainya.",
        "requirements": [
          "Inventaris secret per layanan dan protokol rotasinya, termasuk secret bersama JWT/internal service serta secret provider tunggal.",
          "Control plane menyimpan referensi dan status rotasi, bukan plaintext; input sekali pakai, redaksi log/API, otorisasi admin, dan audit wajib.",
          "Rotasi memakai rollout terkoordinasi, validasi health dan callback/signature, serta rollback; secret lama ditarik setelah konsumen baru siap.",
          "Jangan mengizinkan rotasi bila secret manager atau deployment integration tidak siap; tampilkan kegagalan jelas."
        ],
        "acceptanceCriteria": [
          "Admin dapat memulai rotasi di staging dan melihat status tanpa membaca plaintext secret.",
          "Secret lama dan baru ditangani sesuai protokol tanpa memutus login, DB, pembayaran, atau service-to-service.",
          "Kegagalan rollout dapat di-rollback dan status/applied version akurat.",
          "Tenant/parent tidak dapat memulai atau melihat detail secret.",
          "Existing functionality remains unaffected",
          "Error and validation scenarios are handled correctly"
        ],
        "technicalNotes": "Risiko utama outage lintas layanan, token tidak valid, database tak terhubung, dan pembayaran gagal. Deployment topology/secret manager Unknown; issue diblokir external dependency sampai ada integrasi staging. Perlu ADR per kelompok secret dan uji rotasi end-to-end; jangan mengklaim dukungan hot reload jika service hanya membaca env saat startup.",
        "relevantAreas": [
          "kelolakelas-web/.env.example",
          "kelolakelas-api-gateway/internal/config/config.go",
          "kelolakelas-identity-service/internal/config/config.go",
          "kelolakelas-academic-service/internal/config/config.go",
          "kelolakelas-billing-service/internal/config/config.go"
        ],
        "edgeCases": [
          "JWT key dirotasi saat token lama masih berlaku.",
          "Callback Duitku memakai key lama selama rollout.",
          "Satu replika gagal setelah secret manager menyimpan versi baru."
        ],
        "testingValidation": [
          "Mitigasi risiko: rotasi dan rollback staging untuk JWT, DB, internal credential, dan Duitku dengan request nyata.",
          "Scan respons/log untuk plaintext secret dan uji akses tenant/parent.",
          "Relevant unit tests are added or updated",
          "Relevant integration tests are added or updated",
          "Existing tests pass",
          "Lint passes",
          "Type checking passes",
          "Acceptance criteria are manually or automatically verified"
        ],
        "outOfScope": [
          "Menampilkan nilai secret yang sudah tersimpan.",
          "Menyimpan secret di database aplikasi.",
          "Konfigurasi AI orchestrator internal."
        ]
      }
    },
    {
      "draftKey": "platform-creator-ui",
      "projectKey": "platform-admin-control-plane",
      "title": "Creator tenant dapat meminta dan platform admin dapat memutuskan Creator tambahan dari web",
      "type": "Feature",
      "priority": "High",
      "estimate": "M",
      "complexity": "high",
      "labels": [
        "web",
        "ai-ready"
      ],
      "repositories": [
        "web"
      ],
      "blockedByDraftKeys": [
        "creator-approval"
      ],
      "externalDependencies": [],
      "body": {
        "backgroundProblem": "Web hanya memiliki dashboard tenant dan parent; belum ada permintaan Creator maupun dashboard platform. API approval tanpa UI tidak mendukung alur operator sehari-hari.",
        "goal": "Creator tenant dapat mengajukan dan melacak request, sementara platform admin meninjau, menyetujui, atau menolak request di area terpisah.",
        "requirements": [
          "Tambahkan jalur login/dashboard platform yang hanya mengarahkan principal platform dan tetap memverifikasi di backend.",
          "Tenant Creator dapat membuat dan melihat request untuk tenant sendiri; tampilkan status, alasan, dan keputusan.",
          "Platform admin dapat melihat antrian serta approve/reject dengan konfirmasi dan alasan.",
          "Loading, empty, conflict, forbidden, dan expired-session state jelas; action server tidak mempercayai visibilitas UI sebagai otorisasi."
        ],
        "acceptanceCriteria": [
          "Alur request dan approval/reject selesai dari browser dan status terbaru terlihat.",
          "Tenant bukan Creator tidak melihat kontrol dan action langsung menerima 403.",
          "Admin yang dicabut tidak dapat menyetujui meskipun halaman lama masih terbuka.",
          "Existing functionality remains unaffected",
          "Error and validation scenarios are handled correctly"
        ],
        "technicalNotes": "Risiko utama action server memanggil API privileged dengan token tenant. Semua tindakan harus memakai token caller yang diverifikasi backend; proxy web hanya optimisasi navigasi. Ikuti web AGENTS.md dan uji akses langsung action.",
        "relevantAreas": [
          "kelolakelas-web/proxy.ts",
          "kelolakelas-web/lib/auth-routing.ts",
          "kelolakelas-web/app/(auth)/login/_actions/actions.ts",
          "kelolakelas-web/app/(dashboard)/dashboard/tenant/members"
        ],
        "edgeCases": [
          "Target request berubah sebelum approval.",
          "Admin menekan approve dua kali.",
          "Sesi berakhir saat dialog terbuka."
        ],
        "testingValidation": [
          "Mitigasi risiko: test server action dengan token tenant/parent/admin dicabut dan verifikasi 403.",
          "Uji keyboard, label, konfirmasi, status, dan error state.",
          "Relevant unit tests are added or updated",
          "Relevant integration tests are added or updated",
          "Existing tests pass",
          "Lint passes",
          "Type checking passes",
          "Acceptance criteria are manually or automatically verified"
        ],
        "outOfScope": [
          "Editor konfigurasi platform.",
          "Pencabutan Creator.",
          "Impersonasi tenant."
        ]
      }
    },
    {
      "draftKey": "platform-config-ui",
      "projectKey": "platform-admin-control-plane",
      "title": "Platform admin dapat meninjau, mengubah, dan memantau konfigurasi dari dashboard",
      "type": "Feature",
      "priority": "High",
      "estimate": "L",
      "complexity": "high",
      "labels": [
        "web",
        "ai-ready"
      ],
      "repositories": [
        "web"
      ],
      "blockedByDraftKeys": [
        "platform-registration-policy",
        "platform-catalog-policy",
        "platform-fee-policy",
        "platform-edge-config",
        "platform-service-config",
        "platform-secret-rotation"
      ],
      "externalDependencies": [],
      "body": {
        "backgroundProblem": "Tidak ada UI platform admin untuk inventory setting, versi desired/applied, audit, atau rotasi secret. Konfigurasi tersebar di deployment sehingga operator tidak memiliki satu tampilan yang dapat dipercaya.",
        "goal": "Admin platform dapat mengelola seluruh setting aplikasi yang terinventaris dari dashboard dan melihat apakah perubahan benar-benar diterapkan.",
        "requirements": [
          "Tampilkan inventory berdasarkan domain/layanan, nilai non-secret efektif, status penerapan, versi, serta audit.",
          "Editor typed mengikuti validasi API; perubahan berisiko memerlukan konfirmasi, alasan, dan umpan balik rollback.",
          "Secret menggunakan input sekali pakai dan aksi rotasi; tidak ada read-back/plaintext pada UI, cache, atau error.",
          "Tampilkan kegagalan penerapan, status per layanan, dan langkah pemulihan tanpa mengklaim sukses prematur."
        ],
        "acceptanceCriteria": [
          "Admin dapat mengubah setting bisnis/operasional dan memantau desired/applied state.",
          "Admin dapat memulai rotasi secret dan melihat status tanpa nilai plaintext.",
          "Tenant dan parent tidak dapat mengakses dashboard atau action langsung.",
          "Kesalahan validasi, konflik versi, dan rollout gagal muncul jelas.",
          "Existing functionality remains unaffected",
          "Error and validation scenarios are handled correctly"
        ],
        "technicalNotes": "Risiko utama UI menyatakan perubahan aktif sebelum semua consumer menerapkan dan secret bocor ke browser/log. Gunakan kontrak status backend dan redaksi seluruh jalur render; uji akses langsung action.",
        "relevantAreas": [
          "kelolakelas-web/app/(dashboard)",
          "kelolakelas-web/proxy.ts",
          "kelolakelas-web/lib/gateway.ts"
        ],
        "edgeCases": [
          "Sebagian layanan masih pada versi lama.",
          "Admin menutup halaman saat rollout berlangsung.",
          "Secret input invalid atau rotasi ditolak dependency."
        ],
        "testingValidation": [
          "Mitigasi risiko: test status pending/partial/failed dan redaksi secret di HTML, action result, serta log.",
          "Uji keyboard, aksesibilitas editor, dan error state.",
          "Relevant unit tests are added or updated",
          "Relevant integration tests are added or updated",
          "Existing tests pass",
          "Lint passes",
          "Type checking passes",
          "Acceptance criteria are manually or automatically verified"
        ],
        "outOfScope": [
          "Implementasi control plane backend.",
          "Akses raw secret setelah disimpan.",
          "Konfigurasi AI orchestrator internal."
        ]
      }
    }
  ]
}
```

Validasi: `npm --prefix kelolakelas-ai-orchestrator run intake:validate -- /tmp/kelolakelas-platform-admin-backlog-v4.yaml` berhasil: 1 Project, 12 Issue.
