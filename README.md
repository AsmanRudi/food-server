# FoodApp --- Food Ordering Web Application

FoodApp adalah proyek aplikasi pemesanan makanan berbasis web. Proyek
ini mencakup antarmuka checkout dan backend API untuk menangani data
aplikasi.

> Catatan: README ini disusun dari informasi proyek yang telah dibahas.
> Periksa `package.json`, konfigurasi, dan router aktual untuk
> memastikan nama script, environment variable, serta endpoint sesuai
> dengan source code.

## Fitur

-   Pengambilan dan pengelolaan data produk.
-   Pencarian dan filter produk berdasarkan kategori/tag jika tersedia
    pada endpoint.
-   Registrasi/login dengan autentikasi JWT.
-   Otorisasi akses menggunakan CASL.
-   Dukungan data keranjang dan pesanan.
-   Form checkout dan alamat pengiriman.
-   Dukungan invoice dan alamat pengiriman sesuai implementasi backend.
-   Upload file menggunakan Multer.
-   Pengujian API menggunakan Insomnia.

## Teknologi

### Backend

-   Node.js
-   Express.js
-   MongoDB dan Mongoose
-   JSON Web Token (JWT)
-   bcrypt
-   CASL (`@casl/ability`)
-   Multer
-   Passport jika digunakan oleh konfigurasi autentikasi

### Frontend

-   React
-   Vite
-   JavaScript/JSX
-   Tailwind CSS atau utility class terkait, jika dikonfigurasi

Pug juga tersedia pada proyek backend untuk template yang digunakan.
Versi Node.js yang pernah digunakan saat pengembangan adalah `v24.14.0`.

## Persyaratan

-   Node.js dan npm
-   MongoDB lokal atau URI MongoDB yang dapat diakses
-   Insomnia (opsional, untuk pengujian API)
-   Git (opsional)

## Struktur Proyek

Struktur berikut adalah gambaran umum, bukan jaminan daftar file yang
lengkap. Sesuaikan dengan repository aktual.

``` text
food-server/
├── app.js
├── bin/
│   └── www
├── app/
│   ├── auth/
│   │   └── controller.js
│   ├── user/
│   │   └── model/
│   ├── product/
│   ├── category/
│   ├── order/
│   ├── cart/
│   ├── delivery-address/
│   └── invoice/
├── middlewares/
│   └── index.js
├── config/
├── public/
│   └── images/
├── views/
├── package.json
├── .env
└── README.md
```

## Instalasi

### 1. Masuk ke direktori proyek

Contoh pada Windows:

``` powershell
cd D:\eduwork\Project\food-server
```

### 2. Instal dependency

``` bash
npm install
```

### 3. Konfigurasi environment

Buat file `.env` di root backend. Contoh di bawah hanya template;
gunakan nama variabel yang benar-benar dibaca oleh modul konfigurasi
proyek.

``` dotenv
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/foodapp
JWT_SECRET=ganti_dengan_secret_yang_kuat
```

-   Pastikan MongoDB aktif dan URI sesuai dengan database yang
    digunakan.
-   Pastikan variabel secret dipetakan dengan benar di modul
    konfigurasi.
-   Jangan commit `.env` atau membagikan secret ke repository publik.
-   Jangan gunakan contoh secret di atas untuk produksi.

### Gambar produk di Vercel

Upload produk di Vercel disimpan di Vercel Blob agar gambar tetap tersedia
setelah function selesai. Buat Blob store dari tab **Storage** project Vercel
dan hubungkan ke project backend untuk environment Production dan Preview.
SDK menggunakan kredensial yang disediakan Vercel; jangan menaruh token Blob
di source code.

Frontend harus memiliki `VITE_API_URL` yang menunjuk ke URL backend tanpa
akhiran `/api`. `VITE_IMAGE_URL` boleh diatur ke URL backend yang sama bila
gambar statis lama disajikan dari backend. Gambar yang diunggah sebelum Blob
diaktifkan tetap memerlukan file asalnya di `public/images`; upload baru
disimpan sebagai URL Blob.

### 4. Jalankan backend

Periksa bagian `scripts` pada `package.json` dan jalankan perintah yang
memang tersedia. Contohnya, jika didefinisikan:

``` bash
npm start
```

atau untuk script development yang tersedia:

``` bash
npm run dev
```

Entry point yang pernah dibahas adalah `app.js` melalui `bin/www`. Jika
script npm berbeda, ikuti konfigurasi proyek.

### 5. Jalankan frontend

Jika frontend berada di folder terpisah bernama `frontend`, jalankan:

``` bash
cd frontend
npm install
npm run dev
```

Langkah ini hanya berlaku jika folder tersebut ada dan `package.json`
frontend menyediakan script `dev`. Alamat lokal akan ditampilkan di
terminal.

## Autentikasi dan Otorisasi

API menggunakan JWT untuk autentikasi. Untuk endpoint yang memerlukan
login, kirim token pada header:

``` http
Authorization: Bearer <TOKEN>
```

