
export const getRedirectPath = (user: any): string => {
    console.log("Routing Check - User:", user);

    if (!user) return '/login';

    if (!user.role) return '/selectrole';

    if (user.role === 'CUIDADOR') return '/care/home';

    if (user.role === 'PACIENTE') {
        // Si no tiene perfil de paciente vinculado (raro si tiene rol), completar perfil
        if (!user.patientProfile) return '/complete-profile';

        // Verificar campos requeridos
        const p = user.patientProfile;
        const hasAge = p.age !== undefined && p.age !== null && p.age > 0;
        const hasPhone = p.emergencyPhone && p.emergencyPhone.trim() !== '';

        console.log(`Routing Check - Patient: age=${p.age} phone=${p.emergencyPhone} -> COMPLETE? ${hasAge && hasPhone}`);

        if (hasAge && hasPhone) {
            return '/patient/home';
        } else {
            return '/complete-profile';
        }
    }

    return '/login';
};
