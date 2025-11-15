# 배포 가이드 - kit.mylecture.kr

완전한 배포 가이드입니다. 순서대로 따라하세요.

---

## 📋 사전 준비

- ✅ 서버 SSH 접속 가능
- ✅ 서버에 Nginx 설치됨
- ✅ Cloudflare 계정 및 mylecture.kr 도메인 등록됨
- ✅ GitHub 저장소 접근 권한

---

## 🚀 배포 순서

### 1단계: 서버 초기 설정

#### 1-1. SSH로 서버 접속
```bash
ssh your-username@your-server-ip
```

#### 1-2. 배포 디렉토리 생성
```bash
# 프로젝트 디렉토리 생성
sudo mkdir -p /workspace/project/lecture-kit

# 현재 사용자에게 소유권 부여 (GitHub Actions에서 파일 쓰기 위해 필요)
sudo chown -R $USER:$USER /workspace/project/lecture-kit

# 권한 설정 (755 = 소유자:rwx, 그룹:rx, 기타:rx)
sudo chmod -R 755 /workspace/project/lecture-kit

# 확인
ls -la /workspace/project/
```

#### 1-3. Nginx 사용자가 읽을 수 있도록 추가 권한 설정
```bash
# Nginx가 www-data 사용자로 실행되는 경우
sudo usermod -a -G $USER www-data

# 또는 직접 www-data 그룹으로 설정
sudo chown -R $USER:www-data /workspace/project/lecture-kit
```

---

### 2단계: Nginx 설정

#### 2-1. nginx.conf 파일을 서버로 전송

**로컬 터미널에서:**
```bash
scp nginx.conf your-username@your-server-ip:/tmp/lecture-kit.conf
```

#### 2-2. Nginx 설정 파일 적용

**서버에서:**
```bash
# sites-available에 복사
sudo cp /tmp/lecture-kit.conf /etc/nginx/sites-available/lecture-kit

# sites-enabled에 심볼릭 링크 생성 (활성화)
sudo ln -s /etc/nginx/sites-available/lecture-kit /etc/nginx/sites-enabled/

# 기존 default 사이트와 충돌하지 않는지 확인
ls -la /etc/nginx/sites-enabled/

# 설정 파일 문법 검사
sudo nginx -t
```

**출력 예시 (성공):**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

#### 2-3. Nginx 재시작
```bash
# 설정 리로드 (다운타임 없음)
sudo systemctl reload nginx

# 또는 완전 재시작 (필요시)
sudo systemctl restart nginx

# Nginx 상태 확인
sudo systemctl status nginx
```

---

### 3단계: Cloudflare DNS 설정

#### 3-1. Cloudflare 대시보드 접속
1. https://dash.cloudflare.com/ 로그인
2. **mylecture.kr** 도메인 클릭

#### 3-2. DNS 레코드 추가
1. 왼쪽 메뉴에서 **DNS** → **Records** 클릭
2. **Add record** 버튼 클릭
3. 다음과 같이 입력:

   | 항목 | 값 |
   |------|-----|
   | Type | `A` |
   | Name | `kit` |
   | IPv4 address | `서버 IP 주소` (예: 123.456.789.0) |
   | Proxy status | 🟠 **Proxied** (주황색 구름 켜짐) |
   | TTL | Auto |

4. **Save** 클릭

