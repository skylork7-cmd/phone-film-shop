import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc, addDoc, deleteField } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface SchedulerTabProps {
  schedulers: Array<{ id: string; name: string; description: string; cronExpr: string; jobId?: string; schedulerType?: string }>;
  setSchedulers: React.Dispatch<React.SetStateAction<Array<{ id: string; name: string; description: string; cronExpr: string; jobId?: string; schedulerType?: string }>>>;
  loadSchedulers: () => Promise<void>;
  loadSchedulerJobs: () => Promise<void>;
  schedulerJobs: Array<{ id: string; cronExpr: string; running: boolean }>;
}

export const SchedulerTab: React.FC<SchedulerTabProps> = ({ 
  schedulers, 
  setSchedulers, 
  loadSchedulers, 
  loadSchedulerJobs, 
  schedulerJobs 
}) => {
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);
  const [editingScheduler, setEditingScheduler] = useState<{ id: string; name: string; description: string; cronExpr: string; jobId?: string; schedulerType?: string; jobFunction?: string } | null>(null);
  const [schedulerForm, setSchedulerForm] = useState({ name: '', description: '', cronExpr: '*/5 * * * *', schedulerType: 'productScheduler', running: true });
  const [showSchedulerTypeModal, setShowSchedulerTypeModal] = useState(false);
  const [schedulerTypeForm, setSchedulerTypeForm] = useState({ name: '', value: '' });
  const [schedulerTypes, setSchedulerTypes] = useState<Array<{ id: string; name: string; value: string }>>([]);
  const [showCronModal, setShowCronModal] = useState(false);

  const loadSchedulerTypes = async () => {
    try {
      const snap = await getDocs(collection(db, 'schedulerTypes'));
      const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Array<{ id: string; name: string; value: string }>;
      setSchedulerTypes(rows);
    } catch (e) {
      console.error('스케줄러 타입 목록 조회 실패:', e);
    }
  };

  const openSchedulerTypeModal = async () => {
    setSchedulerTypeForm({ name: '', value: '' });
    setShowSchedulerTypeModal(true);
    await loadSchedulerTypes();
  };

  const saveSchedulerType = async () => {
    const name = schedulerTypeForm.name.trim();
    const value = schedulerTypeForm.value.trim();
    if (!name) { alert('스케줄러 타입명을 입력하세요.'); return; }
    if (!value) { alert('스케줄러 타입값을 입력하세요.'); return; }
    try {
      await addDoc(collection(db, 'schedulerTypes'), {
        name,
        value,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setSchedulerTypeForm({ name: '', value: '' });
      await loadSchedulerTypes();
      alert('스케줄러 타입이 등록되었습니다.');
    } catch (e) {
      console.error('스케줄러 타입 등록 실패:', e);
      alert('스케줄러 타입 등록 실패');
    }
  };

  const deleteSchedulerType = async (id: string) => {
    if (!window.confirm('해당 스케줄러 타입을 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'schedulerTypes', id));
      await loadSchedulerTypes();
      alert('스케줄러 타입이 삭제되었습니다.');
    } catch (e) {
      console.error('스케줄러 타입 삭제 실패:', e);
      alert('스케줄러 타입 삭제 실패');
    }
  };

  const openCreateScheduler = async () => {
    setEditingScheduler(null);
    await loadSchedulerTypes();
    const firstType = (schedulerTypes && schedulerTypes.length > 0) ? schedulerTypes[0].value : '';
    setSchedulerForm({ name: '', description: '', cronExpr: '*/5 * * * *', schedulerType: firstType, running: true });
    setShowSchedulerModal(true);
  };

  const openEditScheduler = async (row: { id: string; name: string; description: string; cronExpr: string; jobId?: string; schedulerType?: string; jobFunction?: string }) => {
    setEditingScheduler(row);
    await loadSchedulerTypes();
    setSchedulerForm({ name: row.name, description: row.description, cronExpr: row.cronExpr, schedulerType: row.schedulerType || row.jobFunction || '', running: isJobRunning(row.jobId) });
    setShowSchedulerModal(true);
  };

  const saveScheduler = async () => {
    const name = schedulerForm.name.trim();
    const description = schedulerForm.description.trim();
    const cron = schedulerForm.cronExpr.trim();
    const schedulerType = (schedulerForm.schedulerType || 'discountSync').trim();
    const desiredRunning = !!schedulerForm.running;
    if (!name) { alert('스케줄명을 입력하세요.'); return; }
    if (!cron) { alert('cron 표현식을 입력하세요.'); return; }
    if (!schedulerType) { alert('스케줄러 타입을 선택하세요.'); return; }

    try {
      // 기존 잡이 있으면 취소
      let oldJobId: string | undefined = editingScheduler?.jobId;
      if (editingScheduler && oldJobId && (schedulerType === 'discountSync' || schedulerType === 'productScheduler')) {
        await fetch(`http://localhost:5001/api/schedules/${oldJobId}`, { method: 'DELETE' }).catch(() => undefined);
      }

      // 새 jobId 생성(수정인 경우 기존 id 재사용, 신규는 새로 생성)
      const nextJobId = oldJobId ?? (`job_${Math.random().toString(36).slice(2)}`);

      // 새 잡 등록 (jobId를 함께 전달하여 서버 쪽도 동일 ID로 등록)
      let jobId: string | undefined = undefined;
      if (schedulerType === 'discountSync' || schedulerType === 'productScheduler') {
        const createRes = await fetch('http://localhost:5001/api/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cronExpr: cron, schedulerType, jobId: nextJobId })
        });
        if (!createRes.ok) throw new Error('크론 등록 실패');
        const created = await createRes.json();
        jobId = created.id as string; // 서버가 수신/등록한 id를 반환
      }

      // 원하는 실행 상태로 맞추기
      if (jobId) {
        if (desiredRunning) {
          await fetch(`http://localhost:5001/api/schedules/${jobId}/start`, { method: 'POST' }).catch(() => undefined);
        } else {
          await fetch(`http://localhost:5001/api/schedules/${jobId}/stop`, { method: 'POST' }).catch(() => undefined);
        }
      }

      if (editingScheduler) {
        await updateDoc(doc(db, 'schedules', editingScheduler.id), {
          name,
          description,
          cronExpr: cron,
          jobId,
          schedulerType,
          jobFunction: deleteField(),
          running: desiredRunning,
          updatedAt: new Date()
        });
      } else {
        const ref = await addDoc(collection(db, 'schedules'), {
          name,
          description,
          cronExpr: cron,
          jobId,
          schedulerType,
          running: desiredRunning,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log('스케줄러 생성:', ref.id);
      }

      setShowSchedulerModal(false);
      setEditingScheduler(null);
      setSchedulerForm({ name: '', description: '', cronExpr: '*/5 * * * *', schedulerType: 'discountSync', running: true });
      await loadSchedulers();
      await loadSchedulerJobs();
      alert('스케줄러가 저장되었습니다.');
    } catch (e) {
      console.error('스케줄러 저장 실패:', e);
      alert('스케줄러 저장 실패');
    }
  };

  const isJobRunning = (jobId?: string) => {
    if (!jobId) return false;
    const found = schedulerJobs.find(j => j.id === jobId);
    return !!found && !!found.running;
  };

  const toggleScheduler = async (jobId: string, running: boolean) => {
    try {
      // running=true → 현재 실행중이므로 중지 호출, running=false → 시작 호출
      const endpoint = running
        ? `http://localhost:5001/api/schedules/${jobId}/stop`
        : `http://localhost:5001/api/schedules/${jobId}/start`;
      const res = await fetch(endpoint, { method: 'POST' });
      if (!res.ok) throw new Error('토글 실패');
      await loadSchedulerJobs();
      alert(running ? '스케줄러가 중지되었습니다.' : '스케줄러가 시작되었습니다.');
    } catch (e) {
      alert('스케줄러 토글 실패');
    }
  };

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#1f2937', margin: 0 }}>
          스케줄러
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={async () => { await loadSchedulerJobs(); setShowCronModal(true); }}
            style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
          >
            실행중 크론 확인
          </button>
          <button
            onClick={openSchedulerTypeModal}
            style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
          >
            스케줄러 타입 관리
          </button>
          <button
            onClick={openCreateScheduler}
            style={{ padding: '8px 16px', background: '#32CD32', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
          >
            스케줄러 추가
          </button>
        </div>
      </div>

      {schedulers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280', fontSize: '18px', border: '1px dashed #d1d5db', borderRadius: '12px', background: '#f9fafb' }}>
          등록된 스케줄이 없습니다.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {schedulers.map((s) => (
            <div key={s.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{s.name}</div>
                  <div style={{ color: '#6b7280', fontSize: 14 }}>{s.description}</div>
                  <div style={{ color: '#6b7280', fontSize: 12, marginTop: 6 }}>
                    스케줄러: {s.schedulerType || '-'} / 크론: {s.cronExpr || '-'} / 상태: {isJobRunning(s.jobId) ? 'running' : 'stopped'}
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>
                    jobId: {s.jobId || '-'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => openEditScheduler(s)}
                    style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
                  >
                    수정
                  </button>
                  {s.jobId && (
                    <>
                      <button
                        onClick={() => toggleScheduler(s.jobId!, isJobRunning(s.jobId))}
                        style={{ padding: '6px 12px', background: isJobRunning(s.jobId) ? '#f59e0b' : '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
                      >
                        {isJobRunning(s.jobId) ? '중지' : '시작'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 스케줄러 등록/수정 모달 */}
      {showSchedulerModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'white', padding: 32, borderRadius: 12, width: '100%', maxWidth: 560 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>{editingScheduler ? '스케줄러 수정' : '스케줄러 등록'}</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151' }}>스케줄러명</label>
                <input type="text" value={schedulerForm.name} onChange={(e) => setSchedulerForm({ ...schedulerForm, name: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151' }}>스케줄러 설명</label>
                <textarea value={schedulerForm.description} onChange={(e) => setSchedulerForm({ ...schedulerForm, description: e.target.value })} rows={3} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151' }}>스케줄러 선택</label>
                <select
                  value={schedulerForm.schedulerType}
                  onChange={(e) => setSchedulerForm({ ...schedulerForm, schedulerType: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                >
                  {schedulerTypes.length === 0 && (
                    <option value="">등록된 스케줄러 타입이 없습니다</option>
                  )}
                  {schedulerTypes.map(t => (
                    <option key={t.id} value={t.value}>{t.name} ({t.value})</option>
                  ))}
                </select>
                {schedulerTypes.length === 0 && (
                  <div style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>먼저 스케줄러 타입을 등록해주세요.</div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151' }}>cron 표현식</label>
                <input type="text" value={schedulerForm.cronExpr} onChange={(e) => setSchedulerForm({ ...schedulerForm, cronExpr: e.target.value })} placeholder="예: */5 * * * *" style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151' }}>상태</label>
                <select
                  value={schedulerForm.running ? 'start' : 'stop'}
                  onChange={(e) => setSchedulerForm({ ...schedulerForm, running: e.target.value === 'start' })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                >
                  <option value="start">시작</option>
                  <option value="stop">중지</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
              <button onClick={() => { setShowSchedulerModal(false); setEditingScheduler(null); }} style={{ flex: 1, padding: 12, background: 'transparent', color: '#374151', border: '1px solid #d1d5db', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>취소</button>
              <button onClick={saveScheduler} style={{ flex: 1, padding: 12, background: '#32CD32', color: 'white', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>{editingScheduler ? '수정' : '등록'}</button>
            </div>
          </div>
        </div>
      )}

      {/* 스케줄러 타입 관리 모달 */}
      {showSchedulerTypeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'white', padding: 32, borderRadius: 12, width: '100%', maxWidth: 560 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>스케줄러 타입 관리</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151' }}>스케줄러 타입명</label>
                <input type="text" value={schedulerTypeForm.name} onChange={(e) => setSchedulerTypeForm({ ...schedulerTypeForm, name: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151' }}>스케줄러 타입값</label>
                <input type="text" value={schedulerTypeForm.value} onChange={(e) => setSchedulerTypeForm({ ...schedulerTypeForm, value: e.target.value })} placeholder="예: discountSync, productScheduler" style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6 }} />
              </div>
              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
                <button onClick={() => setShowSchedulerTypeModal(false)} style={{ padding: 12, background: 'transparent', color: '#374151', border: '1px solid #d1d5db', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>닫기</button>
                <button onClick={saveSchedulerType} style={{ padding: 12, background: '#10b981', color: 'white', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>등록</button>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>등록된 스케줄러 타입</div>
              {schedulerTypes.length === 0 ? (
                <div style={{ color: '#6b7280', fontSize: 14 }}>아직 등록된 스케줄러 타입이 없습니다.</div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {schedulerTypes.map(t => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, border: '1px solid #e5e7eb', borderRadius: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{t.name}</div>
                        <div style={{ color: '#6b7280', fontSize: 12 }}>{t.value}</div>
                      </div>
                      <button onClick={() => deleteSchedulerType(t.id)} style={{ padding: '6px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>삭제</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 실행중 크론 확인 모달 */}
      {showCronModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 12, width: '100%', maxWidth: 560 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>실행중 크론 목록</h3>
            {schedulerJobs.length === 0 ? (
              <div style={{ color: '#6b7280', fontSize: 14 }}>실행중인 스케줄러가 없습니다.</div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {schedulerJobs.map(j => (
                  <div key={j.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }}>
                    <div style={{ fontWeight: 700 }}>ID: {j.id}</div>
                    <div style={{ color: '#6b7280', fontSize: 14 }}>크론: {j.cronExpr}</div>
                    <div style={{ fontSize: 12, color: j.running ? '#10b981' : '#ef4444' }}>상태: {j.running ? 'running' : 'stopped'}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button onClick={() => setShowCronModal(false)} style={{ padding: '8px 14px', background: '#374151', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
