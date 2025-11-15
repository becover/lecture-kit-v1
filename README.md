# 강의 유틸리티 킷 (Lecture Utility Kit)

강의에 필요한 다양한 도구들을 한 곳에서 관리할 수 있는 웹 기반 대시보드입니다.

**🌐 배포 사이트:** [https://kit.mylecture.kr](https://kit.mylecture.kr)

## 주요 기능

### 🎨 테마 시스템
- 4가지 테마 프리셋 (기본, 다크 프리미엄, 미니멀, 프로페셔널)
- 실시간 테마 전환
- 모든 페이지 일관된 디자인
- localStorage 자동 저장

### 🍅 수업 시간표 알림
- 시간대별 알림 설정 (최대 10개)
- 브라우저 알림 지원
- 서버 시간 동기화 (timeapi.io)
- 자정 자동 초기화

### ⏱ 수업 타이머
- 커스터마이즈 가능한 타이머
- 사전 설정된 시간 프리셋 (발표, 토론, 퀴즈 등)
- 브라우저 알림 지원
- 타이머 이름 설정 기능

### 📸 스크린샷 타임
- 설정된 시간에 자동으로 60초 카운트다운 시작
- 30초 전 알림음 및 브라우저 알림
- 10초부터 매초마다 알림음 제공
- 자동 파일명 생성 (YY-MM-DD-HH-MM 형식)
- 중복 파일명 자동 처리 (1), (2), (3)...
- 저장 폴더 선택 (Chrome/Edge 지원)
- 파일명 프리픽스 기능
- 얼굴 인식 기능 (SSD MobileNet 모델)
  - 얼굴 크기 및 위치 자동 분석
  - 화면 가장자리 잘림 감지
  - 운영진/운영/KDT/오르미 화면 자동 스킵
- OCR 기반 이름 인식 (옵션)
- 얼굴 인식 테스트 기능
- 서버 시간 동기화로 정확한 시간 관리

## 기술 스택

- **Frontend Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Routing**: React Router v6
- **Face Detection**: @vladmandic/face-api (SSD MobileNet)
- **OCR**: Tesseract.js

## 시작하기

### 개발 환경 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

개발 서버는 기본적으로 `http://localhost:5173`에서 실행됩니다.

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

### 배포

자세한 배포 가이드는 [DEPLOY.md](./DEPLOY.md)를 참고하세요.

**간단 요약:**
- GitHub Actions를 통한 자동 배포 지원
- main 브랜치에 푸시하면 자동으로 빌드 & 배포
- Nginx + Cloudflare 조합 사용
- HTTPS 자동 적용

## 프로젝트 구조

```
lecture-kit-v1/
├── src/
│   ├── components/       # 재사용 가능한 컴포넌트
│   │   ├── Layout.tsx   # 전체 레이아웃 (헤더, 푸터, 테마 선택)
│   │   └── Card.tsx     # 대시보드 카드
│   ├── context/         # React Context
│   │   └── ThemeContext.tsx  # 전역 테마 관리
│   ├── pages/           # 페이지 컴포넌트
│   │   ├── Dashboard.tsx
│   │   ├── Pomodoro.tsx      # 수업 시간표 알림
│   │   ├── Timer.tsx
│   │   ├── ScreenshotTime.tsx
│   │   ├── Survey.tsx
│   │   └── Upload.tsx
│   ├── App.tsx          # 라우팅 설정
│   ├── main.tsx         # 앱 진입점
│   └── index.css        # 전역 스타일
├── public/              # 정적 파일
├── .github/workflows/   # GitHub Actions
│   └── deploy.yml       # 자동 배포 워크플로우
├── nginx.conf           # Nginx 서버 설정
├── DEPLOY.md            # 배포 가이드
└── package.json         # 프로젝트 설정
```

## 사용 시나리오

### 수업 시작 전
1. **뽀모도로 타이머** 활성화
2. **스크린샷 타임** 설정:
   - 저장 폴더 선택 (선택사항)
   - 파일명 프리픽스 설정 (선택사항)
   - 얼굴 인식 활성화 (선택사항)
   - 시간대 확인 및 조정
3. **스크린샷 타임** 테스트로 얼굴 인식 정확도 확인

### 수업 중
1. **뽀모도로 타이머**로 집중 학습 시간 관리
2. **스크린샷 타임**으로 매 시간별 자동 스크린샷 촬영
   - 설정된 시간 60초 전 자동 카운트다운 시작
   - 30초 전 알림음 및 브라우저 알림
   - 10초부터 매초마다 알림음
   - 자동으로 스크린샷 촬영 및 저장

## 향후 개발 계획
- [x] 테마 시스템 (4가지 프리셋)
- [x] 수업 시간표 알림 기능
- [x] 스크린샷 타임 기능
- [x] 얼굴 인식 기능
- [x] OCR 기반 이름 인식
- [x] GitHub Actions 자동 배포
- [ ] 모바일 반응형 개선
- [ ] PWA (Progressive Web App) 지원
- [ ] Electron 데스크톱 앱 (필요시)

## 라이선스

MIT License

## 기여하기

이슈나 PR은 언제든 환영합니다!

---

Made with ❤️ for educators
