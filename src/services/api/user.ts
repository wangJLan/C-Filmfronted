/**
 * 用户相关 API — 对接后端 UserController
 * 后端路径: /api/user/...
 * 认证方式: Session（Cookie），登录后自动携带，前端无需存 Token
 */
import http from '../request';

// ================= 类型 =================

export interface LoginUserVO {
  id: number;
  userAccount: string;
  userName: string;
  userAvatar: string;
  userProfile: string;
  userRole: string;
  /** 是否需要设置密码（密码仍为默认值，新用户/未设过密码的老用户为 true） */
  needSetPassword?: boolean;
  createTime: string;
  updateTime: string;
}

export interface UserRegisterParams {
  userAccount: string;
  userPassword: string;
  checkPassword: string;
}

// ================= API =================

/** 发送邮箱验证码 */
export async function sendMailCode(email: string): Promise<string> {
  return http.post('/user/send-mail-code', { email, captcha: '' });
}

/** 邮箱验证码登录 / 自动注册 */
export async function loginByMail(email: string, code: string): Promise<LoginUserVO> {
  return http.post('/user/login-by-mail', { email, code });
}

/** 通过邮箱验证码重置密码 */
export async function resetPassword(
  email: string,
  code: string,
  newPassword: string,
  checkPassword: string,
): Promise<string> {
  return http.post('/user/reset-password', { email, code, newPassword, checkPassword });
}

/** 账号密码注册 */
export async function register(params: UserRegisterParams): Promise<number> {
  return http.post('/user/register', params);
}

/** 账号密码登录（成功后 Session 自动写入 Cookie） */
export async function login(params: UserRegisterParams): Promise<LoginUserVO> {
  return http.post('/user/login', params);
}

/** 退出登录 */
export async function logout(): Promise<boolean> {
  return http.post('/user/logout');
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

/** 设置登录密码（当前密码为默认值时使用，无需旧密码） */
export async function setPassword(newPassword: string, checkPassword: string): Promise<string> {
  return http.post('/user/set-password', { newPassword, checkPassword });
}

/** 修改登录密码（需校验旧密码） */
export async function changePassword(
  oldPassword: string,
  newPassword: string,
  checkPassword: string,
): Promise<string> {
  return http.post('/user/change-password', { oldPassword, newPassword, checkPassword });
}

/** 上传头像（返回路径如 /uploads/avatars/xxx.jpg） */
export async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const resp = await fetch('/api/file/upload/avatar', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!resp.ok) throw new Error('上传失败');
  const body = await resp.json();
  if (body.code !== 0) throw new Error(body.message || '上传失败');
  return body.data;
}

/** 当前用户修改自己的个人信息（昵称/头像/简介） */
export async function updateMyProfile(params: {
  userName?: string;
  userAvatar?: string;
  userProfile?: string;
}): Promise<LoginUserVO> {
  return http.post('/user/update/my', params);
}
