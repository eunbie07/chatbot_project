#!/bin/bash

echo "===== [1] 클러스터 정보 ====="
kubectl cluster-info
echo

echo "===== [2] 노드 상태 ====="
kubectl get nodes -o wide
echo

echo "===== [3] 네임스페이스 목록 ====="
kubectl get ns
echo

echo "===== [4] 전체 파드 목록 (모든 네임스페이스) ====="
kubectl get pods --all-namespaces -o wide
echo

echo "===== [5] 현재 네임스페이스의 파드 목록 ====="
kubectl get pods -o wide
echo

echo "===== [6] 서비스 목록 ====="
kubectl get svc -o wide
echo

echo "===== [7] 디플로이먼트 목록 ====="
kubectl get deploy -o wide
echo

echo "===== [8] 레플리카셋 목록 ====="
kubectl get rs -o wide
echo

echo "===== [9] 인그레스 목록 ====="
kubectl get ingress -o wide
echo

echo "===== [10] PVC (볼륨) 목록 ====="
kubectl get pvc -o wide
echo

echo "===== [11] 이벤트 로그 ====="
kubectl get events --sort-by=.metadata.creationTimestamp | tail -n 20
echo

echo "===== [12] 리소스 사용량 (metrics-server 설치 필요) ====="
kubectl top nodes
kubectl top pods
echo
