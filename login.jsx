import { useState } from "react";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.616z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" />
    </svg>
  );
}

// 색상 팔레트 (Tailwind 임의값 클래스 대신 inline style로 적용)
const colors = {
  bg: "#F7F8F2",
  title: "#173C2D",
  subtext: "#9B968A",
  green: "#2D6A4F",
  greenHover: "#255a42",
  noticeBg: "#E8F5E9",
  noticeText: "#5B7A63",
  border: "#F1F1EC",
};

function LoginScreen({ email, setEmail, password, setPassword, onSubmit }) {
  return (
    <div
      className="w-full max-w-[390px] min-h-[844px] flex flex-col justify-center px-6 py-10"
      style={{ backgroundColor: colors.bg }}
    >
      {/* 타이틀 및 설명 */}
      <div className="mb-8">
        <h1
          className="text-2xl font-extrabold leading-snug"
          style={{ color: colors.title }}
        >
          기록을 안전하게<br />보관해요
        </h1>
        <p className="text-sm mt-2" style={{ color: colors.subtext }}>
          로그인하면 휴대폰을 바꿔도 도감과 레벨이 유지됩니다.
        </p>
      </div>

      {/* 입력 폼 */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="이메일 주소"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-14 px-5 rounded-2xl bg-white shadow-sm text-sm focus:outline-none"
          style={{ border: `1px solid ${colors.border}` }}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full h-14 px-5 rounded-2xl bg-white shadow-sm text-sm focus:outline-none"
          style={{ border: `1px solid ${colors.border}` }}
        />

        <button
          type="button"
          onClick={onSubmit}
          className="w-full h-14 mt-4 rounded-2xl text-white font-semibold text-sm shadow-sm transition-colors"
          style={{ backgroundColor: colors.green }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.greenHover)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.green)}
        >
          이메일로 로그인
        </button>
      </div>

      {/* 구분선 */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">또는</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* 구글 로그인 버튼 */}
      <button
        type="button"
        className="w-full h-14 rounded-full bg-white border border-gray-200 text-sm font-semibold shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center"
        style={{ color: colors.green }}
      >
        Google로 계속하기
      </button>

      {/* 회원가입 링크 */}
      <p className="text-center text-xs mt-6" style={{ color: colors.subtext }}>
        아직 계정이 없나요?{" "}
        <span className="font-semibold" style={{ color: colors.green }}>
          회원가입
        </span>
      </p>

      {/* 하단 안내 박스 */}
      <div className="mt-8 rounded-2xl px-5 py-4" style={{ backgroundColor: colors.noticeBg }}>
        <p className="text-[11px] leading-relaxed" style={{ color: colors.noticeText }}>
          사진과 관찰 기록은 본인 계정에 저장되며, 위치 정보는 사용자의 동의 없이 수집하지 않습니다.
        </p>
      </div>
    </div>
  );
}

function HomeScreen() {
  const recentItems = [
    { emoji: "🌼", name: "민들레", rarity: "흔함" },
    { emoji: "🍀", name: "토끼풀", rarity: "흔함" },
    { emoji: "🌸", name: "산철쭉", rarity: "보통" },
  ];

  const navItems = ["홈", "도감", "수집", "프로필"];
  const darkGreen = "#1F4E3D";

  return (
    <div
      className="w-full max-w-[390px] min-h-[844px] flex flex-col px-5 pt-8 pb-4"
      style={{ backgroundColor: colors.bg }}
    >
      {/* 인사말 */}
      <div className="mb-5">
        <h1 className="text-xl font-extrabold" style={{ color: colors.title }}>
          안녕하세요, 홍길동님
        </h1>
        <p className="text-sm mt-1" style={{ color: colors.subtext }}>
          오늘도 새로운 초록을 만나볼까요?
        </p>
      </div>

      {/* 레벨 카드 */}
      <div className="rounded-3xl px-5 py-5 mb-4" style={{ backgroundColor: darkGreen }}>
        <span
          className="inline-block text-white text-xs font-medium px-3 py-1 rounded-full mb-3"
          style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
        >
          Lv. 3 새싹 관찰자
        </span>
        <p className="text-white font-bold text-lg mb-3">다음 레벨까지 180 XP</p>
        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
        >
          <div className="h-full rounded-full" style={{ width: "55%", backgroundColor: "#A8E063" }} />
        </div>
      </div>

      {/* 촬영 유도 카드 */}
      <div
        className="rounded-3xl px-5 py-5 mb-6 flex items-center justify-between"
        style={{ backgroundColor: darkGreen }}
      >
        <p className="text-white font-bold text-base leading-snug">
          지금 보이는 식물을<br />카드로 남겨보세요
        </p>
        <button
          type="button"
          className="shrink-0 text-sm font-semibold px-4 py-2.5 rounded-full whitespace-nowrap"
          style={{ backgroundColor: "#F4D35E", color: colors.title }}
        >
          촬영하기
        </button>
      </div>

      {/* 최근 수집 */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-base" style={{ color: colors.title }}>
          최근 수집
        </h2>
        <span className="text-xs" style={{ color: colors.subtext }}>
          전체 보기
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {recentItems.map((item) => (
          <div key={item.name}>
            <div
              className="aspect-square rounded-2xl flex items-center justify-center text-4xl mb-2"
              style={{ backgroundColor: "#DCEFD8" }}
            >
              {item.emoji}
            </div>
            <p className="text-sm font-semibold" style={{ color: colors.title }}>
              {item.name}
            </p>
            <p className="text-xs" style={{ color: colors.subtext }}>
              {item.rarity}
            </p>
          </div>
        ))}
      </div>

      {/* 촬영 팁 */}
      <div className="rounded-2xl px-5 py-4 mb-6" style={{ backgroundColor: colors.noticeBg }}>
        <p className="text-sm font-bold mb-1" style={{ color: colors.title }}>
          촬영 팁
        </p>
        <p className="text-xs leading-relaxed" style={{ color: colors.noticeText }}>
          식물 잎이나 꽃이 화면 중앙에 오면 더 잘 찾아요.
        </p>
      </div>

      {/* 하단 네비게이션 */}
      <div className="mt-auto flex items-center justify-between bg-white rounded-2xl px-3 py-3 shadow-sm">
        {navItems.map((label) => (
          <div key={label} className="flex-1 flex flex-col items-center gap-1">
            {label === "홈" ? (
              <div
                className="text-xs font-semibold px-4 py-1.5 rounded-full"
                style={{ backgroundColor: colors.noticeBg, color: colors.green }}
              >
                {label}
              </div>
            ) : (
              <span className="text-xs" style={{ color: colors.subtext }}>
                {label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (email.trim() && password.trim()) {
      setScreen("home");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: colors.bg }}
    >
      {screen === "login" ? (
        <LoginScreen
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          onSubmit={handleSubmit}
        />
      ) : (
        <HomeScreen />
      )}
    </div>
  );
}
