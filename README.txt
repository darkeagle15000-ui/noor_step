JEJAK NUR — PROTOTIPE v0.5
A Life of Faith & Adventure

APA YANG DIPERBAIKI DI v0.5
- Karakter utama memakai sprite chibi baru: kepala besar membulat, wajah ramah, badan mungil, dan pakaian sederhana.
- NPC laki-laki memakai variasi warna sprite dan animasi 4 arah; NPC perempuan memakai variasi berkerudung.
- Sprite memiliki 4 arah (depan, kiri, kanan, belakang) dan 4 frame untuk animasi berjalan.
- Pepohonan palem dan pohon berbunga, pot bunga, lampu jalan, motif masjid, detail atap rumah, dan kios pasar diperindah.
- Collision diperbaiki: dinding bangunan menghalangi pemain, tetapi bukaan pintu tetap bisa dilewati.
- Jembatan kayu pada rute kebun kurma bisa diseberangi.
- Misi utama sekarang memiliki tahapan, penanda di dunia/minimap, interaksi toko, barang misi, penyerahan barang, dan hadiah.
- Misi yang diuji: bicara dengan Yusuf → beli 1 paket kurma → temui Maryam → serahkan kurma → terima 35 koin.
- Bangunan dapat dimasuki dan pemain dapat keluar kembali melalui pintu.
- Dunia berukuran 180 × 140 tile (5.760 × 4.480 piksel dunia).

STRUKTUR FOLDER
index.html
style.css
script.js
assets/
  chibi-teal.png
  chibi-terracotta.png
  chibi-blue.png
  chibi-ochre.png
  chibi-plum.png

CARA MENJALANKAN
1. Ekstrak ZIP.
2. Pastikan folder assets beserta kelima file PNG tetap berada sejajar dengan index.html.
3. Buka index.html di browser untuk mencoba game secara lokal.

KONTROL
WASD / tombol panah : bergerak
E / Enter            : bicara, interaksi, masuk/keluar bangunan
I                    : membuka tas
J                    : membuka jurnal misi
H                    : bantuan
ESC                  : menutup jendela
Ponsel               : gunakan tombol arah dan tombol INTERAKSI di layar

MENYELESAIKAN MISI PERTAMA
1. Dekati Yusuf di dekat Pasar Nuraya, lalu tekan E.
2. Ikuti penanda emas ke Pasar Rempah Nuraya dan tekan E.
3. Pilih tombol beli untuk 1 paket Kurma Pilihan (harga 18 koin).
4. Ikuti penanda emas ke timur, seberangi jembatan kayu, lalu temui Maryam di kebun kurma.
5. Tekan E dan pilih "Berikan 1 paket kurma".
6. Misi selesai dan hadiah 35 koin diberikan.

GITHUB + CLOUDFLARE PAGES
1. Ganti index.html, style.css, dan script.js lama di folder utama repository.
2. Upload juga folder assets beserta kelima PNG di atas.
3. Pastikan index.html berada di folder utama (root), bukan di dalam folder tambahan.
4. Commit changes ke branch production (biasanya main).
5. Cloudflare Pages akan membangun ulang website secara otomatis.

CATATAN
- Progres disimpan di localStorage browser masing-masing perangkat.
- Penyimpanan versi sebelumnya tidak diimpor, agar misi baru dimulai dalam keadaan benar dan tidak mewarisi status misi yang rusak.
- Jam dan waktu salat di versi ini masih berupa simulasi untuk gameplay, bukan jadwal ibadah nyata.
- Ini prototipe HTML/CSS/JavaScript statis; belum memakai server akun atau penyimpanan lintas perangkat.
