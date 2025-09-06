document.addEventListener('DOMContentLoaded', () => {
    const photoUpload = document.getElementById('photo-upload');
    const galleryContainer = document.getElementById('gallery-container');
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const closeBtn = document.getElementById('close-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    let currentImageIndex = 0;
    const images = [];

    // Cargar y mostrar imágenes
    photoUpload.addEventListener('change', (event) => {
        const files = event.target.files;
        for (const file of files) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUrl = e.target.result;
                images.push(imageUrl);
                const img = document.createElement('img');
                img.src = imageUrl;
                img.classList.add('gallery-item');
                galleryContainer.appendChild(img);

                img.addEventListener('click', () => {
                    openLightbox(images.indexOf(imageUrl));
                });
            };
            reader.readAsDataURL(file);
        }
    });

    // Abrir el visor de fotos
    const openLightbox = (index) => {
        currentImageIndex = index;
        lightboxImage.src = images[currentImageIndex];
        lightbox.classList.remove('hidden');
    };

    // Navegar por las fotos
    const navigate = (direction) => {
        currentImageIndex = (currentImageIndex + direction + images.length) % images.length;
        lightboxImage.src = images[currentImageIndex];
    };

    prevBtn.addEventListener('click', () => navigate(-1));
    nextBtn.addEventListener('click', () => navigate(1));

    // Cerrar el visor
    closeBtn.addEventListener('click', () => {
        lightbox.classList.add('hidden');
    });

    // Registrar el service worker para PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('Service Worker registrado:', registration);
            }).catch(error => {
                console.log('Registro de Service Worker falló:', error);
            });
        });
    }
});