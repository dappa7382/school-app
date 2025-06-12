// Copilot, buat fungsi untuk mendapatkan permission seorang pengguna.
// 1. Fungsi ini bernama `getUserPermissions` dan menerima `userId` sebagai argumen.
// 2. Gunakan Supabase client untuk query.
// 3. Query harus melakukan join dari `UserRoles` ke `RolePermissions` berdasarkan `role_id`.
// 4. Query harus mengambil `permission_id` dari `RolePermissions` dimana `user_id` cocok.
// 5. Kemudian, lakukan query kedua untuk mengambil `permission_name` dari tabel `Permissions` berdasarkan `permission_id` yang didapat.
// 6. Fungsi harus mengembalikan sebuah array dari string nama permission, contoh: ['VIEW_STUDENT_GRADES', 'EDIT_ATTENDANCE'].

import { createClient } from './server';

export async function getUserPermissions(userId: string): Promise<string[]> {
  const supabase = await createClient();
  
  // 3. Join UserRoles dan RolePermissions
  const { data: rolePermissions, error: roleError } = await supabase
    .from('UserRoles')
    .select(`
      RolePermissions (
        permission_id
      )
    `)
    .eq('user_id', userId);

  if (roleError) {
    console.error('Error fetching user roles:', roleError);
    return [];
  }

  // Ekstrak semua permission_id
  const permissionIds = rolePermissions
    .flatMap(rp => rp.RolePermissions)
    .map(p => p.permission_id);

  if (permissionIds.length === 0) {
    return [];
  }
  
  // 5. Ambil nama permission
  const { data: permissions, error: permError } = await supabase
    .from('Permissions')
    .select('permission_name')
    .in('permission_id', permissionIds);

  if (permError) {
    console.error('Error fetching permissions:', permError);
    return [];
  }

  // 6. Kembalikan array string
  return permissions.map(p => p.permission_name);
}