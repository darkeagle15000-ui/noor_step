JEJAK NUR — PROTOTIPE 0.2
A Life of Faith & Adventure · Cozy Arabian Top-Down Pixel RPG

CARA MENJALANKAN SECARA LOKAL
1. Simpan index.html, style.css, dan script.js di dalam satu folder yang sama.
2. Buka index.html dengan browser (Chrome, Firefox, atau Edge).
3. Tidak memerlukan instalasi, server, atau API key. Font web hanya bersifat opsional.

KONTROL
- WASD atau tombol panah: bergerak ke empat arah
- E atau Enter: berbicara, berinteraksi, masuk pintu, atau keluar bangunan
- I: membuka tas
- J: membuka jurnal
- H: membuka panduan
- Escape: menutup jendela
- Ponsel: gunakan D-pad dan tombol INTERAKSI

FITUR PROTOTIPE 0.2
- Dunia gurun dan oasis berukuran 180 × 140 tile (5.760 × 4.480 pixel dunia).
- Beberapa kawasan: Kota Nuraya, Oasis Utara, Pelabuhan Barat, Kebun Kurma Timur, Taman Oasis Timur, Lembah Selatan, dan Reruntuhan Selatan.
- Karakter bergaya chibi pixel orisinal, dengan empat arah dan animasi langkah.
- Sembilan NPC yang bergerak di area tempat tinggalnya, berhenti, dan menghadap pemain saat diajak bicara.
- Bangunan dengan interior yang dapat dimasuki dan pintu keluar yang dapat digunakan.
- Kamera mengikuti pemain, depth sorting untuk pepohonan/bangunan/karakter, dan peta mini seluruh dunia.
- Pasar, barang, tas, jurnal misi sederhana, jam simulasi, pergantian pencahayaan, dan pengingat waktu salat simulasi.
- Penyimpanan progres di browser menggunakan localStorage.

PENTING UNTUK UPDATE GITHUB + CLOUDFLARE PAGES
1. Ekstrak ZIP ini di komputer.
2. Buka repository JEJAK NUR di GitHub.
3. Ganti file lama index.html, style.css, dan script.js dengan file versi 0.2 ini. Pastikan ketiganya berada di folder utama repository yang sama (kecuali Root directory Cloudflare memang diarahkan ke subfolder).
4. Commit perubahan, lalu Push ke branch production (biasanya main).
5. Cloudflare Pages akan menjalankan deployment otomatis. Buka Deployments di Cloudflare untuk memastikan statusnya Success.
6. Muat ulang website. Jika versi lama masih terlihat, lakukan hard refresh (Ctrl + Shift + R).

KONFIGURASI CLOUDFLARE PAGES UNTUK HTML STATIS
- Framework preset: None
- Build command: exit 0 (atau kosong jika dashboard mengizinkannya)
- Build output directory: .
- Root directory: / jika file index.html berada di root repository.

CATATAN
- Gaya karakter adalah desain pixel chibi orisinal, bukan aset atau karakter Pokémon.
- Jadwal salat pada prototipe ini adalah jadwal simulasi fiktif untuk gameplay, bukan jadwal ibadah nyata.
- Map ini dibuat secara prosedural di Canvas; versi berikutnya masih dapat menambah interior, quest, serta detail aset.
