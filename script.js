// Cek apakah dibuka dari APK Android buatan Kodular
const isAndroidAPK = navigator.userAgent.includes("VideoPlayerAPK");

const apkBanner = document.getElementById('apk-banner');

if (!isAndroidAPK) {
    // Jika BUKAN dibuka dari APK (berarti dari Chrome/browser biasa), munculkan banner
    apkBanner.style.display = 'block';
} else {
    // Jika dibuka dari dalam APK, pastikan banner tersembunyi
    apkBanner.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // DEFINISI ELEMEN DOM
    // ==========================================
    const openUploadBtn = document.getElementById('open-upload-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const uploadModal = document.getElementById('upload-modal');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    const playerContainer = document.getElementById('player-container');
    const placeholderText = document.getElementById('placeholder-text');
    const videoWrapper = document.getElementById('video-wrapper');
    const closeVideoBtn = document.getElementById('close-video-btn');

    // Input Elemen Form
    const deviceVideoInput = document.getElementById('device-video-input');
    const youtubeLinkInput = document.getElementById('youtube-link-input');
    const tiktokLinkInput = document.getElementById('tiktok-link-input');

    // Tombol Konfirmasi Tab
    const confirmDeviceBtn = document.getElementById('confirm-device-btn');
    const confirmYoutubeBtn = document.getElementById('confirm-youtube-btn');
    const confirmTiktokBtn = document.getElementById('confirm-tiktok-btn');

    let isVideoPlaying = false;

    // ==========================================
    // SISTEM PENYIMPANAN INDEXEDDB (UNTUK FILE PERANGKAT)
    // ==========================================
    function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('VideoPlayerDB', 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('videos')) {
                    db.createObjectStore('videos');
                }
            };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async function saveDeviceVideo(file) {
        const db = await initDB();
        const tx = db.transaction('videos', 'readwrite');
        tx.objectStore('videos').put(file, 'currentVideo');
        return tx.complete;
    }

    async function getDeviceVideo() {
        const db = await initDB();
        return new Promise((resolve) => {
            const tx = db.transaction('videos', 'readonly');
            const request = tx.objectStore('videos').get('currentVideo');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
        });
    }

    async function clearDeviceVideo() {
        const db = await initDB();
        const tx = db.transaction('videos', 'readwrite');
        tx.objectStore('videos').delete('currentVideo');
    }

    // ==========================================
    // FITUR BARU: FUNGSI RESET / HAPUS INPUT AUTOMATIS
    // ==========================================
    function resetInputs() {
        deviceVideoInput.value = '';   // Menghapus file yang sempat dipilih
        youtubeLinkInput.value = '';   // Mengosongkan kolom link YouTube
        tiktokLinkInput.value = '';    // Mengosongkan kolom link TikTok
    }

    // ==========================================
    // KONTROL POP-UP (MODAL) & NAVIGASI TAB
    // ==========================================

    // Trigger Buka Pop-Up (Ditolak Jika Video Sedang Diputar)
    openUploadBtn.addEventListener('click', () => {
        if (isVideoPlaying) {
            alert('Pengunggahan ditolak! Silakan tutup (close) video yang sedang berjalan terlebih dahulu.');
            return;
        }
        uploadModal.classList.add('open');
    });

    // Tutup Pop-Up melalui tombol 'X' (Otomatis Menghapus Inputan yang belum diunggah)
    closeModalBtn.addEventListener('click', () => {
        uploadModal.classList.remove('open');
        resetInputs(); // <--- Fungsi penghapus dijalankan di sini
    });

    // Navigasi Tab Sistem di dalam Pop-Up
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    // ==========================================
    // PARSER LINK (YOUTUBE & TIKTOK)
    // ==========================================
    function parseYouTube(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    function parseTikTok(url) {
        const regExp = /\/video\/(\d+)/;
        const match = url.match(regExp);
        return (match && match[1]) ? match[1] : null;
    }

    // Mengaktifkan Tampilan Player & Animasi Background Glow
    function activateVideoPlayer() {
        placeholderText.style.display = 'none';
        videoWrapper.style.display = 'block';
        playerContainer.classList.add('active-video');
        closeVideoBtn.removeAttribute('disabled');
        isVideoPlaying = true;
        uploadModal.classList.remove('open');
        resetInputs(); // Bersihkan sisa inputan setelah sukses tayang
    }

    // ==========================================
    // LOGIKA PROSES KONFIRMASI UNGHAH
    // ==========================================

    // 1. Konfirmasi Tab Perangkat (Wajib Video)
    confirmDeviceBtn.addEventListener('click', async () => {
        const file = deviceVideoInput.files[0];
        if (!file) {
            alert('Silakan pilih berkas file video terlebih dahulu!');
            return;
        }
        if (!file.type.startsWith('video/')) {
            alert('Format salah! Anda wajib mengunggah file video dari perangkat.');
            return;
        }

        alert('Informasi: Berhasil memuat video dari perangkat Anda!');
        
        // Simpan ke database lokal agar kebal refresh
        await saveDeviceVideo(file);
        localStorage.setItem('video_state', JSON.stringify({ type: 'device', source: 'local' }));

        const fileURL = URL.createObjectURL(file);
        videoWrapper.innerHTML = `<video src="${fileURL}" controls autoplay></video>`;
        activateVideoPlayer();
    });

    // 2. Konfirmasi Tab YouTube Link
    confirmYoutubeBtn.addEventListener('click', () => {
        const url = youtubeLinkInput.value.trim();
        if (!url) {
            alert('Masukkan tautan video YouTube terlebih dahulu!');
            return;
        }
        const videoId = parseYouTube(url);
        if (!videoId) {
            alert('Link YouTube asli tidak valid!');
            return;
        }

        alert('Informasi: Link YouTube berhasil dikonfirmasi dan siap diputar!');
        
        // Simpan status state ke localStorage
        localStorage.setItem('video_state', JSON.stringify({ type: 'youtube', source: videoId }));

        videoWrapper.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
        activateVideoPlayer();
    });

    // 3. Konfirmasi Tab TikTok Link
    confirmTiktokBtn.addEventListener('click', () => {
        const url = tiktokLinkInput.value.trim();
        if (!url) {
            alert('Masukkan tautan video TikTok terlebih dahulu!');
            return;
        }
        const videoId = parseTikTok(url);
        if (!videoId) {
            alert('Link TikTok asli tidak valid! Pastikan format tautannya tepat.');
            return;
        }

        alert('Informasi: Link TikTok berhasil dikonfirmasi dan siap diputar!');
        
        // Simpan status state ke localStorage
        localStorage.setItem('video_state', JSON.stringify({ type: 'tiktok', source: videoId }));

        videoWrapper.innerHTML = `<iframe src="https://www.tiktok.com/embed/v2/${videoId}" allowfullscreen></iframe>`;
        activateVideoPlayer();
    });

    // ==========================================
    // SISTEM AUTOMATIS LOAD STATE (ANTI REFRESH)
    // ==========================================
    async function loadSavedVideo() {
        const savedState = localStorage.getItem('video_state');
        if (!savedState) return;

        const { type, source } = JSON.parse(savedState);

        if (type === 'youtube') {
            videoWrapper.innerHTML = `<iframe src="https://www.youtube.com/embed/${source}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
            activateVideoPlayer();
        } else if (type === 'tiktok') {
            videoWrapper.innerHTML = `<iframe src="https://www.tiktok.com/embed/v2/${source}" allowfullscreen></iframe>`;
            activateVideoPlayer();
        } else if (type === 'device') {
            const file = await getDeviceVideo();
            if (file) {
                const fileURL = URL.createObjectURL(file);
                videoWrapper.innerHTML = `<video src="${fileURL}" controls autoplay></video>`;
                activateVideoPlayer();
            }
        }
    }

    // Jalankan pemulihan video otomatis saat web dimuat ulang
    loadSavedVideo();

    // ==========================================
    // FITUR CLOSE VIDEO (KEMBALI KE SEMULA)
    // ==========================================
    closeVideoBtn.addEventListener('click', async () => {
        const confirmClose = confirm('Apakah Anda yakin ingin menutup video yang sedang diputar?');
        if (confirmClose) {
            // Hapus total data dari memori browser
            localStorage.removeItem('video_state');
            await clearDeviceVideo();

            // Kembalikan tampilan halaman beranda seperti semula
            videoWrapper.innerHTML = '';
            videoWrapper.style.display = 'none';
            placeholderText.style.display = 'block';
            playerContainer.classList.remove('active-video'); 
            closeVideoBtn.setAttribute('disabled', 'true');
            isVideoPlaying = false;
        }
    });
});

// Cek apakah ada kiriman video dari luar via parameter URL (?shared_video=...)
const urlParams = new URLSearchParams(window.location.search);
const sharedVideoUrl = urlParams.get('shared_video');

if (sharedVideoUrl) {
    // Jalankan pemutar video otomatis dari video luar yang dikirim
    const videoWrapper = document.getElementById('video-wrapper');
    videoWrapper.innerHTML = `<video src="${sharedVideoUrl}" controls autoplay></video>`;
    
    // Aktifkan tampilan player (asumsi fungsi activateVideoPlayer sudah ada di script.js Anda)
    placeholderText.style.display = 'none';
    videoWrapper.style.display = 'block';
    playerContainer.classList.add('active-video');
    closeVideoBtn.removeAttribute('disabled');
    isVideoPlaying = true;
}