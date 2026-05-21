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
let db = null;

// --- 1. Inisialisasi IndexedDB ---
const dbRequest = indexedDB.open("VideoPlayerDB", 1);

dbRequest.onupgradeneeded = function(e) {
    let database = e.target.result;
    if (!database.objectStoreNames.contains("videos")) {
        database.createObjectStore("videos", { keyPath: "id" });
    }
};

dbRequest.onsuccess = function(e) {
    db = e.target.result;
    // Cek apakah ada video yang tersimpan sebelumnya saat aplikasi dibuka/di-refresh
    checkSavedVideo();
};

dbRequest.onerror = function(e) {
    console.error("Gagal membuka IndexedDB:", e.target.error);
};

// --- 2. Logika Pop-Up & Animasi ---
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

// --- 3. Fungsi Aktivasi & Pemuatan Tampilan ---
function activateVideoMode() {
    isVideoPlaying = true;
    placeholderText.style.display = 'none';
    videoWrapper.classList.add('active');
    closeVideoBtn.classList.add('enabled');
    closeVideoBtn.removeAttribute('disabled');
    closePopup();
}

// --- 4. Fungsi Simpan & Ambil Data Video (IndexedDB) ---
function saveVideoToDB(videoData) {
    if (!db) return;
    const transaction = db.transaction(["videos"], "readwrite");
    const store = transaction.objectStore("videos");
    store.put(videoData);
}

function checkSavedVideo() {
    if (!db) return;
    const transaction = db.transaction(["videos"], "readonly");
    const store = transaction.objectStore("videos");
    const request = store.get("currentVideo");

    request.onsuccess = function(e) {
        const data = e.target.result;
        if (data) {
            if (data.type === 'local') {
                // Ambil kembali file Blob video lokal
                const fileURL = URL.createObjectURL(data.file);
                embedPlayer.style.display = 'none';
                localPlayer.src = fileURL;
                localPlayer.style.display = 'block';
            } else if (data.type === 'youtube' || data.type === 'tiktok') {
                localPlayer.style.display = 'none';
                embedPlayer.src = data.url;
                embedPlayer.style.display = 'block';
            }
            activateVideoMode();
        }
    };
}

function clearSavedVideo() {
    if (!db) return;
    const transaction = db.transaction(["videos"], "readwrite");
    const store = transaction.objectStore("videos");
    store.delete("currentVideo");
}

// --- 5. Logika Pemrosesan Video ---

// Perangkat (Maksimal 1 GB)
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

    // Validasi Ukuran File (1 GB = 1024 * 1024 * 1024 bytes)
    const maxSizeBytes = 1024 * 1024 * 1024; 
    if (file.size > maxSizeBytes) {
        alert("Gagal! Ukuran video melebihi batas maksimal 1 GB.");
        return;
    }

    alert(`Berhasil memuat: ${file.name}`);
    
    // Simpan ke IndexedDB agar tidak hilang saat refresh
    saveVideoToDB({ id: "currentVideo", type: "local", file: file });

    const fileURL = URL.createObjectURL(file);
    embedPlayer.style.display = 'none';
    embedPlayer.src = '';
    
    localPlayer.src = fileURL;
    localPlayer.style.display = 'block';
    localPlayer.play();
    
    activateVideoMode();
});

// YouTube Link
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
        
        // Simpan tautan embed ke IndexedDB
        saveVideoToDB({ id: "currentVideo", type: "youtube", url: embedUrl });

        localPlayer.style.display = 'none';
        localPlayer.pause();
        localPlayer.src = '';

        embedPlayer.src = embedUrl;
        embedPlayer.style.display = 'block';
        
        alert("Link YouTube Terkonfirmasi!");
        youtubeInput.value = ""; 
        activateVideoMode();
    } else {
        alert("Tautan YouTube tidak valid!");
    }
});

// TikTok Link
confirmTiktokBtn.addEventListener('click', () => {
    const urlValue = tiktokInput.value.trim();
    if (!urlValue) {
        alert("Silakan masukkan tautan video TikTok terlebih dahulu!");
        return;
    }

    if (urlValue.includes('tiktok.com')) {
        let embedUrl = `https://www.tiktok.com/player/v1/${urlValue.split('/video/')[1]?.split('?')[0] || ''}?autoplay=1`;
        if(!embedUrl.endsWith('1')){
             embedUrl = urlValue; 
        }

        // Simpan tautan embed ke IndexedDB
        saveVideoToDB({ id: "currentVideo", type: "tiktok", url: embedUrl });

        localPlayer.style.display = 'none';
        localPlayer.pause();
        localPlayer.src = '';

        embedPlayer.src = embedUrl;
        embedPlayer.style.display = 'block';

        alert("Link TikTok Terkonfirmasi!");
        tiktokInput.value = ""; 
        activateVideoMode();
    } else {
        alert("Tautan TikTok tidak valid!");
    }
});

// --- 6. Fitur Close Video (Hapus dari Penyimpanan) ---
closeVideoBtn.addEventListener('click', () => {
    const confirmClose = confirm("Apakah Anda yakin ingin menutup dan menyudahi video yang sedang diputar saat ini?");
    
    if (confirmClose) {
        // Hapus data video dari IndexedDB agar saat di-refresh tidak muncul lagi
        clearSavedVideo();

        // Hentikan Player
        localPlayer.pause();
        localPlayer.src = '';
        localPlayer.style.display = 'none';
        
        embedPlayer.src = '';
        embedPlayer.style.display = 'none';

        localInput.value = "";

        // Tampilan Semula
        videoWrapper.classList.remove('active');
        placeholderText.style.display = 'block';
        
        closeVideoBtn.classList.remove('enabled');
        closeVideoBtn.setAttribute('disabled', 'true');
        
        isVideoPlaying = false;
        alert("Pemutar video telah di-reset kembali seperti semula.");
    }
});
