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

// --- INISIALISASI INDEXEDDB (Untuk Menyimpan Video Lokal) ---
const dbName = "VideoPlayerDB";
const storeName = "videos";
let db;

const request = indexedDB.open(dbName, 1);
request.onupgradeneeded = function(e) {
    db = e.target.result;
    if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
    }
};
request.onsuccess = function(e) {
    db = e.target.result;
    // Setelah DB siap, periksa apakah ada video yang tersimpan sebelumnya
    checkSavedVideo();
};
request.onerror = function(e) {
    console.error("Gagal membuka IndexedDB:", e);
};

// --- LOGIKA POP-UP & ANIMASI ---
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

// --- PENGATURAN TAMPILAN AKTIF ---
function activateVideoMode() {
    isVideoPlaying = true;
    placeholderText.style.display = 'none';
    videoWrapper.classList.add('active');
    closeVideoBtn.classList.add('enabled');
    closeVideoBtn.removeAttribute('disabled');
    closePopup();
}

// --- FUNGSI CEK VIDEO SAAT REFRESH / MASUK WEB ---
function checkSavedVideo() {
    const videoType = localStorage.getItem('savedVideoType');
    
    if (!videoType) return; // Jika tidak ada data tersimpan, biarkan kosong

    if (videoType === 'youtube' || videoType === 'tiktok') {
        const savedSrc = localStorage.getItem('savedVideoSrc');
        if (savedSrc) {
            localPlayer.style.display = 'none';
            embedPlayer.src = savedSrc;
            embedPlayer.style.display = 'block';
            activateVideoMode();
        }
    } else if (videoType === 'local') {
        const transaction = db.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);
        const getRequest = store.get("currentVideo");

        getRequest.onsuccess = function() {
            if (getRequest.result) {
                const videoBlob = getRequest.result;
                const fileURL = URL.createObjectURL(videoBlob);
                embedPlayer.style.display = 'none';
                localPlayer.src = fileURL;
                localPlayer.style.display = 'block';
                activateVideoMode();
            }
        };
    }
}

// --- LOGIKA PEMROSESAN VIDEO & PENYIMPANAN STATE ---

// 1. Unggah dari Perangkat
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

    // Simpan file video asli ke IndexedDB
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    store.put(file, "currentVideo");

    transaction.oncomplete = function() {
        // Simpan tanda type ke localStorage
        localStorage.setItem('savedVideoType', 'local');

        const fileURL = URL.createObjectURL(file);
        embedPlayer.style.display = 'none';
        embedPlayer.src = '';
        
        localPlayer.src = fileURL;
        localPlayer.style.display = 'block';
        localPlayer.play();
        
        activateVideoMode();
    };
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
        
        // Simpan ke localStorage
        localStorage.setItem('savedVideoType', 'youtube');
        localStorage.setItem('savedVideoSrc', finalEmbedUrl);

        localPlayer.style.display = 'none';
        localPlayer.pause();
        localPlayer.src = '';

        embedPlayer.src = finalEmbedUrl;
        embedPlayer.style.display = 'block';
        
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
        let finalEmbedUrl = `https://www.tiktok.com/player/v1/${urlValue.split('/video/')[1]?.split('?')[0] || ''}?autoplay=1`;
        
        if(finalEmbedUrl.endsWith('?autoplay=1')){
             finalEmbedUrl = urlValue; 
        }

        // Simpan ke localStorage
        localStorage.setItem('savedVideoType', 'tiktok');
        localStorage.setItem('savedVideoSrc', finalEmbedUrl);

        localPlayer.style.display = 'none';
        localPlayer.pause();
        localPlayer.src = '';

        embedPlayer.src = finalEmbedUrl;
        embedPlayer.style.display = 'block';

        alert("Link TikTok Terkonfirmasi! Video siap diputar.");
        tiktokInput.value = ""; 
        activateVideoMode();
    } else {
        alert("Tautan TikTok tidak valid! Pastikan mengandung alamat 'tiktok.com'.");
    }
});

// --- FITUR CLOSE VIDEO (Hapus data permanen dari Penyimpanan) ---
closeVideoBtn.addEventListener('click', () => {
    const confirmClose = confirm("Apakah Anda yakin ingin menutup dan menyudahi video yang sedang diputar saat ini?");
    
    if (confirmClose) {
        // 1. Hapus semua data simpanan di localStorage & IndexedDB
        localStorage.removeItem('savedVideoType');
        localStorage.removeItem('savedVideoSrc');
        
        if (db) {
            const transaction = db.transaction([storeName], "readwrite");
            const store = transaction.objectStore(storeName);
            store.delete("currentVideo");
        }

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
        alert("Pemutar video telah di-reset. Data simpanan telah dihapus.");
    }
});

// --- CARA MENDAPATKAN LINK EMAIL PADA JAVASCRIPT ---
// 1. Pergi ke https://formspree.io/ dan daftar akun gratis.
// 2. Buat form baru, lalu ganti kode "https://formspree.io/f/xxxxx" di bawah ini dengan link form Anda.
const FORMSPREE_URL = "https://formspree.io/f/xdajejpn"; // <--- Ganti dengan ID Formspree Anda

// Elemen DOM Tambahan untuk Rating
const openRatingBtn = document.getElementById('openRatingBtn');
const closeRatingPopupBtn = document.getElementById('closeRatingPopupBtn');
const ratingPopup = document.getElementById('ratingPopup');
const ratingForm = document.getElementById('ratingForm');

// Buka Pop Up Rating (Animasi Bawah ke Atas)
openRatingBtn.addEventListener('click', () => {
    ratingPopup.classList.add('show');
});

// Tutup Pop Up Rating (Animasi Atas ke Bawah)
closeRatingPopupBtn.addEventListener('click', () => {
    ratingPopup.classList.remove('show');
});

// Event Handler Pengiriman Form Rating ke Email Pemilik
ratingForm.addEventListener('submit', function(e) {
    e.preventDefault(); // Mencegah halaman reload
    
    // Mengambil nilai bintang terpilih
    const selectedStar = document.querySelector('input[name="stars"]:checked');
    const customFeedback = document.getElementById('customFeedback').value.trim();

    if (!selectedStar && !customFeedback) {
        alert("Silakan pilih rating bintang atau isi rating kustom terlebih dahulu!");
        return;
    }

    const starValue = selectedStar ? selectedStar.value : "Tidak Memilih Bintang";
    
    // Tombol Loading status
    const submitBtn = document.getElementById('submitRatingBtn');
    submitBtn.innerText = "Mengirim...";
    submitBtn.setAttribute('disabled', 'true');

    // Mengirim data secara anonim (tanpa identitas nama/email pengirim) menggunakan AJAX Fetch
    fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            Subjek: "Rating Baru dari Pengguna Website Video Player",
            Pilihan_Bintang: starValue,
            Rating_Kustom_Masukan: customFeedback || "Tidak ada masukan tambahan."
        })
    })
    .then(response => {
        if (response.ok) {
            alert("Terima kasih! Rating anonim Anda berhasil dikirim.");
            
            // Reset Form & Tutup Pop Up
            ratingForm.reset();
            ratingPopup.classList.remove('show');
        } else {
            alert("Terjadi kesalahan sistem saat mengirim rating. Periksa kembali URL Formspree Anda.");
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("Gagal mengirim! Pastikan perangkat Anda terhubung ke internet.");
    })
    .finally(() => {
        // Kembalikan status tombol semula
        submitBtn.innerText = "Kirim Rating";
        submitBtn.removeAttribute('disabled');
    });
});
