// Elemen DOM
const openUploadBtn = document.getElementById('openUploadBtn');
const closePopupBtn = document.getElementById('closePopupBtn');
const uploadPopup = document.getElementById('uploadPopup');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

const videoWrapper = document.getElementById('videoWrapper');
const placeholderText = document.querySelector('.placeholder-text');
const localPlayer = document.getElementById('localPlayer');
const embedPlayer = document.getElementById('embedPlayer');
const closeVideoBtn = document.getElementById('closeVideoBtn');

// Elemen Form Input & Konfirmasi
const localInput = document.getElementById('localInput');
const youtubeInput = document.getElementById('youtubeInput');
const tiktokInput = document.getElementById('tiktokInput');

const confirmLocalBtn = document.getElementById('confirmLocalBtn');
const confirmYoutubeBtn = document.getElementById('confirmYoutubeBtn');
const confirmTiktokBtn = document.getElementById('confirmTiktokBtn');

// Status Pemutar
let isVideoPlaying = false;

// --- FUNGSI UTAMA: CEK STORAGE SAAT HALAMAN DIMUAT (REFRESH) ---
window.addEventListener('DOMContentLoaded', () => {
    const savedVideoType = localStorage.getItem('videoType');
    const savedVideoSource = localStorage.getItem('videoSource');

    if (savedVideoType && savedVideoSource) {
        if (savedVideoType === 'local') {
            embedPlayer.style.display = 'none';
            embedPlayer.src = '';
            localPlayer.src = savedVideoSource;
            localPlayer.style.display = 'block';
            localPlayer.play().catch(err => console.log("Autoplay dicegah oleh browser, user harus berinteraksi dahulu."));
        } else if (savedVideoType === 'youtube' || savedVideoType === 'tiktok') {
            localPlayer.style.display = 'none';
            localPlayer.pause();
            localPlayer.src = '';
            embedPlayer.src = savedVideoSource;
            embedPlayer.style.display = 'block';
        }
        activateVideoMode(true); // Aktifkan mode video tanpa menutup pop-up (karena pop-up memang belum terbuka)
    }
});

// --- Logika Pop-Up & Animasi ---
openUploadBtn.addEventListener('click', () => {
    if (isVideoPlaying) {
        alert("Gagal mengunggah! Harap tutup (Close Video) terlebih dahulu video yang sedang diputar saat ini.");
        return;
    }
    uploadPopup.classList.add('show');
});

function closePopup() {
    uploadPopup.classList.remove('show');
}
closePopupBtn.addEventListener('click', closePopup);

// Sistem Penggantian Tab
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        button.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
    });
});

// --- Pengaturan Tampilan Selesai Unggah ---
function activateVideoMode(isFromRefresh = false) {
    isVideoPlaying = true;
    placeholderText.style.display = 'none';
    videoWrapper.classList.add('active');
    closeVideoBtn.classList.add('enabled');
    closeVideoBtn.removeAttribute('disabled');
    if (!isFromRefresh) {
        closePopup();
    }
}

// --- Logika Pemrosesan Video ---

// 1. Unggah dari Perangkat (Wajib File Video)
confirmLocalBtn.addEventListener('click', () => {
    const file = localInput.files[0];
    if (!file) {
        alert("Silakan pilih file video dari perangkat Anda terlebih dahulu!");
        return;
    }
    
    if (!file.type.startsWith('video/')) {
        alert("Format ditolak! File wajib berupa video.");
        return;
    }

    // Cek Ukuran File untuk batasan LocalStorage (Maksimal rekomendasi ~4MB agar aman dari limit 5MB browser)
    if (file.size > 4 * 1024 * 1024) {
        alert("Ukuran video perangkat terlalu besar untuk disimpan otomatis saat refresh (Maksimal 4MB). Video tetap diputar, namun jika direfresh akan hilang. Disarankan menggunakan link YouTube/TikTok agar aman saat refresh!");
        
        const fileURL = URL.createObjectURL(file);
        embedPlayer.style.display = 'none';
        embedPlayer.src = '';
        localPlayer.src = fileURL;
        localPlayer.style.display = 'block';
        localPlayer.play();
        activateVideoMode();
        return;
    }

    // Jika ukuran aman, konversi ke Base64 agar bisa bertahan saat browser ditutup
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Video = e.target.result;
        
        // Simpan ke Local Storage
        localStorage.setItem('videoType', 'local');
        localStorage.setItem('videoSource', base64Video);

        embedPlayer.style.display = 'none';
        embedPlayer.src = '';
        
        localPlayer.src = base64Video;
        localPlayer.style.display = 'block';
        localPlayer.play();
        
        alert(`Berhasil memuat: ${file.name} (Tersimpan otomatis saat refresh)`);
        activateVideoMode();
    };
    reader.readAsDataURL(file);
});

