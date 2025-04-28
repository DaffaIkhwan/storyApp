let mediaStream = null;

export async function startCameraStream(videoElement) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Browser does not support getUserMedia API');
        alert('Browser Anda tidak mendukung akses kamera.');
        return false;
    }
    if (!videoElement) {
        console.error('Video element provided to startCameraStream is invalid.');
        return false;
    }

    stopCameraStream(videoElement);

    try {
        console.log('Requesting camera stream...');
        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false,
        });

        videoElement.srcObject = mediaStream;
        await new Promise((resolve, reject) => {
            videoElement.onloadedmetadata = () => {
                console.log('Camera metadata loaded.');
                resolve();
            };
             setTimeout(() => reject(new Error("Timeout waiting for video metadata")), 5000);
        });
        await videoElement.play();
        console.log('Camera stream playing.');
        return true;

    } catch (error) {
        console.error('Error accessing or playing camera stream:', error.name, error.message);
        let alertMessage = 'Tidak dapat mengakses kamera. Pastikan izin diberikan.';
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            alertMessage = 'Anda tidak memberikan izin akses kamera.';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            alertMessage = 'Tidak ada kamera yang ditemukan di perangkat ini.';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
           alertMessage = 'Kamera sedang digunakan oleh aplikasi lain atau terjadi error hardware.';
        } else if (error.message.includes("Timeout")) {
            alertMessage = "Gagal memuat metadata video kamera.";
        }
        alert(alertMessage);
        stopCameraStream(videoElement);
        mediaStream = null;
        return false;
    }
}

export function stopCameraStream(videoElement) {
    if (mediaStream) {
        console.log('Stopping camera stream tracks...');
        mediaStream.getTracks().forEach(track => {
            track.stop();
        });
        mediaStream = null;
    }
    if (videoElement && videoElement.srcObject) {
       try {
           const stream = videoElement.srcObject;
           if (stream && typeof stream.getTracks === 'function') {
               stream.getTracks().forEach(track => track.stop());
           }
       } catch (e) {}
       videoElement.srcObject = null;
       videoElement.load();
       console.log('Video element srcObject cleared.');
    }
}

export function capturePhoto(videoElement, canvasElement) {
    if (!videoElement || !canvasElement) {
        console.error("Video or Canvas element missing for capturePhoto.");
        return Promise.resolve(null);
    }
    if (!mediaStream || !videoElement.videoWidth || videoElement.readyState < videoElement.HAVE_CURRENT_DATA) {
        console.warn('Camera stream not active or video not ready for capture.');
        return Promise.resolve(null);
    }

    console.log('Capturing photo frame...');
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    const context = canvasElement.getContext('2d');
    if (!context) {
        console.error("Failed to get 2D context from canvas.");
        return Promise.resolve(null);
    }

    try {
        context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    } catch (drawError) {
       console.error("Error drawing video frame to canvas:", drawError);
       return Promise.resolve(null);
    }

    return new Promise((resolve, reject) => {
       try {
           canvasElement.toBlob(blob => {
               if (blob) {
                   const fileName = `dicoding-story-${Date.now()}.jpeg`;
                   const file = new File([blob], fileName, { type: 'image/jpeg' });
                   console.log('Photo captured and converted to File:', file.name, file.size);
                   resolve(file);
               } else {
                   console.error('Canvas toBlob resulted in null blob.');
                   resolve(null);
               }
           }, 'image/jpeg', 0.9);
       } catch (error) {
           console.error("Error during canvas.toBlob:", error);
           reject(error);
       }
    });
}