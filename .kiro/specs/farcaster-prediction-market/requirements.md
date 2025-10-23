# Requirements Document

## Introduction

Bu proje, Farcaster Mini App olarak çalışan ve Base blockchain üzerinde işlem yapan bir Prediction Market (Tahmin Piyasası) uygulamasıdır. Kullanıcılar Farcaster topluluğu içinde sosyal olaylar, trend'ler ve çeşitli konular hakkında tahminlerde bulunabilir, bahis yapabilir ve doğru tahminlerden kazanç elde edebilirler. Base'in düşük gas ücretleri sayesinde mikro-bahisler mümkün olacak ve işlemler hızlı gerçekleşecektir.

## Requirements

### Requirement 1: Farcaster Kimlik Doğrulama ve Kullanıcı Yönetimi

**User Story:** Bir Farcaster kullanıcısı olarak, mevcut Farcaster hesabımla uygulamaya giriş yapabilmek istiyorum, böylece ayrı bir hesap oluşturmama gerek kalmasın ve sosyal kimliğim doğrulanmış olsun.

#### Acceptance Criteria

1. WHEN kullanıcı uygulamayı ilk kez açtığında THEN sistem Farcaster kimlik doğrulama akışını başlatmalıdır
2. WHEN Farcaster kimlik doğrulaması başarılı olduğunda THEN sistem kullanıcının FID (Farcaster ID), kullanıcı adı ve profil bilgilerini almalıdır
3. WHEN kullanıcı kimlik doğrulaması tamamlandığında THEN sistem kullanıcıyı ana sayfaya yönlendirmeli ve oturum bilgilerini saklamalıdır
4. IF kullanıcı daha önce giriş yapmışsa THEN sistem otomatik olarak oturumu yeniden başlatmalıdır
5. WHEN kullanıcı çıkış yapmak istediğinde THEN sistem oturum bilgilerini temizlemeli ve giriş ekranına yönlendirmelidir

### Requirement 2: Base Wallet Entegrasyonu

**User Story:** Bir kullanıcı olarak, Base blockchain üzerinde işlem yapabilmek için cüzdanımı bağlamak istiyorum, böylece bahis yapabileyim ve kazançlarımı alabileyim.

#### Acceptance Criteria

1. WHEN kullanıcı ilk kez bahis yapmak istediğinde THEN sistem Base ağına bağlı bir wallet bağlantısı istemelidir
2. WHEN kullanıcı wallet'ını bağladığında THEN sistem Base Mainnet veya Base Sepolia (testnet) ağına bağlı olduğunu doğrulamalıdır
3. IF kullanıcı yanlış ağa bağlıysa THEN sistem kullanıcıdan Base ağına geçmesini istemelidir
4. WHEN wallet bağlantısı başarılı olduğunda THEN sistem kullanıcının ETH bakiyesini göstermelidir
5. WHEN kullanıcı wallet'ını değiştirmek istediğinde THEN sistem mevcut bağlantıyı kesip yeni wallet bağlantısı yapabilmelidir
6. IF kullanıcının wallet'ı bağlı değilse THEN sistem bahis yapma ve kazanç çekme işlemlerini engellemeli ve uyarı göstermelidir

### Requirement 3: Piyasa (Market) Oluşturma

**User Story:** Bir kullanıcı olarak, ilgilendiğim konular hakkında yeni tahmin piyasaları oluşturabilmek istiyorum, böylece topluluk bu konular üzerine bahis yapabilsin.

#### Acceptance Criteria

1. WHEN kullanıcı "Yeni Piyasa Oluştur" butonuna tıkladığında THEN sistem bir form göstermelidir
2. WHEN kullanıcı piyasa oluştururken THEN sistem şu bilgileri istemelidir: başlık, açıklama, sonuç seçenekleri (minimum 2, maksimum 5), bitiş tarihi/saati, kategori
3. WHEN kullanıcı formu doldurduğunda THEN sistem girilen bilgileri doğrulamalıdır (boş alan kontrolü, bitiş tarihinin gelecekte olması, vb.)
4. WHEN kullanıcı piyasa oluşturma işlemini onayladığında THEN sistem Base blockchain üzerinde smart contract çağrısı yapmalıdır
5. WHEN blockchain işlemi başarılı olduğunda THEN sistem yeni piyasayı veritabanına kaydetmeli ve kullanıcıya başarı mesajı göstermelidir
6. IF blockchain işlemi başarısız olursa THEN sistem kullanıcıya hata mesajı göstermeli ve işlemi geri almalıdır
7. WHEN piyasa oluşturulduğunda THEN sistem piyasa oluşturucunun FID'sini ve oluşturma zamanını kaydetmelidir