Ganti `<TOKEN>` dengan token yang diterima dari respons login. Jika
menggunakan pilihan Bearer Token di tool API, masukkan token saja
apabila tool tersebut menambahkan prefix `Bearer` secara otomatis.

Kebijakan akses CASL yang pernah dibahas secara umum mencakup: -
**Guest:** membaca produk. - **User:** mengakses pesanan miliknya dan
fitur yang diizinkan, termasuk alamat pengiriman. - **Admin:** mengelola
resource sesuai policy admin.

Izin aktual tetap ditentukan oleh policy dan middleware yang aktif di
source code.

## Pengujian API dengan Insomnia

1.  Jalankan backend dan pastikan koneksi MongoDB berhasil.
2.  Buat request ke base URL backend yang ditampilkan di terminal.
3.  Uji endpoint registrasi dan login yang tersedia.
4.  Salin token dari respons login.
5.  Untuk endpoint terproteksi, gunakan header
    `Authorization: Bearer <TOKEN>`.
6.  Uji endpoint produk, kategori, keranjang, pesanan, alamat
    pengiriman, dan invoice sesuai route yang terdaftar.

Path endpoint dan format request/response harus merujuk pada
router/controller aktual. README ini tidak menetapkan URL endpoint yang
belum diverifikasi.

## Checkout dan Alamat Pengiriman

Halaman checkout memiliki formulir alamat dan ringkasan pesanan. Field
alamat yang direncanakan atau digunakan meliputi:

-   Nama penerima
-   Provinsi
-   Kabupaten/kota
-   Kecamatan
-   Kelurahan/desa
-   Detail alamat

Dropdown wilayah bertingkat dapat mengambil data dari API wilayah
Indonesia sehingga kabupaten/kota mengikuti provinsi, kecamatan
mengikuti kabupaten/kota, dan kelurahan/desa mengikuti kecamatan.

Jika memakai API eksternal, tangani loading, kegagalan jaringan, dan
opsi mencoba kembali. Validasi data alamat di backend sebelum disimpan.
Jangan mempercayai harga atau ongkir dari browser tanpa menghitung atau
memvalidasinya kembali di server.

## Keamanan dan Praktik Baik

-   Simpan secret dan kredensial dalam environment variable.
-   Hash password dengan bcrypt; jangan simpan password dalam bentuk
    teks biasa.
-   Validasi dan sanitasi input di backend.
-   Terapkan otorisasi pada setiap endpoint yang memerlukan akses
    terbatas.
-   Pastikan pengguna hanya dapat membaca atau mengubah data miliknya
    kecuali policy memberi izin lebih luas.
-   Batasi tipe dan ukuran file upload serta validasi path file.
-   Pastikan proses update gambar tidak menghapus file lama sebelum file
    pengganti tervalidasi dan update berhasil.
-   Hitung ulang harga dan ongkir di backend.
-   Gunakan HTTPS dan secret yang kuat di production.
-   Jangan commit `.env`, token, password, atau file sensitif ke Git.

## Troubleshooting

### MongoDB tidak terhubung

-   Pastikan service MongoDB berjalan.
-   Periksa URI pada `.env` dan modul konfigurasi.
-   Periksa error pada terminal backend.

### Token JWT tidak valid

-   Login ulang untuk memperoleh token baru.
-   Pastikan format header `Authorization: Bearer <TOKEN>` benar.
-   Pastikan secret untuk membuat dan memverifikasi token sama.

### Data wilayah gagal dimuat

-   Periksa koneksi internet dan URL API.
-   Periksa respons melalui Developer Tools → Network.
-   Tampilkan pesan error dan sediakan opsi mencoba kembali.
-   Validasi kembali data wilayah sebelum menyimpan alamat.

### Upload gambar gagal

-   Pastikan folder tujuan tersedia dan dapat ditulis.
-   Periksa konfigurasi Multer, batas ukuran, dan tipe file.
-   Pastikan path yang disimpan di database sesuai lokasi file.

### Perintah npm tidak ditemukan

-   Buka `package.json` dan periksa bagian `scripts`.
-   Jalankan hanya script yang benar-benar didefinisikan.

## Pengembangan Selanjutnya

-   Dokumentasi endpoint berdasarkan router aktual.
-   Validasi form dan pesan error yang konsisten.
-   Perhitungan ongkir dan total pesanan di backend.
-   Penyimpanan alamat pengguna dan pemilihan alamat utama.
-   Pengujian otomatis untuk autentikasi, produk, dan checkout.
-   Dokumentasi deployment dan konfigurasi production.

## Kontribusi

1.  Buat branch untuk perubahan.
2.  Implementasikan perubahan dan jalankan pengujian.
3.  Pastikan tidak ada secret atau data pribadi yang ikut ter-commit.
4.  Dokumentasikan perubahan sesuai alur kerja repository.

## Lisensi

Lisensi proyek belum ditentukan. Tambahkan file `LICENSE` dan perbarui
bagian ini jika proyek akan dibagikan atau digunakan pihak lain.
 Terimakasih Rudi Asman Salim
