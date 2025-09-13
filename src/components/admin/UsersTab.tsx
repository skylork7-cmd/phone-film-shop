import React from 'react';

interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: any;
  lastLoginAt?: any;
  isAdmin: boolean;
}

interface UsersTabProps {
  users: User[];
  loadUsers: () => Promise<void>;
}

export const UsersTab: React.FC<UsersTabProps> = ({ users, loadUsers }) => {
  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#1f2937', margin: 0 }}>
          사용자 목록
        </h2>
        <button
          onClick={loadUsers}
          style={{
            padding: '8px 16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          새로고침
        </button>
      </div>

      {users.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '48px', 
          color: '#6b7280',
          fontSize: '18px'
        }}>
          등록된 사용자가 없습니다.
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gap: '16px',
          maxHeight: '70vh',
          overflow: 'auto'
        }}>
          {users.map((user) => (
            <div key={user.id} style={{
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '20px',
              background: 'white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr auto auto',
                gap: '16px',
                alignItems: 'center'
              }}>
                {/* 사용자 정보 */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    marginBottom: '8px'
                  }}>
                    <span style={{ 
                      padding: '4px 8px',
                      background: user.isAdmin ? '#ef4444' : '#10b981',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600
                    }}>
                      {user.isAdmin ? '관리자' : '일반 사용자'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {user.createdAt?.toDate().toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>
                    {user.displayName || '이름 없음'}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {user.email}
                  </div>
                  {user.lastLoginAt && (
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      마지막 로그인: {user.lastLoginAt?.toDate().toLocaleString()}
                    </div>
                  )}
                </div>

                {/* 사용자 ID */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>사용자 ID</div>
                  <div style={{ fontWeight: 600, fontSize: '12px', wordBreak: 'break-all' }}>
                    {user.id}
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      if (user.isAdmin) {
                        alert('관리자는 삭제할 수 없습니다.');
                        return;
                      }
                      if (window.confirm('정말로 이 사용자를 삭제하시겠습니까?')) {
                        // 사용자 삭제 로직 (실제로는 Firebase Auth에서 삭제해야 함)
                        alert('사용자 삭제 기능은 Firebase Admin SDK가 필요합니다.');
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      background: user.isAdmin ? '#9ca3af' : '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: user.isAdmin ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      opacity: user.isAdmin ? 0.5 : 1
                    }}
                    disabled={user.isAdmin}
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
