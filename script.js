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

    // Trigger Buka Pop-Up (Dengan Sistem Tolak Jika Video Sedang Diputar)
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

    // Inisialisasi Tampilan Video Aktif
    function activateVideoPlayer() {
        placeholderText.style.display = 'none';
        videoWrapper.style.display = 'block';
        playerContainer.classList.add('active-video'); // Munculkan background video khusus
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

    // 1. Konfirmasi Tab Perangkat (Wajib bertipe data video)
    confirmDeviceBtn.addEventListener('click', () => {
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
        const fileURL = URL.createObjectURL(file);
        videoWrapper.innerHTML = `<video src="${fileURL}" controls autoplay></video>`;
        activateVideoPlayer();
        deviceVideoInput.value = ''; // Reset input file
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
        videoWrapper.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
        activateVideoPlayer();
        youtubeLinkInput.value = ''; // Otomatis mengosongkan input link setelah berhasil
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
            alert('Link TikTok asli tidak valid! Pastikan link berisi format /video/ID_VIDEO');
            return;
        }

        alert('Informasi: Link TikTok berhasil dikonfirmasi dan siap diputar!');
        videoWrapper.innerHTML = `<iframe src="https://www.tiktok.com/embed/v2/${videoId}" allowfullscreen></iframe>`;
        activateVideoPlayer();
        tiktokLinkInput.value = ''; // Otomatis mengosongkan input link setelah berhasil
    });

    // Fitur Close Video dengan Konfirmasi Kembali Semula
    closeVideoBtn.addEventListener('click', () => {
        const confirmClose = confirm('Apakah Anda yakin ingin menutup video yang sedang diputar?');
        if (confirmClose) {
            videoWrapper.innerHTML = '';
            videoWrapper.style.display = 'none';
            placeholderText.style.display = 'block';
            playerContainer.classList.remove('active-video'); // Kembalikan background semula
            closeVideoBtn.setAttribute('disabled', 'true');
            isVideoPlaying = false;
        }
    });
});
