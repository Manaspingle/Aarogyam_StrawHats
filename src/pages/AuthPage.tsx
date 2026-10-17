import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Mail, Lock, User, Phone, MapPin, BadgeCheck,
  ChevronRight, AlertCircle, Check, Globe
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage, type Language } from '@/context/LanguageContext';
import { BLOOD_GROUPS, CITIES, CITY_COORDS } from '@/lib/constants';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialMode = (searchParams.get('mode') as 'login' | 'signup') || 'login';
  const initialRole = (searchParams.get('role') as 'individual' | 'hospital') || 'individual';

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [role, setRole] = useState<'individual' | 'hospital'>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Individual signup fields
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('25');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [city, setCity] = useState<'Mumbai' | 'Pune' | 'Nagpur'>('Mumbai');
  const [phone, setPhone] = useState('');

  // Hospital signup fields
  const [hospitalName, setHospitalName] = useState('');
  const [registrationId, setRegistrationId] = useState('');
  const [address, setAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [hospitalPhone, setHospitalPhone] = useState('');
  const [verified, setVerified] = useState(true);

  useEffect(() => {
    const urlMode = searchParams.get('mode');
    const urlRole = searchParams.get('role');
    if (urlMode === 'login' || urlMode === 'signup') setMode(urlMode);
    if (urlRole === 'individual' || urlRole === 'hospital') setRole(urlRole);
  }, [searchParams]);


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'login') {
      const { error: loginError } = await signIn(email, password);
      if (loginError) {
        setError(loginError);
        setLoading(false);
        return;
      }
      if (email.toLowerCase().includes('admin')) {
        navigate('/admin');
      } else if (role === 'hospital') {
        navigate('/hospital-dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      const coords = CITY_COORDS[city] || { lat: 19.0760, lng: 72.8777 };

      if (role === 'individual') {
        const { error: signUpError } = await signUp(email, password, role, {
          full_name: fullName.trim() || 'Voluntary Donor',
          age: parseInt(age) || 25,
          blood_group: bloodGroup,
          city,
          phone: phone.trim(),
          organs: [],
          emergency_contact: '',
          consent: true,
          available: true,
          donor_level: 'Bronze Lifesaver',
          donor_points: 0,
          blood_donations: 0,
          medical_allergies: '',
          medical_conditions: '',
          lat: coords.lat + (Math.random() - 0.5) * 0.05,
          lng: coords.lng + (Math.random() - 0.5) * 0.05,
        });
        if (signUpError) {
          setError(signUpError);
          setLoading(false);
          return;
        }
        navigate('/dashboard');
      } else {
        const { error: signUpError } = await signUp(email, password, role, {
          hospital_name: hospitalName.trim() || 'Medical Facility',
          name: hospitalName.trim() || 'Medical Facility',
          registration_id: registrationId.trim() || `REG-${city.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
          city,
          address: address.trim(),
          contact_person: contactPerson.trim(),
          phone: hospitalPhone.trim(),
          emergency_helpline: hospitalPhone.trim(),
          verified: true,
          is_approved: true,
          lat: coords.lat + (Math.random() - 0.5) * 0.05,
          lng: coords.lng + (Math.random() - 0.5) * 0.05,
          inventory: {
            'O+': 0,
            'O-': 0,
            'A+': 0,
            'A-': 0,
            'B+': 0,
            'B-': 0,
            'AB+': 0,
            'AB-': 0,
          },
        });
        if (signUpError) {
          setError(signUpError);
          setLoading(false);
          return;
        }
        navigate('/hospital-dashboard');
      }
    }

    setLoading(false);
  }

  const inputClass = 'w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/40 focus:border-brand-teal transition-all text-sm font-medium';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-orange-50/20 flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
          {/* Header with Uploaded Brand Logo and #00605F */}
          <div className="bg-gradient-to-r from-brand-teal via-[#005453] to-[#003837] px-8 py-7 text-white relative">
            <div className="flex items-center justify-between">
              <Link to="/" className="inline-flex items-center gap-3 text-white mb-3 hover:opacity-95 transition-opacity">
                <img
                  src="/aarogyam-logo.jpg"
                  alt="Aarogyam Logo"
                  className="w-10 h-10 object-cover rounded-xl border-2 border-brand-orange shadow-md"
                />
                <span className="text-2xl font-black">{t('app.name')}</span>
              </Link>

              {/* Language Switcher */}
              <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-xl text-xs font-bold mb-3">
                <Globe className="w-3.5 h-3.5 text-brand-orange" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                >
                  <option value="en" className="text-slate-800">EN</option>
                  <option value="hi" className="text-slate-800">हिन्दी</option>
                  <option value="mr" className="text-slate-800">मराठी</option>
                </select>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black">
              {mode === 'login' ? t('auth.welcome_back') : t('auth.join_aarogyam')}
            </h1>
            <p className="text-teal-100 text-xs sm:text-sm mt-1">
              {mode === 'login'
                ? 'Sign in to access your dashboard across Mumbai, Pune, and Nagpur'
                : 'Connect with local hospitals, donors, and trauma centers in Maharashtra'}
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {/* Mode toggle (Login / Signup) */}
            <div className="flex gap-2 mb-6 p-1.5 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  mode === 'login' ? 'bg-white text-brand-teal shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t('auth.sign_in')}
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  mode === 'signup' ? 'bg-white text-brand-teal shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t('auth.register')}
              </button>
            </div>

            {/* Role toggle (Individual / Hospital) */}
            <div className="flex gap-3 mb-6">
              <button
                type="button"
                onClick={() => setRole('individual')}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-2xl border-2 transition-all font-bold text-sm ${
                  role === 'individual'
                    ? 'border-brand-teal bg-teal-50/70 text-brand-teal shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <User className="w-4 h-4" />
                {t('auth.role_individual')}
              </button>
              <button
                type="button"
                onClick={() => setRole('hospital')}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-2xl border-2 transition-all font-bold text-sm ${
                  role === 'hospital'
                    ? 'border-brand-teal bg-teal-50/70 text-brand-teal shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Building2 className="w-4 h-4" />
                {t('auth.role_hospital')}
              </button>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {mode === 'signup' && role === 'individual' && (
                  <motion.div
                    key="individual-signup"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder={t('auth.full_name')}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className={inputClass}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="Age (18-65)"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          required
                          min="18"
                          max="70"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
                        />
                      </div>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
                      >
                        {BLOOD_GROUPS.map((bg) => (
                          <option key={bg} value={bg}>Blood Group: {bg}</option>
                        ))}
                      </select>
                    </div>

                    {/* Restricted Cities: Mumbai, Pune, Nagpur only */}
                    <div className="grid grid-cols-2 gap-4">
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value as 'Mumbai' | 'Pune' | 'Nagpur')}
                        required
                        className="w-full px-4 py-3 rounded-xl border-2 border-brand-orange/40 bg-orange-50/30 text-slate-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
                      >
                        {CITIES.map((c) => (
                          <option key={c} value={c}>City: {c} (Maharashtra)</option>
                        ))}
                      </select>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="tel"
                          placeholder={t('auth.phone')}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {mode === 'signup' && role === 'hospital' && (
                  <motion.div
                    key="hospital-signup"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder={t('auth.hospital_name')}
                        value={hospitalName}
                        onChange={(e) => setHospitalName(e.target.value)}
                        required
                        className={inputClass}
                      />
                    </div>

                    {/* Restricted Cities: Mumbai, Pune, Nagpur only */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <BadgeCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          placeholder={t('auth.registration_id')}
                          value={registrationId}
                          onChange={(e) => setRegistrationId(e.target.value)}
                          required
                          className={inputClass}
                        />
                      </div>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value as 'Mumbai' | 'Pune' | 'Nagpur')}
                        required
                        className="w-full px-4 py-3 rounded-xl border-2 border-brand-orange/40 bg-orange-50/30 text-slate-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
                      >
                        {CITIES.map((c) => (
                          <option key={c} value={c}>City: {c} (Maharashtra)</option>
                        ))}
                      </select>
                    </div>

                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder={t('auth.address')}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                        className={inputClass}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          placeholder={t('auth.contact_person')}
                          value={contactPerson}
                          onChange={(e) => setContactPerson(e.target.value)}
                          required
                          className={inputClass}
                        />
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="tel"
                          placeholder="Hospital Phone"
                          value={hospitalPhone}
                          onChange={(e) => setHospitalPhone(e.target.value)}
                          required
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email & Password (Common to all modes) */}
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  placeholder={t('auth.email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  placeholder={t('auth.password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className={inputClass}
                />
              </div>



              {error && (
                <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button in Brand Teal #00605F */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 bg-brand-teal hover:bg-brand-teal/90 text-white font-black rounded-2xl transition-all shadow-xl shadow-brand-teal/25 disabled:opacity-60 text-base"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'login' ? t('auth.submit_signin') : t('auth.submit_register')}</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
