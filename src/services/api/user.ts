/**
 * 用户相关 API — 对接后端 UserController
 * 后端路径: /api/user/...
 * 认证方式: Session（Cookie），登录后自动携带
 */
import http from '../request';

// ================= 类型定义（与后端 DTO/VO 对齐） =================

export interface LoginUserVO {
  id: number;
  userAccount: string;
  userName: string;
  userAvatar: string;
  userProfile: string;
  userRole: string;
  createTime: string;
  updateTime: string;
}

export interface UserRegisterParams {
  userAccount: string;
  userPassword: string;
  checkPassword: string;
}

// ================= API =================

/** 用户注册 */
export async function register(params: UserRegisterParams): Promise<number> {
  return http.post('/user/register', params);
}

/** 用户登录（成功后 Session 自动写入 Cookie） */
export async function login(params: UserRegisterParams): Promise<LoginUserVO> {
  return http.post('/user/login', params);
}

/** 获取当前登录用户（从 Session 读取） */
export async function getCurrentUser(): Promise<LoginUserVO> {
  return http.get('/user/get/login');
}

/** 获取用户公开信息 (VO) */
export async function getUserVO(id: number): Promise<LoginUserVO> {
  return http.get('/user/get/vo', { params: { id } });
}

/** 更新用户信息（管理员） */
export async function updateUser(params: {
  id: number;
  userName?: string;
  userAvatar?: string;
  userProfile?: string;
  userRole?: string;
}): Promise<boolean> {
  return http.post('/user/update', params);
}
