# Oyun API Dokümantasyonu

Bu dokümantasyon, JWT token kimlik doğrulama sistemi ile Oyun API'sinin endpoint'lerini açıklar. Tüm endpoint'ler `/v1/game` öneki ile başlar.

## Temel URL
```
http://localhost:3040/v1/game
```

## Kimlik Doğrulama
Oyun API'si kimlik doğrulama için JWT token kullanır. Token'ı Authorization header'ında ekleyin:
```
Authorization: Bearer <access_token>
```

## Endpoint'ler

### 1. Oyun Girişi
**Endpoint:** `POST /login`

**İstek Gövdesi:**
```json
{
  "username": "oyuncuBir",
  "password": "gizli123"
}
```

**Başarılı Yanıt (200):**
```json
{
  "dataPlayer": {
    "username": "oyuncuBir",
    "score": 1250,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Hata Yanıtları:**
```json
{
  "error": "invalid_credentials",
  "message": "Kullanıcı adı veya şifre yanlış"
}
```

### 2. Oyun Hesabı Oluştur
**Endpoint:** `POST /account`

**İstek Gövdesi:**
```json
{
  "username": "yeniOyuncu",
  "email": "oyuncu@example.com",
  "password": "yeniGizli!"
}
```

**Başarılı Yanıt (201):**
```json
{
  "message": "Hesap başarıyla oluşturuldu. Lütfen e-posta adresinizi doğrulayın.",
  "email": "oyuncu@example.com"
}
```

**Hata Yanıtları:**
```json
{
  "error": "username_already_exists",
  "message": "Bu kullanıcı adı zaten alınmış"
}
```

```json
{
  "error": "email_already_exists",
  "message": "Bu e-posta adresi zaten kayıtlı"
}
```

### 3. Liderlik Tablosu
**Endpoint:** `GET /leaderboard`

**İstek:** Gövde gerekmez, kimlik doğrulama gerekmez

**Başarılı Yanıt (200):**
```json
{
  "leaderboard": [
    { "username": "alfa", "score": 2200 },
    { "username": "bravo", "score": 1985 },
    { "username": "charlie", "score": 1720 }
  ]
}
```

**Hata Yanıtları:**
```json
{
  "error": "leaderboard_unavailable",
  "message": "Liderlik tablosu hizmeti kullanılamıyor"
}
```

### 4. Skor Gönder (Oyun Bitti) - 🔒 Kimlik Doğrulama Gerekli
**Endpoint:** `POST /score`

**Header'lar:**
```
Authorization: Bearer <access_token>
```

**İstek Gövdesi:**
```json
{
  "score": 1450
}
```

**Başarılı Yanıt (200):**
```json
{
  "message": "Skor başarıyla güncellendi",
  "dataPlayer": {
    "username": "oyuncuBir",
    "score": 1450
  }
}
```

**Hata Yanıtları:**
```json
{
  "error": "user_not_found",
  "message": "Oyuncu bulunamadı"
}
```

```json
{
  "error": "invalid_score",
  "message": "Skor pozitif bir tam sayı olmalıdır"
}
```

### 5. Oyuncu İstatistikleri - 🔒 Kimlik Doğrulama Gerekli
**Endpoint:** `GET /player/stats`

**Header'lar:**
```
Authorization: Bearer <access_token>
```

**İstek:** Gövde gerekmez

**Başarılı Yanıt (200):**
```json
{
  "dataPlayer": {
    "username": "oyuncuBir",
    "score": 1450,
    "highScore": 2000,
    "gamesPlayed": 15,
    "lastPlayed": "2024-01-15T10:30:00.000Z",
    "memberSince": "2024-01-01T08:00:00.000Z"
  }
}
```

**Hata Yanıtları:**
```json
{
  "error": "user_not_found",
  "message": "Oyuncu bulunamadı"
}
```

### 6. E-posta Doğrulama
**Endpoint:** `POST /verify-email`

**İstek Gövdesi:**
```json
{
  "email": "oyuncu@example.com",
  "verificationCode": "1234"
}
```

**Başarılı Yanıt (200):**
```json
{
  "message": "Hesap başarıyla doğrulandı"
}
```

**Hata Yanıtları:**
```json
{
  "error": "invalid_verification_code",
  "message": "Doğrulama kodu yanlış"
}
```

### 7. Doğrulama E-postası Tekrar Gönder
**Endpoint:** `POST /resend-verification`

**İstek Gövdesi:**
```json
{
  "email": "oyuncu@example.com"
}
```

**Başarılı Yanıt (200):**
```json
{
  "message": "Doğrulama e-postası tekrar gönderildi"
}
```

### 8. Şifre Sıfırlama E-postası Gönder
**Endpoint:** `POST /forgot-password`

**İstek Gövdesi:**
```json
{
  "email": "oyuncu@example.com"
}
```

**Başarılı Yanıt (200):**
```json
{
  "message": "Şifre sıfırlama e-postası gönderildi"
}
```

### 9. Şifre Sıfırla
**Endpoint:** `POST /reset-password`

**İstek Gövdesi:**
```json
{
  "email": "oyuncu@example.com",
  "passwordToken": "1234",
  "newPassword": "yeniGizli123"
}
```

**Başarılı Yanıt (200):**
```json
{
  "message": "Şifre başarıyla sıfırlandı"
}
```

**Hata Yanıtları:**
```json
{
  "error": "token_expired",
  "message": "Doğrulama kodu süresi dolmuş"
}
```

### 10. Oyun Çıkışı - 🔒 Kimlik Doğrulama Gerekli
**Endpoint:** `GET /logout`

**Header'lar:**
```
Authorization: Bearer <access_token>
```

**İstek:** Gövde gerekmez

**Başarılı Yanıt (200):**
```json
{
  "message": "Başarıyla çıkış yapıldı"
}
```

## HTTP Durum Kodları

- **200 OK** – Başarılı istek
- **201 Created** – Hesap başarıyla oluşturuldu
- **400 Bad Request** – Geçersiz istek verisi
- **401 Unauthorized** – Geçersiz kimlik bilgileri veya eksik token
- **404 Not Found** – Oyuncu bulunamadı
- **409 Conflict** – Kullanıcı adı zaten mevcut
- **500 Internal Server Error** – Beklenmeyen sunucu hatası
- **503 Service Unavailable** – Sunucu kapalı / bağlantı sorunları

## Veri Modelleri

### Oyun Oyuncusu
```json
{
  "username": "string (3-20 karakter, benzersiz)",
  "email": "string (e-posta adresi, benzersiz, küçük harf)",
  "password": "string (min 6 karakter, hash'lenmiş, select: false)",
  "verificationCode": "number (4 haneli doğrulama kodu, select: false)",
  "passwordToken": "string (şifre sıfırlama token'ı, select: false)",
  "passwordTokenExpirationDate": "date (token sona erme tarihi, select: false)",
  "isVerified": "boolean (e-posta doğrulama durumu, varsayılan: false)",
  "score": "number (mevcut skor, varsayılan: 0)",
  "highScore": "number (en yüksek skor, varsayılan: 0)",
  "gamesPlayed": "number (toplam oyun, varsayılan: 0)",
  "lastPlayed": "date (son oyun zamanı)",
  "isActive": "boolean (hesap durumu, varsayılan: true)",
  "role": "string (player/admin, varsayılan: player)",
  "createdAt": "date (hesap oluşturma)",
  "updatedAt": "date (son güncelleme)"
}
```

### JWT Token Yükü
```json
{
  "playerId": "ObjectId",
  "username": "string",
  "role": "string",
  "iat": "number (verilme zamanı)",
  "exp": "number (sona erme zamanı)"
}
```

## Özellikler

- **JWT Kimlik Doğrulama**: Ana auth API ile aynı token sistemi
- **Şifre Güvenliği**: Tüm şifreler pre-save middleware ile bcrypt ile hash'lenir
- **Token Yönetimi**: Veritabanı takibi ile erişim ve yenileme token'ları
- **Skor Takibi**: Mevcut skor, en yüksek skor ve oynanan oyun sayısını takip eder
- **Liderlik Tablosu**: Skora göre sıralanmış ilk 100 oyuncu
- **Veri Doğrulama**: Kullanıcı adı uzunluğu, şifre gereksinimleri, skor doğrulama
- **Hata Yönetimi**: Kapsamlı hata yanıtları
- **Performans**: Liderlik tablosu performansı için indekslenmiş sorgular
- **Güvenlik**: Şifre alanı varsayılan olarak hariç tutulur, açık seçim gerektirir

## Kimlik Doğrulama Akışı

1. **Kayıt/Giriş**: Oyuncu hesap oluşturur veya giriş yapar
2. **Token Oluşturma**: Sunucu erişim ve yenileme token'ları oluşturur
3. **Token Saklama**: Token'lar kullanıcı takibi ile veritabanında saklanır
4. **Korumalı Endpoint'ler**: `Authorization: Bearer <token>` header'ı kullanın
5. **Çıkış**: Token'lar geçersiz kılınır ve veritabanından kaldırılır

## Web Sayfaları

Aşağıdaki HTML sayfaları `/public` klasöründe mevcuttur:

- **`/verify-email.html`** - E-posta doğrulama sayfası
- **`/forgot-password.html`** - Şifre sıfırlama talebi sayfası  
- **`/reset-password.html`** - Yeni şifre belirleme sayfası

Bu sayfalar otomatik olarak API ile entegre çalışır ve kullanıcı dostu arayüz sağlar.

## E-posta Sistemi

- **SMTP Yapılandırması**: `.env` dosyasında SMTP ayarları gerekli
- **Doğrulama Kodu**: 4 haneli rastgele kod (10 dakika geçerli)
- **Şifre Sıfırlama**: 4 haneli token ile güvenli sıfırlama
- **HTML E-posta**: Güzel tasarlanmış HTML e-posta şablonları

## Entegrasyon Notları

- Ana kimlik doğrulama API'si ile aynı JWT token sistemini kullanır
- Oyun hesapları bağımsızdır ancak aynı güvenlik kalıplarını takip eder
- Tüm endpoint'ler JSON yanıtları döndürür
- Çapraz kaynak istekleri için CORS etkinleştirilmiştir
- Hata yönetimi ana API ile aynı kalıbı takip eder
- Mevcut `isAuthenticated` fonksiyonu ile middleware entegrasyonu
- E-posta doğrulama zorunludur (giriş yapmadan önce)
- Static dosyalar `/public` klasöründen serve edilir
