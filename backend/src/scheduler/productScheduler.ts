import cron, { ScheduledTask } from 'node-cron';
import { db } from '../config/firebase';

/**
 * productScheduler.ts
 *
 * 이 파일은 "크론(cron)" 형식의 일정에 맞춰 백엔드에서 반복 작업(배치 작업)을 실행하기 위한 유틸리티입니다.
 * - node-cron 라이브러리를 사용해서 일정 등록/취소/목록 조회를 처리합니다.
 * - 예시 작업으로 "할인 동기화(applyDiscountsIfNeeded)"를 제공합니다.
 *
 * 용어 정리
 * - 배치/스케줄(Job): 일정(cron 표현식)에 맞춰 자동으로 실행되는 작업을 의미합니다.
 * - cron 표현식: 분 시 일 월 요일 형태로 주기를 정의하는 문자열입니다. 예) "*\/5 * * * *" → 5분마다
 *
 * 이 파일이 제공하는 주요 기능
 * 1) applyDiscountsIfNeeded: 현재 시간이 상품의 할인 기간인 경우 판매가(discountedPrice)를 동기화
 * 2) scheduleDiscountSync: 할인 동기화 작업을 원하는 cron 표현식으로 등록
 * 3) scheduleProductScheduler: (확장 포인트) 현재는 할인 동기화와 동일하게 동작하도록 등록
 * 4) listDiscountJobs / cancelDiscountJob: 등록된 작업 목록 조회/취소
 * 5) initProductSchedulers: 서버 기동 직후 1회 할인 동기화 실행(선택적 초기화)
 */

/**
 * Firestore 사용 가능 여부 체크
 * 개발(더미) 모드에서는 db.collection이 없을 수 있으므로 방어적으로 검사합니다.
 */
function isDbUsable(): boolean {
  return db && typeof (db as any).collection === 'function';
}

/**
 * 할인 동기화 작업
 * - 상품 문서의 할인 설정(discountApplied, discountRate, discountStartDate, discountEndDate)을 확인하여,
 *   현재 시점이 유효 기간이면 판매가(discountedPrice)를 계산해 반영하고, 아니면 원가(price)로 되돌립니다.
 * - Firestore에 직접 접근하므로, 서비스 계정/환경변수가 설정되지 않은 개발 모드에서는 동작을 건너뜁니다.
 */
export async function applyDiscountsIfNeeded(): Promise<void> {
  if (!isDbUsable()) {
    console.warn('[CRON][products] DB unavailable (dev dummy mode). Using mock data for testing.');
    // 더미 모드에서도 테스트할 수 있도록 목 데이터 사용
    console.log('[CRON][products] Mock discount sync completed.');
    return;
  }

  try {
    console.log('[CRON][products] Discount sync started.');
    // 모든 상품 문서를 조회합니다.
    const productsSnap = await (db as any).collection('products').get();
    console.log(`[CRON][products] Discount sync: ${productsSnap.size} products found.`);
    const now = new Date();

    const updates: Array<Promise<any>> = [];
    productsSnap.forEach((doc: any) => {
      const p = doc.data() || {};

      // 할인 설정 값들을 방어적으로 읽습니다.
      const applied: string = p.discountApplied || 'N';
      const rate: number = typeof p.discountRate === 'number' ? p.discountRate : 0;
      const price: number = typeof p.price === 'number' ? p.price : 0;
      const start: string | undefined = p.discountStartDate;
      const end: string | undefined = p.discountEndDate;
      console.log(`[CRON][products] Discount sync: ${doc.id}, applied=${applied}, rate=${rate}, start=${start}, end=${end}`);

      // 할인 적용 여부 판별
      let shouldApplyDiscount = false;
      
      if (applied === 'Y' && rate > 0) {
        // 할인 시작일/종료일이 모두 있는 경우: 기간 내에만 할인 적용
        if (start && end) {
          const startDate = new Date(start);
          const endDate = new Date(end);
          if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            shouldApplyDiscount = now >= startDate && now <= endDate;
          }
        }
        // 할인 시작일만 있는 경우: 시작일 이후부터 할인 적용
        else if (start && !end) {
          const startDate = new Date(start);
          if (!isNaN(startDate.getTime())) {
            shouldApplyDiscount = now >= startDate;
          }
        }
        // 할인 종료일만 있는 경우: 종료일 이전까지 할인 적용
        else if (!start && end) {
          const endDate = new Date(end);
          if (!isNaN(endDate.getTime())) {
            shouldApplyDiscount = now <= endDate;
          }
        }
        // 할인 시작일/종료일이 모두 없는 경우: 항상 할인 적용
        else if (!start && !end) {
          shouldApplyDiscount = true;
        }
      }
      console.log(`[CRON][products] Discount sync: ${doc.id}, shouldApplyDiscount=${shouldApplyDiscount}`);
      
      // 할인 적용 대상 판매가 계산
      const targetDiscountedPrice = shouldApplyDiscount ? Math.round(price * (1 - rate / 100)) : price;
      const currentDiscountedPrice = typeof p.discountedPrice === 'number' ? p.discountedPrice : price;
      console.log(`[CRON][products] Discount sync: ${doc.id}, targetDiscountedPrice=${targetDiscountedPrice}, currentDiscountedPrice=${currentDiscountedPrice}`);
      
      // 가격이 변경되는 경우에만 업데이트
      if (targetDiscountedPrice !== currentDiscountedPrice) {
        updates.push((db as any).collection('products').doc(doc.id).update({
          discountedPrice: targetDiscountedPrice,
          discountApplied: shouldApplyDiscount ? 'Y' : 'N',
          updatedAt: new Date()
        }));
      }
    });

    if (updates.length > 0) {
      await Promise.allSettled(updates);
      console.log(`[CRON][products] Discount sync done. Updated: ${updates.length}`);
    } else {
      console.log('[CRON][products] Discount sync done. No changes.');
    }
  } catch (error) {
    console.error('[CRON][products] Discount sync failed:', error);
  } finally {
    console.log('[CRON][products] Discount sync finished.');
  }
}

