export function getRoleHomePath(role?: string | null): string {
    if (role === 'ADMIN') return '/admin';
    if (role === 'RECRUITER') return '/recruiter';
    return '/dashboard';
}
