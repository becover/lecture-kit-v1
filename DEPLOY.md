# 배포 가이드 - kit.mylecture.kr

## 자동 배포 (GitHub Actions) 🚀

main 브랜치에 푸시하면 자동으로 빌드하고 서버에 배포됩니다.

### GitHub Secrets 설정

GitHub 저장소 → Settings → Secrets and variables → Actions → New repository secret

다음 4개의 Secret을 추가하세요:

1. **SSH_PRIVATE_KEY**: SSH 개인 키 내용
   ```bash
   # 로컬에서 확인 (예: ~/.ssh/id_rsa 또는 ~/.ssh/id_ed25519)
   cat ~/.ssh/id_rsa
   ```
   전체 내용을 복사해서 붙여넣기 (-----BEGIN ... END----- 포함)

2. **REMOTE_HOST**: 서버 IP 주소 또는 도메인
   ```
   예: 123.456.789.0 또는 server.example.com
   ```

3. **REMOTE_USER**: SSH 접속 유저명
   ```
   예: ubuntu 또는 root 또는 your-username
   ```

4. **REMOTE_TARGET**: 서버의 배포 경로
   ```
   /workspace/project/lecture-kit
   ```

### SSH 키 설정 (처음 한 번만)

서버에 SSH 키가 등록되어 있어야 합니다:

```bash
# 로컬에서 실행
ssh-copy-id user@your-server

# 또는 수동으로 서버의 ~/.ssh/authorized_keys에 공개키 추가
```

### 배포 방법

```bash
git push origin main
```

이제 GitHub Actions가 자동으로:
1. 코드 체크아웃
2. 의존성 설치
3. 빌드 (npm run build)
4. 서버에 배포 (rsync)

---

## 수동 배포 (대안)

GitHub Actions를 사용하지 않고 수동으로 배포하려면:

### 1. 빌드

```bash
npm run build
```

`dist` 폴더가 생성됩니다.

## 2. 서버에 파일 업로드

```bash
# 로컬에서 서버로 dist 폴더 전송
scp -r dist/* user@your-server:/workspace/project/lecture-kit/

# 또는 rsync 사용 (더 효율적)
rsync -avz --delete dist/ user@your-server:/workspace/project/lecture-kit/
```

## 3. 서버에서 권한 설정

```bash
# 서버에 SSH 접속 후
sudo chown -R www-data:www-data /workspace/project/lecture-kit
sudo chmod -R 755 /workspace/project/lecture-kit
```

## 4. Nginx 설정

```bash
# nginx.conf 파일을 서버에 복사
sudo cp nginx.conf /etc/nginx/sites-available/lecture-kit

# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/lecture-kit /etc/nginx/sites-enabled/

# Nginx 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl reload nginx
```

## 5. Cloudflare DNS 설정

Cloudflare 대시보드에서:

1. **DNS** 탭으로 이동
2. **Add record** 클릭
3. 다음과 같이 설정:
   - Type: `A`
   - Name: `kit`
   - IPv4 address: `서버 IP 주소`
   - Proxy status: **Proxied** (주황색 구름 아이콘) ← 이게 켜져 있으면 자동 HTTPS
   - TTL: Auto

4. **Save** 클릭

## 6. SSL 설정 (선택사항)

### 방법 1: Cloudflare SSL (권장, 자동)

Cloudflare에서 Proxy가 켜져 있으면 자동으로 HTTPS가 활성화됩니다.

**Cloudflare 대시보드 설정:**
- SSL/TLS 탭 → **Full** 또는 **Full (strict)** 모드 선택

### 방법 2: Let's Encrypt (직접 설정)

```bash
# Certbot 설치 (Ubuntu/Debian)
sudo apt install certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d kit.mylecture.kr

# 자동 갱신 설정 (이미 되어 있을 수 있음)
sudo systemctl enable certbot.timer
```

## 7. 확인

브라우저에서 https://kit.mylecture.kr 접속하여 확인

## 업데이트 배포 스크립트 (선택사항)

`deploy.sh` 파일을 만들어 두면 편합니다:

```bash
#!/bin/bash
npm run build
rsync -avz --delete dist/ user@your-server:/workspace/project/lecture-kit/
echo "✅ 배포 완료!"
```

사용:
```bash
chmod +x deploy.sh
./deploy.sh
```

## 문제 해결

### 404 에러 발생 시
- Nginx에서 `try_files $uri $uri/ /index.html;` 설정 확인
- React Router가 제대로 작동하려면 필수

### CORS 에러 발생 시
- API 서버가 별도로 있다면 Nginx에 프록시 설정 추가 필요

### 캐시 문제
- Cloudflare에서 캐시 퍼지 (Purge Cache)
- 브라우저 강력 새로고침 (Ctrl+Shift+R)