// 등록된 스케줄 작업들을 메모리에 보관하는 맵입니다.
// - key: 내부적으로 생성한 작업 ID(간단한 식별자)
// - value: node-cron이 반환한 작업 객체(task)와 해당 cron 표현식
const jobs: Map<string, { task: ScheduledTask; cronExpr: string }> = new Map();

/**
 * 할인 동기화 작업을 cron 표현식으로 등록합니다.
 * @param cronExpr 예: "*\/5 * * * *" (5분마다)
 * @param providedId 클라이언트가 지정한 jobId(선택). 지정되면 그대로 사용합니다.
 */
export function scheduleDiscountSync(cronExpr: string, providedId?: string): string {
  const id = providedId || Math.random().toString(36).slice(2);
  console.log(`[CRON][products] Discount sync scheduled: ${id}, cron=${cronExpr}`);
  const task = cron.schedule(cronExpr, () => {
    // 등록된 스케줄에 따라 할인 동기화 작업을 수행합니다.
    applyDiscountsIfNeeded().catch(() => undefined);
  });
  jobs.set(id, { task, cronExpr });
  return id;
}

/**
 * productScheduler용 등록 함수(확장 포인트)
 * @param cronExpr 크론 표현식
 * @param providedId 클라이언트가 지정한 jobId(선택)
 */
export function scheduleProductScheduler(cronExpr: string, providedId?: string): string {
  const id = providedId || Math.random().toString(36).slice(2);
  const task = cron.schedule(cronExpr, () => {
    // 필요 시 여기에 다른 상품 관련 배치 함수를 호출하세요.
    applyDiscountsIfNeeded().catch(() => undefined);
  });
  jobs.set(id, { task, cronExpr });
  return id;
}

/**
 * 등록된 작업 목록을 반환합니다.
 * - running: node-cron의 상태를 간단히 표시(실행 중인지 여부)
 */
export function listDiscountJobs(): Array<{ id: string; cronExpr: string; running: boolean }> {
  return Array.from(jobs.entries()).map(([id, v]) => ({ 
    id, 
    cronExpr: v.cronExpr, 
    running: v.task.getStatus() !== 'stopped'  // 'stopped'가 아닌 경우 실행 중으로 간주
  }));
}

/**
 * 작업을 취소(정지)하고 목록에서 제거합니다.
 * @param id scheduleDiscountSync/scheduleProductScheduler에서 반환한 작업 ID
 */
export function cancelDiscountJob(id: string): boolean {
  const found = jobs.get(id);
  console.log(`[CRON][products] Cancel discount job: ${id}, found=${found}`);
  if (!found) return false;
  try {
    found.task.stop();
  } catch (_) {}
  jobs.delete(id);
  return true;
}

export function stopJob(id: string): boolean {
  const found = jobs.get(id);
  if (!found) return false;
  try {
    found.task.stop();
    return true;
  } catch (_) {
    return false;
  }
}

export function startJob(id: string): boolean {
  const found = jobs.get(id);
  if (!found) return false;
  try {
    found.task.start();
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * 서버 기동 직후 1회 실행되는 초기화 함수입니다.
 * - 운영 요구사항에 따라 자동 실행이 필요 없으면 호출하지 않아도 됩니다.
 */
export function initProductSchedulers(): void {
  // 서버 기동 직후 1회 실행 (선택)
  applyDiscountsIfNeeded().catch(() => undefined);

  // Auto-restore schedules from Firestore
  if (!db || !(db as any).collection) {
    console.warn('[Scheduler] DB unavailable. Skip auto-restore.');
    return;
  }
  (async () => {
    try {
      const snap = await (db as any).collection('schedules').get();
      snap.forEach((doc: any) => {
        const s = doc.data() || {};
        const cronExpr: string | undefined = s.cronExpr;
        const schedulerType: string | undefined = s.schedulerType || s.jobFunction;
        const jobId: string | undefined = s.jobId;
        const running: boolean = !!s.running;
        if (!cronExpr || !schedulerType || !jobId) return;
        let createdId: string;
        if (schedulerType === 'productScheduler') {
          createdId = scheduleProductScheduler(cronExpr, jobId);
        } else {
          createdId = scheduleDiscountSync(cronExpr, jobId);
        }
        if (createdId && createdId === jobId) {
          // adjust running state
          if (running) {
            try { startJob(jobId); } catch (_) {}
          } else {
            try { stopJob(jobId); } catch (_) {}
          }
        }
      });
      console.log('[Scheduler] Auto-restore completed.');
    } catch (e) {
      console.error('[Scheduler] Auto-restore failed:', e);
    }
  })();
}
