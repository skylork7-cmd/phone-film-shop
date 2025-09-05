#!/bin/bash

# Phone Film Shop 서버 시작 스크립트

echo "🚀 Phone Film Shop 서버들을 시작합니다..."

# 프론트엔드 서버 시작 (백그라운드)
echo "📱 프론트엔드 서버 시작 중..."
npm start &
FRONTEND_PID=$!

# 백엔드 서버 시작 (백그라운드)
echo "🔧 백엔드 서버 시작 중..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

echo "✅ 모든 서버가 시작되었습니다!"
echo "📱 프론트엔드: http://localhost:3000"
echo "🔧 백엔드: http://localhost:5001"
echo ""
echo "서버를 중지하려면 Ctrl+C를 누르세요."

# 서버 종료 시 모든 프로세스 정리
cleanup() {
    echo ""
    echo "🛑 서버들을 종료합니다..."
    kill $FRONTEND_PID 2>/dev/null
    kill $BACKEND_PID 2>/dev/null
    echo "✅ 모든 서버가 종료되었습니다."
    exit 0
}

# 시그널 핸들러 등록
trap cleanup SIGINT SIGTERM

# 프로세스들이 실행 중인지 확인
while true; do
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "❌ 프론트엔드 서버가 종료되었습니다."
        cleanup
    fi
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ 백엔드 서버가 종료되었습니다."
        cleanup
    fi
    sleep 1
done
