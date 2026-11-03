# Backlog - Testing 31 Oktober 2026

Enam issue dibuat dan diverifikasi di Linear setelah persetujuan `setujui!` pada 2 November 2026. Semua berstatus Backlog; MAKS_ISSUE=8; tidak ada Project baru. Description sumber kebenaran `issues/*.md`; tidak menggunakan orchestrator/ai-ready.

## Project existing

- P-KEL-7: Operasional tenant untuk menjual kelas; digunakan untuk publication copy.
- P-KEL-9: Pengalaman pembeli yang lengkap di web; digunakan untuk navigasi auth/CTA dan modal lintas web.
- P-KEL-22: Pembelian kelas private dengan jadwal yang disepakati; digunakan untuk time input parent, limit dan approval subset.
- Ketiganya diresolve ulang sebelum pengiriman, tidak Canceled, dan digunakan kembali. Team KEL (KelolaKelas), ID `fa7e083f-279c-4075-b103-76c4ed0a9255`. Tidak overwrite description Project.

## Metadata dan urutan eksekusi

| Urutan | draftKey / Judul | Project | Type | Priority | Estimate | Complexity | Repository labels | Blocked by | Related Done |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | private-approved-slot-limit - [Atur batas slot jadwal approved per enrollment kelas private](issues/05-private-approved-slot-limit.md) | P-KEL-22 | Feature | High | M (2) | high | academic, web, api-gateway | - | KEL-215 |
| 2 | private-approved-slot-selection - [Pilih subset usulan jadwal saat tenant menyetujui kelas private](issues/06-private-approved-slot-selection.md) | P-KEL-22 | Feature | High | L (3) | high | academic, web, api-gateway | private-approved-slot-limit | KEL-215, KEL-222, KEL-221, KEL-226 |
| 3 | centered-modal-layout - [Pusatkan seluruh modal web, termasuk tambah anak dari detail kelas](issues/03-centered-modal-layout.md) | P-KEL-9 | Improvement | High | M (2) | medium | web | - | KEL-228 |
| 4 | auth-entry-navigation - [Lengkapi link login/register dan arahkan Akses awal ke login](issues/01-auth-entry-navigation.md) | P-KEL-9 | Improvement | Medium | S (1) | low | web | - | KEL-228 |
| 5 | private-time-input-autoadvance - [Terapkan perpindahan jam ke menit pada input jadwal private parent](issues/04-private-time-input-autoadvance.md) | P-KEL-22 | Improvement | Medium | M (2) | medium | web | - | KEL-210, KEL-220 |
| 6 | publication-success-copy - [Hapus wording sukses publikasi kelas tanpa menyembunyikan error](issues/02-publication-success-copy.md) | P-KEL-7 | Improvement | Low | S (1) | low | web | - | KEL-198 |

Urutan nama file adalah indeks penulisan, bukan dependency; gunakan kolom Urutan untuk eksekusi. Issue independen boleh dijalankan tanpa menunggu issue private. Native blockedBy hanya selection -> limit setelah key diresolve menjadi ID Linear; related Done bukan blocker. Gate dependency harus merged main sebelum implementasi dependent. `api-gateway` pada dua issue private hanya regression test raw payload forwarding, bukan endpoint/business logic baru. Type planning bugfix tetap Improvement; label Bug boleh dipakai sesuai taxonomy Linear terverifikasi saat pengiriman, tanpa membuat label baru otomatis.

## Keputusan dan gate

Semantik planning disetujui bersama seluruh draft: N maksimum slot mingguan per request/enrollment, private baru default form 1, legacy tanpa N tetap kompatibel, perubahan N berlaku pada pending belum termaterialisasi, approved purchase intent immutable untuk retry. Ini requirement yang disetujui, bukan perilaku yang sudah diimplementasikan. Lihat [report.md](report.md).

## Hasil pengiriman

| Urutan | draftKey | Linear | Native blocked by |
| --- | --- | --- | --- |
| 1 | private-approved-slot-limit | [KEL-229](https://linear.app/farid-zamani/issue/KEL-229/atur-batas-slot-jadwal-approved-per-enrollment-kelas-private) | - |
| 2 | private-approved-slot-selection | [KEL-230](https://linear.app/farid-zamani/issue/KEL-230/pilih-subset-usulan-jadwal-saat-tenant-menyetujui-kelas-private) | KEL-229 |
| 3 | centered-modal-layout | [KEL-231](https://linear.app/farid-zamani/issue/KEL-231/pusatkan-seluruh-modal-web-termasuk-tambah-anak-dari-detail-kelas) | - |
| 4 | auth-entry-navigation | [KEL-232](https://linear.app/farid-zamani/issue/KEL-232/lengkapi-link-loginregister-dan-arahkan-akses-awal-ke-login) | - |
| 5 | private-time-input-autoadvance | [KEL-233](https://linear.app/farid-zamani/issue/KEL-233/terapkan-perpindahan-jam-ke-menit-pada-input-jadwal-private-parent) | - |
| 6 | publication-success-copy | [KEL-234](https://linear.app/farid-zamani/issue/KEL-234/hapus-wording-sukses-publikasi-kelas-tanpa-menyembunyikan-error) | - |

Fetch ulang keenam issue memverifikasi body semantik, delapan heading, team/project, priority, estimate, label, related issues dan dependency native. Mapping UUID/URL tersimpan di [linear-sync.json](linear-sync.json). Tidak ada assignment/delegation, implementasi aplikasi, commit, push atau PR.
