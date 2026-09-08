document.addEventListener('DOMContentLoaded', () => {
    let cameraStream = null;
    let scanningActive = false;
    let qrData = { receiver: '', receiverAcc: '', ref: '', date: '', time: '' };

    // 📷 فتح الكاميرا وقراءة QR
    const openCameraBtn = document.getElementById('openCameraBtn');
    const cameraContainer = document.getElementById('cameraContainer');
    const qrVideo = document.getElementById('qrVideo');
    const closeCameraBtn = document.getElementById('closeCameraBtn');

    if (openCameraBtn) {
        openCameraBtn.addEventListener('click', async () => {
            try {
                cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                qrVideo.srcObject = cameraStream;
                cameraContainer.style.display = 'block';
                openCameraBtn.style.display = 'none';
                scanningActive = true;
                requestAnimationFrame(scanQR);
            } catch (err) {
                alert('❌ لم يتم فتح الكاميرا: تأكد من الصلاحيات');
            }
        });
    }

    if (closeCameraBtn) {
        closeCameraBtn.addEventListener('click', () => {
            scanningActive = false;
            if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
            cameraContainer.style.display = 'none';
            openCameraBtn.style.display = 'block';
        });
    }

    // مسح الكود وتحليله
    function scanQR() {
        if (!scanningActive) return;
        if (qrVideo.readyState === qrVideo.HAVE_ENOUGH_DATA) {
            const canvas = document.createElement('canvas');
            canvas.width = qrVideo.videoWidth;
            canvas.height = qrVideo.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(qrVideo, 0, 0, canvas.width, canvas.height);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imgData.data, imgData.width, imgData.height);

            if (code) {
                scanningActive = false;
                if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
                cameraContainer.style.display = 'none';
                openCameraBtn.style.display = 'block';
                parseQR(code.data);
                return;
            }
        }
        requestAnimationFrame(scanQR);
    }

    // تحليل بيانات الكود — مطابق لنموذجك
    function parseQR(data) {
        try {
            // استخراج البيانات من نص الكود
            qrData.receiver = extractVal(data, 'المستلم', 'حساب') || 'عبد حمد الشواخ';
            qrData.receiverAcc = extractVal(data, 'حساب المستلم', 'المبلغ') || '3701********';
            qrData.ref = extractVal(data, 'رقم', 'تاريخ') || '417501845';
            qrData.date = extractVal(data, 'تاريخ العملية', '—') || '2026-08-30';
            qrData.time = extractVal(data, 'تاريخ العملية', '')?.split(' - ')?.pop() || '10:10:22';

            // عرض البيانات للمستخدم
            document.getElementById('autoReceiver').textContent = qrData.receiver;
            document.getElementById('autoReceiverAcc').textContent = qrData.receiverAcc;
            document.getElementById('autoRef').textContent = qrData.ref;
            document.getElementById('autoDateTime').textContent = qrData.date + ' - ' + qrData.time;

            alert('✅ تم قراءة الكود!\nالمستلم: ' + qrData.receiver + '\n\n👉 أدخل اسم المرسل والمبلغ ثم اضغط إنشاء PDF');
            document.getElementById('dekontSender').focus();
        } catch (e) {
            alert('⚠️ تم قراءة الكود، تحقق من البيانات يدوياً');
        }
    }

    function extractVal(text, start, end) {
        const s = text.indexOf(start);
        if (s === -1) return null;
        const startLen = start.length;
        const e = end ? text.indexOf(end, s + startLen) : text.length;
        return text.substring(s + startLen, e === -1 ? text.length : e).replace(/[؛:\-]/g, '').trim();
    }

    // 📄 إنشاء الإشعار
    const generatePdfBtn = document.getElementById('generatePdfBtn');
    const pdfPreviewSection = document.getElementById('pdfPreviewSection');
    const shareWhatsappBtn = document.getElementById('shareWhatsappBtn');

    if (generatePdfBtn) {
        generatePdfBtn.addEventListener('click', () => {
            const sender = document.getElementById('dekontSender').value || 'حسين احمد الفارس';
            const amount = document.getElementById('dekontAmount').value || '0';
            const genDate = new Date().toLocaleDateString('ar-SA');
            const genTime = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true });

            // ملء المعاينة بنفس ترتيب النموذج تماماً
            document.getElementById('pRef').textContent = qrData.ref;
            document.getElementById('pDate').textContent = qrData.date;
            document.getElementById('pTime').textContent = qrData.time;
            document.getElementById('pSender').textContent = sender;
            document.getElementById('pReceiver').textContent = qrData.receiver;
            document.getElementById('pReceiverAcc').textContent = qrData.receiverAcc;
            document.getElementById('pAmount').textContent = '$ ' + amount;
            document.getElementById('pGenDate').textContent = genDate + ' - ' + genTime;

            pdfPreviewSection.style.display = 'block';
            shareWhatsappBtn.style.display = 'block';
            alert('✅ تم إنشاء الإشعار!\nالمرسل: ' + sender + '\nالمبلغ: $ ' + amount);
        });
    }

    // تحميل PDF
    document.getElementById('downloadPdfBtn')?.addEventListener('click', () => {
        const el = document.getElementById('dekontPreview');
        html2pdf().set({
            margin: 5,
            filename: 'DEKONT-' + Date.now() + '.pdf',
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(el).save().then(() => alert('✅ تم حفظ PDF!'));
    });

    // مشاركة واتساب
    document.getElementById('shareWhatsappBtn')?.addEventListener('click', () => {
        const msg = `إشعار تحويل — DEKONT\n─────────────\nالمرسل: ${document.getElementById('dekontSender').value}\nالمستلم: ${qrData.receiver}\nالمبلغ: $ ${document.getElementById('dekontAmount').value} USD\nالمرجع: ${qrData.ref}\n─────────────\nشام كاش`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    });
});
