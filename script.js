document.addEventListener('DOMContentLoaded', () => {
    // Definisi Elemen DOM
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
    // FUNGSI UTAMA KONTROL VIDEO
    // ==========================================

    // Trigger Buka Pop-Up (Ditolak Jika Video Sedang Diputar)
    openUploadBtn.addEventListener('click', () => {
        if (isVideoPlaying) {
            alert('Pengunggahan ditolak! Silakan tutup (close) video yang sedang berjalan terlebih dahulu.');
            return;
        }
        uploadModal.classList.add('open');
    });

    // Tutup Pop-Up
    closeModalBtn.addEventListener('click', () => {
        uploadModal.classList.remove('open');
    });

    // Navigasi Tab Sistem
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    // Mengaktifkan Tampilan Player & Animasi Background Glow
    function activateVideoPlayer() {
        placeholderText.style.display = 'none';
        videoWrapper.style.display = 'block';
        playerContainer.classList.add('active-video');
        closeVideoBtn.removeAttribute('disabled');
        isVideoPlaying = true;
        uploadModal.classList.remove('open');
    }

    // Parser Tautan YouTube Asli ke Bentuk Embed
    function parseYouTube(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    // Parser Tautan TikTok Asli ke Bentuk Embed 
    function parseTikTok(url) {
        const regExp = /\/video\/(\d+)/;
        const match = url.match(regExp);
        return (match && match[1]) ? match[1] : null;
    }

    // ==========================================
    // LOGIKA PROSES UNGHAH & SIMPAN STATE
    // ==========================================

    // 1. Konfirmasi Tab Perangkat
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
        
        // Simpan file asli ke database lokal agar tidak hilang saat refresh
        await saveDeviceVideo(file);
        localStorage.setItem('video_state', JSON.stringify({ type: 'device', source: 'local' }));

        const fileURL = URL.createObjectURL(file);
        videoWrapper.innerHTML = `<video src="${fileURL}" controls autoplay></video>`;
        activateVideoPlayer();
        deviceVideoInput.value = ''; 
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
        
        // Simpan ID video ke localStorage
        localStorage.setItem('video_state', JSON.stringify({ type: 'youtube', source: videoId }));

        videoWrapper.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
        activateVideoPlayer();
        youtubeLinkInput.value = ''; 
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
        
        // Simpan ID video ke localStorage
        localStorage.setItem('video_state', JSON.stringify({ type: 'tiktok', source: videoId }));

        videoWrapper.innerHTML = `<iframe src="https://www.tiktok.com/embed/v2/${videoId}" allowfullscreen></iframe>`;
        activateVideoPlayer();
        tiktokLinkInput.value = ''; 
    });

    // ==========================================
    // SISTEM AUTOMATIS LOAD STATE SETELAH REFRESH
    // ==========================================
    async function loadSavedVideo() {
        const savedState = localStorage.getItem('video_state');
        if (!savedState) return; // Jika tidak ada data tersimpan, biarkan kosong semula

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

    // Jalankan pengecekan video tersimpan setiap kali halaman dimuat ulang
    loadSavedVideo();

    // ==========================================
    // FITUR CLOSE VIDEO (MENGHAPUS SEMUA STORAGE)
    // ==========================================
    closeVideoBtn.addEventListener('click', async () => {
        const confirmClose = confirm('Apakah Anda yakin ingin menutup video yang sedang diputar?');
        if (confirmClose) {
            // Hapus data dari memori browser total
            localStorage.removeItem('video_state');
            await clearDeviceVideo();

            // Kembalikan tampilan web seperti semula
            videoWrapper.innerHTML = '';
            videoWrapper.style.display = 'none';
            placeholderText.style.display = 'block';
            playerContainer.classList.remove('active-video'); 
            closeVideoBtn.setAttribute('disabled', 'true');
            isVideoPlaying = false;
        }
    });
});
