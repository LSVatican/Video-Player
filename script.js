document.addEventListener("DOMContentLoaded", () => {
    // State Aplikasi
    let isVideoActive = false;

    // Elemen DOM - UI Utama
    const openPopUpBtn = document.getElementById("openPopUpBtn");
    const closePopUpBtn = document.getElementById("closePopUpBtn");
    const uploadPopUp = document.getElementById("uploadPopUp");
    const videoDisplayArea = document.getElementById("videoDisplayArea");
    const placeholderArea = document.getElementById("placeholderArea");
    const mediaWrapper = document.getElementById("mediaWrapper");
    const closeVideoBtn = document.getElementById("closeVideoBtn");

    // Elemen DOM - Sistem Tab & Input
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");
    const deviceVideoInput = document.getElementById("deviceVideoInput");
    const youtubeLinkInput = document.getElementById("youtubeLinkInput");
    const confirmDeviceBtn = document.getElementById("confirmDeviceBtn");
    const confirmYoutubeBtn = document.getElementById("confirmYoutubeBtn");

    // --- FUNGSI POP-UP (MODAL) ---
    function openModal() {
        // VALIDASI: Tolak pengunggahan jika ada video yang sedang aktif diputar
        if (isVideoActive) {
            alert("Harap tutup (Close Video) yang sedang diputar terlebih dahulu sebelum mengunggah video baru!");
            return;
        }
        uploadPopUp.classList.remove("hidden");
        // Beri jeda microtask agar transisi CSS berjalan lancar
        setTimeout(() => uploadPopUp.classList.add("active"), 10);
    }

    function closeModal() {
        uploadPopUp.classList.remove("active");
        setTimeout(() => uploadPopUp.classList.add("hidden"), 300); // Sesuai durasi transisi CSS
    }

    openPopUpBtn.addEventListener("click", openModal);
    closePopUpBtn.addEventListener("click", closeModal);

    // Menutup pop-up jika menekan area background kosong di luar kotak modal
    uploadPopUp.addEventListener("click", (e) => {
        if (e.target === uploadPopUp) closeModal();
    });


    // --- SISTEM PERPINDAHAN TAB ---
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            tabContents.forEach(c => c.classList.remove("active"));

            btn.classList.add("active");
            document.getElementById(btn.dataset.tab).classList.add("active");
        });
    });


    // --- PROSES UNGGAH VIDEO DARI PERANGKAT ---
    confirmDeviceBtn.addEventListener("click", () => {
        const file = deviceVideoInput.files[0];
        
        if (!file) {
            alert("Silakan pilih file video dari perangkat Anda terlebih dahulu!");
            return;
        }

        // Validasi ekstensi/tipe file wajib video
        if (!file.type.startsWith("video/")) {
            alert("File yang Anda pilih bukan file video yang valid!");
            return;
        }

        // Ambil URL local binary objek video
        const videoURL = URL.createObjectURL(file);

        // Render struktur video player ke media wrapper
        mediaWrapper.innerHTML = `
            <video id="mainVideoPlayer" controls autoplay>
                <source src="${videoURL}" type="${file.type}">
                Browser Anda tidak mendukung pemutar video ini.
            </video>
        `;

        // Aktifkan visual background video & matikan placeholder area
        triggerVideoPlayState();
        alert("Video dari perangkat berhasil dimuat!");
        closeModal();
    });


    // --- PROSES UNGGAH VIDEO DARI LINK YOUTUBE ---
    function extractYouTubeID(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    confirmYoutubeBtn.addEventListener("click", () => {
        const urlValue = youtubeLinkInput.value.trim();

        if (urlValue === "") {
            alert("Silakan masukkan tautan link video YouTube terlebih dahulu!");
            return;
        }

        const videoId = extractYouTubeID(urlValue);

        if (!videoId) {
            alert("Tautan link YouTube tidak valid! Pastikan menggunakan link dari video YouTube asli.");
            return;
        }

        // Render Iframe YouTube API ke media wrapper
        mediaWrapper.innerHTML = `
            <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
            </iframe>
        `;

        // Reset input link menjadi kosong saat pengunggahan berhasil
        youtubeLinkInput.value = "";

        // Aktifkan visual background video & matikan placeholder area
        triggerVideoPlayState();
        alert("Video YouTube berhasil dimuat!");
        closeModal();
    });


    // --- MENGELOLA STATE PERUBAHAN TAMPILAN PEMUTAR ---
    function triggerVideoPlayState() {
        isVideoActive = true;
        placeholderArea.classList.add("hidden");
        videoDisplayArea.classList.remove("hidden"); // Memunculkan background video beserta seluruh control panel
    }

    function resetVideoPlayerState() {
        isVideoActive = false;
        mediaWrapper.innerHTML = ""; // Hapus elemen video/iframe agar resource/suara berhenti total
        deviceVideoInput.value = ""; // Reset file picker input
        videoDisplayArea.classList.add("hidden");
        placeholderArea.classList.remove("hidden");
    }


    // --- FITUR KONFIRMASI CLOSE VIDEO ---
    closeVideoBtn.addEventListener("click", () => {
        const confirmClose = confirm("Apakah Anda yakin ingin menutup video yang sedang diputar ini?");
        if (confirmClose) {
            resetVideoPlayerState();
        }
    });
});
