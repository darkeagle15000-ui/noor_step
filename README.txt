JEJAK NUR — PROTOTIPE v0.6
A Life of Faith & Adventure

PERUBAHAN v0.6
- Ukuran karakter diperkecil: sprite sekarang 38 x 50 piksel dunia (sekitar 30 x 40 piksel pada zoom permainan), bukan 62 x 82.
- Animasi berjalan diperbaiki. Sebelumnya waktu animasi dikalikan lagi sehingga frame berubah terlalu cepat; sekarang animasi menggunakan waktu nyata dan berganti 8 frame per detik.
- Posisi gambar memakai koordinat pecahan agar perpindahan karakter dan kamera tidak terasa meloncat-loncat.
- Gerakan pemain tidak lagi mengayunkan animasi jika tertahan oleh dinding atau objek.
- Maryam, Amina, dan Zahra sekarang memakai atlas sprite perempuan yang benar-benar berbeda: hijab, bentuk pakaian, dan warna busananya berbeda dari sprite laki-laki.
- Bug fallback diperbaiki: NPC perempuan tidak lagi memakai gambar Ahmad saat atlas khusus belum tersedia.
- NPC laki-laki tetap menggunakan sprite chibi laki-laki dengan variasi pakaian.

ISI GAME YANG TETAP ADA
- Dunia 180 x 140 tile (5.760 x 4.480 piksel dunia).
- Kota Nuraya, masjid, pasar, pelabuhan, kebun kurma, desa oasis, dan reruntuhan.
- NPC bergerak di area aktivitasnya dan dapat diajak berbicara.
- Collision untuk air, bangunan, pohon, batu, kios, dan objek lingkungan.
- Masuk/keluar bangunan melalui pintu.
- Misi kurma: bicara dengan Yusuf, beli kurma, temui Maryam, serahkan kurma, lalu dapatkan hadiah 35 koin.
- Inventaris, jurnal, koin, jam simulasi, dan pengingat waktu salat dalam game.
- Kontrol keyboard dan tombol sentuh untuk ponsel.

STRUKTUR FOLDER
index.html
style.css
script.js
README.txt
assets/
  chibi-teal.png
  chibi-terracotta.png
  chibi-blue.png
  chibi-ochre.png
  chibi-plum.png
  chibi-female-sage.png
  chibi-female-lavender.png
  chibi-female-rose.png

CARA MENJALANKAN
1. Ekstrak ZIP.
2. Pastikan folder assets dan seluruh PNG tetap berada di samping index.html.
3. Buka index.html di browser untuk mencoba game secara lokal.

KONTROL
WASD / tombol panah : bergerak
E / Enter            : bicara, interaksi, masuk/keluar bangunan
I                    : membuka tas
J                    : membuka jurnal misi
H                    : bantuan
ESC                  : menutup jendela
Ponsel               : gunakan tombol arah dan tombol INTERAKSI

MENYELESAIKAN MISI PERTAMA
1. Dekati Yusuf di dekat Pasar Nuraya, lalu tekan E.
2. Ikuti penanda emas ke Pasar Rempah Nuraya dan tekan E.
3. Beli 1 paket Kurma Pilihan seharga 18 koin.
4. Ikuti penanda emas ke timur, seberangi jembatan kayu, lalu temui Maryam.
5. Tekan E dan pilih "Berikan 1 paket kurma".
6. Misi selesai dan hadiah 35 koin diberikan.

GITHUB + CLOUDFLARE PAGES
1. Timpa index.html, style.css, dan script.js di root repository dengan file versi ini.
2. Upload seluruh folder assets, termasuk tiga file chibi-female-*.png yang baru.
3. Jangan meletakkan index.html di subfolder tambahan.
4. Commit changes ke branch production (biasanya main).
5. Cloudflare Pages akan deploy ulang secara otomatis.

CATATAN
- Progres disimpan di localStorage browser masing-masing perangkat.
- Jika pemain melihat karakter lama setelah deployment, lakukan hard refresh (Ctrl + F5) agar cache sprite lama dibersihkan.
- Jam dan waktu salat masih simulasi gameplay, bukan jadwal ibadah nyata.
- Ini prototipe statis; belum menggunakan server akun atau penyimpanan lintas perangkat.
