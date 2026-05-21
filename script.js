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
    
    // Validasi Ekstensi/Tipe File Mime
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
    // Regex parsing ID video YouTube biasa maupun short url (youtu.be)
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = urlValue.match(regExp);

    if (match && match[2].length === 11) {
        videoId = match[2];
        
        localPlayer.style.display = 'none';
        localPlayer.pause();
        localPlayer.src = '';

        embedPlayer.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        embedPlayer.style.display = 'block';
        
        alert("Link YouTube Terkonfirmasi! Video siap diputar.");
        youtubeInput.value = ""; // Otomatis mengosongkan input link setelah berhasil
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

    // Melakukan pengecekan sederhana format tautan tiktok asli
    if (urlValue.includes('tiktok.com')) {
        localPlayer.style.display = 'none';
        localPlayer.pause();
        localPlayer.src = '';

        // Menggunakan struktur embed standar resmi TikTok
        // Catatan: Beberapa browser memblokir iframe tiktok tertentu karena proteksi pelacakan, disarankan menggunakan format link share desktop lengkap
        embedPlayer.src = `https://www.tiktok.com/player/v1/${urlValue.split('/video/')[1]?.split('?')[0] || ''}?autoplay=1`;
        
        // Cadangan alternatif jika id video tidak didapat langsung secara split: memuat embed block utuh
        if(!embedPlayer.src.endsWith('/')){
             embedPlayer.src = urlValue; 
        }

        embedPlayer.style.display = 'block';

        alert("Link TikTok Terkonfirmasi! Video siap diputar.");
        tiktokInput.value = ""; // Otomatis mengosongkan input link setelah berhasil
        activateVideoMode();
    } else {
        alert("Tautan TikTok tidak valid! Pastikan mengandung alamat 'tiktok.com'.");
    }
});

// --- Fitur Close Video (Kembali ke Semula) ---
closeVideoBtn.addEventListener('click', () => {
    // FITUR KONFIRMASI CLOSE VIDEO
    const confirmClose = confirm("Apakah Anda yakin ingin menutup dan menyudahi video yang sedang diputar saat ini?");
    
    if (confirmClose) {
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
