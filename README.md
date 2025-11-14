# 강의 유틸리티 킷 (Lecture Utility Kit)

강의에 필요한 다양한 도구들을 한 곳에서 관리할 수 있는 웹 기반 대시보드입니다.

## 주요 기능

### 📋 출석 체크
- 학생 출석 관리
- 출석/지각/결석 상태 구분
- 실시간 통계 확인
- 학생 추가/삭제 기능

### 🍅 뽀모도로 타이머
- 25분 집중 + 5분 휴식 사이클
- 4회 반복 후 15분 긴 휴식
- 완료한 뽀모도로 카운트 추적
- 시각적 진행 상태 표시

### ⏱ 수업 타이머
- 커스터마이즈 가능한 타이머
- 사전 설정된 시간 프리셋 (발표, 토론, 퀴즈 등)
- 브라우저 알림 지원
- 타이머 이름 설정 기능

### 📊 실시간 설문
- 실시간 설문 생성 및 관리
- 다중 선택지 지원 (최대 10개)
- 실시간 투표 결과 시각화
- 설문 활성화/비활성화 기능

### 📁 강의 자료 관리
- 드래그 앤 드롭 파일 업로드
- 카테고리별 파일 분류
- 파일 타입별 아이콘 표시
- 파일 다운로드 및 삭제 기능

## 기술 스택

- **Frontend Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Routing**: React Router v6
- **Deployment**: Vercel / Netlify

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

## 배포하기

### Vercel 배포

1. GitHub 저장소에 코드 푸시
2. [Vercel](https://vercel.com)에 로그인
3. "New Project" 클릭
4. GitHub 저장소 선택
5. 자동으로 배포 설정 감지 및 배포

또는 Vercel CLI 사용:
```bash
npm install -g vercel
vercel
```

### Netlify 배포

1. GitHub 저장소에 코드 푸시
2. [Netlify](https://netlify.com)에 로그인
3. "Add new site" → "Import an existing project"
4. GitHub 저장소 선택
5. 자동으로 배포 설정 감지 및 배포

또는 Netlify CLI 사용:
```bash
npm install -g netlify-cli
netlify deploy --prod
```

## 프로젝트 구조

```
lecture-kit-v1/
├── src/
│   ├── components/       # 재사용 가능한 컴포넌트
│   │   ├── Layout.tsx   # 전체 레이아웃
│   │   └── Card.tsx     # 대시보드 카드
│   ├── pages/           # 페이지 컴포넌트
│   │   ├── Dashboard.tsx
│   │   ├── Attendance.tsx
│   │   ├── Pomodoro.tsx
│   │   ├── Timer.tsx
│   │   ├── Survey.tsx
│   │   └── Upload.tsx
│   ├── App.tsx          # 라우팅 설정
│   ├── main.tsx         # 앱 진입점
│   └── index.css        # 전역 스타일
├── public/              # 정적 파일
├── vercel.json          # Vercel 배포 설정
├── netlify.toml         # Netlify 배포 설정
└── package.json         # 프로젝트 설정
```

## 사용 시나리오

### 수업 시작 전
1. **출석 체크**로 학생들의 출석 확인
2. **수업 타이머**로 각 활동별 시간 설정

### 수업 중
1. **뽀모도로 타이머**로 집중 학습 시간 관리
2. **설문 조사**로 실시간 이해도 확인
3. **수업 타이머**로 발표/토론 시간 관리

### 수업 후
1. **자료 업로드**로 강의 자료 공유
2. **설문 조사** 결과 분석

## 향후 개발 계획

- [ ] 데이터 영구 저장 (LocalStorage/Backend)
- [ ] 출석 데이터 엑셀 내보내기
- [ ] 설문 결과 통계 및 차트
- [ ] 다크 모드 지원
- [ ] 모바일 반응형 개선
- [ ] 다국어 지원
- [ ] PWA (Progressive Web App) 지원

## 라이선스

MIT License

## 기여하기

이슈나 PR은 언제든 환영합니다!

---

Made with ❤️ for educators