### Requirement 4: Piyasaları Listeleme ve Filtreleme

**User Story:** Bir kullanıcı olarak, mevcut tahmin piyasalarını görebilmek ve ilgilendiğim piyasaları filtreleyebilmek istiyorum, böylece kolayca bahis yapabileceğim piyasaları bulabileyim.

#### Acceptance Criteria

1. WHEN kullanıcı ana sayfayı açtığında THEN sistem aktif piyasaların listesini göstermelidir
2. WHEN piyasalar listelenirken THEN her piyasa için şu bilgiler görünmelidir: başlık, kategori, toplam bahis miktarı, katılımcı sayısı, kalan süre, mevcut oranlar
3. WHEN kullanıcı filtreleme seçeneklerini kullandığında THEN sistem piyasaları kategoriye, duruma (aktif/tamamlanmış), popülerliğe veya bitiş tarihine göre filtrelemelidir
4. WHEN kullanıcı arama kutusuna metin girdiğinde THEN sistem piyasaları başlık ve açıklamaya göre arayarak sonuçları göstermelidir
5. WHEN kullanıcı bir piyasaya tıkladığında THEN sistem piyasa detay sayfasına yönlendirmelidir
6. IF hiç piyasa yoksa THEN sistem "Henüz piyasa yok, ilk piyasayı siz oluşturun" mesajı göstermelidir

### Requirement 5: Bahis Yapma (Prediction Placement)

**User Story:** Bir kullanıcı olarak, bir piyasada seçtiğim sonuç için bahis yapabilmek istiyorum, böylece doğru tahmin edersem kazanç elde edebilleyim.

#### Acceptance Criteria

1. WHEN kullanıcı bir piyasa detay sayfasında bir seçeneğe tıkladığında THEN sistem bahis miktarı girişi için bir modal açmalıdır
2. WHEN kullanıcı bahis miktarı girdiğinde THEN sistem potansiyel kazancı ve güncel oranları gerçek zamanlı olarak hesaplayıp göstermelidir
3. WHEN kullanıcı bahis miktarı girdiğinde THEN sistem kullanıcının wallet bakiyesinin yeterli olup olmadığını kontrol etmelidir
4. IF kullanıcının bakiyesi yetersizse THEN sistem uyarı mesajı göstermeli ve işlemi engellememelidir
5. WHEN kullanıcı bahsi onayladığında THEN sistem Base blockchain üzerinde transaction başlatmalıdır
6. WHEN transaction onaylandığında THEN sistem bahsi veritabanına kaydetmeli, piyasa oranlarını güncellemeli ve kullanıcıya başarı mesajı göstermelidir
7. WHEN bahis yapıldığında THEN sistem kullanıcının toplam bahis miktarını ve seçtiği sonucu kaydetmelidir
8. IF piyasa süresi dolmuşsa THEN sistem bahis yapılmasını engellemeli ve uyarı göstermelidir

### Requirement 6: Piyasa Sonuçlandırma (Market Resolution)

**User Story:** Bir piyasa oluşturucusu olarak, oluşturduğum piyasanın sonucunu belirleyebilmek istiyorum, böylece kazananlar ödüllerini alabilsin.

#### Acceptance Criteria

1. WHEN bir piyasanın bitiş süresi dolduğunda THEN sistem piyasa durumunu "Sonuçlandırılmayı Bekliyor" olarak işaretlemelidir
2. WHEN piyasa oluşturucusu piyasa detay sayfasını açtığında THEN sistem "Sonucu Belirle" butonu göstermelidir
3. IF kullanıcı piyasa oluşturucusu değilse THEN sistem "Sonucu Belirle" butonunu göstermemelidir
4. WHEN piyasa oluşturucusu sonucu seçip onayladığında THEN sistem blockchain üzerinde sonuçlandırma işlemini başlatmalıdır
5. WHEN sonuçlandırma işlemi tamamlandığında THEN sistem kazanan tarafı belirlemeli ve piyasa durumunu "Tamamlandı" olarak güncellemelidir
6. WHEN piyasa sonuçlandırıldığında THEN sistem tüm kazananların ödüllerini hesaplamalı ve claim edilebilir hale getirmelidir
7. IF sonuçlandırma işlemi başarısız olursa THEN sistem hata mesajı göstermeli ve piyasa durumunu değiştirmemelidir

