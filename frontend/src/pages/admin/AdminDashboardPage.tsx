import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { adminApi } from '@/api/admin';
import { animalApi } from '@/api/animal';
import { adoptionApi } from '@/api/adoption';
import { volunteerApi } from '@/api/volunteer';
import { donationApi } from '@/api/donation';
import { notificationApi } from '@/api/notification';
import type { ShelterResponse } from '@/types/dto';
import type { NotificationResponse } from '@/types/dto';
import type { Adoption, Volunteer, Donation } from '@/types/entities';
import type { AnimalCreateRequest } from '@/types/dto';
import type { VolunteerRecruitmentCreateRequest } from '@/types/dto';
import type { DonationRequestCreateRequest } from '@/types/dto';
import type { UserResponse } from '@/types/dto';
import type { BoardResponse } from '@/types/dto';
import type { RoleFilter, SyncHistoryItem } from '@/api/admin';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const ADMIN_ROLES = ['SHELTER_ADMIN', 'SUPER_ADMIN'];

type SuperTab = 'members' | 'boards' | 'approvals' | 'applicationsLog' | 'sync';
type ShelterTab = 'applications' | 'animals' | 'volunteers' | 'donations' | 'notifications';

const SUPER_TABS: { id: SuperTab; label: string }[] = [
  { id: 'members', label: '회원관리' },
  { id: 'boards', label: '게시판 관리' },
  { id: 'approvals', label: '승인관리' },
  { id: 'applicationsLog', label: '신청 내역' },
  { id: 'sync', label: 'API 수동 동기화' },
];

