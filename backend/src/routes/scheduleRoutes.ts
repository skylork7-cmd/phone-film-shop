import { Router } from 'express';
import { scheduleDiscountSync, listDiscountJobs, cancelDiscountJob, scheduleProductScheduler, startJob, stopJob, applyDiscountsIfNeeded } from '../scheduler/productScheduler';
import { db } from '../config/firebase';

const router = Router();

function isDbUsable(): boolean {
  return db && typeof (db as any).collection === 'function';
}

// 생성: POST /api/schedules  { cronExpr: string, schedulerType?: string, jobId?: string }
router.post('/', async (req, res) => {
  const { cronExpr, schedulerType, jobId } = req.body || {};
  if (typeof cronExpr !== 'string' || cronExpr.trim().length === 0) {
    return res.status(400).json({ message: 'cronExpr가 필요합니다.' });
  }
  try {
    const func = (schedulerType || 'discountSync').toString();
    const providedId = typeof jobId === 'string' && jobId.trim().length > 0 ? jobId.trim() : undefined;
    console.log(`[SCHEDULE] register request: type=${func}, cron=${cronExpr}, jobId=${providedId ?? '(auto)'}`);

    let id: string;
    switch (func) {
      case 'productScheduler':
        id = scheduleProductScheduler(cronExpr.trim(), providedId);
        break;
      case 'discountSync':
      default:
        id = scheduleDiscountSync(cronExpr.trim(), providedId);
    }

    // 등록 직후 1회 즉시 실행(확인용)
    if (func === 'discountSync') {
      console.log('[SCHEDULE] running discountSync once immediately after registration');
      try {
        await applyDiscountsIfNeeded();
      } catch (e) {
        console.error('[SCHEDULE] immediate run failed:', e);
      }
    }

    return res.status(201).json({ id, cronExpr, schedulerType: func });
  } catch (error) {
    console.error('스케줄러 등록 실패:', error);
    return res.status(500).json({ message: '스케줄러 등록에 실패했습니다.' });
  }
});

// 조회: GET /api/schedules
router.get('/', (_req, res) => {
  try {
    console.log('[SCHEDULE] list request');
    const jobs = listDiscountJobs();
    return res.json(jobs);
  } catch (error) {
    console.error('스케줄러 목록 조회 실패:', error);
    return res.status(500).json({ message: '스케줄러 목록 조회에 실패했습니다.' });
  }
});

// 중지: POST /api/schedules/:id/stop
router.post('/:id/stop', (req, res) => {
  try {
    console.log(`[SCHEDULE] stop request: id=${req.params.id}`);
    const ok = stopJob(req.params.id);
    if (!ok) return res.status(404).json({ message: '스케줄러를 찾을 수 없습니다.' });
    return res.json({ message: '스케줄러가 중지되었습니다.' });
  } catch (error) {
    console.error('스케줄러 중지 실패:', error);
    return res.status(500).json({ message: '스케줄러 중지에 실패했습니다.' });
  }
});

// 시작: POST /api/schedules/:id/start
router.post('/:id/start', (req, res) => {
  try {
    console.log(`[SCHEDULE] start request: id=${req.params.id}`);
    const ok = startJob(req.params.id);
    if (!ok) return res.status(404).json({ message: '스케줄러를 찾을 수 없습니다.' });
    return res.json({ message: '스케줄러가 시작되었습니다.' });
  } catch (error) {
    console.error('스케줄러 시작 실패:', error);
    return res.status(500).json({ message: '스케줄러 시작에 실패했습니다.' });
  }
});

// 삭제: DELETE /api/schedules/:id
router.delete('/:id', (req, res) => {
  try {
    console.log(`[SCHEDULE] delete request: id=${req.params.id}`);
    const ok = cancelDiscountJob(req.params.id);
    if (!ok) return res.status(404).json({ message: '스케줄러를 찾을 수 없습니다.' });
    return res.json({ message: '스케줄러가 취소되었습니다.' });
  } catch (error) {
    console.error('스케줄러 취소 실패:', error);
    return res.status(500).json({ message: '스케줄러 취소에 실패했습니다.' });
  }
});

// -------------------------------
// 스케줄 레코드 CRUD (Firestore schedules 컬렉션)
// -------------------------------

// 목록: GET /api/schedules/records
router.get('/records', async (_req, res) => {
  try {
    if (!isDbUsable()) return res.status(503).json({ message: 'DB unavailable' });
    const snap = await (db as any).collection('schedules').get();
    const rows = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() || {}) }));
    return res.json(rows);
  } catch (error) {
    console.error('스케줄 레코드 목록 조회 실패:', error);
    return res.status(500).json({ message: '스케줄 레코드 목록 조회 실패' });
  }
});

// 생성: POST /api/schedules/records
router.post('/records', async (req, res) => {
  try {
    if (!isDbUsable()) return res.status(503).json({ message: 'DB unavailable' });
    const body = req.body || {};
    const now = new Date();
    const docRef = await (db as any).collection('schedules').add({
      name: body.name,
      description: body.description,
      cronExpr: body.cronExpr,
      jobId: body.jobId,
      schedulerType: body.schedulerType,
      running: !!body.running,
      createdAt: now,
      updatedAt: now
    });
    return res.status(201).json({ id: docRef.id });
  } catch (error) {
    console.error('스케줄 레코드 생성 실패:', error);
    return res.status(500).json({ message: '스케줄 레코드 생성 실패' });
  }
});

// 수정: PUT /api/schedules/records/:id
router.put('/records/:id', async (req, res) => {
  try {
    if (!isDbUsable()) return res.status(503).json({ message: 'DB unavailable' });
    const body = req.body || {};
    const update: any = { updatedAt: new Date() };
    ['name','description','cronExpr','jobId','schedulerType','running'].forEach(k => {
      if (body[k] !== undefined) update[k] = body[k];
    });
    await (db as any).collection('schedules').doc(req.params.id).set(update, { merge: true });
    return res.json({ id: req.params.id });
  } catch (error) {
    console.error('스케줄 레코드 수정 실패:', error);
    return res.status(500).json({ message: '스케줄 레코드 수정 실패' });
  }
});

// 삭제: DELETE /api/schedules/records/:id
router.delete('/records/:id', async (req, res) => {
  try {
    if (!isDbUsable()) return res.status(503).json({ message: 'DB unavailable' });
    await (db as any).collection('schedules').doc(req.params.id).delete();
    return res.json({ id: req.params.id });
  } catch (error) {
    console.error('스케줄 레코드 삭제 실패:', error);
    return res.status(500).json({ message: '스케줄 레코드 삭제 실패' });
  }
});

export default router;