### Requirement 7: Kazanç Çekme (Claim Winnings)

**User Story:** Bir kullanıcı olarak, kazandığım piyasalardan elde ettiğim kazançları çekebilmek istiyorum, böylece ödüllerimi wallet'ıma alabileceğim.

#### Acceptance Criteria

1. WHEN kullanıcı profil sayfasını açtığında THEN sistem kullanıcının çekilebilir kazançlarını göstermelidir
2. WHEN kullanıcının çekilebilir kazancı varsa THEN sistem "Kazancı Çek" butonu göstermelidir
3. WHEN kullanıcı "Kazancı Çek" butonuna tıkladığında THEN sistem çekilecek toplam miktarı onay için göstermelidir
4. WHEN kullanıcı çekme işlemini onayladığında THEN sistem blockchain üzerinde transfer işlemini başlatmalıdır
5. WHEN transfer işlemi başarılı olduğunda THEN sistem kazancı kullanıcının wallet'ına göndermelidir ve veritabanında "çekildi" olarak işaretlemelidir
6. WHEN kazanç çekildiğinde THEN sistem kullanıcıya başarı mesajı ve transaction hash göstermelidir
7. IF çekme işlemi başarısız olursa THEN sistem hata mesajı göstermeli ve kazanç durumunu değiştirmemelidir

### Requirement 8: Kullanıcı Profili ve İstatistikler

**User Story:** Bir kullanıcı olarak, kendi bahis geçmişimi, kazanç/kayıp istatistiklerimi ve aktif bahislerimi görebilmek istiyorum, böylece performansımı takip edebileceğim.

#### Acceptance Criteria

1. WHEN kullanıcı profil sayfasını açtığında THEN sistem kullanıcının Farcaster profil bilgilerini göstermelidir
2. WHEN profil sayfası yüklendiğinde THEN sistem şu istatistikleri göstermelidir: toplam bahis sayısı, kazanılan bahis sayısı, toplam kazanç, toplam kayıp, başarı oranı
3. WHEN kullanıcı "Aktif Bahislerim" sekmesine tıkladığında THEN sistem kullanıcının devam eden piyasalardaki bahislerini listelemelidir
4. WHEN kullanıcı "Geçmiş Bahislerim" sekmesine tıkladığında THEN sistem tamamlanmış piyasalardaki bahisleri ve sonuçlarını göstermelidir
5. WHEN kullanıcı bir bahise tıkladığında THEN sistem o piyasanın detay sayfasına yönlendirmelidir
6. WHEN profil sayfası görüntülendiğinde THEN sistem kullanıcının toplam çekilebilir kazancını belirgin şekilde göstermelidir

### Requirement 9: Gerçek Zamanlı Güncellemeler

**User Story:** Bir kullanıcı olarak, piyasa oranlarının ve bahis miktarlarının gerçek zamanlı olarak güncellenmesini istiyorum, böylece en güncel bilgilerle karar verebileceğim.

#### Acceptance Criteria

1. WHEN bir kullanıcı piyasa detay sayfasındayken THEN sistem oranları ve toplam bahis miktarlarını gerçek zamanlı olarak güncellemelidir
2. WHEN başka bir kullanıcı aynı piyasaya bahis yaptığında THEN sistem tüm aktif kullanıcıların ekranlarında oranları otomatik güncellemelidir
3. WHEN piyasa süresi dolduğunda THEN sistem tüm kullanıcılara piyasanın kapandığını göstermelidir
4. WHEN piyasa sonuçlandırıldığında THEN sistem tüm kullanıcılara sonucu gerçek zamanlı olarak göstermelidir
5. IF bağlantı sorunu oluşursa THEN sistem kullanıcıya uyarı göstermeli ve yeniden bağlanmayı denemelidir

### Requirement 10: Hata Yönetimi ve Kullanıcı Bildirimleri

**User Story:** Bir kullanıcı olarak, işlemlerim sırasında oluşan hataları ve başarılı işlemleri net bir şekilde görebilmek istiyorum, böylece ne olduğunu anlayabileceğim.

