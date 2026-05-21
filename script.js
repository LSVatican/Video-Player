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

// --- SINKRONISASI LOCALSTORAGE (ANTI-REFRESH) ---
window.addEventListener('DOMContentLoaded', () => {
    const savedType = localStorage.getItem('videoType');
    const savedSource = localStorage.getItem('videoSource');

    if (savedType && savedSource) {
        if (savedType === 'youtube') {
            // Putar otomatis YouTube
            localPlayer.style.display = 'none';
            embedPlayer.src = savedSource;
            embedPlayer.style.display = 'block';
            activateVideoMode();
        } else if (savedType === 'tiktok') {
            // Putar otomatis TikTok
            localPlayer.style.display = 'none';
            embedPlayer.src = savedSource;
            embedPlayer.style.display = 'block';
            activateVideoMode();
        } else if (savedType === 'local') {
            // Untuk file lokal, ingatkan user untuk memilih file yang sama demi keamanan browser
            alert(`Sesi terakhir memutar video perangkat: "${savedSource}". Silakan pilih kembali file tersebut untuk melanjutkan.`);
            isVideoPlaying = false; // Set sementara agar popup bisa dibuka
            uploadPopup.classList.add('show');
            // Arahkan langsung ke tab perangkat
            switchTab('tab-lokal');
        }
    }
});

// --- Logika Pop-Up & Animasi ---
openUploadBtn.addEventListener('click', () => {
    // TOLAK PENGUNGGAHAN BARU JIKA VIDEO SEDANG BERJALAN
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

// Fungsi ganti tab kustom
function switchTab(tabId) {
    tabButtons.forEach(btn => {
        if(btn.getAttribute('data-tab') === tabId) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    tabContents.forEach(content => {
        if(content.id === tabId) content.classList.add('active');
        else content.classList.remove('active');
    });
}

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        switchTab(button.getAttribute('data-tab'));
    });
});

// --- Pengaturan Tampilan Selesai Unggah ---
function activateVideoMode() {
    isVideoPlaying = true;
    placeholderText.style.display = 'none';
    videoWrapper.classList.add('active');
    closeVideoBtn.classList.add('enabled');
    closeVideoBtn.removeAttribute('disabled');
    closePopup();
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

    alert(`Berhasil mengunggah: ${file.name}`);
    
    const fileURL = URL.createObjectURL(file);
    embedPlayer.style.display = 'none';
    embedPlayer.src = '';
    
    localPlayer.src = fileURL;
    localPlayer.style.display = 'block';
    localPlayer.play();
    
    // Simpan tanda sesi lokal ke localStorage
    localStorage.setItem('videoType', 'local');
    localStorage.setItem('videoSource', file.name);
    
    activateVideoMode();
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
        const finalEmbedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        
        localPlayer.style.display = 'none';
        localPlayer.pause();
        localPlayer.src = '';

        embedPlayer.src = finalEmbedUrl;
        embedPlayer.style.display = 'block';
        
        // Simpan data ke localStorage agar tidak hilang saat refresh
        localStorage.setItem('videoType', 'youtube');
        localStorage.setItem('videoSource', finalEmbedUrl);

        alert("Link YouTube Terkonfirmasi! Video siap diputar.");
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
        localPlayer.style.display = 'none';
        localPlayer.pause();
        localPlayer.src = '';

        let finalEmbedUrl = `https://www.tiktok.com/player/v1/${urlValue.split('/video/')[1]?.split('?')[0] || ''}?autoplay=1`;
        
        if(!finalEmbedUrl.endsWith('/')){
             finalEmbedUrl = urlValue; 
        }

        embedPlayer.src = finalEmbedUrl;
        embedPlayer.style.display = 'block';

        // Simpan data ke localStorage agar tidak hilang saat refresh
        localStorage.setItem('videoType', 'tiktok');
        localStorage.setItem('videoSource', finalEmbedUrl);

        alert("Link TikTok Terkonfirmasi! Video siap diputar.");
        tiktokInput.value = ""; 
        activateVideoMode();
    } else {
        alert("Tautan TikTok tidak valid! Pastikan mengandung alamat 'tiktok.com'.");
    }
});

// --- Fitur Close Video (Hapus Sesi Secara Permanen) ---
closeVideoBtn.addEventListener('click', () => {
    const confirmClose = confirm("Apakah Anda yakin ingin menutup dan menyudahi video yang sedang diputar saat ini?");
    
    if (confirmClose) {
        // Hapus penyimpanan permanen di browser
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
