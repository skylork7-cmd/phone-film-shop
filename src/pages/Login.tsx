import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { addDoc, collection } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const validateForm = () => {
    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      return false;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return false;
    }

    if (isSignUp && password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('유효한 이메일 형식을 입력해주세요.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      if (isSignUp) {
        // 회원가입
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('회원가입 성공:', user.email);
        
        // Firestore에 사용자 정보 저장
        try {
          await addDoc(collection(db, 'users'), {
            id: user.uid,
            email: user.email,
            displayName: user.displayName || null,
            createdAt: new Date(),
            lastLoginAt: new Date(),
            isAdmin: user.email === 'admin@gmail.com'
          });
          console.log('사용자 정보 저장 성공');
        } catch (error) {
          console.error('사용자 정보 저장 실패:', error);
        }
        
        setSuccess('회원가입이 완료되었습니다! 자동으로 로그인됩니다.');
        
        // 잠시 후 홈으로 이동
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        // 로그인
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('로그인 성공:', user.email);
        
        setSuccess('로그인되었습니다!');
        
        // 잠시 후 홈으로 이동
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (error: any) {
      console.error('Authentication failed:', error);
      
      // Firebase 에러 코드에 따른 한국어 메시지
      switch (error.code) {
        case 'auth/user-not-found':
          setError('등록되지 않은 이메일입니다.');
          break;
        case 'auth/wrong-password':
          setError('잘못된 비밀번호입니다.');
          break;
        case 'auth/invalid-email':
          setError('유효하지 않은 이메일 형식입니다.');
          break;
        case 'auth/weak-password':
          setError('비밀번호는 최소 6자 이상이어야 합니다.');
          break;
        case 'auth/email-already-in-use':
          setError('이미 사용 중인 이메일입니다.');
          break;
        case 'auth/too-many-requests':
          setError('너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.');
          break;
        case 'auth/network-request-failed':
          setError('네트워크 연결을 확인해주세요.');
          break;
        case 'auth/operation-not-allowed':
          setError('이메일/비밀번호 로그인이 비활성화되어 있습니다.');
          break;
        default:
          setError(isSignUp ? '회원가입에 실패했습니다.' : '로그인에 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
            {isSignUp ? '회원가입' : '로그인'}
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            Zombi Barrier 계정으로 {isSignUp ? '가입' : '로그인'}하세요
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            color: '#dc2626',
            fontSize: '14px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: '12px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '6px',
            color: '#16a34a',
            fontSize: '14px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              placeholder="이메일을 입력하세요"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              placeholder={isSignUp ? "최소 6자 이상 입력하세요" : "비밀번호를 입력하세요"}
            />
          </div>

          {isSignUp && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                비밀번호 확인
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                placeholder="비밀번호를 다시 입력하세요"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              background: isLoading ? '#9ca3af' : '#32CD32',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginBottom: '16px'
            }}
          >
            {isLoading ? (isSignUp ? '가입 중...' : '로그인 중...') : (isSignUp ? '회원가입' : '로그인')}
          </button>

          {!isSignUp && (
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Link to="/forgot-password" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '14px' }}>
                비밀번호를 잊으셨나요?
              </Link>
            </div>
          )}

          <div style={{ textAlign: 'center', padding: '16px', background: '#f8fafc', borderRadius: '6px' }}>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>
              {isSignUp ? '이미 계정이 있으신가요? ' : '계정이 없으신가요? '}
            </span>
            <button
              type="button"
              onClick={toggleMode}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                textDecoration: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {isSignUp ? '로그인' : '회원가입'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