const SHELTER_TABS: { id: ShelterTab; label: string }[] = [
  { id: 'applications', label: '신청 관리' },
  { id: 'animals', label: '입양 등록' },
  { id: 'volunteers', label: '봉사 모집' },
  { id: 'donations', label: '기부 요청' },
  { id: 'notifications', label: '알림 관리' },
];

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [superTab, setSuperTab] = useState<SuperTab>('approvals');
  const [shelterTab, setShelterTab] = useState<ShelterTab>('animals');

  const [myShelter, setMyShelter] = useState<ShelterResponse | null>(null);
  const [shelterLoading, setShelterLoading] = useState(false);

  const [pendingShelters, setPendingShelters] = useState<ShelterResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const [animalSubmitLoading, setAnimalSubmitLoading] = useState(false);
  const [volunteerSubmitLoading, setVolunteerSubmitLoading] = useState(false);
  const [donationSubmitLoading, setDonationSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [usersPage, setUsersPage] = useState(0);
  const [usersTotalPages, setUsersTotalPages] = useState(0);
  const [usersTotalElements, setUsersTotalElements] = useState(0);
  const [roleFilter, setRoleFilter] = useState<RoleFilter | ''>('');

  const [boards, setBoards] = useState<BoardResponse[]>([]);
  const [boardsLoading, setBoardsLoading] = useState(false);
  const [boardsError, setBoardsError] = useState('');
  const [boardsPage, setBoardsPage] = useState(0);
  const [boardsTotalPages, setBoardsTotalPages] = useState(0);
  const [boardTypeFilter, setBoardTypeFilter] = useState<string>('');
  const [boardActionLoading, setBoardActionLoading] = useState<number | null>(null);
  const [businessRegLoading, setBusinessRegLoading] = useState<number | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncHistoryItem[]>([]);
  const [syncHistoryLoading, setSyncHistoryLoading] = useState(false);
  const [syncHistoryPage, setSyncHistoryPage] = useState(0);
  const [syncHistoryTotalPages, setSyncHistoryTotalPages] = useState(0);
  const [syncHistoryTotalElements, setSyncHistoryTotalElements] = useState(0);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState('');
  const [testEmailResult, setTestEmailResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [pendingAdoptions, setPendingAdoptions] = useState<Adoption[]>([]);
  const [pendingVolunteers, setPendingVolunteers] = useState<Volunteer[]>([]);
  const [pendingDonations, setPendingDonations] = useState<Donation[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationActionLoading, setApplicationActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<{ type: string; id: number; value: string } | null>(null);
  const [applicationDetailView, setApplicationDetailView] = useState<{
    type: 'adoption' | 'volunteer' | 'donation';
    item: Adoption | Volunteer | Donation;
  } | null>(null);

  const [applicationsLogLoading, setApplicationsLogLoading] = useState(false);
  const [allAdoptions, setAllAdoptions] = useState<Adoption[]>([]);
  const [allVolunteers, setAllVolunteers] = useState<Volunteer[]>([]);
  const [allDonations, setAllDonations] = useState<Donation[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (!ADMIN_ROLES.includes(user.role)) {
      navigate('/', { replace: true });
      return;
    }
    if (user.role === 'SHELTER_ADMIN') {
      loadMyShelter();
    }
    if (user.role === 'SUPER_ADMIN' && superTab === 'approvals') {
      loadPendingShelters();
    } else if (superTab === 'approvals') {
      setLoading(false);
    }
  }, [isAuthenticated, user, navigate, superTab]);

  useEffect(() => {
    if (user?.role === 'SHELTER_ADMIN' && shelterTab === 'notifications') {
      loadNotifications();
    }
  }, [user?.role, shelterTab]);

  useEffect(() => {
    if (user?.role === 'SHELTER_ADMIN' && shelterTab === 'applications') {
      loadPendingApplications();
    }
  }, [user?.role, shelterTab]);

  const loadPendingApplications = async () => {
    setApplicationsLoading(true);
    try {
      const [adoptionsRes, volunteersRes, donationsRes] = await Promise.all([
        adoptionApi.getPendingByShelter(0, 50),
        volunteerApi.getPendingByShelter(0, 50),
        donationApi.getPendingByShelter(0, 50),
      ]);
      setPendingAdoptions(adoptionsRes?.content ?? []);
      setPendingVolunteers(volunteersRes?.content ?? []);
      setPendingDonations(donationsRes?.content ?? []);
    } catch {
      setPendingAdoptions([]);
      setPendingVolunteers([]);
      setPendingDonations([]);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const handleAdoptionApprove = async (id: number) => {
    setApplicationActionLoading(`adoption-${id}`);
    try {
      await adoptionApi.approve(id);
      setPendingAdoptions((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? '승인 처리에 실패했습니다.');
    } finally {
      setApplicationActionLoading(null);
    }
  };

  const handleAdoptionReject = async (id: number, reason?: string) => {
    setApplicationActionLoading(`adoption-${id}`);
    try {
      await adoptionApi.reject(id, reason);
      setPendingAdoptions((prev) => prev.filter((a) => a.id !== id));
      setRejectReason(null);
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? '반려 처리에 실패했습니다.');
    } finally {
      setApplicationActionLoading(null);
    }
  };

  const handleVolunteerApprove = async (id: number) => {
    setApplicationActionLoading(`volunteer-${id}`);
    try {
      await volunteerApi.approve(id);
      setPendingVolunteers((prev) => prev.filter((v) => v.id !== id));
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? '승인 처리에 실패했습니다.');
    } finally {
      setApplicationActionLoading(null);
    }
  };

  const handleVolunteerReject = async (id: number, reason?: string) => {
    setApplicationActionLoading(`volunteer-${id}`);
    try {
      await volunteerApi.reject(id, reason);
      setPendingVolunteers((prev) => prev.filter((v) => v.id !== id));
      setRejectReason(null);
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? '반려 처리에 실패했습니다.');
    } finally {
      setApplicationActionLoading(null);
    }
  };

  const handleDonationComplete = async (id: number) => {
    setApplicationActionLoading(`donation-${id}`);
    try {
      await donationApi.complete(id);
      setPendingDonations((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? '수령 완료 처리에 실패했습니다.');
    } finally {
      setApplicationActionLoading(null);
    }
  };

  const handleDonationReject = async (id: number, reason?: string) => {
    setApplicationActionLoading(`donation-${id}`);
    try {
      await donationApi.reject(id, reason);
      setPendingDonations((prev) => prev.filter((d) => d.id !== id));
      setRejectReason(null);
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? '반려 처리에 실패했습니다.');
    } finally {
      setApplicationActionLoading(null);
    }
  };

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' && superTab === 'members') {
      loadUsers();
    }
  }, [user?.role, superTab, usersPage, roleFilter]);

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' && superTab === 'boards') {
      loadBoards();
    }
  }, [user?.role, superTab, boardsPage, boardTypeFilter]);

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' && superTab === 'sync') {
      loadSyncHistory();
    }
  }, [user?.role, superTab, syncHistoryPage]);

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' && superTab === 'applicationsLog') {
      loadApplicationsLog();
    }
  }, [user?.role, superTab]);

  const loadApplicationsLog = async () => {
    setApplicationsLogLoading(true);
    try {
      const [adoptionsRes, volunteersRes, donationsRes] = await Promise.all([
        adminApi.getAllAdoptions(0, 100),
        adminApi.getAllVolunteers(0, 100),
        adminApi.getAllDonations(0, 100),
      ]);
      const adoptions = adoptionsRes?.data?.data?.content ?? [];
      const volunteers = volunteersRes?.data?.data?.content ?? [];
      const donations = donationsRes?.data?.data?.content ?? [];
      setAllAdoptions(adoptions);
      setAllVolunteers(volunteers);
      setAllDonations(donations);
    } catch {
      setAllAdoptions([]);
      setAllVolunteers([]);
      setAllDonations([]);
    } finally {
      setApplicationsLogLoading(false);
    }
  };

  type LogEntry = { type: 'adoption'; item: Adoption } | { type: 'volunteer'; item: Volunteer } | { type: 'donation'; item: Donation };
  const applicationsLogEntries = useMemo<LogEntry[]>(() => {
    const entries: LogEntry[] = [
      ...allAdoptions.map((item) => ({ type: 'adoption' as const, item })),
      ...allVolunteers.map((item) => ({ type: 'volunteer' as const, item })),
      ...allDonations.map((item) => ({ type: 'donation' as const, item })),
    ];
    entries.sort((a, b) => new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime());
    return entries;
  }, [allAdoptions, allVolunteers, allDonations]);

  const getStatusLabel = (type: 'adoption' | 'volunteer' | 'donation', item: Adoption | Volunteer | Donation) => {
    const s = item.status;
    if (type === 'adoption') return s === 'PENDING' ? '대기' : s === 'APPROVED' ? '승인' : s === 'REJECTED' ? '반려' : s === 'CANCELLED' ? '취소' : s;
    if (type === 'volunteer') return s === 'PENDING' ? '대기' : s === 'APPROVED' ? '승인' : s === 'REJECTED' ? '반려' : s === 'COMPLETED' ? '완료' : s;
    if (type === 'donation') return s === 'PENDING' ? '대기' : s === 'COMPLETED' ? '수령 완료' : s === 'CANCELLED' ? '취소' : s;
    return s;
  };

  const getLogApplicant = (type: 'adoption' | 'volunteer' | 'donation', item: Adoption | Volunteer | Donation) => {
    if (type === 'adoption') return (item as Adoption).applicantName ?? '신청자';
    if (type === 'volunteer') return (item as Volunteer).applicantName;
    if (type === 'donation') return (item as Donation).donorName ?? '기부자';
    return '-';
  };

  const loadMyShelter = async () => {
    setShelterLoading(true);
    try {
      const res = await adminApi.getMyShelter();
      const data = res.data?.data ?? res.data;
      setMyShelter(data ?? null);
    } catch {
      setMyShelter(null);
    } finally {
      setShelterLoading(false);
    }
  };

  const loadPendingShelters = async () => {
    if (user?.role !== 'SUPER_ADMIN') return;
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getShelters('PENDING');
      const data = res.data?.data ?? res.data;
      setPendingShelters(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? '보호소 목록을 불러오지 못했습니다.');
      setPendingShelters([]);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    setNotifLoading(true);
    try {
      const data = await notificationApi.getMyList(0, 30);
      setNotifications(data?.content ?? []);
    } catch {
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  };

  const loadSyncHistory = async () => {
    setSyncHistoryLoading(true);
    try {
      const res = await adminApi.getSyncHistory(syncHistoryPage, 20);
      const payload = res.data?.data ?? res.data;
      if (payload?.content) {
        setSyncHistory(payload.content);
        setSyncHistoryTotalPages(payload.totalPages ?? 0);
        setSyncHistoryTotalElements(payload.totalElements ?? 0);
      }
    } catch {
      setSyncHistory([]);
    } finally {
      setSyncHistoryLoading(false);
    }
  };

  const handleSyncFromPublicApi = async () => {
    setSyncLoading(true);
    setSyncResult(null);
    try {
      const res = await adminApi.syncFromPublicApi({ days: 3 });
      const data = res.data?.data ?? res.data;
      const added = data?.addedCount ?? 0;
      const updated = data?.updatedCount ?? 0;
      const corrected = data?.statusCorrectedCount ?? 0;
      const apiKeyOk = data?.apiKeyConfigured !== false;
      if (!apiKeyOk) {
        setSyncResult('API 키가 설정되지 않았습니다. backend/.env 에 DATA_API_KEY 를 확인하세요.');
      } else if (added === 0 && updated === 0 && corrected === 0) {
        setSyncResult('동기화 완료: 변경 없음 (신규/수정된 데이터 없음)');
      } else {
        const parts: string[] = [];
        if (added > 0) parts.push(`추가 ${added}마리`);
        if (updated > 0) parts.push(`수정 ${updated}마리`);
        if (corrected > 0) parts.push(`만료보정 ${corrected}마리`);
        setSyncResult(`동기화 완료: ${parts.join(', ')}`);
      }
      loadSyncHistory();
      setTimeout(() => setSyncResult(null), 8000);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSyncResult(msg ?? '동기화 실패');
      loadSyncHistory();
    } finally {
      setSyncLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    setTestEmailResult(null);
    setTestEmailLoading(true);
    try {
      const res = await adminApi.sendTestEmail(testEmailTo.trim() || undefined);
      const msg = res.data?.message ?? res.data?.data ?? '발송 요청이 완료되었습니다.';
      setTestEmailResult({ ok: true, message: msg });
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '테스트 발송에 실패했습니다.';
      setTestEmailResult({ ok: false, message: msg });
    } finally {
      setTestEmailLoading(false);
    }
  };

  const handleVerify = async (shelterId: number, status: 'APPROVED' | 'REJECTED') => {
    setActionLoading(shelterId);
    try {
      await adminApi.verifyShelter(shelterId, { status });
      setPendingShelters((prev) => prev.filter((s) => s.id !== shelterId));
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? '처리 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {
      // ignore
    }
  };

  const loadUsers = async () => {
    setUsersError('');
    setUsersLoading(true);
    try {
      const role = roleFilter === '' ? undefined : (roleFilter as RoleFilter);
      const res = await adminApi.getUsers(usersPage, 20, role);
      const data = res.data?.data ?? res.data;
      setUsers(data?.content ?? []);
      setUsersTotalPages(data?.totalPages ?? 0);
      setUsersTotalElements(data?.totalElements ?? 0);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string }; status?: number } };
      const msg = err.response?.data?.message ?? err.response?.status === 403 ? '권한이 없습니다.' : '회원 목록을 불러오지 못했습니다.';
      setUsersError(msg);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadBoards = async () => {
    setBoardsError('');
    setBoardsLoading(true);
    try {
      const type = boardTypeFilter === '' ? undefined : boardTypeFilter;
      const res = await adminApi.getBoards(boardsPage, 20, type);
      const data = res.data?.data ?? res.data;
      setBoards(data?.content ?? []);
      setBoardsTotalPages(data?.totalPages ?? 0);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string }; status?: number } };
      const msg = err.response?.data?.message ?? err.response?.status === 403 ? '권한이 없습니다.' : '게시글 목록을 불러오지 못했습니다.';
      setBoardsError(msg);
      setBoards([]);
    } finally {
      setBoardsLoading(false);
    }
  };

  const handleSetBoardPinned = async (boardId: number, pinned: boolean) => {
    setBoardActionLoading(boardId);
    try {
      await adminApi.setBoardPinned(boardId, pinned);
      setBoards((prev) => prev.map((b) => (b.id === boardId ? { ...b, isPinned: pinned } : b)));
    } catch {
      // ignore
    } finally {
      setBoardActionLoading(null);
    }
  };

  const handleDeleteBoard = async (boardId: number) => {
    setBoardActionLoading(boardId);
    try {
      await adminApi.deleteBoard(boardId);
      setBoards((prev) => prev.filter((b) => b.id !== boardId));
    } catch {
      // ignore
    } finally {
      setBoardActionLoading(null);
    }
  };

  const handleViewBusinessReg = async (shelterId: number) => {
    setError('');
    setBusinessRegLoading(shelterId);
    try {
      const res = await adminApi.getBusinessRegistrationFile(shelterId);
      const blob = res.data as Blob;
      // 서버가 JSON 에러를 blob으로 보낸 경우(Content-Type이 application/json이면) 표시 불가
      const contentType = (res.headers as Record<string, string>)['content-type'] || '';
      if (blob.type?.includes('application/json') || contentType.includes('application/json')) {
        const text = await blob.text();
        const json = JSON.parse(text);
        const msg = json?.message ?? json?.data?.message ?? '서버에서 오류가 반환되었습니다.';
        setError(msg);
        setBusinessRegLoading(null);
        return;
      }
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: Blob; status?: number }; message?: string };
      if (e.response?.data instanceof Blob) {
        try {
          const text = await (e.response.data as Blob).text();
          const json = JSON.parse(text);
          const msg = json?.message ?? json?.data?.message;
          setError(msg ?? '사업자등록증 파일을 불러올 수 없습니다.');
        } catch {
          setError(e.response?.status === 404 ? '등록된 사업자등록증이 없거나 파일을 찾을 수 없습니다.' : '사업자등록증 파일을 불러올 수 없습니다.');
        }
      } else {
        setError(e.message ?? '사업자등록증 파일을 불러올 수 없습니다.');
      }
    } finally {
      setBusinessRegLoading(null);
    }
  };

  if (!isAuthenticated || !user) return null;

  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const tabList = isSuperAdmin ? SUPER_TABS : SHELTER_TABS;
  const activeTab = isSuperAdmin ? superTab : shelterTab;
  const setActiveTab = isSuperAdmin
    ? (id: string) => setSuperTab(id as SuperTab)
    : (id: string) => setShelterTab(id as ShelterTab);

  return (
    <div className="admin-dashboard toss-page-with-fixed-header">
      <Header />
      <main>
        <div className="admin-dashboard-inner">
          <div className="admin-dashboard-head">
            <h1 className="admin-dashboard-title">관리자 대시보드</h1>
            <p className="admin-dashboard-desc">
              {user.name}({user.email}) · {user.role === 'SUPER_ADMIN' ? '시스템 관리자' : '보호소 관리자'}
              {myShelter && ` · ${myShelter.name}`}
              {' · '}
              <Link to="/mypage/preferences" className="text-[var(--toss-blue)] hover:underline font-medium">
                선호도 설정
              </Link>
            </p>
          </div>

          <nav className="admin-tabs" aria-label="관리 메뉴">
            {tabList.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <AnimatePresence mode="wait">
            {/* ========== SUPER_ADMIN: 회원관리 ========== */}
            {isSuperAdmin && superTab === 'members' && (
              <motion.section
                key="members"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="admin-card"
              >
                <div className="admin-card-head">
                  <h2 className="admin-card-title">회원관리</h2>
                  <p className="admin-card-desc">전체 회원 목록 조회·관리 (일반 회원, 보호소 관리자)</p>
                </div>
                <div className="admin-card-body">
                  <div className="admin-filters">
                    <label className="admin-filter-label">
                      역할
                      <select
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value as RoleFilter | ''); setUsersPage(0); }}
                        className="admin-select"
                      >
                        <option value="">전체</option>
                        <option value="USER">일반 회원</option>
                        <option value="SHELTER_ADMIN">보호소 관리자</option>
                        <option value="SUPER_ADMIN">시스템 관리자</option>
                      </select>
                    </label>
                  </div>
                  {usersError && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100 flex items-center justify-between gap-2">
                      <span>{usersError}</span>
                      <button type="button" className="admin-btn admin-btn-sm admin-btn-ghost" onClick={() => loadUsers()}>다시 불러오기</button>
                    </div>
                  )}
                  {usersLoading ? (
                    <div className="admin-empty"><p>목록 불러오는 중...</p></div>
                  ) : users.length === 0 && !usersError ? (
                    <div className="admin-empty">
                      <div className="admin-empty-icon" aria-hidden>👥</div>
                      <p>조회된 회원이 없습니다.</p>
                    </div>
                  ) : users.length === 0 && usersError ? null : (
                    <>
                      <div className="admin-table-wrap">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>이메일</th>
                              <th>이름</th>
                              <th>역할</th>
                              <th>가입일</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.map((u) => (
                              <tr key={u.id}>
                                <td>{u.id}</td>
                                <td>{u.email}</td>
                                <td>{u.name ?? '-'}</td>
                                <td>{u.role === 'SUPER_ADMIN' ? '시스템 관리자' : u.role === 'SHELTER_ADMIN' ? '보호소 관리자' : '일반 회원'}</td>
                                <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('ko-KR') : '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="admin-pagination">
                        <button type="button" className="admin-btn admin-btn-ghost" disabled={usersPage <= 0} onClick={() => setUsersPage((p) => p - 1)}>이전</button>
                        <span className="admin-pagination-info">{(usersPage + 1)} / {Math.max(1, usersTotalPages)} (총 {usersTotalElements}명)</span>
                        <button type="button" className="admin-btn admin-btn-ghost" disabled={usersPage >= usersTotalPages - 1} onClick={() => setUsersPage((p) => p + 1)}>다음</button>
                      </div>
                    </>
                  )}
                </div>
              </motion.section>
            )}

            {/* ========== SUPER_ADMIN: 게시판 관리 ========== */}
            {isSuperAdmin && superTab === 'boards' && (
              <motion.section
                key="boards"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="admin-card"
              >
                <div className="admin-card-head">
                  <h2 className="admin-card-title">게시판 관리</h2>
                  <p className="admin-card-desc">공지·FAQ·자유게시판 등 게시글 검토·고정·삭제</p>
                </div>
                <div className="admin-card-body">
                  <div className="admin-filters">
                    <label className="admin-filter-label">
                      게시판
                      <select
                        value={boardTypeFilter}
                        onChange={(e) => { setBoardTypeFilter(e.target.value); setBoardsPage(0); }}
                        className="admin-select"
                      >
                        <option value="">전체</option>
                        <option value="NOTICE">공지</option>
                        <option value="FAQ">FAQ</option>
                        <option value="FREE">자유</option>
                      </select>
                    </label>
                  </div>
                  {boardsError && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100 flex items-center justify-between gap-2">
                      <span>{boardsError}</span>
                      <button type="button" className="admin-btn admin-btn-sm admin-btn-ghost" onClick={() => loadBoards()}>다시 불러오기</button>
                    </div>
                  )}
                  {boardsLoading ? (
                    <div className="admin-empty"><p>목록 불러오는 중...</p></div>
                  ) : boards.length === 0 && !boardsError ? (
                    <div className="admin-empty">
                      <div className="admin-empty-icon" aria-hidden>📋</div>
                      <p>조회된 게시글이 없습니다. 게시판에서 글을 작성하면 여기에서 관리할 수 있습니다.</p>
                      <p className="mt-2 text-sm">
                        <Link to="/boards" className="admin-foot a">게시판 목록 보기 →</Link>
                      </p>
                    </div>
                  ) : boards.length === 0 && boardsError ? null : (
                    <>
                      <div className="admin-table-wrap">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>타입</th>
                              <th>제목</th>
                              <th>작성자</th>
                              <th>고정</th>
                              <th>작성일</th>
                              <th>관리</th>
                            </tr>
                          </thead>
                          <tbody>
                            {boards.map((b) => (
                              <tr key={b.id}>
                                <td>{b.id}</td>
                                <td>{b.type === 'NOTICE' ? '공지' : b.type === 'FAQ' ? 'FAQ' : '자유'}</td>
                                <td>{b.title}</td>
                                <td>{b.userName ?? '-'}</td>
                                <td>{b.isPinned ? '고정' : '-'}</td>
                                <td>{b.createdAt ? new Date(b.createdAt).toLocaleDateString('ko-KR') : '-'}</td>
                                <td>
                                  <button type="button" className="admin-btn admin-btn-sm admin-btn-ghost" disabled={boardActionLoading === b.id}
                                    onClick={() => handleSetBoardPinned(b.id, !b.isPinned)}>
                                    {boardActionLoading === b.id ? '...' : b.isPinned ? '고정 해제' : '고정'}
                                  </button>
                                  <button type="button" className="admin-btn admin-btn-sm admin-btn-danger" disabled={boardActionLoading === b.id}
                                    onClick={() => handleDeleteBoard(b.id)}>삭제</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="admin-pagination">
                        <button type="button" className="admin-btn admin-btn-ghost" disabled={boardsPage <= 0} onClick={() => setBoardsPage((p) => p - 1)}>이전</button>
                        <span className="admin-pagination-info">{(boardsPage + 1)} / {Math.max(1, boardsTotalPages)}</span>
                        <button type="button" className="admin-btn admin-btn-ghost" disabled={boardsPage >= boardsTotalPages - 1} onClick={() => setBoardsPage((p) => p + 1)}>다음</button>
                      </div>
                    </>
                  )}
                </div>
              </motion.section>
            )}

            {/* ========== SUPER_ADMIN: 승인관리 ========== */}
            {isSuperAdmin && superTab === 'approvals' && (
              <motion.section
                key="approvals"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="admin-card"
              >
                <div className="admin-card-head">
                  <h2 className="admin-card-title">승인관리</h2>
                  <p className="admin-card-desc">보호소 가입 신청을 검토 후 승인 또는 거절하세요.</p>
                </div>
                <div className="admin-card-body">
                  {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>
                  )}
                  {loading ? (
                    <div className="admin-empty"><p>목록 불러오는 중...</p></div>
                  ) : pendingShelters.length === 0 ? (
                    <div className="admin-empty">
                      <div className="admin-empty-icon" aria-hidden>✅</div>
                      <p>승인 대기 중인 보호소가 없습니다.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {pendingShelters.map((s) => (
                        <li key={s.id} className="admin-approval-item">
                          <div className="admin-approval-item-head">{s.name}</div>
                          <div className="admin-approval-item-meta">담당자: {s.managerName} · {s.managerPhone}</div>
                          <div className="admin-approval-item-meta text-sm">{s.address} · {s.phone}</div>
                          <div className="admin-approval-item-actions">
                            {s.businessRegistrationFile && (
                              <button type="button" className="admin-btn admin-btn-ghost" disabled={businessRegLoading === s.id}
                                onClick={() => handleViewBusinessReg(s.id)}>
                                {businessRegLoading === s.id ? '불러오는 중...' : '사업자등록증 보기'}
                              </button>
                            )}
                            <button type="button" className="admin-btn admin-btn-primary" disabled={actionLoading === s.id}
                              onClick={() => handleVerify(s.id, 'APPROVED')}>
                              {actionLoading === s.id ? '처리 중...' : '승인'}
                            </button>
                            <button type="button" className="admin-btn admin-btn-ghost" disabled={actionLoading === s.id}
                              onClick={() => handleVerify(s.id, 'REJECTED')}>거절</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.section>
            )}

            {/* ========== SUPER_ADMIN: 신청 내역 (전체 로그) ========== */}
            {isSuperAdmin && superTab === 'applicationsLog' && (
              <motion.section
                key="applicationsLog"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="admin-card"
              >
                <div className="admin-card-head">
                  <h2 className="admin-card-title">신청 내역</h2>
                  <p className="admin-card-desc">전체 입양·봉사·기부 신청 내역을 최신순으로 확인합니다. 승인/반려 결과까지 포함됩니다.</p>
                </div>
                <div className="admin-card-body">
                  {applicationsLogLoading ? (
                    <div className="admin-empty"><p>신청 내역 불러오는 중...</p></div>
                  ) : applicationsLogEntries.length === 0 ? (
                    <div className="admin-empty">
                      <p>신청 내역이 없습니다.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {applicationsLogEntries.map((entry) => (
                        <li key={`${entry.type}-${entry.item.id}`} className="admin-approval-item py-3 flex flex-wrap items-center gap-2 sm:gap-3">
                          <span className="text-sm text-gray-500 shrink-0 w-36 sm:w-40">
                            {new Date(entry.item.createdAt).toLocaleString('ko-KR')}
                          </span>
                          <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${
                            entry.type === 'adoption' ? 'bg-blue-100 text-blue-700' :
                            entry.type === 'volunteer' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {entry.type === 'adoption' ? '입양/임보' : entry.type === 'volunteer' ? '봉사' : '기부'}
                          </span>
                          <span className="font-medium text-gray-900 min-w-0 truncate flex-1">
                            {getLogApplicant(entry.type, entry.item)}
                          </span>
                          <span className="text-sm text-gray-600 shrink-0">
                            {getStatusLabel(entry.type, entry.item)}
                          </span>
                          <button
                            type="button"
                            className="admin-btn admin-btn-ghost text-sm shrink-0"
                            onClick={() => setApplicationDetailView({ type: entry.type, item: entry.item })}
                          >
                            세부내역 보기
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.section>
            )}

            {/* ========== API 수동 동기화 (SUPER_ADMIN / SHELTER_ADMIN 공통) ========== */}
            {isSuperAdmin && superTab === 'sync' && (
              <motion.section
                key="sync"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="admin-card"
              >
                <div className="admin-card-head">
                  <h2 className="admin-card-title">API 수동 동기화</h2>
                  <p className="admin-card-desc">공공데이터포털 유기동물 정보를 입양 게시판에 반영합니다.</p>
                </div>
                <div className="admin-card-body">
                  <div className="p-6 rounded-lg bg-gray-50 border border-gray-200 max-w-2xl">
                    <h3 className="font-semibold text-gray-800 mb-2">공공데이터 입양 동물 동기화</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      최근 3일치 변경분 동기화. 개·고양이 공고중·보호중 데이터가 DB에 반영됩니다.
                    </p>
                    <p className="text-xs text-amber-700 mb-4 bg-amber-50 p-2 rounded">
                      ※ <strong>500 오류</strong> 시: GET URL용 <strong>Encoding 키</strong>(%2F, %3D 포함) 사용. Decoding↔Encoding 바꿔 시도. Swagger에서 직접 테스트 후 확인. →{' '}
                      <a href="https://www.data.go.kr/data/15098931/openapi.do" target="_blank" rel="noopener noreferrer" className="underline">구조동물 API</a>
                      {' '}| docs/PUBLIC_API_REFERENCES.md
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        type="button"
                        className="admin-btn admin-btn-primary"
                        disabled={syncLoading}
                        onClick={handleSyncFromPublicApi}
                      >
                        {syncLoading ? '동기화 중...' : '동기화 실행'}
                      </button>
                      {syncResult && <span className="text-sm text-gray-700">{syncResult}</span>}
                    </div>
                  </div>
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-800 mb-3">동기화 이력 (자동·수동)</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      매일 새벽 2시 자동 동기화 및 수동 실행 내역. 추가·수정·삭제·만료보정 건수를 확인할 수 있습니다.
                    </p>
                    {syncHistoryLoading ? (
                      <p className="text-sm text-gray-500">이력 불러오는 중...</p>
                    ) : syncHistory.length === 0 ? (
                      <p className="text-sm text-gray-500">동기화 이력이 없습니다.</p>
                    ) : (
                      <>
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                          <table className="min-w-full text-sm">
                            <thead className="bg-gray-100 text-left">
                              <tr>
                                <th className="px-3 py-2 font-semibold text-gray-700">실행 시각</th>
                                <th className="px-3 py-2 font-semibold text-gray-700">구분</th>
                                <th className="px-3 py-2 font-semibold text-gray-700 text-center">추가</th>
                                <th className="px-3 py-2 font-semibold text-gray-700 text-center">수정</th>
                                <th className="px-3 py-2 font-semibold text-gray-700 text-center">삭제</th>
                                <th className="px-3 py-2 font-semibold text-gray-700 text-center">만료보정</th>
                                <th className="px-3 py-2 font-semibold text-gray-700">비고</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {syncHistory.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                                    {new Date(row.runAt).toLocaleString('ko-KR')}
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className={row.triggerType === 'AUTO' ? 'text-blue-600 font-medium' : 'text-gray-700'}>
                                      {row.triggerType === 'AUTO' ? '자동' : '수동'}
                                    </span>
                                    {row.daysParam != null && (
                                      <span className="ml-1 text-gray-500 text-xs">({row.daysParam}일)</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-center">{row.addedCount}</td>
                                  <td className="px-3 py-2 text-center">{row.updatedCount}</td>
                                  <td className="px-3 py-2 text-center">{row.deletedCount}</td>
                                  <td className="px-3 py-2 text-center">{row.correctedCount}</td>
                                  <td className="px-3 py-2 text-gray-600 max-w-xs truncate" title={row.errorMessage ?? undefined}>
                                    {row.errorMessage ? <span className="text-red-600">{row.errorMessage}</span> : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {syncHistoryTotalPages > 1 && (
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              type="button"
                              className="admin-btn admin-btn-ghost text-sm"
                              disabled={syncHistoryPage === 0}
                              onClick={() => setSyncHistoryPage((p) => Math.max(0, p - 1))}
                            >
                              이전
                            </button>
                            <span className="text-sm text-gray-600">
                              {syncHistoryPage + 1} / {syncHistoryTotalPages} (총 {syncHistoryTotalElements}건)
                            </span>
                            <button
                              type="button"
                              className="admin-btn admin-btn-ghost text-sm"
                              disabled={syncHistoryPage >= syncHistoryTotalPages - 1}
                              onClick={() => setSyncHistoryPage((p) => p + 1)}
                            >
                              다음
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="mt-6 p-6 rounded-lg bg-gray-50 border border-gray-200 max-w-2xl">
                    <h3 className="font-semibold text-gray-800 mb-2">이메일 테스트 발송 (Resend)</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      수신 주소를 비우면 로그인한 관리자 이메일로 발송됩니다.
                    </p>
                    <p className="text-xs text-amber-700 mb-4 bg-amber-50 p-2 rounded">
                      ※ 기본 발신(onboarding@resend.dev) 사용 시 <strong>Resend 계정에 등록된 이메일로만</strong> 발송할 수 있습니다. 다른 주소로 보내려면 resend.com/domains 에서 도메인 인증 후 RESEND_FROM_EMAIL 설정.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="email"
                        className="toss-auth-input flex-1 min-w-[200px]"
                        placeholder="수신 이메일 (선택)"
                        value={testEmailTo}
                        onChange={(e) => setTestEmailTo(e.target.value)}
                      />
                      <button
                        type="button"
                        className="admin-btn admin-btn-primary"
                        disabled={testEmailLoading}
                        onClick={handleSendTestEmail}
                      >
                        {testEmailLoading ? '발송 중...' : '테스트 발송'}
                      </button>
                    </div>
                    {testEmailResult && (
                      <p className={`mt-2 text-sm ${testEmailResult.ok ? 'text-green-700' : 'text-red-600'}`}>
                        {testEmailResult.message}
                      </p>
                    )}
                  </div>
                </div>
              </motion.section>
            )}

            {/* ========== SHELTER_ADMIN: 신청 관리 (승인/반려) ========== */}
            {!isSuperAdmin && shelterTab === 'applications' && (
              <motion.section
                key="applications"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="admin-card"
              >
                <div className="admin-card-head">
                  <h2 className="admin-card-title">신청 관리</h2>
                  <p className="admin-card-desc">입양·봉사·기부 신청을 승인 또는 반려합니다. 반려 시 신청자에게 이메일로 사유가 전달됩니다.</p>
                </div>
                <div className="admin-card-body space-y-8">
                  {applicationsLoading ? (
                    <div className="admin-empty"><p>신청 목록 불러오는 중...</p></div>
                  ) : (
                    <>
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-3">입양/임보 대기</h3>
                        {pendingAdoptions.length === 0 ? (
                          <p className="text-sm text-gray-500">대기 중인 입양/임보 신청이 없습니다.</p>
                        ) : (
                          <ul className="divide-y divide-gray-100">
                            {pendingAdoptions.map((a) => (
                              <li key={a.id} className="admin-approval-item py-3">
                                <div className="admin-approval-item-head flex items-center justify-between gap-2 flex-wrap">
                                  <span>{(a as Adoption & { applicantName?: string; animalName?: string }).applicantName ?? '신청자'} · 동물 ID {a.animalId}
                                    {(a as Adoption & { animalName?: string }).animalName && ` (${(a as Adoption & { animalName?: string }).animalName})`}
                                  </span>
                                  <button type="button" className="admin-btn admin-btn-ghost text-sm" onClick={() => setApplicationDetailView({ type: 'adoption', item: a })}>세부내역 보기</button>
                                </div>
                                <div className="admin-approval-item-meta text-sm">{a.type === 'FOSTERING' ? '임시보호' : '입양'} · {new Date(a.createdAt).toLocaleString('ko-KR')}</div>
                                {(a.reason || a.experience || a.livingEnv) && (
                                  <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 space-y-1">
                                    {a.reason && <p><strong>신청 사유:</strong> {a.reason}</p>}
                                    {a.experience && <p><strong>경험:</strong> {a.experience}</p>}
                                    {a.livingEnv && <p><strong>거주 환경:</strong> {a.livingEnv}</p>}
                                  </div>
                                )}
                                <div className="admin-approval-item-actions mt-2 flex gap-2 flex-wrap">
                                  <button type="button" className="admin-btn admin-btn-primary" disabled={applicationActionLoading !== null} onClick={() => handleAdoptionApprove(a.id)}>승인</button>
                                  {rejectReason?.type === 'adoption' && rejectReason?.id === a.id ? (
                                    <span className="flex gap-2 items-center flex-wrap">
                                      <input type="text" className="toss-auth-input flex-1 min-w-[200px]" placeholder="반려 사유 (선택)" value={rejectReason.value} onChange={(e) => setRejectReason({ type: 'adoption', id: a.id, value: e.target.value })} />
                                      <button type="button" className="admin-btn admin-btn-ghost" onClick={() => handleAdoptionReject(a.id, rejectReason.value)}>반려 확정</button>
                                      <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setRejectReason(null)}>취소</button>
                                    </span>
                                  ) : (
                                    <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setRejectReason({ type: 'adoption', id: a.id, value: '' })}>반려</button>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-3">봉사 대기</h3>
                        {pendingVolunteers.length === 0 ? (
                          <p className="text-sm text-gray-500">대기 중인 봉사 신청이 없습니다.</p>
                        ) : (
                          <ul className="divide-y divide-gray-100">
                            {pendingVolunteers.map((v) => (
                              <li key={v.id} className="admin-approval-item py-3">
                                <div className="admin-approval-item-head flex items-center justify-between gap-2 flex-wrap">
                                  <span>{v.applicantName} · {v.activityField}</span>
                                  <button type="button" className="admin-btn admin-btn-ghost text-sm" onClick={() => setApplicationDetailView({ type: 'volunteer', item: v })}>세부내역 보기</button>
                                </div>
                                <div className="admin-approval-item-meta text-sm">
                                  {v.recruitmentTitle && <span>요청: {v.recruitmentTitle}</span>}
                                  {v.recruitmentTitle && (v.startDate || v.endDate) && ' · '}
                                  {v.startDate && v.endDate && `${v.startDate} ~ ${v.endDate}`}
                                  {' · '}{new Date(v.createdAt).toLocaleString('ko-KR')}
                                </div>
                                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 space-y-1">
                                  {v.recruitmentTitle && <p><strong>모집공고:</strong> {v.recruitmentTitle}</p>}
                                  {v.activityRegion && <p><strong>활동 지역:</strong> {v.activityRegion}</p>}
                                  {v.applicantPhone && <p><strong>연락처:</strong> {v.applicantPhone}</p>}
                                  {v.applicantEmail && <p><strong>이메일:</strong> {v.applicantEmail}</p>}
                                </div>
                                <div className="admin-approval-item-actions mt-2 flex gap-2 flex-wrap">
                                  <button type="button" className="admin-btn admin-btn-primary" disabled={applicationActionLoading !== null} onClick={() => handleVolunteerApprove(v.id)}>승인</button>
                                  {rejectReason?.type === 'volunteer' && rejectReason?.id === v.id ? (
                                    <span className="flex gap-2 items-center flex-wrap">
                                      <input type="text" className="toss-auth-input flex-1 min-w-[200px]" placeholder="반려 사유 (선택)" value={rejectReason.value} onChange={(e) => setRejectReason({ type: 'volunteer', id: v.id, value: e.target.value })} />
                                      <button type="button" className="admin-btn admin-btn-ghost" onClick={() => handleVolunteerReject(v.id, rejectReason.value)}>반려 확정</button>
                                      <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setRejectReason(null)}>취소</button>
                                    </span>
                                  ) : (
                                    <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setRejectReason({ type: 'volunteer', id: v.id, value: '' })}>반려</button>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-3">기부 대기</h3>
                        {pendingDonations.length === 0 ? (
                          <p className="text-sm text-gray-500">대기 중인 기부 신청이 없습니다.</p>
                        ) : (
                          <ul className="divide-y divide-gray-100">
                            {pendingDonations.map((d) => (
                              <li key={d.id} className="admin-approval-item py-3">
                                <div className="admin-approval-item-head flex items-center justify-between gap-2 flex-wrap">
                                  <span>{d.donorName ?? '기부자'} · {new Date(d.createdAt).toLocaleString('ko-KR')}</span>
                                  <button type="button" className="admin-btn admin-btn-ghost text-sm" onClick={() => setApplicationDetailView({ type: 'donation', item: d })}>세부내역 보기</button>
                                </div>
                                <div className="admin-approval-item-meta text-sm">
                                  {d.requestTitle ? <span>요청: {d.requestTitle}</span> : <span>요청 ID {d.requestId}</span>}
                                </div>
                                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 space-y-1">
                                  {d.requestTitle && <p><strong>어떤 요청:</strong> {d.requestTitle}</p>}
                                  {d.itemName && <p><strong>물품:</strong> {d.itemName}{d.quantity != null && ` · 수량 ${d.quantity}`}</p>}
                                  {d.deliveryMethod && <p><strong>배송:</strong> {d.deliveryMethod}</p>}
                                  {d.donorPhone && <p><strong>연락처:</strong> {d.donorPhone}</p>}
                                  {d.donorEmail && <p><strong>이메일:</strong> {d.donorEmail}</p>}
                                </div>
                                <div className="admin-approval-item-actions mt-2 flex gap-2 flex-wrap">
                                  <button type="button" className="admin-btn admin-btn-primary" disabled={applicationActionLoading !== null} onClick={() => handleDonationComplete(d.id)}>수령 완료</button>
                                  {rejectReason?.type === 'donation' && rejectReason?.id === d.id ? (
                                    <span className="flex gap-2 items-center flex-wrap">
                                      <input type="text" className="toss-auth-input flex-1 min-w-[200px]" placeholder="반려 사유 (선택)" value={rejectReason.value} onChange={(e) => setRejectReason({ type: 'donation', id: d.id, value: e.target.value })} />
                                      <button type="button" className="admin-btn admin-btn-ghost" onClick={() => handleDonationReject(d.id, rejectReason.value)}>반려 확정</button>
                                      <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setRejectReason(null)}>취소</button>
                                    </span>
                                  ) : (
                                    <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setRejectReason({ type: 'donation', id: d.id, value: '' })}>반려</button>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </motion.section>
            )}

            {/* 신청 세부내역 모달 */}
            {applicationDetailView && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" role="dialog" aria-modal="true" aria-labelledby="application-detail-title">
                <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 id="application-detail-title" className="text-xl font-bold text-gray-900">
                      {applicationDetailView.type === 'adoption' && '입양/임보 신청 세부내역'}
                      {applicationDetailView.type === 'volunteer' && '봉사 신청 세부내역'}
                      {applicationDetailView.type === 'donation' && '기부 신청 세부내역'}
                    </h2>
                    <button type="button" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600" onClick={() => setApplicationDetailView(null)} aria-label="닫기">✕</button>
                  </div>
                  <div className="p-6 overflow-y-auto space-y-4">
                    {applicationDetailView.type === 'adoption' && (
                      (() => {
                        const a = applicationDetailView.item as Adoption;
                        return (
                          <dl className="space-y-3 text-sm">
                            <div><dt className="text-gray-500 font-medium">신청 ID</dt><dd className="mt-0.5 text-gray-900">{a.id}</dd></div>
                            <div><dt className="text-gray-500 font-medium">신청자 이름</dt><dd className="mt-0.5 text-gray-900">{(a as Adoption & { applicantName?: string }).applicantName ?? '-'}</dd></div>
                            <div><dt className="text-gray-500 font-medium">동물 ID / 이름</dt><dd className="mt-0.5 text-gray-900">{a.animalId}{(a as Adoption & { animalName?: string }).animalName ? ` (${(a as Adoption & { animalName?: string }).animalName})` : ''}</dd></div>
                            <div><dt className="text-gray-500 font-medium">신청 유형</dt><dd className="mt-0.5 text-gray-900">{a.type === 'FOSTERING' ? '임시보호' : '입양'}</dd></div>
                            <div><dt className="text-gray-500 font-medium">상태</dt><dd className="mt-0.5 text-gray-900">{a.status === 'PENDING' ? '대기' : a.status === 'APPROVED' ? '승인' : a.status === 'REJECTED' ? '반려' : a.status}</dd></div>
                            <div><dt className="text-gray-500 font-medium">신청 사유</dt><dd className="mt-0.5 text-gray-900 whitespace-pre-wrap">{a.reason || '-'}</dd></div>
                            <div><dt className="text-gray-500 font-medium">반려동물 경험</dt><dd className="mt-0.5 text-gray-900 whitespace-pre-wrap">{a.experience || '-'}</dd></div>
                            <div><dt className="text-gray-500 font-medium">거주 환경</dt><dd className="mt-0.5 text-gray-900 whitespace-pre-wrap">{a.livingEnv || '-'}</dd></div>
                            <div><dt className="text-gray-500 font-medium">가족 동의</dt><dd className="mt-0.5 text-gray-900">{a.familyAgreement ? '예' : '아니오'}</dd></div>
                            <div><dt className="text-gray-500 font-medium">신청 일시</dt><dd className="mt-0.5 text-gray-900">{new Date(a.createdAt).toLocaleString('ko-KR')}</dd></div>
                          </dl>
                        );
                      })()
                    )}
                    {applicationDetailView.type === 'volunteer' && (
                      (() => {
                        const v = applicationDetailView.item as Volunteer;
                        return (
                          <dl className="space-y-3 text-sm">
                            <div><dt className="text-gray-500 font-medium">신청 ID</dt><dd className="mt-0.5 text-gray-900">{v.id}</dd></div>
                            <div><dt className="text-gray-500 font-medium">신청자 이름</dt><dd className="mt-0.5 text-gray-900">{v.applicantName}</dd></div>
                            <div><dt className="text-gray-500 font-medium">연락처</dt><dd className="mt-0.5 text-gray-900">{v.applicantPhone || '-'}</dd></div>
                            <div><dt className="text-gray-500 font-medium">이메일</dt><dd className="mt-0.5 text-gray-900">{v.applicantEmail || '-'}</dd></div>
                            <div><dt className="text-gray-500 font-medium">모집공고</dt><dd className="mt-0.5 text-gray-900">{v.recruitmentTitle || `ID ${v.recruitmentId}`}</dd></div>
                            <div><dt className="text-gray-500 font-medium">활동 지역</dt><dd className="mt-0.5 text-gray-900">{v.activityRegion || '-'}</dd></div>
                            <div><dt className="text-gray-500 font-medium">활동 분야</dt><dd className="mt-0.5 text-gray-900">{v.activityField}</dd></div>
                            <div><dt className="text-gray-500 font-medium">희망 기간</dt><dd className="mt-0.5 text-gray-900">{v.startDate} ~ {v.endDate}</dd></div>
                            <div><dt className="text-gray-500 font-medium">신청 인원</dt><dd className="mt-0.5 text-gray-900">{v.participantCount ?? 1}명</dd></div>
                            <div><dt className="text-gray-500 font-medium">신청 내용</dt><dd className="mt-0.5 text-gray-900 whitespace-pre-wrap">{v.message || '-'}</dd></div>
                            <div><dt className="text-gray-500 font-medium">상태</dt><dd className="mt-0.5 text-gray-900">{v.status === 'PENDING' ? '대기' : v.status === 'APPROVED' ? '승인' : v.status === 'REJECTED' ? '반려' : v.status === 'COMPLETED' ? '완료' : v.status}</dd></div>
                            <div><dt className="text-gray-500 font-medium">신청 일시</dt><dd className="mt-0.5 text-gray-900">{new Date(v.createdAt).toLocaleString('ko-KR')}</dd></div>
                          </dl>
                        );
                      })()
                    )}
                    {applicationDetailView.type === 'donation' && (
                      (() => {
                        const d = applicationDetailView.item as Donation;
                        return (
                          <dl className="space-y-3 text-sm">
                            <div><dt className="text-gray-500 font-medium">신청 ID</dt><dd className="mt-0.5 text-gray-900">{d.id}</dd></div>
                            <div><dt className="text-gray-500 font-medium">기부자 이름</dt><dd className="mt-0.5 text-gray-900">{d.donorName ?? '-'}</dd></div>
                            <div><dt className="text-gray-500 font-medium">연락처</dt><dd className="mt-0.5 text-gray-900">{d.donorPhone || '-'}</dd></div>
                            <div><dt className="text-gray-500 font-medium">이메일</dt><dd className="mt-0.5 text-gray-900">{d.donorEmail || '-'}</dd></div>
                            <div><dt className="text-gray-500 font-medium">요청(물품 요청) 제목</dt><dd className="mt-0.5 text-gray-900">{d.requestTitle || `ID ${d.requestId}`}</dd></div>
                            <div><dt className="text-gray-500 font-medium">물품명</dt><dd className="mt-0.5 text-gray-900">{d.itemName ?? '-'}</dd></div>
                            <div><dt className="text-gray-500 font-medium">수량</dt><dd className="mt-0.5 text-gray-900">{d.quantity ?? '-'}</dd></div>
                            <div><dt className="text-gray-500 font-medium">배송 방식</dt><dd className="mt-0.5 text-gray-900">{d.deliveryMethod || '-'}</dd></div>
                            <div><dt className="text-gray-500 font-medium">운송장 번호</dt><dd className="mt-0.5 text-gray-900">{d.trackingNumber || '-'}</dd></div>
                            <div><dt className="text-gray-500 font-medium">상태</dt><dd className="mt-0.5 text-gray-900">{d.status === 'PENDING' ? '대기' : d.status === 'COMPLETED' ? '수령 완료' : d.status === 'CANCELLED' ? '취소' : d.status}</dd></div>
                            <div><dt className="text-gray-500 font-medium">신청 일시</dt><dd className="mt-0.5 text-gray-900">{new Date(d.createdAt).toLocaleString('ko-KR')}</dd></div>
                          </dl>
                        );
                      })()
                    )}
                  </div>
                  <div className="p-6 border-t border-gray-100">
                    <button type="button" className="w-full admin-btn admin-btn-primary" onClick={() => setApplicationDetailView(null)}>닫기</button>
                  </div>
                </div>
              </div>
            )}

            {/* ========== SHELTER_ADMIN: 입양 등록 ========== */}
            {!isSuperAdmin && shelterTab === 'animals' && myShelter && (
              <ShelterAnimalForm
                shelterId={myShelter.id}
                loading={animalSubmitLoading}
                setLoading={setAnimalSubmitLoading}
                onSuccess={() => setSubmitSuccess('동물이 등록되었습니다.')}
                success={submitSuccess}
                onClearSuccess={() => setSubmitSuccess('')}
              />
            )}
            {!isSuperAdmin && shelterTab === 'animals' && shelterLoading && (
              <motion.section key="animals-loading" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="admin-card">
                <div className="admin-card-body">
                  <div className="admin-empty"><p>보호소 정보 불러오는 중...</p></div>
                </div>
              </motion.section>
            )}
            {!isSuperAdmin && shelterTab === 'animals' && !shelterLoading && !myShelter && (
              <motion.section key="animals-empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="admin-card">
                <div className="admin-card-body">
                  <div className="admin-empty"><p>보호소 정보를 불러올 수 없습니다. 승인된 보호소 계정인지 확인하세요.</p></div>
                </div>
              </motion.section>
            )}

            {/* ========== SHELTER_ADMIN: 봉사 모집 ========== */}
            {!isSuperAdmin && shelterTab === 'volunteers' && myShelter && (
              <ShelterVolunteerForm
                shelterId={myShelter.id}
                loading={volunteerSubmitLoading}
                setLoading={setVolunteerSubmitLoading}
                onSuccess={() => setSubmitSuccess('봉사 모집공고가 등록되었습니다.')}
                success={submitSuccess}
                onClearSuccess={() => setSubmitSuccess('')}
              />
            )}

            {/* ========== SHELTER_ADMIN: 기부 요청 ========== */}
            {!isSuperAdmin && shelterTab === 'donations' && myShelter && (
              <ShelterDonationForm
                shelterId={myShelter.id}
                loading={donationSubmitLoading}
                setLoading={setDonationSubmitLoading}
                onSuccess={() => setSubmitSuccess('기부 요청이 등록되었습니다.')}
                success={submitSuccess}
                onClearSuccess={() => setSubmitSuccess('')}
              />
            )}

            {/* ========== SHELTER_ADMIN: 알림 관리 ========== */}
            {!isSuperAdmin && shelterTab === 'notifications' && (
              <motion.section
                key="notifications"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="admin-card"
              >
                <div className="admin-card-head">
                  <h2 className="admin-card-title">알림 관리</h2>
                  <p className="admin-card-desc">받은 알림 목록과 읽음 처리</p>
                </div>
                <div className="admin-card-body">
                  {notifLoading ? (
                    <div className="admin-empty"><p>알림 불러오는 중...</p></div>
                  ) : notifications.length === 0 ? (
                    <div className="admin-empty">
                      <div className="admin-empty-icon" aria-hidden>🔔</div>
                      <p>알림이 없습니다.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {notifications.map((n) => (
                        <li key={n.id} className="admin-approval-item">
                          <div className={`admin-approval-item-head ${n.isRead ? 'text-gray-500 font-normal' : ''}`}>{n.message}</div>
                          <div className="admin-approval-item-meta text-sm">{n.type} · {new Date(n.createdAt).toLocaleString('ko-KR')}</div>
                          {!n.isRead && (
                            <div className="admin-approval-item-actions mt-2">
                              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => handleMarkRead(n.id)}>읽음 처리</button>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <p className="admin-foot mt-6">
            <Link to="/">← 메인</Link>
            <span className="mx-2">·</span>
            <Link to="/admin/login">관리자 로그인</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ShelterAnimalForm({
  shelterId,
  loading,
  setLoading,
  onSuccess,
  success,
  onClearSuccess: _onClearSuccess,
}: {
  shelterId: number;
  loading: boolean;
  setLoading: (v: boolean) => void;
  onSuccess: () => void;
  success: string;
  onClearSuccess: () => void;
}) {
  const [species, setSpecies] = useState<'DOG' | 'CAT'>('DOG');
  const [breed, setBreed] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [size, setSize] = useState<'SMALL' | 'MEDIUM' | 'LARGE'>('MEDIUM');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const payload: AnimalCreateRequest = {
        shelterId,
        species,
        breed: breed || undefined,
        name: name || undefined,
        age: age ? parseInt(age, 10) : undefined,
        gender,
        size,
        description: description || undefined,
        imageUrl: imageUrl || undefined,
        neutered: false,
        vaccinated: false,
        status: 'PROTECTED',
      };
      await animalApi.create(payload);
      onSuccess();
      setBreed(''); setName(''); setAge(''); setDescription(''); setImageUrl('');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErr(msg ?? '등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.section key="animals-form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="admin-card">
      <div className="admin-card-head">
        <h2 className="admin-card-title">입양 게시판 수동 등록</h2>
        <p className="admin-card-desc">입양·임보 가능한 동물을 수동으로 등록합니다.</p>
      </div>
      <div className="admin-card-body">
        {success && <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-800 text-sm">{success}</div>}
        {err && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{err}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="toss-auth-field">
              <label className="admin-card-desc block mb-1 font-semibold text-gray-900">종류</label>
              <select value={species} onChange={(e) => setSpecies(e.target.value as 'DOG' | 'CAT')} className="toss-auth-input">
                <option value="DOG">강아지</option>
                <option value="CAT">고양이</option>
              </select>
            </div>
            <div className="toss-auth-field">
              <label className="admin-card-desc block mb-1 font-semibold text-gray-900">품종</label>
              <input type="text" value={breed} onChange={(e) => setBreed(e.target.value)} className="toss-auth-input" placeholder="믹스 등" />
            </div>
            <div className="toss-auth-field">
              <label className="admin-card-desc block mb-1 font-semibold text-gray-900">이름</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="toss-auth-input" placeholder="이름" />
            </div>
            <div className="toss-auth-field">
              <label className="admin-card-desc block mb-1 font-semibold text-gray-900">나이(세)</label>
              <input type="number" min={0} value={age} onChange={(e) => setAge(e.target.value)} className="toss-auth-input" placeholder="0" />
            </div>
            <div className="toss-auth-field">
              <label className="admin-card-desc block mb-1 font-semibold text-gray-900">성별</label>
              <select value={gender} onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE')} className="toss-auth-input">
                <option value="MALE">남</option>
                <option value="FEMALE">여</option>
              </select>
            </div>
            <div className="toss-auth-field">
              <label className="admin-card-desc block mb-1 font-semibold text-gray-900">크기</label>
              <select value={size} onChange={(e) => setSize(e.target.value as 'SMALL' | 'MEDIUM' | 'LARGE')} className="toss-auth-input">
                <option value="SMALL">소형</option>
                <option value="MEDIUM">중형</option>
                <option value="LARGE">대형</option>
              </select>
            </div>
            <div className="toss-auth-field">
              <label className="admin-card-desc block mb-1 font-semibold text-gray-900">설명</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="toss-auth-input" rows={3} placeholder="특이사항 등" />
            </div>
            <div className="toss-auth-field">
              <label className="admin-card-desc block mb-1 font-semibold text-gray-900">이미지 URL</label>
              <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="toss-auth-input" placeholder="https://..." />
            </div>
          </div>
          <button type="submit" disabled={loading} className="admin-btn admin-btn-primary">{loading ? '등록 중...' : '등록'}</button>
        </form>
      </div>
    </motion.section>
  );
}

function ShelterVolunteerForm({
  shelterId,
  loading,
  setLoading,
  onSuccess,
  success,
  onClearSuccess: _onClearSuccess,
}: {
  shelterId: number;
  loading: boolean;
  setLoading: (v: boolean) => void;
  onSuccess: () => void;
  success: string;
  onClearSuccess: () => void;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [maxApplicants, setMaxApplicants] = useState('10');
  const [deadline, setDeadline] = useState('');
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!title.trim() || !content.trim() || !deadline) {
      setErr('제목, 내용, 마감일을 입력하세요.');
      return;
    }
    setLoading(true);
    try {
      const payload: VolunteerRecruitmentCreateRequest = {
        shelterId,
        title: title.trim(),
        content: content.trim(),
        maxApplicants: parseInt(maxApplicants, 10) || 10,
        deadline,
      };
      await volunteerApi.createRecruitment(payload);
      onSuccess();
      setTitle(''); setContent(''); setDeadline('');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErr(msg ?? '등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.section key="volunteers-form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="admin-card">
      <div className="admin-card-head">
        <h2 className="admin-card-title">봉사 모집공고 등록</h2>
        <p className="admin-card-desc">봉사 요청 게시물을 등록합니다. 제목·내용·마감일·모집 인원은 봉사 목록 카드와 상세 보기에 그대로 표시됩니다.</p>
      </div>
      <div className="admin-card-body">
        {success && <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-800 text-sm">{success}</div>}
        {err && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{err}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="toss-auth-field">
            <label className="admin-card-desc block mb-1 font-semibold text-gray-900">제목 *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="toss-auth-input" required placeholder="예: 주말 산책 봉사자 모집" />
          </div>
          <div className="toss-auth-field">
            <label className="admin-card-desc block mb-1 font-semibold text-gray-900">내용 *</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} className="toss-auth-input" rows={4} required placeholder="내용" />
          </div>
          <div className="toss-auth-field">
            <label className="admin-card-desc block mb-1 font-semibold text-gray-900">모집 인원</label>
            <input type="number" min={1} value={maxApplicants} onChange={(e) => setMaxApplicants(e.target.value)} className="toss-auth-input" />
          </div>
          <div className="toss-auth-field">
            <label className="admin-card-desc block mb-1 font-semibold text-gray-900">마감일 *</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="toss-auth-input" required />
          </div>
          <button type="submit" disabled={loading} className="admin-btn admin-btn-primary">{loading ? '등록 중...' : '등록'}</button>
        </form>
      </div>
    </motion.section>
  );
}

function ShelterDonationForm({
  shelterId,
  loading,
  setLoading,
  onSuccess,
  success,
  onClearSuccess: _onClearSuccess,
}: {
  shelterId: number;
  loading: boolean;
  setLoading: (v: boolean) => void;
  onSuccess: () => void;
  success: string;
  onClearSuccess: () => void;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [targetQuantity, setTargetQuantity] = useState('1');
  const [deadline, setDeadline] = useState('');
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!title.trim() || !content.trim() || !itemCategory.trim() || !deadline) {
      setErr('제목, 내용, 물품 종류, 마감일을 입력하세요.');
      return;
    }
    setLoading(true);
    try {
      const payload: DonationRequestCreateRequest = {
        shelterId,
        title: title.trim(),
        content: content.trim(),
        itemCategory: itemCategory.trim(),
        targetQuantity: parseInt(targetQuantity, 10) || 1,
        deadline,
      };
      await donationApi.createRequest(payload);
      onSuccess();
      setTitle(''); setContent(''); setItemCategory(''); setDeadline('');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErr(msg ?? '등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.section key="donations-form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="admin-card">
      <div className="admin-card-head">
        <h2 className="admin-card-title">기부 요청 등록</h2>
        <p className="admin-card-desc">물품 기부 요청 게시물을 등록합니다. 제목·내용·물품 종류·목표 수량·마감일은 기부 목록 카드와 상세 보기에 그대로 표시됩니다.</p>
      </div>
      <div className="admin-card-body">
        {success && <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-800 text-sm">{success}</div>}
        {err && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{err}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="toss-auth-field">
            <label className="admin-card-desc block mb-1 font-semibold text-gray-900">제목 *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="toss-auth-input" required placeholder="예: 사료·담요 기부 요청" />
          </div>
          <div className="toss-auth-field">
            <label className="admin-card-desc block mb-1 font-semibold text-gray-900">내용 *</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} className="toss-auth-input" rows={4} required placeholder="내용" />
          </div>
          <div className="toss-auth-field">
            <label className="admin-card-desc block mb-1 font-semibold text-gray-900">물품 종류 *</label>
            <input type="text" value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} className="toss-auth-input" required placeholder="사료, 담요 등" />
          </div>
          <div className="toss-auth-field">
            <label className="admin-card-desc block mb-1 font-semibold text-gray-900">목표 수량</label>
            <input type="number" min={1} value={targetQuantity} onChange={(e) => setTargetQuantity(e.target.value)} className="toss-auth-input" />
          </div>
          <div className="toss-auth-field">
            <label className="admin-card-desc block mb-1 font-semibold text-gray-900">마감일 *</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="toss-auth-input" required />
          </div>
          <button type="submit" disabled={loading} className="admin-btn admin-btn-primary">{loading ? '등록 중...' : '등록'}</button>
        </form>
      </div>
    </motion.section>
  );
}
