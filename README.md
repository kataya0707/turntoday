# 오늘차례

오늘 집 일은 누구 차례인지 한 화면. 당번, 장보기, 공평 기록.

## Vercel에 올리기

1. [vercel.com](https://vercel.com) → Continue with GitHub
2. **Import** this repository (`turntoday`)
3. **Environment Variables** (화면을 아래로 내려 펼치기):

| Name | Value |
|---|---|
| `DATABASE_URL` | Neon pooled connection string (`-pooler` 포함) |
| `BETTER_AUTH_SECRET` | 긴 무작위 문자열 (예: `openssl rand -hex 32`) |
| `BETTER_AUTH_URL` | 배포 후 주소, 예: `https://turntoday.vercel.app` |
| `VITE_AUTH_ENABLED` | `true` |

4. **Deploy**

연결 문자열과 비밀값은 GitHub에 넣지 마세요. Vercel Environment Variables에만 넣습니다.

## 로컬

```bash
npm install
cp .env.example .env   # DATABASE_URL 만 넣기
npm run dev
```
