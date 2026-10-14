# Readiness discovery KEL-129

Scope: pembaruan backlog existing dan read-only verification; tidak implementasi fitur.

Bukti provider: native graph dan labels ada pada dependency-verification.json; status merged/CI/reachability 29 PR ada pada pr-evidence.json. Semua prerequisites Done; setiap blocker beserta chain sampai root ditelusuri. Graph telah dicocokkan dengan keys historical contracts.

Bukti executable: api-gateway internal/delivery/http/router.go mendaftarkan route schedule-request secara eksplisit (approve/reject/recommendation/cancel) tanpa aksi send-link. Academic cmd/server/routes.go belum punya send-link; web schedule-requests action mengembalikan paymentUrl untuk disalin manual. Chat mendukung schedule_request conversations dan idempotent Send; internal notification existing memakai conversation notification dan tidak dapat disamakan dengan request-specific conversation. Penambahan route protected gateway diperlukan untuk alur server yang mengotorisasi invoice dan mengirim ke percakapan yang tepat.

User authorization: “lanjutkan sesuai rekomendasi anda”. Hermes berjalan pada mesin lain menurut jawaban pengguna. Tidak ada akses remote runtime, sehingga status active job tidak terverifikasi. Tidak ada perubahan autopilot/cron atau issue lain.

Perubahan scope eksplisit: api-gateway ditambahkan ke set academic/chat/web existing. Project, priority High, estimate M/2, complexity high dan status Backlog dipertahankan. Template lengkap dan contract body konsisten.

Panduan planning lokal kini Markdown-only untuk new issues, sedangkan LINEAR_EXECUTION_PROMPT masih mensyaratkan historical contract/ai-ready. KEL-129 diselaraskan untuk executor existing sesuai otorisasi eksplisit, tanpa memigrasikan items lain.
