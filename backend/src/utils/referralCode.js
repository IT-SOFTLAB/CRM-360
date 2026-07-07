exports.generateReferralCode = () => {
    const random = Math.random().toString(36).substring(2,7).toUpperCase();
    return `REF-${Date.now()}-${random}`;
}