// 2. Unggah Link YouTube Asli
confirmYoutubeBtn.addEventListener('click', () => {
    const urlValue = youtubeInput.value.trim();
    if (!urlValue) {
        alert("Silakan masukkan tautan video YouTube terlebih dahulu!");
        return;
    }

    let videoId = "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = urlValue.match(regExp);

    if (match && match[2].length === 11) {
        videoId = match[2];
        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        
        // Simpan konfigurasi ke Local Storage
        localStorage.setItem('videoType', 'youtube');
        localStorage.setItem('videoSource', embedUrl);

        localPlayer.style.display = 'none';
        localPlayer.pause();
        localPlayer.src = '';

        embedPlayer.src = embedUrl;
        embedPlayer.style.display = 'block';
        
        alert("Link YouTube Terkonfirmasi! Video disimpan.");
        youtubeInput.value = ""; 
        activateVideoMode();
    } else {
        alert("Tautan YouTube tidak valid! Gunakan tautan asli video YouTube.");
    }
});

// 3. Unggah Link TikTok Asli
confirmTiktokBtn.addEventListener('click', () => {
    const urlValue = tiktokInput.value.trim();
    if (!urlValue) {
        alert("Silakan masukkan tautan video TikTok terlebih dahulu!");
        return;
    }

    if (urlValue.includes('tiktok.com')) {
        let embedUrl = `https://www.tiktok.com/player/v1/${urlValue.split('/video/')[1]?.split('?')[0] || ''}?autoplay=1`;
        
        if(!embedUrl.endsWith('?autoplay=1') || embedUrl.includes('undefined')){
             embedUrl = urlValue; 
        }

        // Simpan konfigurasi ke Local Storage
        localStorage.setItem('videoType', 'tiktok');
        localStorage.setItem('videoSource', embedUrl);

        localPlayer.style.display = 'none';
        localPlayer.pause();
        localPlayer.src = '';

        embedPlayer.src = embedUrl;
        embedPlayer.style.display = 'block';

        alert("Link TikTok Terkonfirmasi! Video disimpan.");
        tiktokInput.value = ""; 
        activateVideoMode();
    } else {
        alert("Tautan TikTok tidak valid! Pastikan mengandung alamat 'tiktok.com'.");
    }
});

// --- Fitur Close Video (Hapus dari Cache & Kembalikan ke Semula) ---
closeVideoBtn.addEventListener('click', () => {
    const confirmClose = confirm("Apakah Anda yakin ingin menutup dan menyudahi video yang sedang diputar saat ini?");
    
    if (confirmClose) {
        // HAPUS DATA DARI LOCAL STORAGE AGAR TIDAK MUNCUL LAGI SAAT REFRESH
        localStorage.removeItem('videoType');
        localStorage.removeItem('videoSource');

        // Hentikan Player Lokal
        localPlayer.pause();
        localPlayer.src = '';
        localPlayer.style.display = 'none';
        
        // Hentikan Player Embed
        embedPlayer.src = '';
        embedPlayer.style.display = 'none';

        // Reset Input File
        localInput.value = "";

        // Kembalikan Tampilan Awal
        videoWrapper.classList.remove('active');
        placeholderText.style.display = 'block';
        
        // Kunci Kembali Fitur Pengontrol
        closeVideoBtn.classList.remove('enabled');
        closeVideoBtn.setAttribute('disabled', 'true');
        
        isVideoPlaying = false;
        alert("Pemutar video telah di-reset kembali seperti semula.");
    }
});