#### 3-3. SSL/TLS 설정
1. 왼쪽 메뉴에서 **SSL/TLS** → **Overview** 클릭
2. 암호화 모드를 **Full** 또는 **Full (strict)** 로 설정
   - **Full**: Cloudflare ↔ 서버 간 암호화 (자체 서명 인증서 허용)
   - **Full (strict)**: 유효한 SSL 인증서 필요 (Let's Encrypt 사용 시)

**권장: Full 모드** (Cloudflare가 자동으로 HTTPS 처리)

#### 3-4. DNS 전파 확인 (1~5분 소요)
```bash
# 로컬에서 확인
nslookup kit.mylecture.kr

# 또는
dig kit.mylecture.kr
```

**올바른 IP가 나오면 성공!**

---

### 4단계: GitHub Secrets 설정

#### 4-1. SSH 키 확인

**로컬 터미널에서:**
```bash
# SSH 개인 키 내용 확인
cat ~/.ssh/id_rsa

# 또는 ed25519 키 사용 시
cat ~/.ssh/id_ed25519
```

**출력 예시:**
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtz...
...
-----END OPENSSH PRIVATE KEY-----
```

**⚠️ 전체 내용을 복사** (-----BEGIN부터 -----END까지 모두)

#### 4-2. SSH 키가 서버에 등록되어 있는지 확인
```bash
ssh your-username@your-server-ip "echo 'SSH 연결 성공!'"
```

성공하면 "SSH 연결 성공!" 메시지가 나옵니다.

**실패하면:**
```bash
# 공개 키를 서버에 등록
ssh-copy-id your-username@your-server-ip

# 수동으로 등록 (위 명령어가 안 되면)
cat ~/.ssh/id_rsa.pub | ssh your-username@your-server-ip "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

#### 4-3. GitHub Secrets 등록

1. GitHub 저장소로 이동
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **Secrets and variables** → **Actions** 클릭
4. **New repository secret** 버튼 클릭

**다음 4개의 Secret을 각각 추가:**

| Name | Value | 예시 |
|------|-------|------|
| `SSH_PRIVATE_KEY` | SSH 개인 키 전체 내용 | -----BEGIN OPENSSH... |
| `REMOTE_HOST` | 서버 IP 또는 도메인 | 123.456.789.0 |
| `REMOTE_USER` | SSH 접속 유저명 | ubuntu 또는 your-username |
| `REMOTE_TARGET` | 배포 경로 | /workspace/project/lecture-kit |

**⚠️ 주의:**
- `SSH_PRIVATE_KEY`는 **개인 키** (id_rsa)를 넣어야 합니다. 공개 키(id_rsa.pub) 아님!
- 전체 내용을 복사해야 합니다 (-----BEGIN부터 -----END까지)

---

### 5단계: 자동 배포 테스트

#### 5-1. main 브랜치에 푸시
```bash
# 현재 브랜치 확인
git branch

# main으로 체크아웃 (필요시)
git checkout main

# 최신 코드 pull
git pull origin main

# 변경사항이 있다면 커밋
git add .
git commit -m "배포 테스트"

# main에 푸시 → 자동 배포 시작!
git push origin main
```

#### 5-2. GitHub Actions 진행 상황 확인

1. GitHub 저장소로 이동
2. **Actions** 탭 클릭
3. 가장 최근 워크플로우 클릭
4. 빌드 및 배포 로그 확인

**성공 시:**
```
✅ Checkout code
✅ Setup Node.js
✅ Install dependencies
✅ Build
✅ Deploy to server via SSH
```

**실패 시:**
- 빨간색 X 표시된 단계 클릭
- 에러 메시지 확인 후 아래 트러블슈팅 참고

#### 5-3. 서버에서 파일 확인
```bash
# 서버 SSH 접속
ssh your-username@your-server-ip

# 배포된 파일 확인
ls -la /workspace/project/lecture-kit/

# index.html이 있어야 함
cat /workspace/project/lecture-kit/index.html
```

**있어야 할 파일들:**
```
index.html
assets/
  ├── index-XXXXX.js
  ├── index-XXXXX.css
  └── ...
```

---

### 6단계: 배포 확인

#### 6-1. 브라우저에서 접속
```
https://kit.mylecture.kr
```

**체크리스트:**
- ✅ HTTPS로 접속되는가? (자물쇠 아이콘)
- ✅ 페이지가 정상적으로 로드되는가?
- ✅ 모든 기능이 작동하는가?
- ✅ 브라우저 콘솔에 에러가 없는가? (F12)

#### 6-2. 다양한 페이지 테스트
- 대시보드: https://kit.mylecture.kr/
- 스크린샷: https://kit.mylecture.kr/screenshot
- Pomodoro: https://kit.mylecture.kr/pomodoro
- Timer: https://kit.mylecture.kr/timer

**⚠️ 404 에러 발생 시:**
- Nginx 설정에서 `try_files $uri $uri/ /index.html;` 확인
- React Router (SPA)를 위해 필수 설정

---

## 🔧 트러블슈팅

### 문제 1: GitHub Actions에서 SSH 연결 실패
```
Permission denied (publickey)
```

**해결책:**
1. `SSH_PRIVATE_KEY` Secret이 올바른지 확인 (개인 키 전체 내용)
2. 서버의 `~/.ssh/authorized_keys`에 공개 키가 등록되어 있는지 확인
3. SSH 키 권한 확인:
   ```bash
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   ```

### 문제 2: Nginx 404 Not Found
```
nginx/1.x.x 404 Not Found
```

**해결책:**
1. 파일이 올바른 위치에 있는지 확인:
   ```bash
   ls -la /workspace/project/lecture-kit/
   ```
2. Nginx 설정에서 `root` 경로 확인:
   ```bash
   sudo cat /etc/nginx/sites-available/lecture-kit | grep root
   ```
3. Nginx 에러 로그 확인:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

### 문제 3: 403 Forbidden
```
nginx/1.x.x 403 Forbidden
```

**해결책:**
1. 권한 확인:
   ```bash
   ls -la /workspace/project/lecture-kit/
   ```
2. Nginx 사용자가 파일을 읽을 수 있도록 설정:
   ```bash
   sudo chmod -R 755 /workspace/project/lecture-kit
   sudo chown -R $USER:www-data /workspace/project/lecture-kit
   ```

### 문제 4: React Router 페이지 새로고침 시 404
```
/pomodoro 페이지에서 새로고침하면 404
```

**해결책:**
Nginx 설정에 `try_files` 추가 (이미 포함되어 있어야 함):
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 문제 5: SSL/HTTPS 문제
```
Your connection is not private
```

**해결책:**
1. Cloudflare SSL/TLS 모드를 **Full**로 변경
2. 또는 서버에 Let's Encrypt 인증서 발급:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d kit.mylecture.kr
   ```

### 문제 6: 배포 후 변경사항이 안 보임
```
코드를 수정했는데 사이트에 반영 안 됨
```

**해결책:**
1. Cloudflare 캐시 퍼지:
   - Cloudflare 대시보드 → **Caching** → **Purge Everything**
2. 브라우저 강력 새로고침:
   - Chrome/Edge: `Ctrl + Shift + R` (Mac: `Cmd + Shift + R`)
   - Firefox: `Ctrl + F5`
3. 시크릿 모드로 테스트

---

## 📊 로그 확인

### Nginx 로그
```bash
# 접속 로그
sudo tail -f /var/log/nginx/access.log

# 에러 로그
sudo tail -f /var/log/nginx/error.log

# 특정 도메인 필터링
sudo tail -f /var/log/nginx/access.log | grep kit.mylecture.kr
```

### GitHub Actions 로그
1. GitHub 저장소 → **Actions** 탭
2. 워크플로우 클릭
3. 각 단계별 로그 확인

---

## 🔄 업데이트 배포

코드 수정 후 배포하는 방법:

```bash
# 1. 코드 수정
# (파일 수정...)

# 2. 커밋
git add .
git commit -m "기능 추가/수정"

# 3. main 브랜치에 푸시 → 자동 배포!
git push origin main
```

**GitHub Actions가 자동으로:**
1. 코드 체크아웃
2. 의존성 설치
3. 빌드 (`npm run build`)
4. 서버에 rsync로 배포
5. 완료!

**배포 시간:** 약 2~3분

---

## 🛠 수동 배포 (대안)

GitHub Actions를 사용하지 않고 수동으로 배포하려면:

```bash
# 1. 로컬에서 빌드
npm run build

# 2. 서버로 전송
rsync -avz --delete dist/ your-username@your-server-ip:/workspace/project/lecture-kit/

# 또는 scp 사용
scp -r dist/* your-username@your-server-ip:/workspace/project/lecture-kit/
```

### 배포 스크립트 만들기

`deploy.sh` 파일 생성:
```bash
#!/bin/bash

echo "🔨 빌드 중..."
npm run build

echo "📤 서버에 업로드 중..."
rsync -avz --delete dist/ your-username@your-server-ip:/workspace/project/lecture-kit/

echo "✅ 배포 완료!"
echo "🌐 https://kit.mylecture.kr"
```

사용:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 📝 체크리스트

배포 전 확인사항:

### 서버 설정
- [ ] `/workspace/project/lecture-kit` 디렉토리 생성
- [ ] 디렉토리 권한 설정 (755)
- [ ] Nginx 설정 파일 적용
- [ ] Nginx 설정 테스트 통과 (`nginx -t`)
- [ ] Nginx 재시작 완료

### DNS 설정
- [ ] Cloudflare A 레코드 추가 (kit → 서버 IP)
- [ ] Proxy 상태 활성화 (주황색 구름)
- [ ] SSL/TLS 모드 Full 설정
- [ ] DNS 전파 확인 (`nslookup kit.mylecture.kr`)

### GitHub 설정
- [ ] SSH_PRIVATE_KEY Secret 등록
- [ ] REMOTE_HOST Secret 등록
- [ ] REMOTE_USER Secret 등록
- [ ] REMOTE_TARGET Secret 등록
- [ ] SSH 키 서버 등록 확인

### 배포 확인
- [ ] main 브랜치 푸시
- [ ] GitHub Actions 성공
- [ ] https://kit.mylecture.kr 접속 성공
- [ ] 모든 페이지 정상 작동
- [ ] 브라우저 콘솔 에러 없음

---

## 🎉 완료!

이제 main 브랜치에 푸시할 때마다 자동으로 배포됩니다.

**배포 사이트:** https://kit.mylecture.kr

**문제 발생 시:**
1. 위 트러블슈팅 섹션 확인
2. GitHub Issues에 버그 제보: https://github.com/becover/lecture-kit-v1/issues
