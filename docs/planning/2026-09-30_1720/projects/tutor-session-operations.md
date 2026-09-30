## Tujuan/outcome

Pengajar dapat melihat sesi yang menjadi tanggung jawabnya, mencatat kehadiran, mengubah jadwal atau mengganti pengajar, dan menulis laporan evaluasi siswa dari dashboard KelolaKelas.

## Masalah yang diselesaikan

Backend sesi, absensi, dan laporan sudah ada, tetapi tidak ada satu pun layar web yang memakainya; absensi gagal untuk sesi yang di-reschedule, guard pengajar tidak konsisten, dan menu tenant statis sehingga pengajar melihat semua menu admin.

## Nilai dan prioritas

High: operasional kelas harian adalah alasan utama tenant memakai aplikasi setelah kelas terjual; sebagian besar kemampuan backend sudah tersedia sehingga nilai per effort tinggi.

## Scope

- Absensi per sesi termasuk sesi hasil reschedule dan pencatatan massal per sesi.
- Guard akses sesi dan laporan untuk pengajar serta daftar sesi milik pengajar yang login.
- Endpoint permission anggota saat ini dan menu tenant yang mengikuti permission.
- Layar sesi dan absensi, reschedule dan tutor pengganti, serta laporan evaluasi siswa.

## Di luar scope

- Akses parent ke sesi, absensi, dan laporan (Project portal parent).
- Notifikasi perubahan jadwal ke parent (Project notifikasi).
- Aplikasi mobile native.

## Success metrics

- Pengajar dapat mencatat kehadiran seluruh siswa satu sesi, termasuk sesi yang di-reschedule, dalam satu aksi.
- Pengajar hanya melihat menu dan data yang diizinkan permission-nya; tidak ada update laporan oleh pengajar yang tidak mengajar kelas tersebut.

## Dependencies/risiko

- Role sistem hanya Creator dan Teacher; role kustom tenant bisa tidak memiliki permission baru yang diwajibkan sehingga dokumentasi perubahan akses wajib disertakan.
- Perubahan guard backend dapat menolak klien yang sebelumnya lolos; uji kompatibilitas role Creator dan Teacher.

## Issue yang diusulkan

1. Absensi dapat dicatat per sesi, termasuk sesi reschedule dan secara massal (`attendance-by-session`)
2. Pengajar melihat sesinya sendiri dan akses sesi, tutor pengganti, serta laporan dijaga konsisten (`tutor-session-scope-guards`)
3. Menu dashboard tenant hanya menampilkan area yang diizinkan permission anggota (`role-aware-tenant-nav`)
4. Pengajar melihat sesi hari ini dan minggu ini serta mencatat kehadiran dari dashboard (`web-tutor-sessions-attendance`)
5. Tenant dapat me-reschedule sesi dan menugaskan tutor pengganti dari detail sesi (`web-session-reschedule-substitute`)
6. Pengajar menulis dan mengelola laporan evaluasi siswa dari dashboard (`web-tutor-student-reports`)

## AI Orchestrator Project Contract

```json
{
  "key": "tutor-session-operations",
  "name": "Operasional sesi, absensi, dan laporan oleh pengajar",
  "outcome": "Pengajar dapat melihat sesi yang menjadi tanggung jawabnya, mencatat kehadiran, mengubah jadwal atau mengganti pengajar, dan menulis laporan evaluasi siswa dari dashboard KelolaKelas.",
  "problem": "Backend sesi, absensi, dan laporan sudah ada, tetapi tidak ada satu pun layar web yang memakainya; absensi gagal untuk sesi yang di-reschedule, guard pengajar tidak konsisten, dan menu tenant statis sehingga pengajar melihat semua menu admin.",
  "valueAndPriority": "High: operasional kelas harian adalah alasan utama tenant memakai aplikasi setelah kelas terjual; sebagian besar kemampuan backend sudah tersedia sehingga nilai per effort tinggi.",
  "scope": [
    "Absensi per sesi termasuk sesi hasil reschedule dan pencatatan massal per sesi.",
    "Guard akses sesi dan laporan untuk pengajar serta daftar sesi milik pengajar yang login.",
    "Endpoint permission anggota saat ini dan menu tenant yang mengikuti permission.",
    "Layar sesi dan absensi, reschedule dan tutor pengganti, serta laporan evaluasi siswa."
  ],
  "outOfScope": [
    "Akses parent ke sesi, absensi, dan laporan (Project portal parent).",
    "Notifikasi perubahan jadwal ke parent (Project notifikasi).",
    "Aplikasi mobile native."
  ],
  "successMetrics": [
    "Pengajar dapat mencatat kehadiran seluruh siswa satu sesi, termasuk sesi yang di-reschedule, dalam satu aksi.",
    "Pengajar hanya melihat menu dan data yang diizinkan permission-nya; tidak ada update laporan oleh pengajar yang tidak mengajar kelas tersebut."
  ],
  "dependenciesAndRisks": [
    "Role sistem hanya Creator dan Teacher; role kustom tenant bisa tidak memiliki permission baru yang diwajibkan sehingga dokumentasi perubahan akses wajib disertakan.",
    "Perubahan guard backend dapat menolak klien yang sebelumnya lolos; uji kompatibilitas role Creator dan Teacher."
  ]
}
```