#### Acceptance Criteria

1. WHEN blockchain işlemi başarısız olduğunda THEN sistem kullanıcıya anlaşılır bir hata mesajı göstermelidir
2. WHEN blockchain işlemi beklemede olduğunda THEN sistem loading göstergesi ve "İşlem onaylanıyor" mesajı göstermelidir
3. WHEN işlem başarılı olduğunda THEN sistem başarı mesajı ve transaction hash göstermelidir
4. IF kullanıcının wallet'ı bağlı değilse THEN sistem ilgili işlem butonlarını devre dışı bırakmalı ve "Wallet bağlayın" mesajı göstermelidir
5. IF kullanıcının bakiyesi yetersizse THEN sistem işlemi engellemeli ve "Yetersiz bakiye" uyarısı göstermelidir
6. WHEN ağ hatası oluştuğunda THEN sistem kullanıcıya "Bağlantı hatası, lütfen tekrar deneyin" mesajı göstermelidir
7. WHEN kullanıcı geçersiz veri girdiğinde THEN sistem form validasyon hataları göstermelidir

### Requirement 11: Smart Contract Güvenliği ve İşlem Yönetimi

**User Story:** Bir kullanıcı olarak, fonlarımın güvenli bir şekilde yönetildiğinden emin olmak istiyorum, böylece güvenle bahis yapabileceğim.

#### Acceptance Criteria

1. WHEN smart contract deploy edildiğinde THEN contract owner sadece yönetici adresi olmalıdır
2. WHEN bahis yapıldığında THEN fonlar smart contract'a kilitlenmeli ve sadece sonuçlandırma sonrası çekilebilir olmalıdır
3. WHEN piyasa sonuçlandırıldığında THEN sadece piyasa oluşturucusu sonucu belirleyebilmelidir
4. WHEN kazanç çekildiğinde THEN sistem aynı kazancın iki kez çekilmesini engellemeli (reentrancy koruması)
5. IF smart contract'ta kritik bir hata tespit edilirse THEN sistem acil durum modu aktif olmalı ve yeni işlemleri durdurmalıdır
6. WHEN işlem gas ücreti hesaplanırken THEN sistem kullanıcıya tahmini gas ücretini göstermelidir
7. WHEN işlem gönderildiğinde THEN sistem transaction hash'i kaydetmeli ve takip edilebilir hale getirmelidir

### Requirement 12: Piyasa Ücretleri ve Platform Geliri

**User Story:** Platform yöneticisi olarak, her piyasadan küçük bir komisyon alabilmek istiyorum, böylece platformun sürdürülebilirliğini sağlayabileceğim.

#### Acceptance Criteria

1. WHEN piyasa oluşturulduğunda THEN sistem piyasa oluşturma ücreti (örn: 0.001 ETH) talep etmelidir
2. WHEN piyasa sonuçlandırıldığında THEN sistem toplam bahis havuzundan belirli bir yüzde (örn: %2) platform ücreti olarak kesmelidir
3. WHEN platform ücreti kesildiğinde THEN kalan miktar kazananlara dağıtılmalıdır
4. WHEN platform yöneticisi ücret oranlarını değiştirmek istediğinde THEN sadece owner adresi bu işlemi yapabilmelidir
5. IF ücret oranı %5'i geçerse THEN sistem işlemi reddetmelidir (maksimum ücret koruması)
6. WHEN platform ücreti toplandığında THEN sistem bu miktarı ayrı bir havuzda tutmalıdır
7. WHEN platform yöneticisi birikmiş ücretleri çekmek istediğinde THEN sadece owner adresi bu işlemi yapabilmelidir

### Requirement 13: Piyasa İptal ve İtiraz Mekanizması

**User Story:** Bir kullanıcı olarak, hatalı veya yanıltıcı piyasalara itiraz edebilmek istiyorum, böylece adil bir ortamda bahis yapabileceğim.

#### Acceptance Criteria

