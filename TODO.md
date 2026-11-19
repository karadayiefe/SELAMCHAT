# SELAMCHAT — Tamamlanan kapsam

## 1. Anonim kimlik ve görünür marka
- Siteye giren her kullanıcıya otomatik olarak rastgele bir hayvan adı, emoji ve sabit rengi atanır; üyelik, e-posta, şifre veya profil gerekmez.
- Tarayıcı sekmesi kimliği sayfa yenilenince korunur; ayrı sekmeler bağımsız kullanıcı kimliği alır.
- Sitede, sekme başlığında, metadata’da, logoda ve favicon’da görünen marka SELAMCHAT’tir.

## 2. Sayaçlar ve rastgele eşleşme
- Sağ üstte "Canlı Bağlantı: X" ve "Aktif Sohbet: Y" sayaçları bağlı kullanıcılar/aktif sohbetleri düzenli aralıklarla günceller.
- "Sohbete Başla" bekleyen başka bir kullanıcıyla rastgele bire bir eşleştirir; aynı anda eşleşmeye çalışan kullanıcılar sunucu tarafında atomik olarak kilitlenir.
- Beş saniyede eşleşme yoksa "Şu anda aktif online yok" uyarısı görünür; arama arka planda sürer ve sonraki gerçek kullanıcı geldiğinde eşleşir.

## 3. Canlı sohbet
- İki kullanıcının mesajları her iki ekranda da hayvan adı, emoji ve renk ile gösterilir; yazıyor göstergesi bulunur.
- Sohbet ekranı responsive ve mobilde kullanılabilir.
- Mesaj içeriği yalnızca aktif oda süresince geçici DB satırlarında bulunabilir; sohbet kapanınca oda mesajları silinir, sohbet geçmişi/arşivi tutulmaz.

## 4. Ayrılma ve güvenilir temizleme
- İki kullanıcıdan biri "Sohbetten Ayrıl" dediğinde, sekme kapanışı Beacon’i ulaştığında veya bağlantı heartbeat zaman aşımına uğradığında tek tarafın ayrılması sohbeti bitirir; karşı tarafın ayrıca ayrılması beklenmez.
- Odanın kapanması mesaj satırlarını veritabanından siler, aktif katılımcıya "Karşı taraf sohbetten ayrıldı, sohbet temizlendi" ve "Yeni Kişi Bul" durumunu gösterir.
- Eşzamanlı ayrılma işlemleri aynı katılımcı/oda kilit sırasıyla yürütülür; eşleşme ile ayrılma çakışması yeniden okunup ele alınır.
- Bağlantı heartbeat’i 20 saniyeden eski olan kullanıcı çevrimdışı sayılır; devam eden tarafın yoklaması zaman aşımını algılar ve odayı temizler. Sekme kapanış Beacon’i bu süreci hızlandırır.
- Yeni eşleşme yeni oda kimliğiyle başlar; önceki odanın mesajları yeni sohbete taşınmaz.

## 5. Production yayını
- Üretim alanı `https://selamchat.fun/` public; Manus deployment durumu başarılı. 17 Kasım 2026 testinde IPv4 DNS, TLS 1.2/1.3 sertifika doğrulaması, HTTP→HTTPS 301, HTTPS ana sayfa 200 ve `/api/health` 200 alındı.
- DNS AAAA kayıtları yayımlı; bu Sandbox’ta IPv6 ağına rota olmadığından IPv6 TLS handshake’i burada doğrulanamadı. Tam test kanıtı ve kapsam sınırı `DOMAIN-DIAGNOSTICS.md` içindedir.
