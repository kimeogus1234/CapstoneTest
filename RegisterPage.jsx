import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  registerUser,
  checkUserId,
  checkNickname,
  sendVerificationCode,
  verifyEmail,
} from '../api/auth';
import './RegisterPage.css';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    userId: '',
    nickname: '',
    email: '',
    password: '',
    passwordConfirm: '',
    verificationCode: '',
  });

  const [validations, setValidations] = useState({
    userId: { available: null, message: '' },
    nickname: { available: null, message: '' },
    password: { valid: null, message: '8자 이상, 대/소문자, 숫자, 특수문자를 포함해야 합니다.' },
  });

  const [emailStatus, setEmailStatus] = useState({
    sent: false,
    verified: false,
    message: '',
  });
  const [timer, setTimer] = useState(0); // 초 단위

  const [loading, setLoading] = useState(false);
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'email') {
      // 이메일 변경 시 인증 초기화
      setEmailStatus({ sent: false, verified: false, message: '' });
      setTimer(0);
    }

    if (name === 'userId') setValidations(prev => ({ ...prev, userId: { available: null, message: '' } }));
    if (name === 'nickname') setValidations(prev => ({ ...prev, nickname: { available: null, message: '' } }));
    if (name === 'password') {
      const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+]).{8,}$/;
      setValidations(prev => ({ ...prev, password: { ...prev.password, valid: pwRegex.test(value) } }));
    }
  };


  const handleCheckUserId = async () => {
    if (!formData.userId.trim()) {
      setValidations(prev => ({ ...prev, userId: { available: false, message: '아이디를 입력해주세요.' } }));
      return;
    }
    try {
      setLoading(true);
      const data = await checkUserId(formData.userId);
      setValidations(prev => ({
        ...prev,
        userId: {
          available: data.available,
          message: data.available ? '사용 가능한 아이디입니다.' : '이미 사용 중인 아이디입니다.'
        }
      }));
    } catch (e) {
      setValidations(prev => ({ ...prev, userId: { available: false, message: e.message } }));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckNickname = async () => {
    if (!formData.nickname.trim()) {
      setValidations(prev => ({ ...prev, nickname: { available: false, message: '닉네임을 입력해주세요.' } }));
      return;
    }
    try {
      setLoading(true);
      const data = await checkNickname(formData.nickname);
      setValidations(prev => ({
        ...prev,
        nickname: {
          available: data.available,
          message: data.available ? '사용 가능한 닉네임입니다.' : '이미 사용 중인 닉네임입니다.'
        }
      }));
    } catch (e) {
      setValidations(prev => ({ ...prev, nickname: { available: false, message: e.message } }));
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerificationCode = async () => {
    const email = formData.email.trim();
    if (!email) return setFormMessage({ type: 'error', text: '이메일을 입력해주세요.' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return setFormMessage({ type: 'error', text: '올바른 이메일 형식이 아닙니다.' });

    try {
      setLoading(true);
      const data = await sendVerificationCode(email);
      
      setEmailStatus({ ...emailStatus, sent: true, verified: false, message: data.message || '인증번호가 발송되었습니다.' });
      setTimer(180); // 3분 = 180초
      setFormMessage({ type: 'success', text: '' });

      // 타이머 감소
      const interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setEmailStatus(prev => ({ ...prev, sent: false, message: '인증번호가 만료되었습니다.' }));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e) {
      setFormMessage({ type: 'error', text: e.message });
      setEmailStatus({ sent: false, verified: false, message: '' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    const code = formData.verificationCode.trim();
    if (!code) return setFormMessage({ type: 'error', text: '인증번호를 입력해주세요.' });

    try {
      setLoading(true);
      const res = await verifyEmail(formData.email, code); // api 호출
      if (res.success) {
        setEmailStatus(prev => ({ ...prev, verified: true, message: res.message }));
        setFormMessage({ type: 'success', text: '' });
      } else {
        setEmailStatus(prev => ({ ...prev, verified: false, message: res.message || '인증번호가 올바르지 않습니다.' }));
      }

    } catch (e) {
      setFormMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setFormMessage({ type: '', text: '' });

    if (validations.userId.available !== true) return setFormMessage({ type: 'error', text: '아이디 중복 확인을 완료해주세요.' });
    if (validations.nickname.available !== true) return setFormMessage({ type: 'error', text: '닉네임 중복 확인을 완료해주세요.' });
    if (!emailStatus.verified) return setFormMessage({ type: 'error', text: '이메일 인증을 완료해주세요.' });
    if (formData.password !== formData.passwordConfirm) return setFormMessage({ type: 'error', text: '비밀번호가 일치하지 않습니다.' });
    if (!validations.password.valid) return setFormMessage({ type: 'error', text: '비밀번호 형식을 확인해주세요.' });

    try {
      setLoading(true);
      const res = await registerUser({
        userId: formData.userId,
        email: formData.email,
        nickname: formData.nickname,
        password: formData.password,
        verificationCode: formData.verificationCode,
      });
      alert(res.message || '회원가입이 완료되었습니다.');
      navigate('/login');
    } catch (e) {
      setFormMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleRegister}>
        <h2>회원가입</h2>

        <div className="input-group">
          <label htmlFor="userId">아이디</label>
          <div className="input-with-button">
            <input id="userId" name="userId" value={formData.userId} onChange={handleChange} required />
            <button type="button" onClick={handleCheckUserId} disabled={loading}>중복 확인</button>
          </div>
          <p className={`validation-message ${validations.userId.available === true ? 'success' : validations.userId.available === false ? 'error' : ''}`}>
            {validations.userId.message}
          </p>
        </div>

        <div className="input-group">
          <label htmlFor="nickname">닉네임</label>
          <div className="input-with-button">
            <input id="nickname" name="nickname" value={formData.nickname} onChange={handleChange} required />
            <button type="button" onClick={handleCheckNickname} disabled={loading}>중복 확인</button>
          </div>
          <p className={`validation-message ${validations.nickname.available === true ? 'success' : validations.nickname.available === false ? 'error' : ''}`}>
            {validations.nickname.message}
          </p>
        </div>

        <div className="input-group">
          <label htmlFor="password">비밀번호</label>
          <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
          <p className={`validation-message ${validations.password.valid === true ? 'success' : validations.password.valid === false ? 'error' : ''}`}>
            {validations.password.message}
          </p>
        </div>

        <div className="input-group">
          <label htmlFor="passwordConfirm">비밀번호 확인</label>
          <input type="password" id="passwordConfirm" name="passwordConfirm" value={formData.passwordConfirm} onChange={handleChange} required />
        </div>

        <div className="input-group email-group">
          <label htmlFor="email">이메일</label>
          <div className="input-with-button">
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required disabled={emailStatus.verified} />
            <button type="button" onClick={handleSendVerificationCode} disabled={loading || emailStatus.sent}>인증번호 전송</button>
          </div>
        </div>

        {emailStatus.sent && (
          <div className="input-group">
            <label htmlFor="verificationCode">인증번호</label>
            <div className="input-with-button">
              <input
                id="verificationCode"
                name="verificationCode"
                value={formData.verificationCode}
                onChange={handleChange}
                required
                disabled={emailStatus.verified}
              />
              <button type="button" onClick={handleVerifyEmail} disabled={loading || emailStatus.verified}>인증번호 확인</button>
              {timer > 0 && <span className="timer">{Math.floor(timer/60)}:{('0'+(timer%60)).slice(-2)}</span>}
            </div>
            <p className={`validation-message ${emailStatus.verified ? 'success' : 'error'}`}>{emailStatus.message}</p>
          </div>
        )}

        {formMessage.text && <div className={`form-message ${formMessage.type}`}>{formMessage.text}</div>}

        <button type="submit" className="register-button" disabled={loading}>회원가입</button>

        <div className="form-footer">
          <span>이미 계정이 있으신가요?</span>
          <Link to="/login">로그인</Link>
        </div>
      </form>
    </div>
  );
}