1. WHEN bir piyasa henüz başlamamışsa ve bahis yoksa THEN piyasa oluşturucusu piyasayı iptal edebilmelidir
2. WHEN piyasa iptal edildiğinde THEN tüm bahisler otomatik olarak iade edilmelidir
3. WHEN kullanıcılar bir piyasaya itiraz etmek istediğinde THEN sistem itiraz formu göstermelidir
4. WHEN itiraz sayısı belirli bir eşiği geçtiğinde (örn: katılımcıların %30'u) THEN piyasa "İnceleme Altında" durumuna geçmelidir
5. IF piyasa inceleme altındaysa THEN sistem yeni bahisleri engellemeli ancak mevcut bahisleri korumalıdır
6. WHEN platform yöneticisi itirazı incelediğinde THEN piyasayı iptal edebilmeli veya devam ettirebilmelidir
7. IF piyasa itiraz sonucu iptal edilirse THEN tüm bahisler tam olarak iade edilmelidir

### Requirement 14: Likidite ve Otomatik Market Maker (AMM)

**User Story:** Bir kullanıcı olarak, her zaman bahis yapabilmek istiyorum, böylece karşı tarafta bahis beklememe gerek kalmasın.

#### Acceptance Criteria

1. WHEN piyasa oluşturulduğunda THEN sistem her seçenek için başlangıç likidite havuzu oluşturmalıdır
2. WHEN kullanıcı bahis yaptığında THEN sistem otomatik olarak oranları yeniden hesaplamalıdır (bonding curve kullanarak)
3. WHEN bir seçeneğe çok fazla bahis yapıldığında THEN o seçeneğin oranı düşmeli, diğer seçeneklerin oranı yükselmemelidir
4. WHEN oranlar hesaplanırken THEN sistem constant product formula (x * y = k) veya benzeri bir algoritma kullanmalıdır
5. IF bir seçeneğin oranı çok düşükse (örn: 1.01) THEN sistem minimum oran sınırını uygulamalıdır
6. WHEN piyasa sonuçlandırıldığında THEN likidite havuzundaki kalan miktar kazananlara orantılı dağıtılmalıdır
7. WHEN kullanıcı bahis yaparken THEN sistem slippage (kayma) miktarını göstermelidir

### Requirement 15: Sosyal Özellikler ve Farcaster Entegrasyonu

**User Story:** Bir Farcaster kullanıcısı olarak, piyasaları Farcaster feed'imde paylaşabilmek ve arkadaşlarımın bahislerini görebilmek istiyorum, böylece sosyal bir deneyim yaşayabileceğim.

#### Acceptance Criteria

1. WHEN kullanıcı bir piyasa oluşturduğunda THEN sistem otomatik olarak Farcaster'da cast (gönderi) paylaşma seçeneği sunmalıdır
2. WHEN piyasa Farcaster'da paylaşıldığında THEN cast içinde piyasa detayları ve direkt bahis yapma linki olmalıdır
3. WHEN kullanıcı bir bahis yaptığında THEN sistem "Bahsimi paylaş" seçeneği göstermelidir
4. WHEN kullanıcı profil sayfasını açtığında THEN Farcaster takipçilerinin aktif bahislerini görebilmelidir
5. WHEN bir piyasa sonuçlandığında THEN kazananlar otomatik olarak başarılarını Farcaster'da paylaşabilmelidir
6. WHEN kullanıcı bir piyasaya yorum yapmak istediğinde THEN sistem Farcaster cast thread'i oluşturmalıdır
7. IF bir piyasa viral olursa (çok sayıda bahis) THEN sistem trending piyasalar bölümünde öne çıkarmalıdır

### Requirement 16: Mobil Responsive Tasarım ve Mini App Optimizasyonu

**User Story:** Bir mobil kullanıcı olarak, uygulamayı Farcaster mobil uygulamasında sorunsuz kullanabilmek istiyorum, böylece her yerden bahis yapabileceğim.

#### Acceptance Criteria

1. WHEN uygulama mobil cihazda açıldığında THEN tüm UI elementleri ekrana uygun şekilde görünmelidir
2. WHEN kullanıcı touch gesture kullandığında THEN sistem swipe, tap ve pinch hareketlerini desteklemelidir
3. WHEN formlar mobilde görüntülendiğinde THEN input alanları dokunmatik klavye için optimize edilmiş olmalıdır
4. WHEN piyasa listesi mobilde görüntülendiğinde THEN kartlar dikey scroll ile kolayca gezinilebilir olmalıdır
5. IF ekran boyutu küçükse THEN sistem gereksiz bilgileri gizlemeli ve önemli aksiyonları öne çıkarmalıdır
6. WHEN wallet bağlantısı mobilde yapıldığında THEN sistem mobil wallet uygulamalarını (Coinbase Wallet, MetaMask Mobile) desteklemelidir
7. WHEN uygulama Farcaster Mini App olarak çalıştığında THEN Farcaster SDK'nın tüm özelliklerini kullanmalıdır

### Requirement 17: Bildirimler ve Hatırlatmalar

**User Story:** Bir kullanıcı olarak, bahis yaptığım piyasalar hakkında bildirim almak istiyorum, böylece önemli gelişmeleri kaçırmayayım.

#### Acceptance Criteria

1. WHEN kullanıcının bahis yaptığı piyasa sonuçlandırıldığında THEN sistem kullanıcıya bildirim göndermelidir
2. WHEN kullanıcının bahis yaptığı piyasanın bitiş süresine 1 saat kaldığında THEN sistem hatırlatma bildirimi göndermelidir
3. WHEN kullanıcı kazanç elde ettiğinde THEN sistem "Kazancınızı çekebilirsiniz" bildirimi göndermelidir
4. WHEN kullanıcının takip ettiği bir piyasada büyük bir bahis yapıldığında THEN sistem bilgilendirme bildirimi göndermelidir
5. IF kullanıcı bildirim ayarlarını değiştirmek isterse THEN sistem bildirim tercihlerini yönetebilme seçeneği sunmalıdır
6. WHEN bildirim gönderildiğinde THEN Farcaster'ın bildirim sistemini kullanmalıdır
7. IF kullanıcı bildirimleri kapattıysa THEN sistem bildirim göndermemelidir

### Requirement 18: Analytics ve Leaderboard

**User Story:** Bir kullanıcı olarak, en başarılı tahmin yapanları görebilmek ve kendi sıralamamı takip edebilmek istiyorum, böylece rekabetçi bir ortamda bulunabileceğim.

#### Acceptance Criteria

1. WHEN kullanıcı leaderboard sayfasını açtığında THEN sistem en yüksek kazanç elde eden kullanıcıları listelemelidir
2. WHEN leaderboard görüntülendiğinde THEN kullanıcılar için şu metrikler gösterilmelidir: toplam kazanç, başarı oranı, toplam bahis sayısı, sıralama
3. WHEN kullanıcı farklı zaman aralıkları seçtiğinde THEN sistem günlük, haftalık, aylık ve tüm zamanlar için leaderboard göstermelidir
4. WHEN kullanıcı kendi profilini açtığında THEN genel sıralamadaki yerini görebilmelidir
5. WHEN bir kullanıcı leaderboard'da ilk 10'a girdiğinde THEN özel bir rozet veya badge almalıdır
6. WHEN platform yöneticisi analytics sayfasını açtığında THEN toplam işlem hacmi, aktif kullanıcı sayısı, oluşturulan piyasa sayısı gibi metrikleri görebilmelidir
7. IF bir kullanıcı sürekli başarılı tahminler yapıyorsa THEN sistem "Uzman Tahminçi" gibi özel unvanlar vermelidir

### Requirement 19: Developer Experience ve Proje Setup

**User Story:** Bir geliştirici olarak, projeyi hızlıca kurabilmek ve çalıştırabilmek istiyorum, böylece development'a hemen başlayabileceğim.

#### Acceptance Criteria

1. WHEN geliştirici projeyi clone ettiğinde THEN README.md dosyası tüm setup adımlarını net bir şekilde içermelidir
2. WHEN geliştirici .env.example dosyasını kopyaladığında THEN tüm gerekli environment variable'lar açıklamalı ve örnek değerlerle birlikte olmalıdır
3. WHEN geliştirici npm install çalıştırdığında THEN tüm dependency'ler hatasız kurulmalıdır
4. WHEN geliştirici local database setup yapmak istediğinde THEN Docker komutları hazır ve dokümante edilmiş olmalıdır
5. WHEN geliştirici Prisma migration çalıştırdığında THEN database schema otomatik oluşturulmalıdır
6. WHEN geliştirici npm run dev çalıştırdığında THEN frontend ve backend servisleri başlamalıdır
7. WHEN geliştirici smart contract test etmek istediğinde THEN Hardhat test komutları çalışır durumda olmalıdır
8. IF geliştirici external service API key'leri almak isterse THEN dokümantasyon her servis için adım adım talimatlar içermelidir
