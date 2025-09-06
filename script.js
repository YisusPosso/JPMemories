document.addEventListener('DOMContentLoaded', () => {
    const photoUpload = document.getElementById('photo-upload');
    const galleryContainer = document.getElementById('gallery-container');
    const lightbox = document.getElementById('lightbox');
    const lightboxBackground = document.getElementById('lightbox-background');
    const lightboxImage = document.getElementById('lightbox-image');
    const closeBtn = document.getElementById('close-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const timeDisplay = document.getElementById('time-display');
    const dateDisplay = document.getElementById('date-display');
    const timerSelect = document.getElementById('timer-select'); // Cambiado a timerSelect

    let currentImageIndex = 0;
    const images = [];
    let timerInterval = null;
    const DB_NAME = 'PhotoGalleryDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'photos';

    function openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            };
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    async function saveImage(id, imageUrl) {
        const db = await openDatabase();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.put({ id: id, url: imageUrl });
        transaction.oncomplete = () => console.log('Imagen guardada en la base de datos');
    }

    async function deleteImage(imageUrl) {
        const db = await openDatabase();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => {
            const items = request.result;
            const itemToDelete = items.find(item => item.url === imageUrl);
            if (itemToDelete) {
                store.delete(itemToDelete.id);
                transaction.oncomplete = () => {
                    console.log('Imagen eliminada de la base de datos');
                };
            }
        };
    }

    async function loadImages() {
        const db = await openDatabase();
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => {
            const storedImages = request.result;
            if (storedImages.length > 0) {
                storedImages.forEach(item => {
                    images.push(item.url);
                    createThumbnail(item.url);
                });
            }
        };
    }

    function createThumbnail(imageUrl) {
        const container = document.createElement('div');
        container.classList.add('gallery-item-container');
        const img = document.createElement('img');
        img.src = imageUrl;
        img.classList.add('gallery-item');
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑️';
        deleteBtn.classList.add('delete-thumb-btn');
        container.appendChild(img);
        container.appendChild(deleteBtn);
        galleryContainer.appendChild(container);
        img.addEventListener('click', () => {
            openLightbox(images.indexOf(imageUrl));
        });
        deleteBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            deleteImage(imageUrl);
            const indexToRemove = images.indexOf(imageUrl);
            if (indexToRemove > -1) {
                images.splice(indexToRemove, 1);
            }
            container.remove();
        });
    }

    loadImages();

    function updateDateTime() {
        const now = new Date();
        const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Bogota' };
        timeDisplay.textContent = now.toLocaleTimeString('es-CO', timeOptions);
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Bogota' };
        dateDisplay.textContent = now.toLocaleDateString('es-CO', dateOptions);
    }
    setInterval(updateDateTime, 1000);
    updateDateTime();

    function startTimer() {
        const intervalInSeconds = parseInt(timerSelect.value);
        if (isNaN(intervalInSeconds) || intervalInSeconds < 1) {
            return;
        }
        stopTimer();
        timerInterval = setInterval(() => {
            navigate(1);
        }, intervalInSeconds * 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
        }
    }

    function navigateWithTransition(imageUrl) {
        lightboxImage.style.opacity = 0;
        setTimeout(() => {
            lightboxImage.src = imageUrl;
            lightboxBackground.style.backgroundImage = `url(${imageUrl})`;
            lightboxImage.style.opacity = 1;
        }, 500);
    }

    photoUpload.addEventListener('change', (event) => {
        const files = event.target.files;
        for (const file of files) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUrl = e.target.result;
                const newId = Date.now();
                images.push(imageUrl);
                saveImage(newId, imageUrl);
                createThumbnail(imageUrl);
            };
            reader.readAsDataURL(file);
        }
    });

    const openLightbox = (index) => {
        if (images.length === 0) return;
        currentImageIndex = index;
        navigateWithTransition(images[currentImageIndex]);
        lightbox.classList.remove('hidden');
        startTimer();
        requestFullScreen(document.body);
    };

    const navigate = (direction) => {
        if (images.length === 0) {
            closeBtn.click();
            return;
        }
        currentImageIndex = (currentImageIndex + direction + images.length) % images.length;
        navigateWithTransition(images[currentImageIndex]);
    };

    prevBtn.addEventListener('click', () => {
        stopTimer();
        navigate(-1);
    });
    nextBtn.addEventListener('click', () => {
        stopTimer();
        navigate(1);
    });

    closeBtn.addEventListener('click', () => {
        lightbox.classList.add('hidden');
        stopTimer();
        exitFullScreen();
    });

    timerSelect.addEventListener('change', startTimer); // Cambiado a timerSelect

    function requestFullScreen(element) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    }
    
    function exitFullScreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }

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
