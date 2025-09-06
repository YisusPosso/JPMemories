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
    const timerInput = document.getElementById('timer-input');

    let currentImageIndex = 0;
    const images = []; // Contiene las URL de las imágenes
    let timerInterval = null;
    const DB_NAME = 'PhotoGalleryDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'photos';

    // Función para activar el modo de pantalla completa
    function requestFullScreen(element) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) { /* Firefox */
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) { /* IE/Edge */
            element.msRequestFullscreen();
        }
    }
    
    // Función para salir del modo de pantalla completa
    function exitFullScreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { /* Firefox */
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE/Edge */
            document.msExitFullscreen();
        }
    }

    // Función para abrir la base de datos (IndexedDB)
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

    // Función para guardar una imagen en IndexedDB
    async function saveImage(id, imageUrl) {
        const db = await openDatabase();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.put({ id: id, url: imageUrl });
        transaction.oncomplete = () => console.log('Imagen guardada en la base de datos');
    }

    // Función para eliminar una imagen de IndexedDB
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

    // Función para cargar las imágenes desde IndexedDB al inicio
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

    // Nueva función para crear la miniatura con el botón de eliminar
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
            event.stopPropagation(); // Evita que se abra el lightbox
            
            // 1. Eliminar de IndexedDB
            deleteImage(imageUrl);

            // 2. Eliminar del array
            const indexToRemove = images.indexOf(imageUrl);
            if (indexToRemove > -1) {
                images.splice(indexToRemove, 1);
            }

            // 3. Eliminar del DOM
            container.remove();
        });
    }

    // Llamamos a la función de carga al inicio de la aplicación
    loadImages();

    // Función para actualizar la hora y la fecha
    function updateDateTime() {
        const now = new Date();
        const timeOptions = { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true,
            timeZone: 'America/Bogota'
        };
        timeDisplay.textContent = now.toLocaleTimeString('es-CO', timeOptions);
        
        const dateOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            timeZone: 'America/Bogota'
        };
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
    
    // Función de transición unificada
    function navigateWithTransition(imageUrl) {
        lightboxImage.style.opacity = 0;
        setTimeout(() => {
            lightboxImage.src = imageUrl;
            lightboxBackground.style.backgroundImage = `url(${imageUrl})`;
            lightboxImage.style.opacity = 1;
        }, 500);
    }

    // Cargar y mostrar imágenes
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

    // Abrir el visor de fotos con transición y arrancar el temporizador
    const openLightbox = (index) => {
        if (images.length === 0) return;
        currentImageIndex = index;
        navigateWithTransition(images[currentImageIndex]);
        lightbox.classList.remove('hidden');
        startTimer();
        
        // Entrar en modo de pantalla completa al abrir el visor
        requestFullScreen(document.body);
    };

    // Navegar por las fotos con transición
    const navigate = (direction) => {
        if (images.length === 0) {
            closeBtn.click();
            return;
        }
        currentImageIndex = (currentImageIndex + direction + images.length) % images.length;
        navigateWithTransition(images[currentImageIndex]);
    };

    // Control de eventos para los botones de navegación
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
        exitFullScreen(); // Salir de pantalla completa al cerrar
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
