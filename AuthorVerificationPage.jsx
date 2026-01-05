import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { verifyPhoneNumber } from "../api/firebaseAuthService";
import AuthContext from "../context/AuthContext";
import './AuthorVerificationPage.css';

const AuthorVerificationPage = () => {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [phone1, setPhone1] = useState("010");
  const [phone2, setPhone2] = useState("");
  const [phone3, setPhone3] = useState("");
  const [code, setCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const recaptchaRef = useRef(null);

  // ReCAPTCHA 초기화
  useEffect(() => {
    if (recaptchaRef.current) return;
    const container = document.getElementById("recaptcha-container");
    if (!container) return;

    const verifier = new RecaptchaVerifier(
      "recaptcha-container",
      { size: "invisible" },
      auth
    );

    verifier.render().then(() => (recaptchaRef.current = verifier));
  }, []);

  // 인증번호 요청
  const handleRequest = async () => {
    if (!phone2 || !phone3) return setMessage("전화번호를 모두 입력해주세요.");
    if (!recaptchaRef.current) return setMessage("Recaptcha 준비 중입니다.");

    setLoading(true);
    setMessage("");

    const fullPhone = `+82${phone1.substring(1)}${phone2}${phone3}`;

    try {
      const result = await signInWithPhoneNumber(auth, fullPhone, recaptchaRef.current);
      setConfirmationResult(result);
      setStep(2);
      setMessage("인증번호 발송 완료!");
    } catch (err) {
      console.error(err);
      setMessage(`인증 요청 실패: ${err.code}`);
    } finally {
      setLoading(false);
    }
  };

  // 인증번호 확인 + 토큰 재발급
  const handleVerify = async () => {
    if (!code) return setMessage("인증번호를 입력해주세요.");
    if (!user) return setMessage("로그인 후 본인 인증 가능합니다.");

    setLoading(true);
    setMessage("");

    try {
      // Firebase 인증 확인
      const userCredential = await confirmationResult.confirm(code);
      const idToken = await userCredential.user.getIdToken();
      const dbUserId = user.userId;

      // 서버 본인인증 API 호출 → 새 JWT 발급 포함
      const data = await verifyPhoneNumber({
        idToken,
        userId: dbUserId,
      });

      if (!data.token) throw new Error("서버에서 토큰을 받지 못했습니다.");

      // 🔹 새 토큰 저장
      localStorage.setItem('token', data.token);

      // 🔹 AuthContext 업데이트 (권한 반영)
      const updatedUser = { ...user, role: data.role || 'author' };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setMessage(data.message || "인증 완료! 권한이 부여되었습니다.");

      // 페이지 이동
      navigate("/novels/create");

      // 상태 초기화
      setStep(1);
      setPhone1("010");
      setPhone2("");
      setPhone3("");
      setCode("");
      setConfirmationResult(null);

    } catch (err) {
      console.error(err);
      setMessage(err.message || "인증 확인 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verification-container">
      <h1>작가 본인 인증</h1>

      {message && (
        <div className={`message ${message.includes("실패") ? "error" : "success"}`}>
          {message}
        </div>
      )}

      {step === 1 && (
        <div className="phone-input-group">
          <input
            type="text"
            maxLength={3}
            value={phone1}
            onChange={() => setPhone1("010")}
            disabled
          />
          <input
            type="text"
            maxLength={4}
            value={phone2}
            onChange={(e) => setPhone2(e.target.value.replace(/\D/g, ""))}
          />
          <input
            type="text"
            maxLength={4}
            value={phone3}
            onChange={(e) => setPhone3(e.target.value.replace(/\D/g, ""))}
          />
          <button onClick={handleRequest} disabled={loading || !phone2 || !phone3}>
            {loading ? "인증 요청 중..." : "인증 요청"}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="code-input-group">
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="인증번호 (6자리)"
          />
          <button onClick={handleVerify} disabled={loading || code.length !== 6}>
            {loading ? "인증 확인 중..." : "인증 확인"}
          </button>
        </div>
      )}

      <div id="recaptcha-container"></div>
    </div>
  );
};

export default AuthorVerificationPage;
