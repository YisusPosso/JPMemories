document.addEventListener('DOMContentLoaded', () => {
    const photoUpload = document.getElementById('photo-upload');
    const galleryContainer = document.getElementById('gallery-container');
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const closeBtn = document.getElementById('close-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const timeDisplay = document.getElementById('time-display');
    const dateDisplay = document.getElementById('date-display');
    // Nuevos elementos
    const timerInput = document.getElementById('timer-input');

    let currentImageIndex = 0;
    const images = [];
    let timerInterval = null;

    // Función para actualizar la hora y la fecha
    function updateDateTime() {
        const now = new Date();
        const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
        timeDisplay.textContent = now.toLocaleTimeString('es-CO', timeOptions);
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.textContent = now.toLocaleDateString('es-CO', dateOptions);
    }
    setInterval(updateDateTime, 1000);
    updateDateTime();

    // Lógica para el temporizador automático
    function startTimer() {
        const intervalInSeconds = parseInt(timerInput.value);
        if (isNaN(intervalInSeconds) || intervalInSeconds < 1) {
            return;
        }

        stopTimer(); // Detiene cualquier temporizador anterior
        timerInterval = setInterval(() => {
            navigate(1); // Navega a la siguiente foto
        }, intervalInSeconds * 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
        }
    }

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

    // Abrir el visor de fotos con transición y arrancar el temporizador
    const openLightbox = (index) => {
        currentImageIndex = index;
        lightboxImage.style.opacity = 0;
        setTimeout(() => {
            lightboxImage.src = images[currentImageIndex];
            lightboxImage.style.opacity = 1;
        }, 100);
        lightbox.classList.remove('hidden');
        startTimer(); // Inicia el temporizador
    };

    // Navegar por las fotos con transición
    const navigate = (direction) => {
        lightboxImage.style.opacity = 0;
        setTimeout(() => {
            currentImageIndex = (currentImageIndex + direction + images.length) % images.length;
            lightboxImage.src = images[currentImageIndex];
            lightboxImage.style.opacity = 1;
        }, 300);
    };

    // Detiene el temporizador si el usuario navega manualmente
    prevBtn.addEventListener('click', () => {
        stopTimer();
        navigate(-1);
    });
    nextBtn.addEventListener('click', () => {
        stopTimer();
        navigate(1);
    });

    // Cierra el visor y detiene el temporizador
    closeBtn.addEventListener('click', () => {
        lightbox.classList.add('hidden');
        stopTimer();
    });

    // Vuelve a iniciar el temporizador si el usuario cambia el valor
    timerInput.addEventListener('change', startTimer);

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
