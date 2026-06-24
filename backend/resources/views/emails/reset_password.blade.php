<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Kode OTP Lupa Sandi</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8fafc;
            color: #334155;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            border: 1px solid #f1f5f9;
        }
        .header {
            background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
            padding: 32px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.025em;
        }
        .content {
            padding: 40px;
            line-height: 1.6;
        }
        .content p {
            margin-top: 0;
            margin-bottom: 24px;
            font-size: 15px;
            color: #475569;
        }
        .otp-container {
            background-color: #fff7ed;
            border: 1px dashed #fdba74;
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            margin: 32px 0;
        }
        .otp-code {
            font-size: 32px;
            font-weight: 800;
            letter-spacing: 0.25em;
            color: #ea580c;
            margin: 0;
            font-family: monospace;
        }
        .footer {
            background-color: #f8fafc;
            padding: 24px;
            text-align: center;
            border-top: 1px solid #f1f5f9;
            font-size: 12px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>goodpeople-hcms</h1>
        </div>
        <div class="content">
            <p>Halo,</p>
            <p>Kami menerima permintaan untuk mengatur ulang kata sandi akun Anda di Portal Absensi Karyawan. Gunakan kode OTP di bawah ini untuk memverifikasi identitas Anda:</p>
            
            <div class="otp-container">
                <h2 class="otp-code">{{ $otp }}</h2>
            </div>
            
            <p>Kode OTP ini berlaku selama <strong>15 menit</strong>. Jangan bagikan kode ini kepada siapa pun demi keamanan akun Anda.</p>
            <p>Jika Anda tidak merasa mengajukan permintaan ini, Anda dapat mengabaikan email ini dengan aman.</p>
            <p>Terima kasih,<br>Tim IT goodpeople-hcms</p>
        </div>
        <div class="footer">
            &copy; 2026 Portal Absensi Karyawan. Hak Cipta Dilindungi Undang-Undang.
        </div>
    </div>
</body>
</html>
